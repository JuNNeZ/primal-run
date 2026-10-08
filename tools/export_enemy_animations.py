"""Extract reviewed enemy studies without drawing or interpolating artwork."""
from pathlib import Path
import json, hashlib, io
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]; GAME=ROOT/'PRIMAL_RUN_Game'
DIRS=['S','E','N','W']; STATES=['idle','step_left','step_right','action']
# Anatomical torso/hip landmarks reviewed in each source cell, in 3x samples.
ANCHORS={
 'compy':{'S':[(51,60),(51,56),(52,56),(49,49)],'E':[(49,60),(49,60),(48,59),(45,49)],'N':[(53,61),(53,56),(53,54),(53,47)],'W':[(53,60),(55,60),(52,57),(54,50)]},
 'parasaurolophus':{'S':[(42,60),(41,58),(39,59),(42,53)],'E':[(46,62),(46,64),(46,64),(46,56)],'N':[(52,61),(53,59),(52,61),(51,56)],'W':[(50,64),(50,66),(50,65),(50,57)]},
 'carnotaurus':{'S':[(42,62),(42,62),(42,59),(43,53)],'E':[(47,63),(48,60),(47,61),(48,53)],'N':[(51,53),(51,52),(51,52),(51,57)],'W':[(52,62),(53,62),(53,61),(53,53)]},
 'ankylosaurus':{'S':[(46,66),(46,58),(46,55),(46,52)],'E':[(51,66),(57,60),(51,59),(53,50)],'N':[(50,67),(50,65),(50,56),(50,62)],'W':[(40,66),(52,66),(52,59),(52,57)]},
}
def isolate(visible):
 # Reviewed atlases have isolated neighbouring tail fragments; retain complete
 # main animal plus nearby detached pixels, without changing its registration.
 seen=np.zeros_like(visible); groups=[]
 for y,x in zip(*np.where(visible)):
  if seen[y,x]: continue
  group=[];stack=[(y,x)];seen[y,x]=True
  while stack:
   cy,cx=stack.pop();group.append((cy,cx))
   for dy in [-1,0,1]:
    for dx in [-1,0,1]:
     ny,nx=cy+dy,cx+dx
     if 0<=ny<visible.shape[0] and 0<=nx<visible.shape[1] and visible[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;stack.append((ny,nx))
  groups.append(group)
 main=max(groups,key=len); ys,xs=zip(*main)
 keep=np.zeros_like(visible); y0,y1=max(0,min(ys)-2),max(ys)+3;x0,x1=max(0,min(xs)-2),max(xs)+3
 keep[y0:y1,x0:x1]=visible[y0:y1,x0:x1]
 return keep

def export():
 palette=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((GAME/'palette.json').read_text())['colors']],dtype=np.int32)
 manifest=[]; animations=[]; pending=[]
 for species,anchors in ANCHORS.items():
  source=GAME/'Source_Generated/enemies_v1'/f'{species}_sheet.png'
  sheet=Image.open(source).convert('RGBA'); bounds=[round(i*sheet.width/4) for i in range(5)]
  if sheet.size!=(1254,1254):raise ValueError(f'Unexpected reviewed layout {source}: {sheet.size}')
  for col,d in enumerate(DIRS):
   files=[]
   for frame,state in enumerate(STATES):
    # Reject clipped carnotaurus South idle. Reuse intact first walk pose as ready.
    # Horizontal Compy gape remains too lateral; use a reviewed lunge stride instead.
    row=1 if (species=='carnotaurus' and ((d=='S' and frame==0) or (d=='N' and frame==3))) or (species=='compy' and d in ['E','W'] and frame==3) else frame
    crop=[max(0,bounds[col]-24),max(0,bounds[row]-24),min(sheet.width,bounds[col+1]+24),min(sheet.height,bounds[row+1]+24)]
    if d=='E' and species!='compy': crop[0]=260
    if d=='S' and species=='carnotaurus' and row==3: crop[1]=max(0,bounds[row]-6)
    a=np.asarray(sheet.crop(crop))[1::3,1::3].copy(); visible=isolate(a[:,:,3]>=192)
    colors=a[:,:,:3].astype(np.int32); nearest=np.argmin(np.sum((colors[:,:,None,:]-palette[None,None,:,:])**2,axis=3),axis=2)
    a[:,:,:3]=palette[nearest];a[:,:,3]=np.where(visible,255,0);a[~visible]=0
    original_anchor=anchors[d][row]; anchor=[original_anchor[0]+round((bounds[col]-crop[0])/3),original_anchor[1]+round((bounds[row]-crop[1])/3)]; offset=[64-anchor[0],64-anchor[1]]
    ys,xs=np.where(visible);tx,ty=xs+offset[0],ys+offset[1]
    if not len(xs) or min(tx)<2 or min(ty)<2 or max(tx)>=126 or max(ty)>=126:raise ValueError(f'{species} {d} {frame}: padding review needed: bounds {min(tx)},{min(ty)}-{max(tx)},{max(ty)}')
    out=np.zeros((128,128,4),dtype=np.uint8);out[ty,tx]=a[ys,xs]
    file=f'assets/enemy_animations/{species}_{state}_{d}_000.png';path=GAME/file;buffer=io.BytesIO();Image.fromarray(out).save(buffer,format='PNG');payload=buffer.getvalue();pending.append((path,payload));files.append(file)
    manifest.append({'file':file,'export_sha256':hashlib.sha256(payload).hexdigest(),'size':[128,128],'origin':[64,64],'body_anchor':[64,64],'species':species,'direction':d,'state':state,'frame':frame,'status':'prototype_static','production_approved':False,'animation_ready':False,'source':source.relative_to(GAME).as_posix(),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'source_crop':crop,'source_row':row,'source_cell_anchor':list(anchor),'registration_offset':offset,'export':'Integer 3px nearest-neighbor source sampling, alpha>=192, fixed32palette, manually registered anatomy. No interpolation or automatic bbox centering. Expanded reviewed crop; isolated neighbouring fragments excluded.','note':'Clipped South carnotaurus idle, wrong-facing North carnotaurus action and lateral horizontal Compy gapes excluded; documented ready/lunge reuse.'})
   for state,frames,fps,loop in [('idle',[files[0]],1,True),('walk',[files[0],files[1],files[0],files[2]],8,True),('action',[files[0],files[3],files[0]],8,False)]:
    animations.append({'name':f'{species}_{state}_{d}','species':species,'state':state,'direction':d,'frames':frames,'fps':fps,'loop':loop,'origin':[64,64],'production_approved':False,'validated_animation':False,'note':'Walk uses intentional planted return frames; action is a three-pose study, not a full production sequence.'})
 for path,payload in pending: path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(payload)
 (GAME/'enemy_animation_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 (GAME/'enemy_animations.json').write_text(json.dumps({'animations':animations,'frame_plan_exception':'128x128 fixed canvas for all four cardinal directions; 4-frame 8fps walk uses planted,left,planted,right. Three-frame nonloop action uses ready,action,ready. Parasaurolophus action is flee, not attack. All generated studies retain prototype status.'},indent=2)+'\n')
 preview=GAME/'previews/enemies';preview.mkdir(parents=True,exist_ok=True)
 for bg,label in [('#151b19','dark'),('#e8ece1','light')]:
  sheet=Image.new('RGBA',(16*132,4*150),bg);draw=ImageDraw.Draw(sheet)
  for i,e in enumerate(manifest):
   col=i%16;row=i//16;x=col*132+2;y=row*150+18
   sheet.alpha_composite(Image.open(GAME/e['file']),(x,y));draw.text((x+2,y-16),e['species'][:5]+' '+e['direction']+' '+e['state'][:4],fill='#69a4a0')
  sheet.save(preview/f'frames_{label}_1x.png')
 print(f'Exported {len(manifest)} reviewed enemy PNGs.')
if __name__=='__main__':export()
