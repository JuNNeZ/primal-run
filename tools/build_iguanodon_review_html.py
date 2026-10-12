"""Package the reviewer as one portable HTML; embedded PNG bytes stay intact."""
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
P = ROOT/'PRIMAL_RUN_Species_Pilot'

def build():
    def png(path):
        return 'data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
    payload = {
        'rig': json.loads((P/'Reference_Rig/reference_manifest.json').read_text()),
        'referenceAtlas': png(P/'Reference_Rig/reference_E_atlas.png'),
        'spriteAtlas': png(P/'review/iguanodon_rig/iguanodon_walk_E_atlas.png'),
    }
    template = (ROOT/'tools/templates/iguanodon_rig_review.html').read_text()
    marker = '__EMBEDDED_REVIEW_DATA__'
    assert template.count(marker) == 1
    encoded = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    (P/'iguanodon_rig_review.html').write_text(template.replace(marker, encoded))
    print('Built standalone Iguanodon reviewer: embedded pose JSON and two byte-identical PNG atlases.')

if __name__ == '__main__':
    build()
