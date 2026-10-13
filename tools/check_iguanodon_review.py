"""Audit sources and the user's strict 2px contour requirement, without changing gates."""
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from export_iguanodon_rig_review import ROOT, REVIEW as P


def edge(mask):
    neighbours = np.pad(mask, 1)
    interior = mask.copy()
    for dy in range(3):
        for dx in range(3):
            interior &= neighbours[dy:dy+144, dx:dx+144]
    return mask & ~interior


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    records = json.loads((P / 'export_provenance.json').read_text())
    assert len(records) == 120
    for name, expected in json.loads((P / 'protected_hashes.json').read_text()).items():
        assert sha(ROOT / name) == expected, name
    sheet = Image.new('RGBA', (1728, 1680), '#202925')
    draw = ImageDraw.Draw(sheet)
    distances = {}
    for i, name in enumerate(json.loads((P / 'rig_reference.json').read_text())['frames']):
        e = records[name]
        assert sha(P / e['file']) == e['export_sha256'], name
        assert sha(P / e['raw']) == e['raw_sha256'], name
        im = np.array(Image.open(P / e['file']).convert('RGBA'))
        rig = np.array(Image.open(ROOT / 'PRIMAL_RUN_Rig/iguanodon' / e['file']).convert('RGBA'))
        assert not np.array_equal(im, rig), name
        ae, be = edge(im[:, :, 3] > 0), edge(rig[:, :, 3] > 0)
        ac, bc = np.argwhere(ae), np.argwhere(be)
        squared = ((ac[:, None, :].astype(np.int32) - bc[None, :, :]) ** 2).sum(2)
        ad, bd = np.sqrt(squared.min(1)), np.sqrt(squared.min(0))
        distance = round(float(max(ad.max(), bd.max())), 3)
        distances[name] = distance
        overlay = im.copy()
        overlay[be] = [70, 190, 220, 255]
        for pixels in [ac[ad > 2], bc[bd > 2]]:
            overlay[pixels[:, 0], pixels[:, 1]] = [255, 80, 75, 255]
        x, y = i % 12 * 144, i // 12 * 168
        sheet.alpha_composite(Image.fromarray(overlay), (x, y + 24))
        draw.text((x + 3, y + 2), name.replace('iguanodon_', ''), fill='#dce2c4')
        draw.text((x + 3, y + 12), f'max {distance:.2f}px', fill='#ff7b75' if distance > 2 else '#70d38c')
        if distance > 2:
            draw.rectangle((x, y, x + 143, y + 167), outline='#ff5d58')
    failures = {n: d for n, d in distances.items() if d > 2}
    diagnostic = {'method': 'symmetric Euclidean Hausdorff between native silhouette boundary pixels',
                  'threshold_px': 2, 'passed': not failures, 'failures': failures,
                  'max_distance_per_frame': distances,
                  'note': 'Additional check of existing user requirement. Original validator unchanged.'}
    (P / 'strict_contour_diagnostic.json').write_text(json.dumps(diagnostic, indent=2) + '\n')
    sheet.save(P / 'strict_contour_overlay.png')
    sheet.crop((0, 0, 576, 168)).resize((1152, 336), Image.Resampling.NEAREST).save(P / 'strict_contour_example.png')
    print(f'Strict contour: {len(failures)}/120 frames exceed 2px. Maximum {max(distances.values()):.3f}px. Source hashes verified.')
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
