"""Authoritative revised export: reuse feathered pixels without smoothing.

Only palette swaps, fixed integer sampling, clipping and explicit registration.
New tiny HUD symbols remain drawn by Codex in draw_art.hud().
"""
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw
import draw_art as art

ROOT = art.ROOT
FEATHER = ROOT / 'Source_Reused/feathered'
ORIGINAL = ROOT / 'Source_Reused/original'
RGB = [tuple(bytes.fromhex(c[1:])) for c in art.PALETTE]


def rgba(c):
    return tuple(bytes.fromhex(c[1:])) + (255,)


def quantize(im):
    out = Image.new('RGBA', im.size)
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = im.getpixel((x, y))
            if a >= 192:
                color = min(RGB, key=lambda c: sum((c[i] - (r, g, b)[i]) ** 2 for i in range(3)))
                out.putpixel((x, y), color + (255,))
    return out


def record(im, path, origin, family, source, operation, frame=None):
    art.save(im, path, origin, family, frame)
    entry = art.entries[-1]
    source = source.relative_to(ROOT).as_posix()
    entry.update(source=source, source_sha256=hashlib.sha256((ROOT / source).read_bytes()).hexdigest(),
                 operation=operation, export_sha256=hashlib.sha256((ROOT / entry['path']).read_bytes()).hexdigest())


