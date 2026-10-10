"""Reviewed source crops, integer sampling and palette mapping; no drawn pixels."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];G=ROOT/'PRIMAL_RUN_Game'
src=G/'Source_Generated/ground/biome_ground_atlas.png';pic=Image.open(src).convert('RGBA')
pal=np.array([[int(c[i:i+2],16)for i in (1,3,5)]for c in json.loads((G/'palette.json').read_text())['colors']],dtype=np.int32)
manifest=[]
for row,biome in enumerate(['forest','river','rocks','volcano']):
 for col in range(4):
  # Generated 1254 atlas: crop288x288 inside each ~313px cell, fixed9 sampling.
  x=round(col*pic.width/4)+12;y=round(row*pic.height/4)+12;crop=[x,y,x+288,y+288]
  a=np.array(pic.crop(crop))[4::9,4::9].copy();rgb=a[:,:,:3].astype(np.int32);a[:,:,:3]=pal[np.argmin(((rgb[:,:,None,:]-pal[None,None,:,:])**2).sum(axis=3),axis=2)];a[:,:,3]=255
  f=f'assets/ground/{biome}_{col}.png';out=G/f;out.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(a).save(out)
  manifest.append(dict(file=f,size=[32,32],origin=[0,0],source=src.relative_to(G).as_posix(),source_crop=crop,sampling_step=9,source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),export_sha256=hashlib.sha256(out.read_bytes()).hexdigest(),status='prototype_static',animation_ready=False,production_approved=False))
  grid=Image.new('RGBA',(96,96))
  for gx in range(3):
   for gy in range(3):grid.paste(Image.fromarray(a),(gx*32,gy*32))
  preview=G/f'previews/ground/{biome}_{col}_3x3.png';preview.parent.mkdir(parents=True,exist_ok=True);grid.save(preview)
(G/'ground_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Exported16 opaque native32 biome tiles. Seam/style review remains prototype.')
# Add separately drawn volcano/crossing props, explicit crater/formation pivots.
from export_enemy_animations import isolate
src=G/'Source_Generated/ground/volcanic_props.png';pic=Image.open(src).convert('RGBA')
for n,name in enumerate(['volcanic_cone_0','volcanic_cone_1','basalt_crossing_0','basalt_crossing_1']):
 col=n%2;row=n//2;crop=[col*640,0 if row==0 else 720,(col+1)*640,720 if row==0 else 1280];anchor=[320,315 if row==0 else 280]
 a=np.array(pic.crop(crop))[1::3,1::3].copy();mask=isolate(a[:,:,3]>=192);rgb=a[:,:,:3].astype(np.int32);a[:,:,:3]=pal[np.argmin(((rgb[:,:,None,:]-pal[None,None,:,:])**2).sum(axis=3),axis=2)];a[:,:,3]=np.where(mask,255,0);a[~mask]=0
 out=np.zeros((256,256,4),dtype=np.uint8);ox=128-round((anchor[0]-1)/3);oy=128-round((anchor[1]-1)/3);ys,xs=np.where(mask);out[ys+oy,xs+ox]=a[ys,xs];im=Image.fromarray(out);box=im.getbbox()
 assert box and min(box[:2])>=2 and max(box[2:])<=254,(name,box)
 f=f'assets/ground/{name}.png';dest=G/f;im.save(dest)
 manifest.append(dict(file=f,size=[256,256],origin=[128,128],source=src.relative_to(G).as_posix(),source_crop=crop,source_cell_anchor=anchor,sampling_step=3,source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),export_sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),status='prototype_static',animation_ready=False,production_approved=False))
 for color,label in [('#151b19','dark'),('#e8ece1','light')]:
  preview=Image.new('RGBA',(256,256),color);preview.alpha_composite(im);preview.save(G/f'previews/ground/{name}_{label}_1x.png')
(G/'ground_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Exported4 volcanic props at256canvas with fixed crater/formation pivots.')
