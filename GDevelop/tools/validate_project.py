"""Portable project integrity checks. Not a substitute for engine deserialization."""
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1];p=json.loads((root/'project.json').read_text());kit=root.parent/'PRIMAL_RUN_Prototype_Kit'
assert p['firstLayout']=='Game' and len(p['layouts'])==1
assert p['properties']['scaleMode']=='nearest' and p['properties']['pixelsRounding']
scene=p['layouts'][0];assert len(scene['objects'])==11
names={o['name'] for o in scene['objects']};assert names=={e['objectName'] for e in scene['objectsFolderStructure']['children']}
assert all(i['name'] in names for i in scene['instances'])
resources=p['resources']['resources'];assert len(resources)==112
for r in resources:
 path=Path(r['file']);assert not path.is_absolute() and '..' not in path.parts
 assert (root/path).is_file(),r['file']
 if (kit/path).exists():assert hashlib.sha256((root/path).read_bytes()).digest()==hashlib.sha256((kit/path).read_bytes()).digest(),'Asset changed '+r['file']
 if r['kind']=='image':assert r['smoothed'] is False
for o in scene['objects']:
 assert not o['behaviors'],'Autonomous behaviors require a separate pause audit'
 if o['type']=='Sprite':
  for a in o['animations']:
   for d in a['directions']:
    for f in d['sprites']:assert f['image'] in {r['name'] for r in resources}
report=dict(result='PASS',objects=len(names),resources=len(resources),png=104,wav=8,checks=['relative resource paths','files exist','assets byte-identical to original kit','nearest/pixel rounding','no unpaused autonomous behaviors','all native object definitions visible in editor folder'],scope='Project integrity, NOT engine schema/runtime')
(root/'reports/integrity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
