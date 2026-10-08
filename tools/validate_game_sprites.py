"""Check exported game sprites and attack manifests without approving artwork."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
manifest = json.loads((GAME / 'manifest.json').read_text())
palette = {tuple(int(c[i:i+2], 16) for i in (1, 3, 5)) for c in json.loads((GAME / 'palette.json').read_text())['colors']}
errors, stats = [], {}
for entry in manifest:
    file = entry['file']
    with Image.open(GAME / file) as pic:
        if pic.mode != 'RGBA' or list(pic.size) != entry['size']:
            errors.append(file + ': mode/size')
        a = np.asarray(pic)
        if not set(np.unique(a[:, :, 3])).issubset({0, 255}):
            errors.append(file + ': nonbinary alpha')
        if np.any(a[a[:, :, 3] == 0, :3]):
            errors.append(file + ': nonzero transparent RGB')
        colors = {tuple(c) for c in a[a[:, :, 3] == 255, :3]}
        if colors - palette:
            errors.append(file + ': outside palette')
        if file.startswith('assets/player_combat/'):
            bbox = pic.getbbox()
            if not bbox or min(bbox[:2]) < 2 or bbox[2] > 126 or bbox[3] > 126:
                errors.append(file + ': padding/empty')
            if entry['origin'] != entry['body_anchor']:
                errors.append(file + ': pivot mismatch')
            if hashlib.sha256((GAME / entry['source']).read_bytes()).hexdigest() != entry['source_sha256']:
                errors.append(file + ': source hash mismatch')
            stats[file] = {'bbox': list(bbox), 'origin': entry['origin'], 'opaque_pixels': int(np.sum(a[:, :, 3] == 255)), 'palette_colors': len(colors)}
actual = {p.relative_to(GAME).as_posix() for p in (GAME / 'assets').rglob('*.png')}
listed = {e['file'] for e in manifest}
if actual != listed:
    errors.append('Asset inventory mismatch: ' + str(sorted(actual ^ listed)))
animations = json.loads((GAME / 'player_combat_animations.json').read_text())['animations']
for anim in animations:
    frames = [np.asarray(Image.open(GAME / f)) for f in anim['frames']]
    if len(frames) != 6 or anim['fps'] != 14 or anim['loop'] or anim['contact_frame'] != 3:
        errors.append(anim['name'] + ': timing/plan mismatch')
    if not np.array_equal(frames[0], frames[5]):
        errors.append(anim['name'] + ': recovery endpoint differs')
    for i in range(1, 5):
        if np.array_equal(frames[i], frames[i-1]):
            errors.append(anim['name'] + ': unintended duplicate frame ' + str(i))
report = {
    'technical_export_result': 'FAIL' if errors else 'PASS', 'assets': len(manifest),
    'new_attack_frames': len(stats), 'errors': errors, 'frames': stats,
    'production_approved': False,
    'scope': 'Native PNG dimensions, palette, alpha, padding, inventory, source integrity, declared anchors, intentional endpoint reuse and timing plan. Does not certify anatomy, consistent lighting or temporal art quality.',
    'visual_review': 'See player_review.html at 1x/4x on both backgrounds. Generated poses remain studies; legacy walk/idle transitions require further refinement.',
}
(GAME / 'player_sprite_validation.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k != 'frames'}, indent=2))
raise SystemExit(1 if errors else 0)
