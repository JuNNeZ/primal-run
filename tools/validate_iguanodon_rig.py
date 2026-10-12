"""Independent geometry and mechanical-export checks; no visual certification."""
import hashlib
import json
import math
import sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parent))
from export_species_pilot import sample

P=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Species_Pilot'
R=P/'Reference_Rig'
D=P/'review/iguanodon_rig'
rig=json.loads((R/'reference_manifest.json').read_text())
palette={tuple(bytes.fromhex(s[1:])) for s in json.loads((P/'palette.json').read_text())['colors']}
frames=rig['frames']
assert len(frames)==12
length_checks=contacts=0
for i,p in enumerate(frames):
    assert p['root']==rig['root']
    assert set(p['limbs'])=={'LH','LF','RH','RF'}
    assert sum(v['stance'] for v in p['limbs'].values())>=3
    for name,v in p['limbs'].items():
        for a,b,length in [(v['upper'],v['joint'],v['lengths'][0]),(v['joint'],v['foot'],v['lengths'][1])]:
            assert abs(math.dist(a,b)-length)<1e-6
            length_checks+=1
        assert abs(v['foot'][1]-v['upper'][1])<1e-6, 'unplanned sidestep'
        if v['stance']:
            assert abs(v['foot'][2]-.10)<1e-6
        w=frames[(i+1)%12]['limbs'][name]
        if v['stance'] and w['stance']:
            # Add world travel to the model-relative stance foot.
            assert abs(w['foot'][0]-v['foot'][0]+rig['stride']/.75/12)<1e-6
            contacts+=1
    im=Image.open(R/f'guide_E_{i:03}.png')
    assert im.size==(432,432)
    a=np.array(im.convert('RGBA'))[:,:,3]
    assert np.any(a>0) and np.all(a[:2]==0) and np.all(a[-2:]==0)
    assert np.all(a[:,:2]==0) and np.all(a[:,-2:]==0)

entries=json.loads((D/'manifest.json').read_text())
hashes=[]
for e in entries:
    path=P/e['file']
    im=Image.open(path).convert('RGBA')
    assert im.size==(144,144)
    a=np.array(im)
    assert set(np.unique(a[:,:,3]))=={0,255}
    assert np.all(a[a[:,:,3]==0]==0)
    assert {tuple(c) for c in a[a[:,:,3]==255,:3]}<=palette
    assert not np.any(a[:2,:,3]) and not np.any(a[-2:,:,3])
    assert not np.any(a[:,:2,3]) and not np.any(a[:,-2:,3])
    expected,_=sample(e)
    assert np.array_equal(np.array(expected),a)
    assert hashlib.sha256(path.read_bytes()).hexdigest()==e['export_sha256']
    atlas=Image.open(P/e['atlas']).convert('RGBA')
    x,y,w,h=e['atlas_crop']
    assert np.array_equal(np.array(atlas.crop((x,y,x+w,y+h))),a)
    assert hashlib.sha256((P/e['source']).read_bytes()).hexdigest()==e['source_sha256']
    assert e['production_approved'] is False and e['animation_ready'] is False
    hashes.append(e['export_sha256'])
assert len(set(hashes))==6, 'exact duplicate export'
report=json.loads((D/'validation_report.json').read_text())
report.update(rig_geometry='PASS',reference_pose_count=12,bone_length_checks=length_checks,
              world_stance_contact_checks=contacts,constant_root=True,no_reference_sidesteps=True,
              sprite_pixels='PASS:144RGBA/fixed32/binary alpha/margins/source hashes/explicit sampling',
              unique_export_count=len(set(hashes)),visual_approval=False)
(D/'validation_report.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'PASS: {length_checks} bone lengths, {contacts} stance intervals, six mechanically valid review exports. Visual approval: false.')