def bubbles():
    # Preserve recognizable original reflection shapes instead of empty rings.
    for n, (name, step, sample_offset, offset) in enumerate([
        ('bubble_02.png', 2, (0, 0), (3, 3)), ('bubble_01.png', 2, (1, 1), (3, 2)),
        ('bubble_03.png', 2, (0, 1), (1, 1)), ('bubble_05.png', 1, (0, 0), (1, 1))
    ]):
        src = ORIGINAL / name
        original = Image.open(src).convert('RGBA')
        sampled = Image.new('RGBA', ((original.width - sample_offset[0] + step - 1) // step,
                                     (original.height - sample_offset[1] + step - 1) // step))
        for y in range(sampled.height):
            for x in range(sampled.width):
                sampled.putpixel((x, y), original.getpixel((x * step + sample_offset[0], y * step + sample_offset[1])))
        im = Image.new('RGBA', (16, 16))
        im.paste(quantize(sampled), offset)
        record(im, f'effects/bubble_{n:03}.png', [8, 8], 'bubble', src,
               {'integer_sample_step': step, 'sample_offset': list(sample_offset), 'placement': list(offset),
                'alpha_threshold': 192, 'palette': 'nearest fixed RGB'}, n)


def ash():
    swaps = {art.INK: art.INK, art.EARTH: art.SLATE, art.BROWN: art.SLATE,
             art.CLAY: art.STONE, art.TAN: art.ASH, art.GOLD: art.ASH,
             art.CREAM: art.PALE, art.SAND: art.PALE,
             art.RED: art.SLATE, art.RUST: art.STONE, art.EMBER: art.ASH,
             art.FIRE: art.PALE}
    table = {rgba(k): rgba(v) for k, v in swaps.items()}
    for n in range(4):
        src = FEATHER / f'assets/effects/dust_{n:03}.png'
        source = Image.open(src).convert('RGBA')
        colored = source.copy()
        for y in range(source.height):
            for x in range(source.width):
                p = source.getpixel((x, y))
                colored.putpixel((x, y), table.get(p, p) if p[3] else (0, 0, 0, 0))
        im = Image.new('RGBA', (192, 128))
        im.paste(colored, (48, 16))
        record(im, f'effects/ash_cloud_{n:03}.png', [96, 64], 'ash_cloud', src,
               {'palette_swap': swaps, 'placement': [48, 16], 'sampling_step': 1,
                'source_origin': [48, 48], 'source_pixels_geometry_unchanged': True}, n)


def mud():
    cracks = [
        [[(8, 12), (9, 15), (7, 18), (8, 23), (5, 27)], [(9, 15), (14, 16), (18, 14)], [(8, 23), (15, 24), (20, 29)]],
        [[(23, 11), (21, 15), (23, 19), (21, 24), (23, 28)], [(21, 15), (16, 17), (13, 16)], [(23, 19), (27, 21)]],
        [[(12, 10), (13, 14), (11, 18), (14, 21), (12, 27)], [(11, 18), (6, 19), (4, 22)], [(14, 21), (21, 21), (25, 25)]],
        [[(19, 12), (16, 15), (17, 20), (14, 24), (15, 29)], [(16, 15), (10, 14), (7, 17)], [(17, 20), (23, 18), (26, 19)]],
    ]
    swaps = {art.DARK: art.EARTH, art.OLIVE: art.BROWN, art.GREEN: art.CLAY,
             art.LEAF: art.TAN, art.LIME: art.GOLD}
    table = {rgba(k): rgba(v) for k, v in swaps.items()}
    for n in range(4):
        src = FEATHER / f'assets/ground/river_{n}.png'
        im = Image.open(src).convert('RGBA')
        for y in range(32):
            for x in range(32):
                p = im.getpixel((x, y))
                # Shared gently irregular north bank, no automatic rotations.
                top = [9, 9, 8, 8, 9, 9, 10, 10][x % 8]
                im.putpixel((x, y), (0, 0, 0, 0) if y < top else table.get(p, p))
        d = ImageDraw.Draw(im)
        for line in cracks[n]:
            d.line([(x + 1, y) for x, y in line], fill=art.TAN)
            d.line(line, fill=art.EARTH)
        # Identical source column at both ends for mixable edge joins.
        seam = Image.open(FEATHER / 'assets/ground/river_0.png').convert('RGBA')
        for y in range(9, 32):
            p = seam.getpixel((0, y))
            im.putpixel((0, y), table.get(p, p))
            im.putpixel((31, y), table.get(p, p))
        record(im, f'ground/dried_mud_edge_N_{n}.png', [16, 16], 'mud_overlay', src,
               {'palette_swap': swaps, 'clip': 'native north bank',
                'added_details': 'Codex-authored integer crack paths',
                'seam_source': 'river_0.png column 0', 'sampling_step': 1})


def basalt():
    for n in range(2):
        src = FEATHER / f'assets/ground/basalt_crossing_{n}.png'
        record(Image.open(src).convert('RGBA'), f'ground/basalt_crossing_{n}.png',
               [128, 128], 'basalt_crossing', src, {'sampling_step': 1, 'unchanged': True})
        # Preserve encoded bytes as well as pixels.
        shutil.copyfile(src, ROOT / art.entries[-1]['path'])
        art.entries[-1]['export_sha256'] = hashlib.sha256(src.read_bytes()).hexdigest()


def ally_marker():
    src = ORIGINAL / 'insulating_feathers.png'
    source = Image.open(src).convert('RGBA')
    im = Image.new('RGBA', (12, 12))
    swaps = {rgba(art.CREAM): rgba(art.FOAM), rgba(art.GOLD): rgba(art.FOAM),
             rgba(art.TAN): rgba(art.TEAL), rgba(art.CLAY): rgba(art.WATER),
             rgba(art.BROWN): rgba(art.WATER), rgba(art.EARTH): rgba(art.INK)}
    for y in range(12):
        for x in range(12):
            p = source.getpixel(((x + 2) * 2, (y + 2) * 2))
            im.putpixel((x, y), swaps.get(p, p) if p[3] else (0, 0, 0, 0))
    art.entries[:] = [e for e in art.entries if e['family'] != 'ally_marker']
    record(im, 'ui/raptor_ally.png', [6, 6], 'ally_marker', src,
           {'integer_sample_step': 2, 'source_crop': [4, 4, 28, 28],
            'palette_swap': 'warm feather highlights to teal team colors'})


if __name__ == '__main__':
    art.hud()
    ally_marker()
    bubbles()
    ash()
    mud()
    basalt()
    (ROOT / 'manifest.json').write_text(json.dumps(dict(
        name='Feathered reference reuse and corrected handoff art', revision=3,
        authoring='Reused preserved art plus Codex native pixel details',
        palette='palette.json', animation_ready=False, assets=art.entries,
        proposed_playback={'bubble': {'fps': 10, 'loop': False}, 'ash_cloud': {'fps': 10, 'loop': False}},
        source_contract='Source_Reused/feathered/reference/SPRITE_RULES_GROUND.md'
    ), indent=2) + '\n')
    art.previews()
