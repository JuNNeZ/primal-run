"""Review-only cardinal poses; reuse approved East without changing a pixel."""
import hashlib
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
palette = np.array([tuple(bytes.fromhex(c[1:])) for c in
                    json.loads((ROOT / 'PRIMAL_RUN_Game/palette.json').read_text())['colors']],
                   dtype=np.int32)
records = []
selections = json.loads((HERE / 'selections.json').read_text()) if (HERE / 'selections.json').exists() else {}
for direction in ['N', 'S', 'W', 'E']:
    output = HERE / f'iguanodon_walk_{direction}_000.png'
    if direction == 'E':
        source = HERE.parent / 'head_revision/iguanodon_walk_E_000.png'
        shutil.copy2(source, output)
        record = dict(source='../head_revision/' + source.name, reused_byte_identical=True,
                      visual_design_approved=True, approved_by='Jonas / user')
    else:
        source = HERE / selections.get(direction, f'source_{direction}_v1.png')
        pic = Image.open(source).convert('RGBA')
        if pic.size != (1254, 1254):
            raise ValueError(f'Unreviewed source plan for {direction}: {pic.size}')
        sample = np.asarray(pic.crop((7, 7, 1247, 1247)))[5::10, 5::10].copy()
        visible = sample[:, :, 3] >= 192
        rgb = sample[:, :, :3].astype(np.int32)
        idx = np.argmin(((rgb[:, :, None, :] - palette[None, None, :, :]) ** 2).sum(3), 2)
        sample[:, :, :3] = palette[idx]
        sample[:, :, 3] = np.where(visible, 255, 0)
        sample[~visible] = 0
        canvas = np.zeros((144, 144, 4), dtype=np.uint8)
        canvas[10:134, 10:134] = sample
        Image.fromarray(canvas).save(output)
        record = dict(source=source.name, source_size=[1254, 1254],
                      source_crop=[7, 7, 1247, 1247], sample_step=10, sample_phase=[5, 5],
                      source_anchor=[627, 627], registration_offset=[10, 10],
                      alpha_threshold=192, reused_byte_identical=False,
                      visual_design_approved=False)
    record.update(file=output.name, direction=direction, size=[144, 144],
                  origin=[72, 72], body_anchor=[72, 72],
                  source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                  export_sha256=hashlib.sha256(output.read_bytes()).hexdigest(),
                  status='prototype_static', production_approved=False, animation_ready=False,
                  purpose='One static direction study. Frame000 naming matches the pose guide only.')
    records.append(record)
(HERE / 'review_manifest.json').write_text(json.dumps(records, indent=2) + '\n')
for color, label in [('#e8ece1', 'light'), ('#151b19', 'dark')]:
    board = Image.new('RGBA', (288, 328), color)
    draw = ImageDraw.Draw(board)
    for index, record in enumerate(records):
        x, y = (index % 2) * 144, (index // 2) * 164
        board.alpha_composite(Image.open(HERE / record['file']), (x, y + 20))
        title = dict(N='Nord', S='Syd', W='Vest', E='Øst - godkendt reference')[record['direction']]
        draw.text((x + 3, y + 3), title, fill='#69a4a0' if label == 'dark' else '#28372a')
    board.save(HERE / f'cardinals_{label}_1x.png')
    board.resize((1152, 1312), Image.Resampling.NEAREST).save(HERE / f'cardinals_{label}_4x.png')
