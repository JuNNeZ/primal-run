"""Export one head-design study, without painting or integration."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
source = HERE / 'head_source_v1.png'
im = Image.open(source).convert('RGBA')
if im.size != (1254, 1254):
    raise ValueError(f'Unreviewed source plan: {im.size}')
# Imagegen returned 1254 instead of requested 1024. Preserve its pixels:
# crop 7px empty border, sample fixed10, register source landmark 627,627.
# This is a review-only source plan, not approval of scale or the drawn hip.
sample = np.asarray(im.crop((7, 7, 1247, 1247)))[5::10, 5::10].copy()
colors = json.loads((ROOT / 'PRIMAL_RUN_Game/palette.json').read_text())['colors']
palette = np.array([tuple(bytes.fromhex(c[1:])) for c in colors], dtype=np.int32)
rgb = sample[:, :, :3].astype(np.int32)
idx = np.argmin(((rgb[:, :, None, :] - palette[None, None, :, :]) ** 2).sum(3), 2)
visible = sample[:, :, 3] >= 192
sample[:, :, :3] = palette[idx]
sample[:, :, 3] = np.where(visible, 255, 0)
sample[~visible] = 0
canvas = np.zeros((144, 144, 4), dtype=np.uint8)
canvas[10:134, 10:134] = sample
output = HERE / 'iguanodon_walk_E_000.png'
Image.fromarray(canvas).save(output)
manifest = dict(file=output.name, source=source.name,
                source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                export_sha256=hashlib.sha256(output.read_bytes()).hexdigest(),
                source_size=[1254, 1254], source_crop=[7, 7, 1247, 1247],
                sample_step=10, sample_phase=[5, 5], source_anchor=[627, 627],
                registration_offset=[10, 10], origin=[72, 72], body_anchor=[72, 72],
                size=[144, 144], alpha_threshold=192, status='prototype_static',
                production_approved=False, animation_ready=False,
                purpose='One anatomical head study; not an animation or approved replacement.')
approval = HERE.parent / 'cardinal_review/approval.json'
if approval.exists():
    manifest.update(visual_design_approved=True, approved_by='Jonas / user',
                    approval_record='../cardinal_review/approval.json',
                    purpose='User-approved East appearance reference; no animation or integration approval.')
(HERE / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
old = Image.open(HERE.parent / output.name).convert('RGBA')
new = Image.fromarray(canvas)
for bg, label in [('#e8ece1', 'light'), ('#151b19', 'dark')]:
    for scale in [1, 4]:
        board = Image.new('RGBA', (288, 164), bg)
        draw = ImageDraw.Draw(board)
        for x, pic, title in [(0, old, 'Afvist v1'), (144, new, 'Hovedstudie - ikke godkendt')]:
            board.alpha_composite(pic, (x, 20))
            draw.text((x + 3, 3), title, fill='#69a4a0' if label == 'dark' else '#28372a')
        board.resize((288 * scale, 164 * scale), Image.Resampling.NEAREST).save(
            HERE / f'comparison_{label}_{scale}x.png')
