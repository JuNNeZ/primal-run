"""Fixed integer sampling of authored 16-mask terrain atlases; no invented art."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
palette=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((G/'palette.json').read_text())['colors']],dtype=np.int32)
manifest=[];configs=[]
overrides=json.loads((G/'Source_Generated/water_transitions/corrections.json').read_text()) if (G/'Source_Generated/water_transitions/corrections.json').exists() else {}
for family in ['shore_soil','shore_sand','water_depth']:
 source=G/f'Source_Generated/water_transitions/{family}_revision1.png';im=Image.open(source).convert('RGBA');assert im.size==(1254,1254)
 bounds=[0,314,627,941,1254];grid=Image.new('RGBA',(128,144),'#151b19')
 configs.append(dict(family=family,source=source.relative_to(G).as_posix(),source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),boundaries=bounds,sampling_stride=10,sampling_offset=1,corner_bits={'NW':1,'NE':2,'SE':4,'SW':8},status='prototype_static',production_approved=False))
 for mask in range(16):
  row,col=divmod(mask,4);crop=[bounds[col],bounds[row],bounds[col+1],bounds[row+1]];actualSource=source;actualImage=im
  if f'{family}:{mask}' in overrides:
   override=overrides[f'{family}:{mask}'];actualSource=G/override['source'];actualImage=Image.open(actualSource).convert('RGBA');crop=override['crop']
  a=np.array(actualImage.crop(crop))[1::10,1::10][:32,:32].copy();assert a.shape==(32,32,4)
  colors=palette if family!='water_depth' and mask!=15 else np.array([[59,65,68],[60,113,128],[105,164,160],[162,212,193],[232,236,225]],dtype=np.int32)
  rgb=a[:,:,:3].astype(np.int32);idx=np.argmin(((rgb[:,:,None,:]-colors[None,None,:,:])**2).sum(axis=3),axis=2);a[:,:,:3]=colors[idx];a[:,:,3]=255
  out=Image.fromarray(a);file=f'assets/water_transitions/{family}_{mask:02d}.png';p=G/file;p.parent.mkdir(parents=True,exist_ok=True);out.save(p)
  manifest.append(dict(file=file,size=[32,32],origin=[0,0],family=family,mask=mask,source=actualSource.relative_to(G).as_posix(),source_sha256=hashlib.sha256(actualSource.read_bytes()).hexdigest(),source_crop=crop,sampling_stride=10,sampling_offset=1,palette_subset='water blues for depth/all-water; full32 for banks',export_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),status='prototype_static',production_approved=False,animation_ready=False))
  grid.alpha_composite(out,(col*32,row*36+4));ImageDraw.Draw(grid).text((col*32,row*36),str(mask),fill='#e8ece1')
 p=G/f'previews/water_transitions/{family}_1x.png';p.parent.mkdir(parents=True,exist_ok=True);grid.save(p)
(G/'water_transition_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(G/'Source_Generated/water_transitions/sources.json').write_text(json.dumps(configs,indent=2)+'\n')
print('Exported 48 native 32px terrain tiles.')
