"""Verify native reuse without converting a renderer check into visual approval."""
from pathlib import Path
import hashlib,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'PRIMAL_RUN_Game'
entries=json.loads((GAME/'ground_reuse_manifest.json').read_text());assert len(entries)==16
palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in json.loads((GAME/'palette.json').read_text())['colors']}
for e in entries:
    data=(GAME/e['file']).read_bytes();assert hashlib.sha256(data).hexdigest()==e['export_sha256']==e['reused_sha256'],e['file']
    assert data==(GAME/'Source_Generated/ground_reused'/e['file']).read_bytes(),e['file']+' immutable master'
    assert hashlib.sha256((GAME/e['source']).read_bytes()).hexdigest()==e['source_sha256'],e['source']
    with Image.open(GAME/e['file']) as im:
        assert im.mode=='RGBA' and im.size==(32,32) and e['origin']==[0,0]
        pixels=list(im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata())
        assert {p[3] for p in pixels}=={255}
        assert {p[:3] for p in pixels}<=palette
report=dict(status='PASS',tiles=16,checks=['preserved export hashes','immutable tile masters','original source atlas hash','native 32x32 RGBA','opaque alpha','fixed Earth32 palette','unaltered origins'],production_approved=False)
(GAME/'ground_reuse_validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
