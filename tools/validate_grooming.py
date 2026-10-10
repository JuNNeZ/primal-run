"""Technical provenance/pixel gates are separate from grooming anatomy review."""
from pathlib import Path
import hashlib,json
from PIL import Image
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
M=json.loads((G/'grooming_manifest.json').read_text());palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in json.loads((G/'palette.json').read_text())['colors']};errors=[];counts={}
for e in M:
 file=G/e['file'];im=Image.open(file).convert('RGBA');counts[e['species']]=counts.get(e['species'],0)+1
 try:
  assert im.size==tuple(e['size'])==(144,144)
  assert e['status']=='prototype_static' and not e['production_approved'] and not e['animation_ready']
  assert hashlib.sha256(file.read_bytes()).hexdigest()==e['export_sha256']
  assert hashlib.sha256((G/e['source']).read_bytes()).hexdigest()==e['source_sha256']
  assert hashlib.sha256((G/e['reference']).read_bytes()).hexdigest()==e['reference_sha256']
  for p in im.getdata():assert p==(0,0,0,0) or p[3]==255 and p[:3] in palette
  bbox=im.getbbox();assert bbox and min(bbox[:2])>=2 and max(bbox[2:])<=142
 except AssertionError:errors.append(e['file'])
for species,count in counts.items():
 if count!=8:errors.append(f'{species}: expected eight poses, got {count}')
report=dict(status='PASS' if not errors else 'FAIL',frames=len(M),species=counts,runtime_enabled=sum(bool(e['runtime_enabled']) for e in M),errors=errors,scope='PNG/provenance only; anatomy/style/runtime approval remains separate.')
(G/'GROOMING_VALIDATION.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));assert not errors
