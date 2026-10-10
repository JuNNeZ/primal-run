"""Export authored behaviour poses with declared anchors; preserve native fallback frames."""
from pathlib import Path
import json,hashlib,shutil
import numpy as np
from PIL import Image,ImageDraw
from export_enemy_animations import isolate
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
P=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((G/'palette.json').read_text())['colors']],dtype=np.int32)
legacy={e['file']:e for name in ['player_full','enemy_full'] for e in json.loads((G/f'{name}_manifest.json').read_text())}
config=json.loads((G/'Source_Generated/behavior_exports.json').read_text());manifest=[];errors=[]
for item in config:
 species=item['species'];family=item['family'];source=G/item['source'];image=Image.open(source).convert('RGBA');assert image.size==(1536,1024),(source,image.size)
 grid=Image.new('RGBA',((6 if family=='ecology' else 8)*144,4*164),'#e8ece1');dark=Image.new('RGBA',grid.size,'#151b19')
 for row,direction in enumerate(['S','N','E','W']):
  nativeFamily='enemy_full' if species in ['parasaurolophus','triceratops','tyrannosaurus','deinosuchus'] else 'player_full'
  origin=legacy[f'assets/{nativeFamily}/{species}_idle_{direction}_000.png']['origin']
  for col in range(6):
   if family=='ecology':state=['graze','graze','drink','drink','sleep','sleep'][col];frame=col%2;sourceCol=col
   else:state='scratch' if col<2 else 'limp';frame=col if col<2 else col-2;sourceCol=col if col<2 else col-2
   # Scratch2 + six limp frames: only two drawn injury keyposes; other poses preserve old walk pixels.
   jobs=[(state,frame,sourceCol)] if family=='ecology' or col<2 else [('limp',col-2, None)]
   if family=='limp' and col==5:jobs.extend([('limp',4,None),('limp',5,None)])
   for state,frame,sourceCol in jobs:
    file=f'assets/behavior/{species}_{state}_{direction}_{frame:03}.png';path=G/file;path.parent.mkdir(parents=True,exist_ok=True)
    reused=family=='limp' and state=='limp' and frame not in [2,3]
    if reused:
     ref=f'assets/{nativeFamily}/{species}_walk_{direction}_{frame:03}.png';shutil.copyfile(G/ref,path);out=Image.open(path).convert('RGBA')
     e={**legacy[ref], 'file':file,'species':species,'state':state,'direction':direction,'frame':frame,'origin':origin,'reused_from':ref,'reused_sha256':hashlib.sha256((G/ref).read_bytes()).hexdigest(),'export_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'runtime_enabled':item.get('runtime_enabled',True)}
    else:
     if family=='limp' and state=='limp':sourceCol=frame
     cw=256 if family=='ecology' else 384;inset=item.get('row_insets',{}).get(direction,[0,0,0,0]);margin=item.get('crop_margin',0);crop=[max(0,sourceCol*cw-margin+inset[0]),max(0,row*256-margin+inset[1]),min(1536,(sourceCol+1)*cw+margin-inset[2]),min(1024,(row+1)*256+margin-inset[3])];step=item.get('direction_strides',{}).get(direction,item.get('sample_stride',2));offsetSample=item.get('sample_offset',1)
     a=np.array(image.crop(crop))[offsetSample::step,offsetSample::step].copy();visible=isolate(a[:,:,3]>=item.get('alpha_threshold',248),margin=4) if item.get('isolate_neighbors') else a[:,:,3]>=item.get('alpha_threshold',248);ys,xs=np.where(visible)
     anchor=item['anchors'][direction];cell=[sourceCol*cw,row*256];off=[origin[i]-round((anchor[i]+cell[i]-crop[i]-offsetSample)/step) for i in range(2)];tx=xs+off[0];ty=ys+off[1]
     if not len(xs) or min(tx)<2 or min(ty)<2 or max(tx)>141 or max(ty)>141:errors.append(f'{species}/{family}/{direction}/{state}/{frame}: clipping {min(tx)},{min(ty)}-{max(tx)},{max(ty)}');continue
     rgb=a[:,:,:3].astype(np.int32);idx=np.argmin(((rgb[:,:,None,:]-P[None,None,:,:])**2).sum(axis=3),axis=2);a[:,:,:3]=P[idx];a[:,:,3]=np.where(visible,255,0);a[~visible]=0
     canvas=np.zeros((144,144,4),dtype=np.uint8);canvas[ty,tx]=a[ys,xs];out=Image.fromarray(canvas);out.save(path)
     e=dict(file=file,size=[144,144],origin=origin,species=species,state=state,direction=direction,frame=frame,source=source.relative_to(G).as_posix(),source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),source_crop=crop,source_cell_anchor=anchor,registration_offset=off,sampling_stride=step,sampling_offset=offsetSample,export_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),status='prototype_static',production_approved=False,animation_ready=False,runtime_enabled=item.get('runtime_enabled',True))
    manifest.append(e)
    # Ecology layout6; limp layout scratch2, then limp6 on separate review sheet.
    previewCol=col if family=='ecology' or state=='scratch' else frame+2
    for target in [grid,dark]:target.alpha_composite(out,(previewCol*144,row*164+20));ImageDraw.Draw(target).text((previewCol*144+2,row*164+3),state+' '+direction+' '+str(frame),fill='#69a4a0')
 for label,target in [('light',grid),('dark',dark)]:
  path=G/f'previews/behavior/{species}_{family}_{label}_1x.png';path.parent.mkdir(parents=True,exist_ok=True);target.save(path)
if errors:raise ValueError('\n'.join(errors))
(G/'behavior_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('Exported',len(manifest),'behaviour frames.')
