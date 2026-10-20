"""Extract reviewed source pixels; no drawing, rotation, mirroring or interpolation."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
PALETTE = np.array([tuple(bytes.fromhex(c[1:])) for c in json.loads(
    (ROOT.parents[2] / 'palette.json').read_text())['colors']], dtype=np.int32)


def opaque_landmark(tile, requested):
    """Resolve a reviewed landmark onto its sampled source pixel, within 2px."""
    x, y = requested
    candidates = [(dx*dx+dy*dy, y+dy, x+dx)
                  for dy in range(-2, 3) for dx in range(-2, 3)
                  if 0 <= y+dy < tile.shape[0] and 0 <= x+dx < tile.shape[1]
                  and tile[y+dy, x+dx, 3] == 255]
    if not candidates:
        raise ValueError(f'Landmark outside source surface: {requested}')
    _, yy, xx = min(candidates)
    return np.array([xx, yy])


def joint_caps(tile, edges):
    """Cut a 3px rounded cap from existing pixels at named extraction planes.

    This only selects source pixels; it neither paints anatomy nor changes RGB.
    The overlap hides these extraction planes in the assembled rest pose.
    """
    for edge in edges:
        work = tile if edge in ('left', 'right') else tile.transpose(1, 0, 2)
        if edge in ('right', 'bottom'):
            work = work[:, ::-1]
        occupied = np.flatnonzero(np.any(work[:, :, 3] != 0, axis=0))
        first = int(occupied[0])
        rows = np.flatnonzero(work[:, first, 3])
        center = (int(rows[0]) + int(rows[-1])) / 2
        half = (int(rows[-1]) - int(rows[0])) / 2 + 0.5
        for distance in range(3):
            radius = half * np.sqrt(1 - ((3-distance)/3)**2)
            remove = np.abs(np.arange(work.shape[0]) - center) > max(0.5, radius)
            work[remove, first+distance] = 0


def main():
    config = json.loads((ROOT / 'registration.json').read_text())
    result = {'species': 'tyrannosaurus', 'directions': {}}
    provenance = {}
    sources = {}
    for direction, spec in config['directions'].items():
        images, parts = {}, {}
        for name, item in spec['parts'].items():
            source = ROOT / item['source']
            if source not in sources:
                sources[source] = np.asarray(Image.open(source).convert('RGBA'))
            raw = sources[source]
            x0, y0, x1, y1 = item['crop']
            step = item['integer_sample']
            tile = raw[y0:y1:step, x0:x1:step].copy()
            rgb = tile[:, :, :3].astype(np.int32)
            nearest = ((rgb[:, :, None, :] - PALETTE[None, None, :, :])**2).sum(-1).argmin(-1)
            tile[:, :, :3] = PALETTE[nearest]
            tile[:, :, 3] = np.where(tile[:, :, 3] >= config['alpha_threshold'], 255, 0)
            tile[tile[:, :, 3] == 0] = 0
            for _ in range(2):
                on = tile[:, :, 3] > 0
                padded = np.pad(on, 1)
                inside = (padded[:-2, 1:-1] & padded[2:, 1:-1] & padded[1:-1, :-2] & padded[1:-1, 2:])
                ink = np.all(tile[:, :, :3] == PALETTE[0], axis=2) | np.all(tile[:, :, :3] == PALETTE[1], axis=2)
                tile[on & ~inside & ink] = 0
            joint_caps(tile, item.get('cap_edges', []))
            # Extraction planes can expose ink that was interior in the source.
            # Strip exterior ink to a fixed point; preserve enclosed markings.
            while True:
                on = tile[:, :, 3] > 0
                padded = np.pad(on, 1)
                inside = (padded[:-2, 1:-1] & padded[2:, 1:-1] & padded[1:-1, :-2] & padded[1:-1, 2:])
                ink = np.all(tile[:, :, :3] == PALETTE[0], axis=2) | np.all(tile[:, :, :3] == PALETTE[1], axis=2)
                remove = on & ~inside & ink
                if not remove.any():
                    break
                tile[remove] = 0
            pivot = opaque_landmark(tile, np.rint(
                (np.array(item['source_pivot']) - [x0, y0]) / step).astype(int))
            tip = opaque_landmark(tile, np.rint(
                (np.array(item['source_tip']) - [x0, y0]) / step).astype(int))
            target = item['target_pivot']
            if isinstance(target, dict):
                target = parts[target['part']][target['point']]
            delta = np.array(target) - pivot
            canvas = np.zeros((144, 144, 4), dtype=np.uint8)
            yy, xx = np.nonzero(tile[:, :, 3])
            dest_x, dest_y = xx + delta[0], yy + delta[1]
            assert np.all((dest_x >= 2) & (dest_x < 142) & (dest_y >= 2) & (dest_y < 142)), (direction, name, 'clipping')
            canvas[dest_y, dest_x] = tile[yy, xx]
            image = Image.fromarray(canvas)
            image.save(ROOT / f'tyrannosaurus_{direction}_{name}.png')
            images[name] = image
            parts[name] = {'parent': item['parent'], 'pivot': list(map(int, target)),
                           'tip': (tip + delta).astype(int).tolist()}
            provenance[f'{direction}/{name}'] = dict(item, sampled_pivot=pivot.tolist(),
                sampled_tip=tip.tolist(), translation=delta.tolist(),
                source_sha256=hashlib.sha256(source.read_bytes()).hexdigest())
        full = Image.new('RGBA', (144, 144))
        for name in spec['order']:
            full.alpha_composite(images[name])
        full.save(ROOT / f'tyrannosaurus_{direction}_full.png')
        result['directions'][direction] = {'order': spec['order'], 'parts': parts}
    (ROOT / 'tyrannosaurus_parts.json').write_text(json.dumps(result, indent=2) + '\n')
    (ROOT / 'source_sampling.json').write_text(json.dumps(provenance, indent=2) + '\n')
    previews = ROOT / 'previews'
    previews.mkdir(exist_ok=True)
    for background, color in [('light', '#ddd7c6'), ('dark', '#202725')]:
        native = Image.new('RGB', (144*4, 156), color)
        contact = Image.new('RGB', (144*4*3, (144+12)*3), color)
        draw = ImageDraw.Draw(contact)
        for i, direction in enumerate('SNEW'):
            full = Image.open(ROOT / f'tyrannosaurus_{direction}_full.png')
            native.paste(full, (i*144, 12), full)
            ImageDraw.Draw(native).text((i*144+4, 1), direction,
                fill='#151b19' if background == 'light' else '#edd0a0')
            enlarged = full.resize((432, 432), Image.Resampling.NEAREST)
            contact.paste(enlarged, (i*432, 30), enlarged)
            draw.text((i*432+12, 8), direction, fill='#151b19' if background == 'light' else '#edd0a0')
        contact.save(previews / f'full_{background}_3x.png')
        native.save(previews / f'full_{background}_1x.png')
    for direction, spec in result['directions'].items():
        contact = Image.new('RGB', (4*144*2, 4*160*2), '#ddd7c6')
        draw = ImageDraw.Draw(contact)
        for i, name in enumerate(list(spec['parts']) + ['full']):
            im = Image.open(ROOT / f'tyrannosaurus_{direction}_{name}.png')
            x, y = (i % 4)*288, (i // 4)*320
            scaled = im.resize((288, 288), Image.Resampling.NEAREST)
            contact.paste(scaled, (x, y+24), scaled)
            draw.text((x+8, y+6), name, fill='#151b19')
        contact.save(previews / f'parts_{direction}_2x.png')
        dark = Image.new('RGB', contact.size, '#202725')
        draw = ImageDraw.Draw(dark)
        for i, name in enumerate(list(spec['parts']) + ['full']):
            im = Image.open(ROOT / f'tyrannosaurus_{direction}_{name}.png')
            x, y = (i % 4)*288, (i // 4)*320
            scaled = im.resize((288, 288), Image.Resampling.NEAREST)
            dark.paste(scaled, (x, y+24), scaled)
            draw.text((x+8, y+6), name, fill='#edd0a0')
        dark.save(previews / f'parts_{direction}_dark_2x.png')


if __name__ == '__main__':
    main()
