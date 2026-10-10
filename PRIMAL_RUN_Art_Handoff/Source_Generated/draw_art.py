"""Original hand-drafted pixel shapes for the October handoff. No image model.

Run from any directory. Native integer pixels, fixed Primal Earth 32 palette.
"""
import json
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PALETTE = json.loads((ROOT / 'palette.json').read_text())['colors']
INK, DARK, OLIVE, GREEN, LEAF, LIME, SAND = PALETTE[:7]
EARTH, BROWN, CLAY, TAN, GOLD, CREAM = PALETTE[7:13]
SLATE, STONE, ASH, PALE = PALETTE[13:17]
RED, RUST, EMBER, FIRE = PALETTE[17:21]
WATER, TEAL, FOAM = PALETTE[21:24]
WHITE, YELLOW = PALETTE[28:30]
entries = []


def canvas(size):
    im = Image.new('RGBA', size)
    return im, ImageDraw.Draw(im)


def save(im, path, anchor, family, frame=None):
    target = ROOT / 'assets' / path
    target.parent.mkdir(parents=True, exist_ok=True)
    im.save(target)
    entries.append(dict(path='assets/' + path, size=list(im.size), origin=anchor,
                        family=family, frame=frame, status='prototype_static',
                        production_approved=False, source='Source_Generated/draw_art.py',
                        source_crop=None))


def hud():
    im, d = canvas((16, 16))
    # Stepped rays and a warm top-left highlight, with two pixels of margin.
    for box in [(7, 2, 8, 3), (7, 12, 8, 13), (2, 7, 3, 8), (12, 7, 13, 8),
                (3, 3, 4, 4), (11, 3, 12, 4), (3, 11, 4, 12), (11, 11, 12, 12)]:
        d.rectangle(box, fill=GOLD)
    d.polygon([(6, 4), (9, 4), (11, 6), (11, 9), (9, 11), (6, 11), (4, 9), (4, 6)], fill=INK)
    d.polygon([(6, 5), (9, 5), (10, 6), (10, 9), (9, 10), (6, 10), (5, 9), (5, 6)], fill=FIRE)
    d.rectangle((6, 5, 8, 8), fill=YELLOW)
    d.line([(5, 6), (5, 8)], fill=CREAM)
    save(im, 'ui/time_sun.png', [8, 8], 'hud')
    im, d = canvas((16, 16))
    d.polygon([(7, 2), (10, 2), (8, 4), (7, 6), (7, 8), (9, 10),
               (12, 10), (11, 12), (8, 13), (5, 12), (3, 10), (2, 7), (3, 4), (5, 3)], fill=INK)
    d.polygon([(6, 3), (8, 3), (6, 5), (6, 8), (8, 11), (10, 11),
               (8, 12), (5, 11), (3, 8), (3, 6), (4, 4)], fill=FOAM)
    d.line([(4, 5), (4, 8), (5, 9)], fill=WHITE)
    d.point((11, 4), fill=WHITE)
    save(im, 'ui/time_moon.png', [8, 8], 'hud')
    im, d = canvas((12, 12))
    # Two claw/tooth shapes around a small central diamond.
    d.polygon([(2, 3), (4, 2), (4, 5), (3, 7), (2, 6)], fill=WATER)
    d.polygon([(7, 2), (9, 3), (9, 6), (8, 7), (7, 5)], fill=TEAL)
    d.polygon([(5, 5), (7, 7), (5, 9), (4, 7)], fill=FOAM)
    d.point((3, 3), fill=FOAM)
    save(im, 'ui/raptor_ally.png', [6, 6], 'ally_marker')


