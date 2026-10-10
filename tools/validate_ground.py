"""Native terrain and source integrity checks; not seamless/art approval."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game';entries=json.loads((G/'ground_manifest.json').read_text());pal={tuple(int(c[i:i+2],16)for i in (1,3,5))for c in json.loads((G/'palette.json').read_text())['colors']};errors=[]
assert len(entries)==20
for e in entries:
 im=Image.open(G/e['file']);a=np.array(im);props=e['size']==[256,256]
 if im.mode!='RGBA' or list(im.size)!=e['size']:errors.append(e['file']+': canvas')
 if set(np.unique(a[:,:,3]))-{0,255} or np.any(a[a[:,:,3]==0,:3]):errors.append(e['file']+': alpha')
 if {tuple(p)for p in a[a[:,:,3]==255,:3]}-pal:errors.append(e['file']+': palette')
 if not props and not np.all(a[:,:,3]==255):errors.append(e['file']+': tile has empty edge')
 if props:
  b=im.getbbox()
  if not b or min(b[:2])<2 or max(b[2:])>254:errors.append(e['file']+': prop padding')
 for key,file in [('source_sha256',e['source']),('export_sha256',e['file'])]:
  if hashlib.sha256((G/file).read_bytes()).hexdigest()!=e[key]:errors.append(file+': integrity')
 if e['status']!='prototype_static' or e['production_approved'] or e['animation_ready']:errors.append('Invalid approval '+e['file'])
actual={p.relative_to(G).as_posix()for p in (G/'assets/ground').glob('*.png')}
if actual!={e['file']for e in entries}:errors.append('Ground overlay inventory')
report={'technical_result':'FAIL'if errors else'PASS','tiles':16,'props':4,'errors':errors,'production_approved':False,'seamless_approved':False,'limitations':['Generated tiles have subtle repeated clusters; irregular runtime patches reduce visible rectangular boundaries.','3x3 repeats are preserved for manual seam/style review; no technical seam certification.','Volcanic cone/crater art is a prototype; core supplies gradual heat and safe crossings.']}
(G/'ground_validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));raise SystemExit(bool(errors))
