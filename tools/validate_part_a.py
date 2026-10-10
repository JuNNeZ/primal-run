"""Technical integrity gate. Anatomy and motion still require visual review."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game';errors=[];count=0;families={}
palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in json.loads((G/'palette.json').read_text())['colors']}
for name,expected in [('water_transition',48),('behavior',632)]:
 entries=json.loads((G/f'{name}_manifest.json').read_text());families[name]=len(entries);count+=len(entries)
 if len(entries)!=expected:errors.append(f'{name}: expected {expected}, got {len(entries)}')
 seen=set()
 for e in entries:
  if e['file'] in seen:errors.append('Duplicate '+e['file'])
  seen.add(e['file']);p=G/e['file'];im=Image.open(p);a=np.array(im)
  if im.mode!='RGBA' or list(im.size)!=e['size']:errors.append(e['file']+': format')
  if not set(np.unique(a[:,:,3])).issubset({0,255}) or np.any(a[a[:,:,3]==0,:3]):errors.append(e['file']+': alpha')
  if {tuple(v) for v in a[a[:,:,3]==255,:3]}-palette:errors.append(e['file']+': palette')
  if name=='water_transition' and np.any(a[:,:,3]!=255):errors.append(e['file']+': tile holes')
  if name=='behavior':
   b=im.getbbox()
   if not b or min(b[:2])<2 or max(b[2:])>142:errors.append(e['file']+': clipped/empty')
  for key,file in [('source_sha256',G/e['source']),('export_sha256',p)]:
   if hashlib.sha256(file.read_bytes()).hexdigest()!=e[key]:errors.append(e['file']+': '+key)
  if e.get('reused_from') and p.read_bytes()!=(G/e['reused_from']).read_bytes():errors.append(e['file']+': reuse mismatch')
  if e['status']!='prototype_static' or e['production_approved'] or e['animation_ready']:errors.append(e['file']+': invalid approval claim')
 if name=='behavior':
  for species in {e['species'] for e in entries}:
   for state,n in [('scratch',2),('limp',6)]:
    for d in ['S','N','E','W']:
     if {e['frame'] for e in entries if e['species']==species and e['state']==state and e['direction']==d}!=set(range(n)):errors.append(species+': incomplete '+state+d)
report=dict(status='FAIL' if errors else 'PASS',families=families,assets=count,errors=errors,production_approved=False,scope='Native export inventory, alpha, palette, hashes and complete directions. Does not certify anatomy, gait or seamless tile edges.')
(G/'PART_A_ASSET_VALIDATION.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));raise SystemExit(bool(errors))
