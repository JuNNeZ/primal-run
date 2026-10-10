"""Export separately generated full player atlases; never draw or interpolate poses."""
from pathlib import Path
import hashlib,json,io
import numpy as np
from PIL import Image,ImageDraw
from export_enemy_animations import isolate
ROOT=Path(__file__).resolve().parents[1]; GAME=ROOT/'PRIMAL_RUN_Game'
CONFIG=GAME/'Source_Generated/player_full/sources.json'
PLAN={'idle':(0,0,4,4,True),'hurt':(0,4,2,8,False),'walk':(1,0,6,8,True),'run':(2,0,6,12,True),'attack':(3,0,6,14,False),'death':(4,0,6,8,False)}
def export():
 config=json.loads(CONFIG.read_text()); palette=np.array([[int(c[i:i+2],16) for i in [1,3,5]] for c in json.loads((GAME/'palette.json').read_text())['colors']],dtype=np.int32)
 manifest=[];animations=[];pending=[];errors=[]
 for item in config:
  source=GAME/item['source'];pic=Image.open(source).convert('RGBA');width,height=pic.size
  if (width,height)!=(1536,1024):raise ValueError(f'Unexpected sheet size {source}: {pic.size}')
  ys=[round(i*height/5) for i in range(6)];origin=[n+8 for n in item['origin']];species=item['species'];direction=item['direction'];files={}
  for state,(row,start,count,fps,loop) in PLAN.items():
   frames=[]
   for frame in range(count):
    col=start+frame;margin=item.get('crop_margin',32);crop=[max(0,col*256-margin),max(0,ys[row]-margin),min(width,(col+1)*256+margin),min(height,ys[row+1]+margin)]
    # Explicit manually reviewed anatomical hip landmark in source-cell pixels.
    landmark=item['anchors'][row][col];anchor=[landmark[0]+col*256-crop[0],landmark[1]+ys[row]-crop[1]];step=item.get('source_sample_stride',2);sample_point=step//2 if step>2 else 1;sample=np.asarray(pic.crop(crop))[sample_point::step,sample_point::step].copy();visible=isolate(sample[:,:,3]>=item.get('alpha_threshold',192),item.get('neighbor_isolation_margin',2))
    colors=sample[:,:,:3].astype(np.int32);idx=np.argmin(((colors[:,:,None,:]-palette[None,None,:,:])**2).sum(axis=3),axis=2);sample[:,:,:3]=palette[idx];sample[:,:,3]=np.where(visible,255,0);sample[~visible]=0
    offset=[origin[0]-round((anchor[0]-sample_point)/step),origin[1]-round((anchor[1]-sample_point)/step)];fy,fx=np.where(visible);tx,ty=fx+offset[0],fy+offset[1]
    if not len(fx) or min(tx)<2 or min(ty)<2 or max(tx)>141 or max(ty)>141:
     errors.append(f'{species} {direction} {state} {frame} padding: {min(tx)},{min(ty)}-{max(tx)},{max(ty)}');continue
    out=np.zeros((144,144,4),dtype=np.uint8);out[ty,tx]=sample[fy,fx]
    stride=item.get('native_sample_stride',1)
    if stride>1:
     sampled=out[::stride,::stride].copy();out[:]=0;ox,oy=origin[0]-origin[0]//stride,origin[1]-origin[1]//stride;out[oy:oy+sampled.shape[0],ox:ox+sampled.shape[1]]=sampled
    if item.get('user_transform')=='rotate180':out=np.array(Image.fromarray(out).transpose(Image.Transpose.ROTATE_180))
    file=f'assets/player_full/{species}_{state}_{direction}_{frame:03}.png';buff=io.BytesIO();Image.fromarray(out).save(buff,format='PNG');payload=buff.getvalue();pending.append((GAME/file,payload));frames.append(file);files[(row,col)]=file
    manifest.append({'file':file,'size':[144,144],'origin':origin,'body_anchor':origin,'species':species,'direction':direction,'state':state,'frame':frame,'source':item['source'],'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'source_crop':crop,'crop_margin':item.get('crop_margin',32),'source_cell_anchor':anchor,'registration_offset':offset,'export_sha256':hashlib.sha256(payload).hexdigest(),'status':'prototype_static','production_approved':False,'animation_ready':False,'source_sample_stride':item.get('source_sample_stride',2),'alpha_threshold':item.get('alpha_threshold',192),'native_sample_stride':item.get('native_sample_stride',1),'user_transform':item.get('user_transform'),'derived_from_direction':item.get('derived_from_direction'),'export':'Fixed integer source sampling, binary alpha, fixed32 palette, explicit hip landmark. Declared native stride and user_transform are recorded. No drawing, interpolation, mirroring or bbox recentering.'})
   animations.append({'name':f'{species}_{state}_{direction}','species':species,'state':state,'direction':direction,'frames':frames,'fps':fps,'loop':loop,'origin':origin,'contact_frame':3 if state=='attack' else None,'validated_animation':False,'production_approved':False})
  # Technical contact grids on both backgrounds at native1x; no altered sprite pixels.
  for color,label in [('#151b19','dark'),('#e8ece1','light')]:
   grid=Image.new('RGBA',(6*144,5*164),color);draw=ImageDraw.Draw(grid)
   for (row,col),file in files.items():
    payload=next(b for p,b in pending if p==GAME/file);grid.alpha_composite(Image.open(io.BytesIO(payload)),(col*144,row*164+20));draw.text((col*144+4,row*164+3),Path(file).stem.split('_',1)[1],fill='#69a4a0' if label=='dark' else '#28372a')
   path=GAME/f'previews/player_full/{species}_{direction}_{label}_1x.png';path.parent.mkdir(parents=True,exist_ok=True);grid.save(path)
 if errors:raise ValueError('\n'.join(errors))
 for path,payload in pending:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(payload)
 (GAME/'player_full_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 (GAME/'player_full_animations.json').write_text(json.dumps({'animations':animations,'frame_plan_exception':'Separately drawn 4-direction full states: idle4/walk6/run6/attack6/hurt2/death6. All generated art remains prototype_static; class-specific attack speed uses gameplay duration.'},indent=2)+'\n')
 print(f'Exported {len(manifest)} native full-player frames from {len(config)} separate atlases.')
if __name__=='__main__':export()
