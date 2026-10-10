"""Export a canonical-WALK-referenced injury pilot for review, never runtime."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image,ImageDraw
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
config=json.loads((G/'Source_Generated/behavior_limp/ankylosaurus_revision2_review.json').read_text())
source=G/config['source'];image=Image.open(source).convert('RGBA');assert list(image.size)==config['source_dimensions']
palette=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((G/'palette.json').read_text())['colors']],dtype=np.int32)
manifest=[];grids={name:Image.new('RGBA',(576,656),bg) for name,bg in [('light','#e8ece1'),('dark','#151b19')]}
for row,d in enumerate(config['direction_rows']):
 for pair,frame in enumerate((2,3)):
  col=frame;crop=[col*384,row*256,(col+1)*384,(row+1)*256];a=np.array(image.crop(crop))[1::2,1::2].copy();mask=a[:,:,3]>=192;ys,xs=np.where(mask);offset=[-24,8];tx=xs+offset[0];ty=ys+offset[1]
  assert tx.min()>=2 and ty.min()>=2 and tx.max()<=141 and ty.max()<=141
  rgb=a[:,:,:3].astype(np.int32);indices=np.argmin(((rgb[:,:,None,:]-palette[None,None,:,:])**2).sum(3),axis=2);a[:,:,:3]=palette[indices];a[:,:,3]=np.where(mask,255,0);a[~mask]=0
  out=np.zeros((144,144,4),np.uint8);out[ty,tx]=a[ys,xs];file=f'Source_Generated/behavior_limp/review_exports/ankylosaurus_limp_{d}_{frame:03}.png';path=G/file;path.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(out).save(path)
  canonical=f'assets/player_full/ankylosaurus_walk_{d}_{frame:03}.png';old=np.array(Image.open(G/canonical).convert('RGBA'));om=old[:,:,3]>0;nm=out[:,:,3]>0;changed=int(np.any(old!=out,axis=2).sum());
  def bounds(mask):
   yy,xx=np.where(mask);return [int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
  ob=bounds(om);nb=bounds(nm);ratio=[round((nb[i+2]-nb[i])/(ob[i+2]-ob[i]),4) for i in (0,1)];iou=round(float((om&nm).sum()/(om|nm).sum()),4)
  manifest.append(dict(file=file,size=[144,144],origin=[72,72],species='ankylosaurus',state='limp',direction=d,frame=frame,source=config['source'],source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),source_crop=crop,source_cell_anchor=[192,128],registration_offset=offset,sampling_stride=2,sampling_offset=1,export_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),canonical=canonical,canonical_sha256=hashlib.sha256((G/canonical).read_bytes()).hexdigest(),changed_pixels=changed,silhouette_iou=iou,canonical_bounds=ob,export_bounds=nb,extent_ratio=ratio,review_notes='Native visual comparison: four legs and continuous clubtail; same armour family and hip. Shortened hindfoot subtle; unapproved prototype.',status='prototype_static',runtime_enabled=all(.9<=r<=1.1 for r in ratio) and iou>=.87,production_approved=False,animation_ready=False))
  for grid in grids.values():
   for idx,(pixels,label) in enumerate(((old,'old'),(out,'revision2'))):
    x=(pair*2+idx)*144;y=row*164;grid.alpha_composite(Image.fromarray(pixels),(x,y+20));ImageDraw.Draw(grid).text((x+2,y+3),f'{d}{frame} {label}',fill='#65998e')
for name,grid in grids.items():grid.save(G/f'previews/behavior/ankylosaurus_injury_revision2_{name}_1x.png')
(G/'Source_Generated/behavior_limp/ankylosaurus_revision2_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Exported 8 unapproved Anky injury prototype keyposes, silhouette IoU',min(e['silhouette_iou'] for e in manifest),'-',max(e['silhouette_iou'] for e in manifest))
