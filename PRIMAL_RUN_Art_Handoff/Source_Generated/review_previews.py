"""Review-only comparisons and looping previews; never alters asset PNGs."""
from pathlib import Path
import io
import zipfile
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'previews'


def place(board, im, xy, scale):
    big = im.resize((im.width * scale, im.height * scale), Image.Resampling.NEAREST)
    board.paste(big, xy, big)


def comparisons():
    rows = [
        ('Bubble / 4x', 'Source_Reused/original/bubble_01.png', 'assets/effects/bubble_001.png', 4, 160),
        ('Dust -> ash / 2x native pixels', 'Source_Reused/feathered/assets/effects/dust_002.png', 'assets/effects/ash_cloud_002.png', 2, 290),
        ('River bank -> dry mud / 4x', 'Source_Reused/feathered/assets/ground/river_0.png', 'assets/ground/dried_mud_edge_N_0.png', 4, 200),
        ('Basalt crossing / 1x unchanged', 'Source_Reused/feathered/assets/ground/basalt_crossing_0.png', 'assets/ground/basalt_crossing_0.png', 1, 300),
    ]
    with zipfile.ZipFile('/workspace/PRIMAL_RUN_Art_Handoff_v2.zip') as old:
        for theme, bg in [('dark', '#28372a'), ('light', '#ded392')]:
            board = Image.new('RGB', (1200, 1010), bg)
            d = ImageDraw.Draw(board)
            ink = '#edd0a0' if theme == 'dark' else '#443027'
            for j, label in enumerate(['Existing source', 'Previous attempt', 'Reused / corrected']):
                d.text((12 + j * 400, 12), label, fill=ink)
            y = 40
            for label, ref, path, scale, height in rows:
                for j in range(3):
                    d.text((12 + j * 400, y), label, fill=ink)
                source = Image.open(ROOT / ref).convert('RGBA')
                result = Image.open(ROOT / path).convert('RGBA')
                place(board, source, (12, y + 24), scale)
                place(board, result, (812, y + 24), scale)
                candidates = [n for n in old.namelist() if n == ROOT.name + '/' + path]
                if candidates:
                    place(board, Image.open(io.BytesIO(old.read(candidates[0]))).convert('RGBA'), (412, y + 24), scale)
                else:
                    d.text((412, y + 60), 'Not supplied previously', fill=ink)
                y += height
            board.save(OUT / f'feathered_comparison_{theme}.png')
            if theme == 'dark':
                board.save(OUT / 'feathered_comparison.png')


def effects():
    for family in ['ash_cloud', 'bubble']:
        for theme, bg in [('dark', '#151b19'), ('light', '#ded392')]:
            images = [Image.open(ROOT / f'assets/effects/{family}_{n:03}.png').convert('RGBA') for n in range(4)]
            w, h = images[0].size
            strip = Image.new('RGB', ((w + 8) * 4, h + 16), bg)
            frames = []
            for n, im in enumerate(images):
                place(strip, im, (n * (w + 8) + 4, 8), 1)
                frame = Image.new('RGB', (w + 8, h + 16), bg)
                place(frame, im, (4, 8), 1)
                frames.append(frame)
            for scale in [1, 4]:
                strip.resize((strip.width * scale, strip.height * scale), Image.Resampling.NEAREST).save(
                    OUT / f'{family}_frames_{theme}_{scale}x.png')
                loop = [f.resize((f.width * scale, f.height * scale), Image.Resampling.NEAREST) for f in frames]
                loop[0].save(OUT / f'{family}_review_loop_{theme}_{scale}x.gif', save_all=True,
                             append_images=loop[1:], loop=0, duration=[100, 100, 100, 400])


if __name__ == '__main__':
    comparisons()
    effects()
