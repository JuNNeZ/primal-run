"""Export review-only HUD stats from preserved generated sources, without drawing.

Fixed integer source sampling, nearest palette mapping and binary alpha only.
The 32px version is an exact nearest-neighbor 2x copy of the 16px export.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
SOURCE = GAME / 'Source_Generated/hud_icons/stats'
OUT = GAME / 'assets/hud_icons/stats'
NAMES = ('health', 'damage', 'crit', 'armor', 'regen', 'speed', 'ability', 'luck')
INK = '#101b16'  # Explicit contour requested in the brief; outside Primal Earth 32.


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def export():
    config = json.loads((SOURCE / 'sampling.json').read_text())
    colors = json.loads((GAME / 'palette.json').read_text())['colors'] + [INK]
    rgb = [tuple(bytes.fromhex(c[1:])) for c in colors]
    symbols = '0123456789ABCDEFGHIJKLMNOPQRSTUVW'
    pixels = {'palette': colors, 'symbols': symbols, 'icons': {}}
    manifest = []
    OUT.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        source = SOURCE / (name + '.png')
        with Image.open(source) as im:
            im = im.convert('RGBA')
            plan = config[name]
            x0, y0, stride = plan['x'], plan['y'], plan['stride']
            data = []
            indices = []
            for y in range(16):
                for x in range(16):
                    sx, sy = x0 + x * stride, y0 + y * stride
                    p = im.getpixel((sx, sy)) if 0 <= sx < im.width and 0 <= sy < im.height else (0, 0, 0, 0)
                    if p[3] < 128:
                        data.append((0, 0, 0, 0))
                        indices.append('.')
                    else:
                        idx = min(range(len(rgb)), key=lambda i: sum((p[k] - rgb[i][k]) ** 2 for k in range(3)))
                        data.append((*rgb[idx], 255))
                        indices.append(symbols[idx])
            native = Image.new('RGBA', (16, 16))
            native.putdata(data)
        for size, suffix in ((16, ''), (32, '_32')):
            icon = native if size == 16 else native.resize((32, 32), Image.Resampling.NEAREST)
            file = OUT / (name + suffix + '.png')
            icon.save(file)
            ident = 'stat_' + name + suffix
            rows = [''.join(indices[y * 16:(y + 1) * 16]) for y in range(16)]
            if size == 32:
                rows = [r for row in rows for r in [''.join(ch * 2 for ch in row)] * 2]
            pixels['icons'][ident] = rows
            manifest.append(dict(id=ident, file=file.relative_to(GAME).as_posix(), size=[size, size],
                group='stats', palette='Primal Earth 32 + explicitly requested #101b16 contour',
                status='prototype_static', production_approved=False, animation_ready=False,
                origin=[size // 2, size // 2], source=source.relative_to(GAME).as_posix(),
                source_sha256=sha(source), source_crop=[x0, y0, stride, 16, 16], sha256=sha(file),
                source_pixels='Source_Generated/hud_icons/stats/native_pixels.json',
                review='Awaiting Jonas; no runtime integration. Fixed integer samples; no smoothing.'))
    pixel_file = SOURCE / 'native_pixels.json'
    pixel_file.write_text(json.dumps(pixels, indent=2) + '\n', newline='\n')
    for entry in manifest:
        entry['source_pixels_sha256'] = sha(pixel_file)
    master_path = GAME / 'hud_icons_manifest.json'
    master = json.loads(master_path.read_text())
    master = [e for e in master if e['group'] != 'stats'] + manifest
    master_path.write_text(json.dumps(master, indent=2) + '\n', newline='\n')
    # Both 1x sizes and magnified native pixels; all labels stay outside assets.
    preview = Image.new('RGB', (800, 420), '#101b16')
    d = ImageDraw.Draw(preview)
    for row, bg in enumerate(('#101b16', '#e8ece1')):
        d.rectangle((0, row * 210, 799, row * 210 + 209), fill=bg)
        for col, name in enumerate(NAMES):
            x, y = col * 100, row * 210
            d.text((x + 5, y + 8), name, fill='#e8ece1' if row == 0 else '#101b16')
            with Image.open(OUT / (name + '.png')) as icon:
                preview.paste(icon, (x + 8, y + 35), icon)
                zoom = icon.resize((64, 64), Image.Resampling.NEAREST)
                preview.paste(zoom, (x + 8, y + 105), zoom)
            with Image.open(OUT / (name + '_32.png')) as icon:
                preview.paste(icon, (x + 8, y + 62), icon)
    preview.save(GAME / 'previews/stat_icons_review.png')
    print('Exported 16 review-only PNGs and native source records.')


if __name__ == '__main__':
    export()
