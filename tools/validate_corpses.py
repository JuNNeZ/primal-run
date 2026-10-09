"""Validate static decomposition props; file checks are not anatomy approval."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image
GAME=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
manifest=json.loads((GAME/'corpse_manifest.json').read_text());errors=[]
palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in json.loads((GAME/'palette.json').read_text())['colors']}
if len(manifest)!=160:errors.append('Expected160 corpse props')
keys=set()
for e in manifest:
 p=GAME/e['file'];im=Image.open(p);a=np.array(im);bbox=im.getbbox();key=(e['species'],e['stage'],e['direction'],e['variant'])
 if key in keys:errors.append('Duplicate pose '+str(key))
 keys.add(key)
 if im.mode!='RGBA' or im.size!=(144,144) or e['origin']!=[72,72]:errors.append(e['file']+': canvas/origin')
 if not bbox or min(bbox[:2])<2 or max(bbox[2:])>142:errors.append(e['file']+': empty/padding')
 if not set(np.unique(a[:,:,3])).issubset({0,255}) or np.any(a[a[:,:,3]==0,:3]):errors.append(e['file']+': alpha')
 if {tuple(c) for c in a[a[:,:,3]==255,:3]}-palette:errors.append(e['file']+': palette')
 for file,field in [(p,'export_sha256'),(GAME/e['source'],'source_sha256')]:
  if hashlib.sha256(file.read_bytes()).hexdigest()!=e[field]:errors.append(e['file']+': hash '+field)
 if e['status']!='prototype_static' or e['production_approved'] or e['animation_ready']:errors.append(e['file']+': unsupported approval')
for species in {e['species'] for e in manifest}:
 for stage in ['decayed','skeleton']:
  for direction in ['S','E','N','W']:
   hashes=[e['export_sha256'] for e in manifest if e['species']==species and e['stage']==stage and e['direction']==direction]
   if len(hashes)!=2 or len(set(hashes))!=2:errors.append(f'{species}/{stage}/{direction}: variants missing/identical')
actual={p.relative_to(GAME).as_posix() for p in (GAME/'assets/corpses').glob('*.png')}
if actual!={e['file'] for e in manifest}:errors.append('Inventory mismatch')
report=dict(technical_export_result='FAIL' if errors else 'PASS',assets=len(manifest),errors=errors,production_approved=False,scope='Static native pixel inventory, palette, alpha, hashes, padding and variants. Does not certify anatomy or animated transitions.')
(GAME/'corpse_validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));raise SystemExit(bool(errors))
