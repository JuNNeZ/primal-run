#!/usr/bin/env python3
"""Askebanen (FEATURES.ashLevel): small impact craters left by meteor fragments, drawn as top-down pixel art in the
Primal Earth 32 palette. Deterministic. Writes PRIMAL_RUN_Game/assets/ash_world/crater_<size>_<n>.png and
PRIMAL_RUN_Game/ash_world_manifest.json. Run: python tools/draw_ash_world.py  (then python tools/rebuild_generated.py)"""
import hashlib, json, math, pathlib
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = ROOT / 'PRIMAL_RUN_Game'
OUT = GAME / 'assets' / 'ash_world'
C = {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) + (255,) for k, v in {
    'ink': '#151b19', 'slate': '#3b4144', 'ash': '#626861', 'ashlt': '#929387', 'bone': '#bab8a2',
    'ember0': '#54282d', 'ember1': '#913b32', 'ember2': '#c6663c', 'ember3': '#de954a', 'hot': '#edd0a0',
    'rock0': '#443027', 'rock1': '#674333', 'rock2': '#8d6042'}.items()}
SIZES = {'s': (48, 30), 'm': (72, 44), 'l': (104, 62)}

def noise(seed, x, y):
    return int.from_bytes(hashlib.blake2b(f'{seed}:{x}:{y}'.encode(), digest_size=4).digest(), 'big') / 2**32

def crater(size, seed):
    w, h = SIZES[size]; img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = img.load()
    cx, cy, rx, ry = w / 2, h / 2 + 1, w * .36, h * .34
    for y in range(h):
        for x in range(w):
            dx, dy = (x + .5 - cx) / rx, (y + .5 - cy) / ry
            d = math.hypot(dx, dy) + (noise(seed, x // 2, y // 2) - .5) * .12; n = noise(seed + 7, x, y)
            if d > 1.32: continue
            if d > 1.0:  # outer ejecta slope, dithered into the ground
                if n > (1.32 - d) / .32 * 1.1: continue
                px[x, y] = C['ash'] if n < .55 else C['slate']; continue
            if d > .74:  # raised rim, lit from the upper left
                lit = -(dx * .6 + dy * .8) / max(d, .01)
                px[x, y] = C['bone'] if lit > .55 and n > .25 else C['ashlt'] if lit > .05 else C['ash'] if lit > -.5 else C['slate']
                if d > .97 and n < .35: px[x, y] = C['slate']
                continue
            # bowl: far (upper) wall in shadow, near wall catches light
            v = dy + (n - .5) * .25
            px[x, y] = C['ink'] if v < -.4 else C['slate'] if v < .05 else C['ash'] if v < .45 else C['ashlt']
            g = math.hypot(dx, (dy - .1) * 1.3) + (noise(seed + 5, x // 2, y // 2) - .5) * .3
            if g < .42:  # smouldering floor, broken into irregular glowing patches
                t = g / .42 + (n - .5) * .5
                px[x, y] = C['hot'] if t < .12 else C['ember3'] if t < .3 else C['ember2'] if t < .55 else C['ember1'] if t < .8 else C['ember0']
    # meteor fragment in the glow, pitted and outlined like props/meteorite.png
    fr = max(3, w // 14); fx, fy = int(cx + (noise(seed, 1, 1) - .5) * w * .1), int(cy + 1)
    for y in range(fy - fr - 1, fy + fr + 2):
        for x in range(fx - fr - 1, fx + fr + 2):
            d = math.hypot(x - fx, (y - fy) * 1.25) + (noise(seed + 3, x, y) - .5) * 1.2
            if d < fr: px[x, y] = C['rock2'] if (x - fx) + (y - fy) < -1 else C['rock1'] if noise(seed + 4, x, y) > .25 else C['rock0']
            elif d < fr + 1.1: px[x, y] = C['ink']
    # glowing cracks running out through the rim
    for k in range(3 + size.count('l')):
        a = noise(seed + 11, k, 0) * math.tau; r = .55
        x, y = cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r
        for step in range(int(w * .28)):
            a += (noise(seed + 12, k, step) - .5) * .7; x += math.cos(a); y += math.sin(a) * .6
            ix, iy = int(x), int(y)
            if not (0 <= ix < w and 0 <= iy < h) or px[ix, iy][3] == 0: break
            px[ix, iy] = C['ember1'] if step % 5 else C['ember2']
            if 0 <= iy + 1 < h and px[ix, iy + 1][3]: px[ix, iy + 1] = C['ink']
    # ejecta pebbles around the rim
    for k in range(6 + 3 * list(SIZES).index(size)):
        a = noise(seed + 21, k, 1) * math.tau; r = 1.05 + noise(seed + 22, k, 1) * .22
        x, y = int(cx + math.cos(a) * rx * r), int(cy + math.sin(a) * ry * r)
        for ox, oy, col in ((0, 0, 'ashlt'), (1, 0, 'ash'), (0, 1, 'ink'), (1, 1, 'ink')):
            if 0 <= x + ox < w and 0 <= y + oy < h: px[x + ox, y + oy] = C[col]
    return img

def main():
    OUT.mkdir(parents=True, exist_ok=True); assets = {}
    for size in SIZES:
        for n in range(3):
            img = crater(size, 1000 + 97 * n + 13 * list(SIZES).index(size)); rel = f'assets/ash_world/crater_{size}_{n}.png'
            img.save(GAME / rel, optimize=False)
            assets[rel] = {'kind': 'ground_decal', 'size': list(img.size), 'origin': [img.width // 2, img.height // 2], 'status': 'prototype_static', 'production_approved': False,
                           'note': 'Askebanen: crater from a meteor fragment', 'sha256': hashlib.sha256((GAME / rel).read_bytes()).hexdigest()}
    (GAME / 'ash_world_manifest.json').write_text(json.dumps({'tool': 'tools/draw_ash_world.py', 'palette': 'Primal Earth 32',
        'approval': 'Ash level art liked by Jonas 2026-10-15; craters redrawn on his request. Status stays prototype_static until the approval card.', 'assets': assets}, indent=2) + '\n', encoding='utf-8')
    sheet = Image.new('RGBA', (400, 200), C['ash'][:3] + (255,)); x = 8
    for i, rel in enumerate(assets):
        im = Image.open(GAME / rel); sheet.alpha_composite(im, (x % 384, 8 + (i // 3) * 64)); x += im.width + 12 if i % 3 != 2 else -x + 8
    sheet.resize((1200, 600), Image.NEAREST).save(ROOT / 'PRIMAL_RUN_Game' / 'previews' / 'ash_world_craters.png')
    print('wrote', len(assets), 'craters')
if __name__ == '__main__': main()
