"""Validate delivery pixels and contract; does not approve art or runtime."""
import json
import hashlib
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent


def validate():
    manifest = json.loads((ROOT / 'manifest.json').read_text())
    palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads((ROOT / 'palette.json').read_text())['colors']}
    results = []
    for entry in manifest['assets']:
        im = Image.open(ROOT / entry['path'])
        errors = []
        if im.mode != 'RGBA' or list(im.size) != entry['size']:
            errors.append('Wrong mode or dimensions')
        for r, g, b, a in set(im.getdata()):
            if a not in (0, 255) or (a == 0 and (r, g, b) != (0, 0, 0)):
                errors.append('Invalid alpha or transparent RGB')
            if a and (r, g, b) not in palette:
                errors.append('Color outside palette')
        bounds = im.getbbox()
        if not bounds:
            errors.append('Empty asset')
        elif entry['family'] != 'mud_overlay':
            if bounds[0] < 2 or bounds[1] < 2 or bounds[2] > im.width - 2 or bounds[3] > im.height - 2:
                errors.append('Insufficient transparent margin')
        if entry['status'] != 'prototype_static' or entry['production_approved']:
            errors.append('Incorrect approval status')
        if 'source_sha256' in entry:
            source = ROOT / entry['source']
            if hashlib.sha256(source.read_bytes()).hexdigest() != entry['source_sha256']:
                errors.append('Source hash mismatch')
            if hashlib.sha256((ROOT / entry['path']).read_bytes()).hexdigest() != entry['export_sha256']:
                errors.append('Export hash mismatch')
            if entry['operation'].get('unchanged') and source.read_bytes() != (ROOT / entry['path']).read_bytes():
                errors.append('Reused asset was altered')
        results.append(dict(path=entry['path'], bounds=bounds, errors=sorted(set(errors))))
    for family in ('bubble', 'ash_cloud'):
        frames = [e for e in manifest['assets'] if e['family'] == family]
        assert len({tuple(e['size'] + e['origin']) for e in frames}) == 1
        assert len({Image.open(ROOT / e['path']).tobytes() for e in frames}) == 4
    tiles = [Image.open(ROOT / e['path']) for e in manifest['assets'] if e['family'] == 'mud_overlay']
    seams_match = all(t.crop((0, 0, 1, 32)).tobytes() == t.crop((31, 0, 32, 32)).tobytes() for t in tiles)
    provenance = json.loads((ROOT / 'Source_Reused/provenance.json').read_text())
    source_blobs_valid = True
    for entry in provenance['files']:
        if entry['path'].endswith('.png'):
            data = (ROOT / 'Source_Reused/feathered' / entry['path']).read_bytes()
            actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
            source_blobs_valid &= actual == entry['git_blob_sha']
    report = dict(passed=not any(r['errors'] for r in results) and seams_match and source_blobs_valid,
                  asset_count=len(results), mud_left_right_seams_match=seams_match,
                  feathered_source_git_blobs_match=source_blobs_valid,
                  visual_review='See REVIEW.md; human approval pending',
                  game_runtime_tested=False, results=results)
    (ROOT / 'validation_report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'results'}, indent=2))
    for r in results:
        if r['errors']:
            print(r)
    return report['passed']


if __name__ == '__main__':
    raise SystemExit(0 if validate() else 1)
