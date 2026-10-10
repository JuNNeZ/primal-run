"""Extract drawn corpse/skeleton poses, integer pixels only; no invented anatomy."""
from pathlib import Path
import json,hashlib,io
import numpy as np
from PIL import Image,ImageDraw
from export_enemy_animations import isolate
GAME=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
config=json.loads((GAME/'Source_Generated/corpses/sources.json').read_text())
palette=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((GAME/'palette.json').read_text())['colors']],dtype=np.int32)
manifest=[];pending=[];errors=[]
for item in config:
 source=GAME/item['source'];image=Image.open(source).convert('RGBA');assert image.size==(1536,1024),(source,image.size)
 grids={label:Image.new('RGBA',(576,656),color) for label,color in [('light','#e8ece1'),('dark','#151b19')]}
 for row in range(4):
  for col,direction in enumerate(['S','E','N','W']):
   source=GAME/item.get('direction_sources',{}).get(direction,item['source']);image=Image.open(source).convert('RGBA')
   crop=[max(0,col*384-64),max(0,row*256-64),min(1536,(col+1)*384+64),min(1024,(row+1)*256+64)]
   step=item.get('source_sample_stride',4);a=np.array(image.crop(crop))[1::step,1::step].copy();visible=isolate(a[:,:,3]>=192)
   colors=a[:,:,:3].astype(np.int32);idx=np.argmin(((colors[:,:,None,:]-palette[None,None,:,:])**2).sum(axis=3),axis=2);a[:,:,:3]=palette[idx];a[:,:,3]=np.where(visible,255,0);a[~visible]=0
   landmark=item['anchors'][row][col];anchor=[landmark[0]+col*384-crop[0],landmark[1]+row*256-crop[1]];offset=[72-round((v-1)/step) for v in anchor];fy,fx=np.where(visible);tx,ty=fx+offset[0],fy+offset[1]
   if not len(fx) or min(tx)<2 or min(ty)<2 or max(tx)>141 or max(ty)>141:errors.append(f"{item['species']} {row} {direction}:padding {min(tx)},{min(ty)}-{max(tx)},{max(ty)}");continue
   out=np.zeros((144,144,4),dtype=np.uint8);out[ty,tx]=a[fy,fx]
   for exclusion in item.get('native_neighbor_exclusions',[]):
    if exclusion['row']==row and exclusion['col']==col:
     x0,y0,x1,y1=exclusion['box'];out[y0:y1,x0:x1]=0
   stride=item.get('native_sample_stride',1)
   if stride>1:
    sampled=out[::stride,::stride].copy();out[:]=0;offset2=72-72//stride;out[offset2:offset2+sampled.shape[0],offset2:offset2+sampled.shape[1]]=sampled
   im=Image.fromarray(out);stage='decayed' if row<2 else 'skeleton';variant=row%2;file=f"assets/corpses/{item['species']}_{stage}_{direction}_{variant}.png";buff=io.BytesIO();im.save(buff,format='PNG');payload=buff.getvalue();pending.append((GAME/file,payload))
   manifest.append(dict(file=file,size=[144,144],origin=[72,72],body_anchor=[72,72],species=item['species'],stage=stage,variant=variant,direction=direction,native_sample_stride=item.get('native_sample_stride',1),source=source.relative_to(GAME).as_posix(),source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),source_crop=crop,source_cell_anchor=anchor,registration_offset=offset,source_sample_stride=step,export_sha256=hashlib.sha256(payload).hexdigest(),status='prototype_static',production_approved=False,animation_ready=False,export='Integer4 sampling offset1, explicit approximate hip landmarks, neighbour isolation, fixed32 palette, alpha>=192. No drawing/interpolation/mirroring/rotation.'))
   for grid in grids.values():grid.alpha_composite(im,(col*144,row*164+20));ImageDraw.Draw(grid).text((col*144+3,row*164+3),stage+' '+direction+' '+str(variant),fill='#69a4a0')
 for label,grid in grids.items():
  p=GAME/f"previews/corpses/{item['species']}_{label}_1x.png";p.parent.mkdir(parents=True,exist_ok=True);grid.save(p)
if errors:raise ValueError('\n'.join(errors))
for path,payload in pending:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(payload)
(GAME/'corpse_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Exported',len(manifest),'native corpse/skeleton poses.')
