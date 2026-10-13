"""Review-only fixed32 export. No drawing, pose correction or game integration."""
import argparse
import hashlib
import json
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def export(source, output):
    if not output.resolve().is_relative_to(HERE):
        raise ValueError('Exports must remain inside this review folder.')
    if not source.resolve().is_relative_to(HERE):
        raise ValueError('Preserve the source inside this review folder first.')
    output.mkdir(parents=True, exist_ok=True)
    pic = Image.open(source).convert('RGBA')
    if pic.size != (1536, 1024):
        raise ValueError(f'Unexpected native source plan: {pic.size}')
    palette = np.array([tuple(bytes.fromhex(c[1:])) for c in
                        json.loads((ROOT / 'PRIMAL_RUN_Game/palette.json').read_text())['colors']],
                       dtype=np.int32)
    manifest = []
    animations = []
    for row, direction in enumerate('SNEW'):
        frames = []
        names = []
        for frame in range(6):
            crop = [frame * 256, row * 256, (frame + 1) * 256, (row + 1) * 256]
            sample = np.asarray(pic.crop(crop))[1::2, 1::2].copy()
            visible = sample[:, :, 3] >= 192
            rgb = sample[:, :, :3].astype(np.int32)
            idx = np.argmin(((rgb[:, :, None, :] - palette[None, None, :, :]) ** 2).sum(3), 2)
            sample[:, :, :3] = palette[idx]
            sample[:, :, 3] = np.where(visible, 255, 0)
            sample[~visible] = 0
            canvas = np.zeros((144, 144, 4), dtype=np.uint8)
            canvas[8:136, 8:136] = sample
            name = f'iguanodon_walk_{direction}_{frame:03}.png'
            path = output / name
            Image.fromarray(canvas).save(path)
            frames.append(Image.fromarray(canvas))
            names.append(name)
            manifest.append(dict(file=name, size=[144, 144], origin=[72, 72],
                                 body_anchor=[72, 72], species='iguanodon', state='walk',
                                 direction=direction, frame=frame,
                                 source=os.path.relpath(source.resolve(), output.resolve()),
                                 source_sha256=sha(source), source_crop=crop,
                                 source_cell_anchor=[128, 128], registration_offset=[8, 8],
                                 export_sha256=sha(path), sample_step=2, sample_phase=[1, 1],
                                 alpha_threshold=192, status='prototype_static',
                                 production_approved=False, animation_ready=False,
                                 anchor_visual_verified=False))
        animations.append(dict(state='walk', direction=direction, frames=names, fps=8,
                               loop=True, origin=[72, 72], validated_animation=False))
        for bg, label in [('#e8ece1', 'light'), ('#151b19', 'dark')]:
            previews = []
            for frame in frames:
                preview = Image.new('RGBA', (144, 144), bg)
                preview.alpha_composite(frame)
                previews.append(preview.convert('RGB'))
            for scale in [1, 4]:
                seq = [im.resize((144 * scale, 144 * scale), Image.Resampling.NEAREST)
                       for im in previews]
                seq[0].save(output / f'walk_{direction}_{label}_{scale}x.gif',
                            save_all=True, append_images=seq[1:], duration=125, loop=0)
    for bg, label in [('#e8ece1', 'light'), ('#151b19', 'dark')]:
        sheet = Image.new('RGBA', (864, 656), bg)
        draw = ImageDraw.Draw(sheet)
        for item in manifest:
            row = 'SNEW'.index(item['direction'])
            x, y = item['frame'] * 144, row * 164
            sheet.alpha_composite(Image.open(output / item['file']), (x, y + 20))
            draw.text((x + 3, y + 3), item['file'].removeprefix('iguanodon_'),
                      fill='#69a4a0' if label == 'dark' else '#28372a')
        sheet.save(output / f'walk_{label}_1x.png')
        sheet.resize((3456, 2624), Image.Resampling.NEAREST).save(output / f'walk_{label}_4x.png')
    (output / 'review_manifest.json').write_text(json.dumps(dict(
        export='Fixed 2px integer sampling; alpha>=192; fixed32; explicit cell registration. '
               'No silhouette substitution, drawing, smoothing, mirroring or bbox centering.',
        frames=manifest, animations=animations), indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    export(args.source, args.output)