def bubbles():
    # The ring rises and opens into a two-ring burst; not a translated duplicate.
    contours = [
        [(6, 8), (9, 8), (11, 10), (11, 12), (9, 13), (6, 13), (4, 11), (4, 10)],
        [(6, 5), (9, 5), (11, 7), (11, 10), (9, 12), (6, 12), (4, 10), (4, 7)],
        [(5, 3), (9, 3), (12, 6), (12, 9), (10, 11), (6, 11), (3, 8), (3, 5)],
    ]
    for n in range(4):
        im, d = canvas((16, 16))
        if n < 3:
            points = contours[n]
            d.polygon(points, fill=PALETTE[31])
            d.line(points + [points[0]], fill=WATER, width=1)
            d.line(points[:2], fill=TEAL, width=1)
            x, y = points[0]
            d.rectangle((x, y + 1, x + 1, y + 2), fill=FOAM)
            d.point((x, y + 1), fill=WHITE)
            d.point((x - 1, y + 2), fill=TEAL)
            d.point((9, max(p[1] for p in points) - 1), fill=TEAL)
            if n == 2:
                d.line([(10, 5), (11, 6)], fill=TEAL)
        else:
            d.line([(3, 5), (4, 3), (6, 2)], fill=FOAM)
            d.line([(10, 2), (12, 4), (12, 5)], fill=TEAL)
            d.line([(4, 8), (5, 9)], fill=WATER)
            d.point((10, 8), fill=FOAM)
        save(im, f'effects/bubble_{n:03}.png', [8, 8], 'bubble', n)


# Explicit clustered cloud outlines; staggered lobes keep a windblown silhouette.
CLOUD = [(15, 40), (18, 28), (28, 21), (42, 22), (48, 10), (61, 5),
         (76, 9), (82, 18), (98, 14), (111, 20), (114, 29), (130, 27),
         (142, 35), (143, 44), (159, 44), (168, 53), (163, 65), (151, 71),
         (130, 68), (116, 76), (101, 72), (89, 80), (70, 77), (62, 69),
         (45, 74), (31, 68), (29, 59), (17, 55)]


