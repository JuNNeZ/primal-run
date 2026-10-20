#!/usr/bin/env python3
"""Paint transfer: four drawn poses (S/N/E/W) become 120 animated frames.

The rig and the still drawings come from the same 3D model.  For every pixel of a rig frame this
tool knows which model part it shows and where on that part it sits.  It finds the same spot in
the rest pose of the same direction and copies the colour the artist painted there.  So Codex
(or anyone) paints only the four rest poses and every frame follows: legs, tail, neck and death
roll carry the painted pattern and shading with them.

  python tools/rig_paint_transfer.py --species allosaurus --templates DIR
      writes DIR/allosaurus_rest_<S|N|E|W>.png: the exact rest silhouettes to paint over
  python tools/rig_paint_transfer.py --species allosaurus --paint DIR --out OUT
      reads DIR/allosaurus_rest_<D>.png (painted), writes the 120 frames to OUT

Painted poses must keep the template's silhouette and anchor (paint inside it).  Spots the
rest view cannot see (a far leg behind the body, the flank in the death roll) take the nearest
painted spot of the same body part from any of the four views; the outline stays the rig's.  Output is prototype art and needs Jonas' approval.
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

OUTLINE = tuple(int('151b19'[i:i + 2], 16) for i in (0, 2, 4))


def segments(m):
    """Split the prim list into (start, end, chain-key) runs; chains are matched by their key."""
    marks = sorted((c.start, c.end, (c.kind, c.side, i)) for i, c in enumerate(m.chains))
    out, pos = [], 0
    for start, end, key in marks:
        if start > pos:
            out.append((pos, start, None))
        out.append((start, end, key))
        pos = end
    if pos < len(m.prims):
        out.append((pos, len(m.prims), None))
    return out


def prim_map(posed, rest):
    """Index of the rest prim for every posed prim (tubes may have a different ellipsoid count)."""
    a, b = segments(posed), segments(rest)
    if len(a) != len(b):
        if len(posed.prims) == len(rest.prims):
            return np.arange(len(posed.prims))
        return None
    out = np.zeros(len(posed.prims), dtype=int)
    for (s0, e0, _), (s1, e1, _) in zip(a, b):
        n0, n1 = e0 - s0, e1 - s1
        for i in range(n0):
            out[s0 + i] = s1 + (round(i * (n1 - 1) / max(n0 - 1, 1)) if n0 != n1 else i)
    return out


def corr_render(prims):
    """Ray-cast with gid = prim index so the supersampled buffer says which prim each sample hit."""
    tagged = []
    for i, p in enumerate(prims):
        q = p.transformed(np.eye(3), np.zeros(3))
        q.gid = i
        tagged.append(q)
    mats = sorted({p.mat for p in prims} | {m for p in prims for m in getattr(p.paint, 'mats', [])})
    B, Dv = D.render(tagged, mats)
    return B, Dv


def to_local(p, P):
    if p.kind == 'ell':
        return ((P - p.c) @ p.R) / p.r
    n = np.cross(p.e1, p.e2)
    rel = P - p.o
    return np.stack([(rel @ p.e1) / p.k, (rel @ p.e2) / p.k, rel @ n], axis=-1)


def from_local(p, L):
    if p.kind == 'ell':
        return p.c + (L * p.r) @ p.R.T
    n = np.cross(p.e1, p.e2)
    return p.o + (L[:, :1] * p.e1 + L[:, 1:2] * p.e2) * p.k + L[:, 2:3] * n


def ref_model(sid, ref):
    """The pose the artist painted: 'rest' (the still drawing) or 'state:frame' of the rig."""
    if ref == 'rest':
        return R.build(sid)
    state, frame = ref.split(':')
    n = R.STATES[state][0]
    info = R.RigInfo(sid)
    return R.build_death(sid, info, int(frame), n) if state == 'death' else R.build(sid, R.Pose(info, state, int(frame), n))


def align(painted, template, reach=6):
    """Integer shift that lays the painting best over the reference silhouette, and a painting whose
    colours are spread a few pixels past its own edge so a small silhouette mismatch still finds paint."""
    pa, ta = painted[..., 3] > 0, template[..., 3] > 0
    best, shift = -1.0, (0, 0)
    for dy in range(-reach, reach + 1):
        for dx in range(-reach, reach + 1):
            m = np.roll(np.roll(pa, dy, 0), dx, 1)
            iou = (m & ta).sum() / max((m | ta).sum(), 1)
            if iou > best:
                best, shift = iou, (dy, dx)
    img = np.roll(np.roll(painted, shift[0], 0), shift[1], 1).copy()
    good = (img[..., 3] > 0) & ~np.all(img[..., :3] == OUTLINE, axis=-1)
    for _ in range(reach):  # grow interior colours outward, one ring per pass
        grow = np.zeros_like(good)
        acc = img.copy()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            g = np.roll(np.roll(good, dy, 0), dx, 1) & ~good & ~grow
            acc[g] = np.roll(np.roll(img, dy, 0), dx, 1)[g]
            grow |= g
        img, good = acc, good | grow
        img[good, 3] = 255
    return img, shift, best


def rest_view(sid, d, k, ref='rest'):
    rest = ref_model(sid, ref)
    prims, _ = D.place(rest, R.HEADING[d], k)
    B, Dv = corr_render(prims)
    return rest, prims, B, Dv


def centre_points(B, Dv):
    """World point and prim index of the centre sub-sample of every output pixel."""
    ss, size, c = D.SS, D.CANVAS, D.SS // 2
    gid, lam = B.gid[c::ss, c::ss], B.lam[c::ss, c::ss]
    jj, ii = np.meshgrid(np.arange(size), np.arange(size))
    X = (jj * ss + c + 0.5) / ss - D.ANCHOR[0]
    U = D.ANCHOR[1] - (ii * ss + c + 0.5) / ss
    P = np.stack([X, U / D.PA, np.zeros_like(X)], axis=-1) + np.where(np.isfinite(lam), lam, 0)[..., None] * Dv
    return gid, P


def painted_samples(cache, painted):
    """Per rest prim: local coordinates and painted colours of every spot a rest view shows."""
    pts = {}
    for d, (rest, rprims, RB, Dv) in cache.items():
        gid, P = centre_points(RB, Dv)
        img = painted[d]
        good = (gid >= 0) & (img[..., 3] > 0) & ~np.all(img[..., :3] == OUTLINE, axis=-1)
        for i in np.unique(gid[good]):
            sel = good & (gid == i)
            pts.setdefault(int(i), []).append((to_local(rprims[i], P[sel]), img[sel][:, :3]))
    return {i: (np.concatenate([a for a, _ in v]), np.concatenate([b for _, b in v])) for i, v in pts.items()}


def nearest(samples, ri, L):
    if ri not in samples:
        return None
    A, C = samples[ri]
    d2 = ((L[:, None, :] - A[None, :, :]) ** 2).sum(-1)
    return C[np.argmin(d2, axis=1)]


def transfer(sid, model, d, painted, rest_cache, k, samples=None):
    """Return the rig frame for (model, d) recoloured from the painted rest pose."""
    frame = D.draw_view(model, R.HEADING[d], D.seed_for(sid, d), scale=k)
    rest, rprims, RB, Dv = rest_cache[d]
    pmap = prim_map(model, rest)
    if pmap is None:
        return frame, 0.0
    prims, _ = D.place(model, R.HEADING[d], k)
    B, _ = corr_render(prims)
    ss, size = D.SS, D.CANVAS
    # one sample per output pixel: the centre sub-sample
    c = ss // 2
    gid = B.gid[c::ss, c::ss]
    lam = B.lam[c::ss, c::ss]
    jj, ii = np.meshgrid(np.arange(size), np.arange(size))
    X = (jj * ss + c + 0.5) / ss - D.ANCHOR[0]
    U = D.ANCHOR[1] - (ii * ss + c + 0.5) / ss
    out = frame.copy()
    opaque = frame[..., 3] > 0
    is_line = np.all(frame[..., :3] == OUTLINE, axis=-1)
    todo = opaque & ~is_line & (gid >= 0)
    hit = 0
    for i in np.unique(gid[todo]):
        sel = todo & (gid == i)
        P = np.stack([X[sel], U[sel] / D.PA, np.zeros(int(sel.sum()))], axis=-1) + lam[sel][:, None] * Dv
        rp = rprims[pmap[i]]
        Q = from_local(rp, to_local(prims[i], P))
        col = np.floor(D.ANCHOR[0] + Q[:, 0] * 1.0).astype(int)
        uq = D.PA * Q[:, 1] + D.PB * Q[:, 2]
        row = np.floor(D.ANCHOR[1] - uq).astype(int)
        inb = (col >= 0) & (row >= 0) & (col < size) & (row < size)
        # visible in the rest pose: that rest pixel's front surface is this same spot
        rr, cc = np.clip(row * ss + c, 0, size * ss - 1), np.clip(col * ss + c, 0, size * ss - 1)
        p0 = np.stack([Q[:, 0], uq / D.PA, np.zeros(len(Q))], axis=-1)
        lam_q = (Q - p0) @ Dv
        vis = inb & (np.abs(RB.lam[rr, cc] - lam_q) < 1.6)
        src = painted[row.clip(0, size - 1), col.clip(0, size - 1)]
        ok = vis & (src[:, 3] > 0) & ~np.all(src[:, :3] == OUTLINE, axis=-1)
        idx = np.argwhere(sel)
        out[idx[ok, 0], idx[ok, 1], :3] = src[ok, :3]
        hit += int(ok.sum())
        if samples is not None and (~ok).any():  # hidden in this rest view: nearest painted spot of the same part
            near = nearest(samples, int(pmap[i]), to_local(prims[i], P)[~ok])
            if near is not None:
                out[idx[~ok, 0], idx[~ok, 1], :3] = near
                hit += int((~ok).sum())
    return out, hit / max(int(todo.sum()), 1)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--species', required=True)
    ap.add_argument('--templates', default='', help='write the rest poses to paint over into this folder')
    ap.add_argument('--paint', default='', help='folder with the four painted poses')
    ap.add_argument('--pattern', default='{sid}_rest_{d}.png', help='painted file names, e.g. {sid}_walk_{d}_000.png')
    ap.add_argument('--ref', default='rest', help="pose that was painted: rest or state:frame, e.g. walk:0")
    ap.add_argument('--out', default='')
    ap.add_argument('--states', default=','.join(R.STATES))
    a = ap.parse_args()
    sid = a.species
    k = D.SPECIES[sid].get('scale', 1.0)
    if a.templates:
        Path(a.templates).mkdir(parents=True, exist_ok=True)
        rest = R.build(sid)
        for d in R.DIRECTIONS:
            Image.fromarray(D.draw_view(rest, R.HEADING[d], D.seed_for(sid, d), scale=k), 'RGBA').save(
                Path(a.templates) / f'{sid}_rest_{d}.png')
        print('templates ->', a.templates)
    if not a.paint:
        return
    out = Path(a.out or f'PRIMAL_RUN_Rig/{sid}_painted')
    out.mkdir(parents=True, exist_ok=True)
    cache = {d: rest_view(sid, d, k, a.ref) for d in R.DIRECTIONS}
    ref = ref_model(sid, a.ref)
    painted = {}
    for d in R.DIRECTIONS:
        raw = np.array(Image.open(Path(a.paint) / a.pattern.format(sid=sid, d=d)).convert('RGBA'))
        template = D.draw_view(ref, R.HEADING[d], D.seed_for(sid, d), scale=k)
        painted[d], shift, iou = align(raw, template)
        print(f'{d}: painting shifted {shift[1]:+d},{shift[0]:+d} px onto the rig pose, silhouette overlap {iou:.0%}')
    samples = painted_samples(cache, painted)
    info = R.RigInfo(sid)
    cover = []
    for state in a.states.split(','):
        n = R.STATES[state][0]
        for f in range(n):
            m = R.build_death(sid, info, f, n) if state == 'death' else R.build(sid, R.Pose(info, state, f, n))
            for d in R.DIRECTIONS:
                img, c = transfer(sid, m, d, painted[d], cache, k, samples)
                cover.append(c)
                Image.fromarray(img, 'RGBA').save(out / f'{sid}_{state}_{d}_{f:03d}.png')
        print('painted', sid, state)
    print(f'{len(cover)} frames -> {out}; painted coverage mean {np.mean(cover):.0%}, min {np.min(cover):.0%}')


if __name__ == '__main__':
    main()
