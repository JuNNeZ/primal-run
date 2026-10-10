"""Technical provenance/pixel gates are separate from behavior anatomy review."""
from pathlib import Path
import hashlib,json
from PIL import Image
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
M=json.loads((G/'native_behavior_manifest.json').read_text());palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in json.loads((G/'palette.json').read_text())['colors']};errors=[];counts={}
for e in M:
 file=G/e['file'];im=Image.open(file).convert('RGBA');counts[e['species']]=counts.get(e['species'],0)+1
 try:
  assert im.size==tuple(e['size'])==(144,144)
  assert e['status']=='prototype_static' and not e['production_approved'] and not e['animation_ready']
  assert hashlib.sha256(file.read_bytes()).hexdigest()==e['export_sha256']
  assert hashlib.sha256((G/e['source']).read_bytes()).hexdigest()==e['source_sha256']
  if e.get('native_fallback'):assert (G/e['file']).read_bytes()==(G/e['reference']).read_bytes() and not e['runtime_enabled']
  elif e['runtime_enabled']:assert e['visual_review']!='pending'
  assert hashlib.sha256((G/e['reference']).read_bytes()).hexdigest()==e['reference_sha256']
  for p in im.getdata():assert p==(0,0,0,0) or p[3]==255 and p[:3] in palette
  bbox=im.getbbox();assert bbox and min(bbox[:2])>=2 and max(bbox[2:])<=142
 except AssertionError:errors.append(e['file'])
expected={'ankylosaurus','baryonyx','carnotaurus','deinosuchus','gallimimus','pachycephalosaurus','parasaurolophus','triceratops','tyrannosaurus'}
if set(counts)!=expected:errors.append('Incomplete nine-species registry')
groups={}
for e in M:groups.setdefault((e['species'],e['state'],e['direction']),[]).append(e)
for key,pair in groups.items():
 if len(pair)!=2 or {e['frame'] for e in pair}!={0,1} or len({e['runtime_enabled'] for e in pair})!=1:errors.append(f'Incomplete/mixed pair {key}')
for species,count in counts.items():
 if count!=32:errors.append(f'{species}: expected32poses, got {count}')
report=dict(status='PASS' if not errors else 'FAIL',frames=len(M),species=counts,runtime_enabled=sum(bool(e['runtime_enabled']) for e in M),errors=errors,native_fallback=sum(bool(e.get('native_fallback')) for e in M),scope='PNG/provenance only; anatomy/style/runtime approval remains separate.')
(G/'NATIVE_BEHAVIOR_VALIDATION.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));assert not errors
