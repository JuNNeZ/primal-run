"""Draw the sprites for the run extras (2026-10-14): powerups, shrine, elite-trait badges, hunting-streak flame,
dusk/dawn clock icons, amber piece, egg hatching, and new ambient animals (dragonfly, jumping fish, bat).

Deterministic procedural pixel art: every shape is a supersampled mask reduced to native pixels by majority,
shaded with a fixed top-left light along Primal Earth 32 ramps, then given a 1 px #151b19 outline. Binary alpha,
transparent RGB = 0, at least 2 px empty margin on free-standing objects, integer origins.

Outputs: PRIMAL_RUN_Game/assets/run_extras/*.png, PRIMAL_RUN_Game/run_extras_manifest.json and a review sheet
PRIMAL_RUN_Game/previews/run_extras_review.png (light and dark backgrounds, 1x and 4x).
All files are prototype_static / production_approved=false until Jonas approves them.

Usage: python tools/draw_run_extras.py
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
OUT = GAME / 'assets' / 'run_extras'
MANIFEST = GAME / 'run_extras_manifest.json'
PREVIEW = GAME / 'previews' / 'run_extras_review.png'
PALETTE = json.loads((GAME / 'palette.json').read_text())['colors']
SS = 4
OUTLINE = '#151b19'


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


class Sprite:
    """A native canvas with painter's-order layers. Each layer: mask (bool grid) + ramp (dark..light hex)."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[None] * w for _ in range(h)]
        self.outline_mask = [[False] * w for _ in range(h)]

    def _mask(self, draw_fn):
        big = Image.new('L', (self.w * SS, self.h * SS), 0)
        draw_fn(ImageDraw.Draw(big), SS)
        m = [[False] * self.w for _ in range(self.h)]
        data = big.load()
        for y in range(self.h):
            for x in range(self.w):
                n = sum(1 for yy in range(SS) for xx in range(SS) if data[x * SS + xx, y * SS + yy] > 127)
                m[y][x] = n * 2 > SS * SS
        return m

    def shape(self, draw_fn, ramp, light=(-1, -1), centre=None, outline=True, flat=False):
        m = self._mask(draw_fn)
        pts = [(x, y) for y in range(self.h) for x in range(self.w) if m[y][x]]
        if not pts:
            return m
        cx = centre[0] if centre else sum(p[0] for p in pts) / len(pts)
        cy = centre[1] if centre else sum(p[1] for p in pts) / len(pts)
        rad = max(1.0, max(math.hypot(x - cx, y - cy) for x, y in pts))
        lx, ly = light
        ln = math.hypot(lx, ly) or 1
        for x, y in pts:
            if flat:
                c = ramp[len(ramp) // 2] if isinstance(ramp, list) else ramp
            else:
                # facing the light (top-left) -> lighter; edge pixels on the far side -> darker
                t = ((x - cx) * lx + (y - cy) * ly) / ln / rad  # -1 .. 1, positive = towards light
                edge = math.hypot(x - cx, y - cy) / rad
                v = .5 + .55 * t - .25 * max(0, edge - .7)
                i = max(0, min(len(ramp) - 1, int(v * len(ramp))))
                c = ramp[i]
            self.px[y][x] = c
            if outline:
                self.outline_mask[y][x] = True
        return m

    def pixel(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = c

    def pixels(self, pts, c):
        for x, y in pts:
            self.pixel(x, y, c)

    def image(self, outline=True):
        img = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        filled = [[self.px[y][x] is not None for x in range(self.w)] for y in range(self.h)]
        out = [row[:] for row in self.px]
        if outline:
            for y in range(self.h):
                for x in range(self.w):
                    if filled[y][x]:
                        continue
                    if any(0 <= x + dx < self.w and 0 <= y + dy < self.h and filled[y + dy][x + dx] and self.outline_mask[y + dy][x + dx]
                           for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                        out[y][x] = OUTLINE
        for y in range(self.h):
            for x in range(self.w):
                if out[y][x] is not None:
                    img.putpixel((x, y), rgb(out[y][x]) + (255,))
        return img


def ell(cx, cy, rx, ry):
    return lambda d, s: d.ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=255)


def poly(points):
    return lambda d, s: d.polygon([(x * s, y * s) for x, y in points], fill=255)


def rect(x0, y0, x1, y1):
    return lambda d, s: d.rectangle([x0 * s, y0 * s, x1 * s - 1, y1 * s - 1], fill=255)


def line(points, width):
    return lambda d, s: d.line([(x * s, y * s) for x, y in points], fill=255, width=int(width * s), joint='curve')


# ---------------------------------------------------------------- ramps (Primal Earth 32 only)
RED = ['#54282d', '#913b32', '#c6663c', '#de954a']
BLOOD = ['#54282d', '#8d2028', '#913b32', '#c6663c']
MEAT = ['#54282d', '#913b32', '#c6663c', '#edd0a0']
AMBER = ['#8d6042', '#de954a', '#dfbc52', '#ded392']
TEAL = ['#28372a', '#3c7180', '#69a4a0', '#a2d4c1']
ICE = ['#3c7180', '#69a4a0', '#a2d4c1', '#e8ece1']
PURPLE = ['#563f8e', '#56346f', '#8853b0', '#bb80d9']
GREEN = ['#28372a', '#3f5030', '#586d38', '#799447', '#a8b15b']
STONE = ['#3b4144', '#626861', '#929387', '#bab8a2']
BONE = ['#8d6042', '#d4a36c', '#edd0a0', '#e8ece1']
EGG = ['#8d6042', '#b98252', '#d4a36c', '#edd0a0']
BROWN = ['#443027', '#674333', '#8d6042', '#b98252']
FISH = ['#3b4144', '#3c7180', '#69a4a0', '#bab8a2']
DARK = ['#151b19', '#28372a', '#3b4144', '#626861']


def powerup(kind):
    s = Sprite(24, 24)
    if kind == 'rage':  # blood-moon meat: a marbled steak under a pale red crescent moon
        s.shape(poly([(4, 15), (7, 10), (13, 9), (19, 11), (20, 16), (16, 20), (8, 20)]), MEAT)
        s.pixels([(8, 14), (9, 14), (10, 15), (13, 13), (14, 13), (15, 14), (11, 17), (12, 17)], '#edd0a0')
        s.shape(lambda d, k: (d.ellipse([3 * k, 2 * k, 11 * k, 10 * k], fill=255), d.ellipse([5.5 * k, 1 * k, 13 * k, 8.5 * k], fill=0)), ['#913b32', '#c6663c', '#edd0a0'])
    elif kind == 'amber':  # amber shield: a drop of resin with a trapped speck
        s.shape(poly([(12, 3), (19, 9), (18, 17), (12, 21), (6, 17), (5, 9)]), AMBER)
        s.pixels([(11, 12), (12, 12), (12, 11)], '#674333')
        s.pixels([(8, 8), (9, 7), (8, 9)], '#e8ece1')
    elif kind == 'stamina':  # adrenaline berries: a cluster of teal berries on a twig
        s.shape(line([(5, 5), (12, 9), (18, 6)], 1.4), BROWN)
        for cx, cy in ((9, 14), (15, 14), (12, 18), (12, 11)):
            s.shape(ell(cx, cy, 3.3, 3.3), TEAL)
        s.pixels([(8, 13), (14, 13), (11, 17), (11, 10)], '#e8ece1')
    elif kind == 'wind':  # feather lightness
        s.shape(poly([(5, 20), (8, 12), (13, 6), (19, 3), (17, 9), (13, 15), (7, 19)]), ICE)
        s.shape(line([(5, 20), (17, 5)], 1), ['#3c7180'], flat=True, outline=False)
    elif kind == 'frost':  # ice-age dew: a frozen droplet with a sparkle
        s.shape(poly([(12, 3), (17, 12), (17, 16), (12, 21), (7, 16), (7, 12)]), ICE)
        s.pixels([(10, 9), (10, 10), (9, 11)], '#e8ece1')
        s.pixels([(19, 4), (19, 6), (18, 5), (20, 5)], '#e8ece1')
    elif kind == 'comet':  # comet dust: a violet star with a tail
        s.shape(line([(4, 20), (10, 14)], 3), ['#563f8e', '#8853b0'])
        s.shape(poly([(15, 3), (17, 8), (22, 9), (18, 12), (19, 18), (15, 15), (11, 18), (12, 12), (8, 9), (13, 8)]), PURPLE)
        s.pixels([(14, 8), (15, 8), (14, 9)], '#e8ece1')
    elif kind == 'leech':  # vampire fern: a dark red curled frond
        s.shape(line([(12, 21), (12, 10), (14, 6)], 1.4), ['#54282d'], flat=True)
        for i, (cx, cy) in enumerate(((8, 16), (16, 15), (8.5, 11), (15.5, 10), (12, 6))):
            s.shape(ell(cx, cy, 3.2 if i < 4 else 2.6, 2.1), BLOOD)
        s.pixels([(7, 15), (15, 14), (7, 10)], '#c6663c')
    elif kind == 'heart':  # heart fruit: a heart-shaped red fruit with a leaf
        s.shape(lambda d, k: (d.ellipse([4 * k, 6 * k, 13 * k, 15 * k], fill=255), d.ellipse([11 * k, 6 * k, 20 * k, 15 * k], fill=255), d.polygon([(4.6 * k, 12 * k), (19.4 * k, 12 * k), (12 * k, 21 * k)], fill=255)), RED)
        s.shape(poly([(12, 7), (14, 2), (18, 3), (15, 6)]), GREEN[1:])
        s.pixels([(7, 9), (8, 8), (7, 10)], '#edd0a0')
    return s.image()


def glow(frame):
    """Pulsing sparkle ring around a powerup (two frames, 32x32)."""
    s = Sprite(32, 32)
    r = 11 if frame == 0 else 12.5
    pts = []
    for i in range(8):
        a = i * math.pi / 4 + (math.pi / 8 if frame else 0)
        pts.append((round(16 + math.cos(a) * r), round(16 + math.sin(a) * r)))
    for i, (x, y) in enumerate(pts):
        c = '#e8ece1' if i % 2 == 0 else '#dfbc52'
        s.pixel(x, y, c)
        if i % 2 == 0:
            s.pixels([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)], '#dfbc52')
    return s.image(outline=False)


def shrine():
    s = Sprite(48, 48)
    s.shape(ell(24, 37, 17, 6), GREEN[:4])                       # mossy base
    s.shape(poly([(11, 38), (13, 27), (35, 27), (37, 38)]), STONE)   # altar block
    s.shape(poly([(15, 28), (17, 13), (31, 13), (33, 28)]), STONE)   # standing stone
    s.shape(poly([(13, 14), (24, 8), (35, 14), (24, 17)]), STONE[1:])  # capstone
    for x, y in ((21, 20), (22, 19), (23, 18), (24, 18), (25, 19), (26, 20), (24, 21), (24, 22), (23, 23), (24, 24), (25, 23)):
        s.pixel(x, y, '#dfbc52')                                 # carved rune, catches light
    s.pixels([(14, 34), (15, 35), (32, 31), (33, 32), (19, 36), (29, 36)], '#799447')  # moss specks
    return s.image()


def affix(kind):
    s = Sprite(16, 16)
    if kind == 'brutal':     # three red claw slashes
        for x0 in (4, 7.5, 11):
            s.shape(line([(x0, 3), (x0 - 1.5, 12)], 1.6), ['#913b32', '#c6663c'])
    elif kind == 'armored':  # grey shield plate
        s.shape(poly([(8, 2), (13, 4), (12.5, 10), (8, 14), (3.5, 10), (3, 4)]), STONE)
        s.pixels([(8, 5), (8, 6), (8, 7), (8, 8), (8, 9)], '#3b4144')
    elif kind == 'swift':    # teal speed chevrons
        for x0 in (3, 8):
            s.shape(poly([(x0, 3), (x0 + 3, 3), (x0 + 6, 8), (x0 + 3, 13), (x0, 13), (x0 + 3, 8)]), TEAL[1:])
    elif kind == 'thorns':   # green thorn cluster
        s.shape(poly([(8, 1), (10, 7), (15, 8), (10, 10), (8, 15), (6, 10), (1, 8), (6, 7)]), GREEN[1:])
    elif kind == 'regen':    # leaf with a pale cross
        s.shape(ell(8, 8, 5.5, 5.5), TEAL)
        s.pixels([(8, 5), (8, 6), (8, 7), (8, 8), (8, 9), (8, 10), (6, 8), (7, 8), (9, 8), (10, 8)], '#e8ece1')
    return s.image()


def flame(frame):
    s = Sprite(16, 16)
    tip = (8, 1) if frame == 0 else (9, 2)
    s.shape(poly([(4, 10), (5, 6), (7, 7), tip, (11, 6), (12, 10), (10, 14), (6, 14)]), ['#913b32', '#c6663c', '#de954a', '#dfbc52'])
    s.shape(ell(8, 11, 2, 2.4), ['#dfbc52', '#ded392'], outline=False)
    return s.image()


def clock(kind):
    s = Sprite(16, 16)
    # half sun on a horizon; dusk is warm and low, dawn is pale and rising
    ramp = ['#913b32', '#c6663c', '#de954a'] if kind == 'dusk' else ['#de954a', '#dfbc52', '#ded392']
    s.shape(lambda d, k: d.pieslice([3 * k, 5 * k, 13 * k, 15 * k], 180, 360, fill=255), ramp)
    s.shape(rect(2, 10, 14, 12), ['#56346f'] if kind == 'dusk' else ['#3c7180'], flat=True)
    rays = [(8, 2), (3, 5), (13, 5)] if kind == 'dawn' else [(2, 6), (14, 6)]
    for x, y in rays:
        s.pixel(x, y, ramp[-1])
    return s.image()


def amber(frame):
    s = Sprite(16, 16)
    s.shape(poly([(8, 3), (12, 6), (12, 11), (8, 13), (4, 11), (4, 6)]), AMBER)
    s.pixels([(8, 8), (7, 8), (9, 8), (8, 9), (7, 7), (9, 7)], '#674333')  # trapped insect
    s.pixel(8, 7, '#443027')
    if frame:
        s.pixels([(13, 3), (13, 1), (12, 2), (14, 2), (13, 2)], '#e8ece1')
        s.pixel(6, 5, '#e8ece1')
    return s.image()


def egg(frame):
    """Six-frame hatching: intact, crack, wider crack, lid lifts, halves open, shell pieces on the ground."""
    s = Sprite(48, 48)
    s.shape(ell(24, 40, 13, 3.5), ['#28372a', '#3f5030'], outline=False, flat=True)  # nest shadow ring
    if frame <= 2:
        wob = (0, 0, 1)[frame]
        s.shape(ell(24 + wob, 26, 9, 12), EGG)
        s.pixels([(19 + wob, 20), (20 + wob, 19), (19 + wob, 21)], '#edd0a0')
        for x, y in ((27, 20), (29, 31), (21, 32)):
            s.pixel(x + wob, y, '#8d6042')  # speckles
        if frame >= 1:
            crack = [(20, 24), (21, 23), (22, 24), (23, 22), (24, 23), (25, 21)] + ([(26, 23), (27, 22), (28, 24), (29, 23)] if frame == 2 else [])
            s.pixels([(x + wob, y) for x, y in crack], '#443027')
    elif frame == 3:
        s.shape(lambda d, k: d.chord([15 * k, 14 * k, 33 * k, 38 * k], 0, 180, fill=255), EGG)          # bottom half
        s.shape(lambda d, k: d.chord([16 * k, 4 * k, 34 * k, 22 * k], 180, 360, fill=255), EGG)          # lid lifting
        s.pixels([(x, 26) for x in range(16, 33, 2)], '#443027')
        s.pixels([(21, 9), (22, 8)], '#edd0a0')
    elif frame == 4:
        s.shape(lambda d, k: d.chord([11 * k, 22 * k, 25 * k, 42 * k], 90, 270, fill=255), EGG)          # left half
        s.shape(lambda d, k: d.chord([23 * k, 22 * k, 37 * k, 42 * k], 270, 450, fill=255), EGG)         # right half
        s.shape(ell(24, 33, 4, 2), ['#ded392', '#a8b15b'], outline=False)                              # yolk sheen
    else:
        for cx, cy, rx, ry in ((14, 36, 3, 2), (33, 37, 3.5, 2), (24, 41, 2.5, 1.6), (19, 31, 2, 1.4)):
            s.shape(ell(cx, cy, rx, ry), EGG)
    return s.image()


def dragonfly(frame):
    s = Sprite(24, 24)
    sweep = 0 if frame == 0 else 2
    for side in (-1, 1):  # two pairs of long thin wings, beating forward/back
        s.shape(ell(12 + side * 5.5, 8.5 - sweep / 2, 5.5, 1.7), ['#a2d4c1', '#e8ece1'], outline=False)
        s.shape(ell(12 + side * 5, 12.5 + sweep / 2, 5, 1.6), ['#69a4a0', '#a2d4c1'], outline=False)
    s.shape(line([(12, 8), (12, 20)], 1.6), ['#2466a0', '#3c7180', '#69a4a0'])
    s.shape(ell(12, 7, 2, 1.8), ['#2466a0', '#69a4a0'])
    return s.image()


def fish_jump(frame):
    s = Sprite(24, 24)
    if frame == 0:    # nose out of the water, splash ring
        s.shape(ell(12, 17, 7, 2.2), ['#3c7180', '#69a4a0'], outline=False, flat=True)
        s.shape(poly([(10, 16), (12, 10), (14, 16)]), FISH)
        s.pixels([(6, 15), (18, 15), (5, 17), (19, 17)], '#e8ece1')
    elif frame == 1:  # arc in the air
        s.shape(poly([(5, 13), (9, 9), (15, 8), (19, 11), (16, 13), (10, 14)]), FISH)
        s.shape(poly([(4, 15), (5, 12), (2, 11)]), FISH[:3])
        s.pixel(16, 10, '#151b19')
        s.pixels([(8, 18), (12, 19), (16, 18)], '#a2d4c1')
    else:             # dive back, splash
        s.shape(poly([(10, 8), (14, 8), (12, 15)]), FISH)
        s.shape(ell(12, 17, 6, 2), ['#3c7180', '#69a4a0'], outline=False, flat=True)
        s.pixels([(5, 13), (19, 13), (7, 11), (17, 11), (12, 6)], '#e8ece1')
    return s.image()


def bat(frame):
    s = Sprite(24, 24)
    if frame == 0:
        s.shape(poly([(2, 9), (7, 7), (10, 10), (12, 8), (14, 10), (17, 7), (22, 9), (18, 13), (14, 12), (12, 15), (10, 12), (6, 13)]), DARK)
    else:
        s.shape(poly([(5, 15), (8, 9), (11, 10), (12, 8), (13, 10), (16, 9), (19, 15), (15, 13), (12, 15), (9, 13)]), DARK)
    s.pixels([(11, 10), (13, 10)], '#c6663c')
    return s.image()


ASSETS = {}


def add(name, img, kind, origin, note):
    ASSETS[name] = (img, kind, origin, note)


def build():
    for k in ('rage', 'amber', 'stamina', 'wind', 'frost', 'comet', 'leech', 'heart'):
        add(f'powerup_{k}', powerup(k), 'pickup', (12, 12), f'Powerup pickup: {k}')
    for f in (0, 1):
        add(f'powerup_glow_{f}', glow(f), 'vfx', (16, 16), 'Sparkle ring around powerups, 2 frames at 4 fps')
    add('shrine', shrine(), 'prop', (24, 38), 'Powerup shrine (one per level); the powerup floats over its top')
    for k in ('brutal', 'armored', 'swift', 'thorns', 'regen'):
        add(f'affix_{k}', affix(k), 'badge', (8, 8), f'Elite trait badge: {k}')
    for f in (0, 1):
        add(f'streak_flame_{f}', flame(f), 'hud', (8, 8), 'Hunting-streak flame next to the health bar, 2 frames')
    for k in ('dusk', 'dawn'):
        add(f'time_{k}', clock(k), 'hud', (8, 8), f'HUD clock icon for {k} (pairs with ui/time_sun and ui/time_moon)')
    for f in (0, 1):
        add(f'amber_{f}', amber(f), 'pickup', (8, 8), 'Hidden amber piece with a trapped insect; frame 1 glints')
    for f in range(6):
        add(f'egg_hatch_{f}', egg(f), 'vfx', (24, 40), 'Hard baby start: egg hatching at run start, 6 frames at 4 fps')
    for f in range(3):
        add(f'fish_jump_{f}', fish_jump(f), 'ambient', (12, 16), 'Ambient fish jumping in ponds and rivers, 3 frames')
    for f in (0, 1):
        add(f'bat_{f}', bat(f), 'ambient', (12, 12), 'Ambient bat at dusk and night, 2 frames')


def check(img, name):
    allowed = {rgb(h) for h in PALETTE}
    errors = []
    for (r, g, b, a) in (img.getpixel((x, y)) for y in range(img.height) for x in range(img.width)):
        if a not in (0, 255):
            errors.append(f'{name}: alpha {a}')
            break
        if a == 0 and (r, g, b) != (0, 0, 0):
            errors.append(f'{name}: transparent RGB not 0')
            break
        if a == 255 and (r, g, b) not in allowed:
            errors.append(f'{name}: colour {(r, g, b)} outside Primal Earth 32')
            break
    box = img.getbbox()
    if box and (box[0] < 1 or box[1] < 1 or box[2] > img.width - 1 or box[3] > img.height - 1) and not name.startswith('powerup_glow'):
        errors.append(f'{name}: touches the canvas edge {box}')
    return errors


def preview():
    names = list(ASSETS)
    cell = 4 * 48 + 12
    cols = 8
    rows = math.ceil(len(names) / cols)
    sheet = Image.new('RGBA', (cols * cell, rows * cell * 2), (0, 0, 0, 255))
    for half, bg in enumerate(((200, 200, 180, 255), (21, 27, 25, 255))):
        ImageDraw.Draw(sheet).rectangle([0, half * rows * cell, cols * cell, (half + 1) * rows * cell], fill=bg)
        for i, n in enumerate(names):
            img = ASSETS[n][0]
            big = img.resize((img.width * 4, img.height * 4), Image.NEAREST)
            x, y = (i % cols) * cell + 6, half * rows * cell + (i // cols) * cell + 6
            sheet.alpha_composite(big, (x, y))
            sheet.alpha_composite(img, (x + cell - img.width - 12, y + cell - img.height - 12))
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(PREVIEW)


def main():
    build()
    OUT.mkdir(parents=True, exist_ok=True)
    errors, entries = [], {}
    for name, (img, kind, origin, note) in ASSETS.items():
        path = OUT / f'{name}.png'
        img.save(path, optimize=False)
        errors += check(img, name)
        entries[f'assets/run_extras/{name}.png'] = {'kind': kind, 'size': [img.width, img.height], 'origin': list(origin), 'status': 'prototype_static',
                                                    'production_approved': False, 'note': note, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    MANIFEST.write_text(json.dumps({'tool': 'tools/draw_run_extras.py', 'palette': 'Primal Earth 32 (palette.json)', 'rules': 'PRIMAL_RUN_Sprites/SPRITE_RULES.md, PRIMAL_RUN_Game/SPRITE_RULES.md',
                                    'approval': 'pending Jonas (approval card)', 'assets': entries, 'validation': {'errors': errors, 'result': 'PASS' if not errors else 'FAIL'}}, indent=2, ensure_ascii=False) + '\n')
    preview()
    print(json.dumps({'assets': len(entries), 'errors': errors}))
    if errors:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
