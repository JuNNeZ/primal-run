"""Technical gates for dedicated HUD heads and A1 attacks; never certifies anatomy."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'PRIMAL_RUN_Game'
palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in json.loads((GAME/'palette.json').read_text())['colors']};errors=[]
for family,size,count in [('avatar',64,240),('species_attack',144,96),('forage',64,8)]:
 data=json.loads((GAME/(family+'_manifest.json')).read_text())
 if len(data)!=count:errors.append(f'{family}: expected {count} files')
 for e in data:
  p=GAME/e['file'];im=Image.open(p);a=np.array(im);box=im.getbbox()
  if im.mode!='RGBA' or im.size!=(size,size) or e['origin']!=[size//2,size//2]:errors.append(e['file']+': canvas/origin')
  if not set(np.unique(a[:,:,3])).issubset({0,255}) or np.any(a[a[:,:,3]==0,:3]):errors.append(e['file']+': alpha')
  if {tuple(c) for c in a[a[:,:,3]==255,:3]}-palette:errors.append(e['file']+': palette')
  if not box or min(box[:2])<2 or max(box[2:])>size-2:errors.append(e['file']+': empty/clipped')
  for path,key in [(p,'export_sha256'),(GAME/e['source'],'source_sha256')]:
   if hashlib.sha256(path.read_bytes()).hexdigest()!=e[key]:errors.append(e['file']+': SHA')
  if e['status']!='prototype_static' or e['production_approved'] or e['animation_ready']:errors.append(e['file']+': unsupported approval')
 report={'status':'FAIL' if errors else 'PASS','files':len(data),'errors':errors.copy(),'production_approved':False,'scope':'Canvas, binary alpha, padding, fixed palette, declared registration and source/export integrity only.'}
 (GAME/(family+'_validation.json')).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':'FAIL' if errors else 'PASS','errors':errors},indent=2));raise SystemExit(bool(errors))
