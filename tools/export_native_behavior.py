"""Extract minimally authored behavior pairs; never redraw, recenter or scale anatomy."""
from pathlib import Path
import hashlib,json,shutil
import numpy as np
from PIL import Image,ImageDraw
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
P=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((G/'palette.json').read_text())['colors']],dtype=np.int32)
legacy={e['file']:e for family in ['player_full','enemy_full'] for e in json.loads((G/f'{family}_manifest.json').read_text())}
config=json.loads((G/'Source_Generated/behavior_native/exports.json').read_text())
manifest=[]
for item in config:
 species=item['species'];base_src=G/item['source'];cache={}
 family='enemy_full' if species in ['parasaurolophus','triceratops','tyrannosaurus','deinosuchus'] else 'player_full'
 previews={label:Image.new('RGBA',(6*144,4*164),color) for label,color in [('light','#e8ece1'),('dark','#151b19')]}
 for row,direction in enumerate(['S','N','E','W']):
  ref=f'assets/{family}/{species}_idle_{direction}_000.png';origin=legacy[ref]['origin'];anchor=item.get('anchors',{}).get(direction,[192,128]);step=item.get('sample_stride',2);offset=item.get('sample_offset',1)
  for col in range(4):
   state=['graze','graze','drink','drink'][col] if item['part']=='feed' else ['sleep','sleep','scratch','scratch'][col];frame=col%2
   src=G/item.get('source_overrides',{}).get(f'{state}_{direction}',base_src.relative_to(G).as_posix())
   if src not in cache:
    cache[src]=Image.open(src).convert('RGBA');assert cache[src].size==(1536,1024),(src,cache[src].size)
   im=cache[src]
   crop=[col*384,row*256,(col+1)*384,(row+1)*256];a=np.array(im.crop(crop))[offset::step,offset::step].copy();visible=a[:,:,3]>=item.get('alpha_threshold',248);ys,xs=np.where(visible)
   registration=[origin[i]-round((anchor[i]-offset)/step) for i in range(2)];tx=xs+registration[0];ty=ys+registration[1]
   reason=next((item.get('rejected_poses',{}).get(f'{state}_{direction}_{f:03}') for f in [0,1] if item.get('rejected_poses',{}).get(f'{state}_{direction}_{f:03}')), '')
   if not len(xs):reason=reason or 'Empty authored pose; canonical idle fallback.'
   elif min(tx)<2 or min(ty)<2 or max(tx)>141 or max(ty)>141:reason=reason or f'Authored pose clips fixed native canvas: {min(tx)},{min(ty)}-{max(tx)},{max(ty)}; canonical idle fallback.'
   rgb=a[:,:,:3].astype(np.int32);idx=np.argmin(((rgb[:,:,None,:]-P[None,None,:,:])**2).sum(axis=3),axis=2);a[:,:,:3]=P[idx];a[:,:,3]=np.where(visible,255,0);a[~visible]=0
   canvas=np.zeros((144,144,4),dtype=np.uint8)
   if not reason:canvas[ty,tx]=a[ys,xs]
   out=Image.open(G/ref).convert('RGBA') if reason else Image.fromarray(canvas)
   file=f'assets/behavior_native/{species}_{state}_{direction}_{frame:03}.png';path=G/file;path.parent.mkdir(parents=True,exist_ok=True)
   if reason:shutil.copyfile(G/ref,path)
   else:out.save(path)
   manifest.append(dict(file=file,size=[144,144],origin=origin,species=species,state=state,direction=direction,frame=frame,source=src.relative_to(G).as_posix(),source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),source_crop=crop,source_cell_anchor=anchor,registration_offset=registration,sampling_stride=step,sampling_offset=offset,alpha_threshold=item.get('alpha_threshold',248),export_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),reference=ref,reference_sha256=hashlib.sha256((G/ref).read_bytes()).hexdigest(),status='prototype_static',production_approved=False,animation_ready=False,runtime_enabled=False if reason else item.get('runtime_enabled',False),visual_review=reason or item.get('visual_review','pending'),native_fallback=bool(reason),fallback_reason=reason or None))
   for image in previews.values():
    image.alpha_composite(Image.open(G/ref).convert('RGBA'),((col//2)*432,row*164+20));image.alpha_composite(out,((col//2)*432+(frame+1)*144,row*164+20));ImageDraw.Draw(image).text(((col//2)*432+(frame+1)*144+2,row*164+3),f'{direction} {state} {frame}',fill='#69a4a0')
 for label,image in previews.items():
  path=G/f'previews/behavior_native/{species}_{item['part']}_{label}_1x.png';path.parent.mkdir(parents=True,exist_ok=True);image.save(path)
# A failed pose rejects bothmembers of its cycle, nevermix changed anatomy witholdidle.
groups={}
for e in manifest:groups.setdefault((e['species'],e['state'],e['direction']),[]).append(e)
for pair in groups.values():
 reason=next((e['fallback_reason'] for e in pair if e['native_fallback']),None)
 if reason:
  for e in pair:
   path=G/e['file'];shutil.copyfile(G/e['reference'],path);e.update(native_fallback=True,runtime_enabled=False,fallback_reason=reason,visual_review=reason,export_sha256=hashlib.sha256(path.read_bytes()).hexdigest())
   part='feed' if e['state'] in ['graze','drink'] else 'rest';groupcol=0 if e['state'] in ['graze','sleep'] else 1;row=['S','N','E','W'].index(e['direction']);x=groupcol*432+(e['frame']+1)*144;y=row*164
   for label,color in [('light','#e8ece1'),('dark','#151b19')]:
    preview=G/f"previews/behavior_native/{e['species']}_{part}_{label}_1x.png";image=Image.open(preview).convert('RGBA');d=ImageDraw.Draw(image);d.rectangle((x,y,x+143,y+163),fill=color);image.alpha_composite(Image.open(path).convert('RGBA'),(x,y+20));d.text((x+2,y+3),f"{e['direction']} FALLBACK {e['frame']}",fill='#69a4a0');image.save(preview)
(G/'native_behavior_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(f'Exported {len(manifest)} native-body behavior poses; eligibility remains explicit per source.')
