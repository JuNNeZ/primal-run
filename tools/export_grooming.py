"""Extract minimally authored grooming pairs; never redraw, recenter or scale anatomy."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image,ImageDraw
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
P=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((G/'palette.json').read_text())['colors']],dtype=np.int32)
legacy={e['file']:e for family in ['player_full','enemy_full'] for e in json.loads((G/f'{family}_manifest.json').read_text())}
config=json.loads((G/'Source_Generated/behavior_grooming/exports.json').read_text())
manifest=[]
for item in config:
 species=item['species'];src=G/item['source'];im=Image.open(src).convert('RGBA');assert im.size==(1536,1024),(src,im.size)
 family='enemy_full' if species in ['parasaurolophus','triceratops','tyrannosaurus','deinosuchus'] else 'player_full'
 previews={label:Image.new('RGBA',(4*144,4*164),color) for label,color in [('light','#e8ece1'),('dark','#151b19')]}
 for row,direction in enumerate(['S','N','E','W']):
  ref=f'assets/{family}/{species}_idle_{direction}_000.png';origin=legacy[ref]['origin'];anchor=item.get('anchors',{}).get(direction,[384,128]);step=item.get('sample_stride',2);offset=item.get('sample_offset',1)
  for frame in range(2):
   crop=[frame*768,row*256,(frame+1)*768,(row+1)*256];a=np.array(im.crop(crop))[offset::step,offset::step].copy();visible=a[:,:,3]>=item.get('alpha_threshold',248);ys,xs=np.where(visible);assert len(xs),(species,direction,frame,'empty')
   registration=[origin[i]-round((anchor[i]-offset)/step) for i in range(2)];tx=xs+registration[0];ty=ys+registration[1];assert min(tx)>=2 and min(ty)>=2 and max(tx)<=141 and max(ty)<=141,(species,direction,frame,'clipping',min(tx),min(ty),max(tx),max(ty))
   rgb=a[:,:,:3].astype(np.int32);idx=np.argmin(((rgb[:,:,None,:]-P[None,None,:,:])**2).sum(axis=3),axis=2);a[:,:,:3]=P[idx];a[:,:,3]=np.where(visible,255,0);a[~visible]=0
   canvas=np.zeros((144,144,4),dtype=np.uint8);canvas[ty,tx]=a[ys,xs];out=Image.fromarray(canvas);file=f'Source_Generated/behavior_grooming/review_exports/{species}_scratch_{direction}_{frame:03}.png';path=G/file;path.parent.mkdir(parents=True,exist_ok=True);out.save(path)
   manifest.append(dict(file=file,size=[144,144],origin=origin,species=species,state='scratch',direction=direction,frame=frame,source=src.relative_to(G).as_posix(),source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),source_crop=crop,source_cell_anchor=anchor,registration_offset=registration,sampling_stride=step,sampling_offset=offset,export_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference=ref,reference_sha256=hashlib.sha256((G/ref).read_bytes()).hexdigest(),status='prototype_static',production_approved=False,animation_ready=False,runtime_enabled=item.get('runtime_enabled',False),visual_review=item.get('visual_review','pending')))
   for image in previews.values():
    image.alpha_composite(Image.open(G/ref).convert('RGBA'),(frame*288,row*164+20));image.alpha_composite(out,(frame*288+144,row*164+20));ImageDraw.Draw(image).text((frame*288+2,row*164+3),f'{direction} idle / scratch {frame}',fill='#69a4a0')
 for label,image in previews.items():
  path=G/f'previews/grooming/{species}_{label}_1x.png';path.parent.mkdir(parents=True,exist_ok=True);image.save(path)
(G/'grooming_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(f'Exported {len(manifest)} grooming poses; eligibility remains explicit per source.')