def ash_clouds():
    # Coherent irregular lobes with discrete relief shading, using the kit's
    # clustered dust rendering as reference. No smooth alpha or interpolation.
    lobes = [(50, 55, 22, 18), (71, 42, 24, 24), (90, 64, 24, 18),
             (111, 48, 23, 21), (133, 65, 22, 17), (151, 72, 14, 11)]
    ramp = [SLATE, STONE, ASH, PALE]
    for n, scale in enumerate([0.55, 0.78, 1.0, 1.06]):
        im, d = canvas((192, 128))
        for y in range(4, 120, 2):
            for x in range(4, 188, 2):
                u = 96 + (x - 96) / scale
                v = 64 + (y - 64 + n * 4) / scale
                best = None
                for j, (cx, cy, rx, ry) in enumerate(lobes):
                    if n == 3:
                        cx += (j - 2) * 4
                        rx *= .75
                        ry *= .85
                    dx, dy = (u - cx) / rx, (v - cy) / ry
                    angle = math.atan2(dy, dx)
                    radius = math.hypot(dx, dy)
                    edge = 1 + .12 * math.sin(5 * angle + j) + .06 * math.cos(9 * angle - j)
                    if radius > edge:
                        continue
                    # Stable block-level texture gives clusters, not per-frame snow.
                    grain = (((int(u) // 3) * 17 + (int(v) // 3) * 31 + j * 7) % 11 - 5) * .035
                    relief = 1.9 - 1.1 * radius - .7 * dx - .85 * dy + grain
                    if best is None or radius < best[0]:
                        best = (radius, relief)
                if best:
                    color = ramp[max(0, min(3, round(best[1])))]
                    d.rectangle((x, y, x + 1, y + 1), fill=color)
        for x, y in [(31, 88), (52, 95), (139, 91), (159, 78)]:
            x = round(96 + (x - 96) * scale)
            y = y - n * 3
            d.rectangle((x, y, x + 1, y + 1), fill=STONE)
        save(im, f'effects/ash_cloud_{n:03}.png', [96, 64], 'ash_cloud', n)


def mud():
    # North-facing dry bank strip. L/R silhouettes are identical for tiling.
    shoreline = [9, 9, 8, 8, 8, 9, 10, 10, 9, 9, 8, 7, 7, 8, 8, 9,
                 10, 10, 9, 8, 8, 7, 7, 8, 9, 10, 10, 9, 8, 8, 9, 9]
    networks = [
        [[(8, 12), (9, 15), (7, 18), (8, 23), (5, 27)], [(9, 15), (14, 16), (18, 14)], [(8, 23), (15, 24), (20, 29)]],
        [[(23, 11), (21, 15), (23, 19), (21, 24), (23, 28)], [(21, 15), (16, 17), (13, 16)], [(23, 19), (27, 21)]],
        [[(12, 10), (13, 14), (11, 18), (14, 21), (12, 27)], [(11, 18), (6, 19), (4, 22)], [(14, 21), (21, 21), (25, 25)]],
        [[(19, 12), (16, 15), (17, 20), (14, 24), (15, 29)], [(16, 15), (10, 14), (7, 17)], [(17, 20), (23, 18), (26, 19)]],
    ]
    for n in range(4):
        im, d = canvas((32, 32))
        for x, y in enumerate(shoreline):
            d.line((x, y, x, 31), fill=CLAY)
            d.point((x, y), fill=EARTH)
            d.line((x, y + 1, x, y + 2), fill=TAN)
        rng = random.Random(410 + n)
        for _ in range(150):
            x, y = rng.randrange(1, 30), rng.randrange(11, 32)
            color = rng.choice([BROWN, BROWN, TAN, CLAY])
            d.line((x, y, min(30, x + rng.randrange(2)), y), fill=color)
        for y in range(12, 32):
            # Same seam texture for every variant, so any two can be neighbours.
            color = [CLAY, BROWN, CLAY, TAN, CLAY][y % 5]
            d.point((0, y), fill=color)
            d.point((31, y), fill=color)
        for line in networks[n]:
            d.line([(x + 1, y) for x, y in line], fill=TAN)
            d.line(line, fill=EARTH)
        for x, y in [(3, 15), (28, 27), (25, 13), (4, 29)]:
            d.line((x, y, x + 1, y), fill=BROWN)
        save(im, f'ground/dried_mud_edge_N_{n}.png', [16, 16], 'mud_overlay')


def previews():
    target = ROOT / 'previews'
    target.mkdir(exist_ok=True)
    for theme, bg in [('light', '#ded392'), ('dark', '#151b19')]:
        sheet = Image.new('RGB', (960, ((len(entries) + 2) // 3) * 320), bg)
        d = ImageDraw.Draw(sheet)
        for i, e in enumerate(entries):
            x, y = 12 + (i % 3) * 320, 12 + (i // 3) * 320
            im = Image.open(ROOT / e['path'])
            zoom = max(1, min(4, 296 // im.width, 272 // im.height))
            big = im.resize((im.width * zoom, im.height * zoom), Image.Resampling.NEAREST)
            sheet.paste(big, (x, y + 24), big)
            d.text((x, y), Path(e['path']).name, fill='#626861' if theme == 'light' else '#ded392')
        sheet.save(target / f'contact_{theme}.png')
    # Repeated strips on a contrasting background expose joins and crack rhythm.
    sheet = Image.new('RGB', (768, 160), WATER)
    for n in range(4):
        tile = Image.open(ROOT / f'assets/ground/dried_mud_edge_N_{n}.png')
        for x in range(6):
            sheet.paste(tile, (x * 32, n * 40), tile)
    sheet = sheet.crop((0, 0, 192, 160)).resize((768, 640), Image.Resampling.NEAREST)
    sheet.save(target / 'mud_repeat.png')


if __name__ == '__main__':
    hud()
    bubbles()
    ash_clouds()
    mud()
    (ROOT / 'manifest.json').write_text(json.dumps(dict(
        name='October original art studies', authoring='Codex: explicit pixel geometry in Pillow',
        palette='palette.json', animation_ready=False, assets=entries,
        proposed_playback={'bubble': {'fps': 10, 'loop': False}, 'ash_cloud': {'fps': 8, 'loop': False}}
    ), indent=2) + '\n')
    previews()
