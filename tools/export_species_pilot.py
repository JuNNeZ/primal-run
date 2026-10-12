"""Explicit source-cell sampling for the standalone three-species pilot.

No body drawing, interpolation, bbox/centroid alignment or guessed frames.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'PRIMAL_RUN_Species_Pilot'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def sample(entry, package=PACKAGE):
    source = package / entry['source']
    image = Image.open(source).convert('RGBA')
    crop = entry['source_crop']
    step = entry['source_sample_stride']
    point = entry['sampling_offset']
    pixels = np.array(image.crop(crop))[point::step, point::step].copy()
    mask = pixels[:, :, 3] >= entry['alpha_threshold']
    palette = np.array([list(bytes.fromhex(c[1:])) for c in
                        json.loads((package / 'palette.json').read_text())['colors']], np.int32)
    indices = np.argmin(((pixels[:, :, :3].astype(np.int32)[:, :, None, :] -
                         palette[None, None, :, :]) ** 2).sum(3), axis=2)
    pixels[:, :, :3] = palette[indices]
    pixels[:, :, 3] = np.where(mask, 255, 0)
    pixels[~mask] = 0
    origin = entry['origin']
    anchor = entry['source_landmark']
    delta = [origin[i] - round((anchor[i] - point) / step) for i in range(2)]
    ys, xs = np.where(mask)
    tx, ty = xs + delta[0], ys + delta[1]
    w, h = entry['size']
    if not len(xs) or min(tx) < 2 or min(ty) < 2 or max(tx) >= w - 2 or max(ty) >= h - 2:
        raise ValueError(f"Clipping source anatomy in {entry['file']}: "
                         f"{min(tx)},{min(ty)}..{max(tx)},{max(ty)}")
    out = np.zeros((h, w, 4), np.uint8)
    out[ty, tx] = pixels[ys, xs]
    return Image.fromarray(out), delta

def export(canonical_only=False):
    plan = json.loads((PACKAGE / 'canonical_plan.json').read_text())
    extra = PACKAGE / 'animation_plan.json'
    if not canonical_only and extra.exists():
        plan += json.loads(extra.read_text())
    manifest = []
    for entry in plan:
        entry = dict(entry)
        file = PACKAGE / entry['file']
        file.parent.mkdir(parents=True, exist_ok=True)
        if entry.get('reused_from'):
            reference = PACKAGE / entry['reused_from']
            shutil.copy2(reference, file)
            entry['reused_sha256'] = sha(reference)
        else:
            image, delta = sample(entry)
            image.save(file)
            entry.update(registration_offset=delta, source_sha256=sha(PACKAGE / entry['source']))
        entry.update(export_sha256=sha(file), status='prototype_static',
                     production_approved=False, animation_ready=False)
        manifest.append(entry)
    name = 'canonical_exports.json' if canonical_only else 'manifest.json'
    (PACKAGE / name).write_text(json.dumps(manifest, indent=2) + '\n')
    preview = PACKAGE / 'previews'
    preview.mkdir(exist_ok=True)
    for background, color in [('light', '#e8ece1'), ('dark', '#151b19')]:
        grid = Image.new('RGBA', (576, 504), color)
        draw = ImageDraw.Draw(grid)
        for row, species in enumerate(['edmontosaurus', 'iguanodon', 'archelon']):
            for col, direction in enumerate(['S', 'E', 'N', 'W']):
                file = PACKAGE / f'assets/frames/{species}_idle_{direction}_000.png'
                grid.alpha_composite(Image.open(file).convert('RGBA'), (col * 144, row * 168 + 24))
                draw.text((col * 144 + 2, row * 168 + 3), species + ' ' + direction, fill='#699b91')
        grid.save(preview / f'canonical_{background}_1x.png')
        grid.resize((1152, 1008), Image.Resampling.NEAREST).save(preview / f'canonical_{background}_2x.png')
    print(f'Exported {len(manifest)} explicitly registered native pilot frames.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--canonical-only', action='store_true')
    export(parser.parse_args().canonical_only)
