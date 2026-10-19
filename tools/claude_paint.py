#!/usr/bin/env python3
"""Claude's paint-over: hand-tuned pixel-art pass for the four still poses of a new species.

Uses the 3D model only to know, per pixel, which part and material it shows and which way the
surface faces.  The colours are then chosen like a pixel artist would: clean light bands instead of
noise, a lit rim along the top edge, a darker core shadow on the far side, a lit-side outline in the
material's own dark tone (sel-out), a pale back stripe, and readable faces (eye glint, nostril,
mouth line).  The silhouette is identical to the template, so tools/rig_paint_transfer.py can carry
the result onto all 120 frames.  The output is a proposal for Jonas' review, never approved art.

  python tools/claude_paint.py --species allosaurus --out DIR   # DIR/<id>_rest_<S|N|E|W>.png + sheet
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import draw_new_species as D  # noqa: E402
import rig_animate as R  # noqa: E402

OUT = D.OUTLINE
GLINT = 28  # #e8ece1
# Longer, hue-shifted ramps (palette indices, dark -> light): shadows lean cool/purple-brown, lights warm.
RAMP = {
    'tan': [7, 8, 9, 10, 11, 12], 'tan_band': [0, 17, 7, 8], 'sandbelly': [9, 10, 11, 12, 6],
    'olive': [1, 2, 3, 4, 5, 6], 'olive_dark': [0, 1, 2, 3], 'green': [1, 2, 3, 4, 5, 6],
    'lightgreen': [2, 3, 4, 5, 6], 'rust': [17, 18, 19, 20], 'claw': [13, 15, 16, 28],
    'sail': [17, 18, 19, 20, 29], 'tealgrey': [0, 13, 21, 22, 23], 'greyblue': [0, 13, 31, 21, 22, 23],
    'feather_grey': [13, 14, 15, 16, 12], 'wing': [13, 14, 15, 16], 'brown': [7, 8, 9, 10, 11], 'sand': [8, 9, 10, 11, 12],
    'olivegrey': [1, 2, 3, 14, 15, 16], 'browngreen': [7, 8, 3, 4, 5],
}
BANDS = (0.28, 0.42, 0.57, 0.72, 0.90)  # light value thresholds between ramp steps


def ramp_for(name):
    return RAMP.get(name) or D.RAMPS[name]  # pattern ramps (_dark, stripe, iridescent) keep their black


def paint_view(model, heading, sid, k):
    prims, decals = D.place(model, heading, k)
    mats = sorted({p.mat for p in prims} | {m for p in prims for m in getattr(p.paint, 'mats', [])})
    B, Dv = D.render(prims, mats)
    v = D.shade_values(B, D.LIGHT, Dv, scale=k)
    alpha, mat, val, gid, dmin = D.downsample(B, v)
    c = D.SS // 2
    n = B.n[c::D.SS, c::D.SS]
    size = alpha.shape[0]
    idx = np.zeros(alpha.shape, dtype=int)
    yy, xx = np.mgrid[:size, :size]
    checker = (yy + xx) % 2 == 0
    for mi, name in enumerate(mats):
        sel = alpha & (mat == mi)
        if not sel.any():
            continue
        ramp = ramp_for(name)
        t = np.clip(val[sel], 0, 1.2)
        steps = np.array(BANDS[:len(ramp) - 1])
        level = (t[:, None] > steps[None, :]).sum(1)
        # one-pixel checker only right at a band edge: smooth but still clean
        near = np.abs(t[:, None] - steps[None, :]).min(1) < 0.025
        level = np.where(near & checker[sel], np.maximum(level - 1, 0), level)
        idx[sel] = np.array(ramp)[np.clip(level, 0, len(ramp) - 1)]
        # rim light: top/left edge facing the light gets the next lighter step
        up = np.zeros_like(alpha)
        up[1:, :] = ~alpha[:-1, :]
        left = np.zeros_like(alpha)
        left[:, 1:] = ~alpha[:, :-1]
        rim = sel & (up | left) & ((n @ D.LIGHT) > 0.35)
        idx[rim] = [ramp[min(ramp.index(i) + 1, len(ramp) - 1)] if i in ramp else i for i in idx[rim]]
        # core shadow: bottom/right edge turned away from the light gets the next darker step
        dn = np.zeros_like(alpha)
        dn[:-1, :] = ~alpha[1:, :]
        rt = np.zeros_like(alpha)
        rt[:, :-1] = ~alpha[:, 1:]
        core = sel & (dn | rt) & ((n @ D.LIGHT) < 0.25)
        idx[core] = [ramp[max(ramp.index(i) - 1, 0)] if i in ramp else i for i in idx[core]]
    # back highlight: the top of the body facing the light catches the palest tone of its ramp
    for mi, name in enumerate(mats):
        ramp = ramp_for(name)
        top = alpha & (mat == mi) & (n[..., 2] > 0.93) & ((n @ D.LIGHT) > 0.80) & (val > BANDS[-1])
        idx[top & checker] = ramp[-1]
    rgba = D.to_image(alpha, idx)
    rgba = D.outline_pass(rgba, dmin, alpha, gid, edge=2.5 * k ** 0.5)
    # sel-out: the outer outline on the lit (top/left) side takes the dark tone of the body next to it
    ring = (rgba[..., 3] > 0) & ~alpha
    for dy, dx in ((1, 0), (0, 1)):
        inner = np.zeros_like(alpha)
        inner[:size - dy, :size - dx] = alpha[dy:, dx:]
        lit = ring & inner
        src_y, src_x = np.nonzero(lit)
        for r, cc in zip(src_y, src_x):
            body = idx[r + dy, cc + dx]
            mname = mats[mat[r + dy, cc + dx]] if mat[r + dy, cc + dx] >= 0 else None
            if mname and (n[r + dy, cc + dx] @ D.LIGHT) > 0.3:
                ramp = ramp_for(mname)
                rgba[r, cc, :3] = D.PALETTE[ramp[0] if ramp[0] != body else OUT]
    # faces: eye with a glint, nostrils, a mouth line along the lower jaw edge
    for p, kind in decals:
        col = int(np.floor(D.ANCHOR[0] + p[0]))
        row = int(np.floor(D.ANCHOR[1] - (D.PA * p[1] + D.PB * p[2])))
        if not (0 <= row < size and 0 <= col < size) or not alpha[row, col]:
            continue
        if float(p @ Dv) > dmin[row, col] + 2.0 * k:
            continue
        if kind.startswith('eye'):
            D.paint_eye(rgba, row, col, kind, 2 if k >= 1.0 else 1)
            if alpha[row - 1, col - 1]:
                rgba[row - 1, col - 1, :3] = D.PALETTE[GLINT]
        else:
            D.paint_eye(rgba, row, col, kind, 1)
    return rgba


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--species', required=True)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    sid, out = a.species, Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    k = D.SPECIES[sid].get('scale', 1.0)
    rest = R.build(sid)
    for d in R.DIRECTIONS:
        img = paint_view(rest, R.HEADING[d], sid, k)
        tpl = D.draw_view(rest, R.HEADING[d], D.seed_for(sid, d), scale=k)
        assert ((img[..., 3] > 0) == (tpl[..., 3] > 0)).all(), 'silhouette changed'
        Image.fromarray(img, 'RGBA').save(out / f'{sid}_rest_{d}.png')
    print('painted', sid, '->', out)


if __name__ == '__main__':
    main()
