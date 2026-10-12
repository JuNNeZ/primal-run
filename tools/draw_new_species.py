"""Draw static placeholder sprites for the new PRIMAL RUN species.

Deterministic procedural drawing (no randomness without a fixed seed).
Each animal is described once as a small 3D model built from ellipsoids
(tubes along a spine, limbs, horns) and flat polygon slabs (sails, plates,
frills, wings).  The model is rendered with a fixed overhead camera and a
fixed light, so S, E and N are proper separate views with consistent light;
W is the exact mirror of E.  Shading uses only Primal Earth 32 ramps, binary
alpha and a 1 px dark outline.

Outputs (PRIMAL_RUN_Game/assets/new_species/):
  <id>_<S|N|E|W>.png   144x144 live pose, hip/body anchor at 72,72
  <id>_corpse.png      144x144 decayed carcass lying on its side (E)
  <id>_skeleton.png    144x144 skeleton lying on its side (E)
  <id>_avatar.png      64x64 HUD head portrait, centred on 32,32
  ambient/*.png        small ambient creatures (stretch goal)
plus PRIMAL_RUN_Game/new_species_manifest.json.

These are static placeholders for Codex to animate; nothing here is wired
into the game.

Usage: python tools/draw_new_species.py [--only id,id] [--sheet out.png] [--lineup out.png]
A full run (no --only) also redraws ambient/, the manifest and new_species_review.html.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
OUT = GAME / 'assets' / 'new_species'
AMBIENT = OUT / 'ambient'
MANIFEST = GAME / 'new_species_manifest.json'

PALETTE_HEX = json.loads((GAME / 'palette.json').read_text())['colors']
PALETTE = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in PALETTE_HEX], dtype=np.uint8)
OUTLINE = 0  # palette index of #151b19

CANVAS = 144
ANCHOR = (72, 72)
AVATAR = 64
SS = 3  # supersampling per native pixel

# Camera: overhead, slightly tilted toward north.  image_x = x,
# image_up = PA*y + PB*z.  PA ~ 0.82 matches the N/S foreshortening of the
# existing enemy_full / player_full frames.
PA, PB = 0.82, 0.36
LIGHT = np.array([-0.50, 0.42, 0.78])
LIGHT = LIGHT / np.linalg.norm(LIGHT)

AVATAR_LIGHT = np.array([-0.32, -0.38, 0.87])
AVATAR_LIGHT = AVATAR_LIGHT / np.linalg.norm(AVATAR_LIGHT)

BAYER4 = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) + 0.5) / 16.0

# ---------------------------------------------------------------- materials
# Ramps are palette indices ordered dark -> light.
RAMPS = {
    'outline': [0],
    'eye': [0],
    'claw': [13, 15, 16, 28],
    'claw_dark': [0, 13, 14, 15],
    'horn': [8, 10, 11, 12],
    'beak': [13, 14, 15, 16],
    'mouth': [17, 30, 18],
    'bone': [8, 9, 10, 11, 12],
    'bone_dark': [7, 8, 9, 10],
    'flesh': [17, 30, 18, 19],
    'decay': [0, 7, 8, 9, 10],
    'decay_dark': [0, 7, 8, 9],
    # species colours
    'tealgrey': [0, 13, 14, 21, 22, 16],
    'tealgrey_belly': [13, 14, 15, 16],
    'sail': [17, 18, 19, 20, 29],
    'sail_dark': [17, 17, 18, 19],
    'tan': [0, 7, 8, 9, 10, 11],
    'tan_band': [0, 7, 8, 9],
    'olive': [0, 1, 2, 3, 4, 5],
    'olive_dark': [0, 1, 2, 3],
    'rust': [17, 18, 19, 20],
    'feather_grey': [0, 13, 14, 15, 16, 12],
    'feather_grey_dark': [0, 13, 14],
    'pale': [14, 15, 16, 28],
    'wing': [13, 14, 15, 16, 28],
    'iridescent': [0, 0, 0, 27, 31, 21],
    'iridescent_dark': [0, 0, 24, 27],
    'brown': [0, 7, 8, 9, 10, 11],
    'brown_dark': [0, 7, 8],
    'boss': [14, 15, 16, 12],
    'orange_crest': [18, 19, 20, 29],
    'lightgreen': [1, 2, 3, 4, 5, 6],
    'sandbelly': [9, 10, 11, 12],
    'green': [1, 2, 3, 4, 5],
    'stripe': [0, 7, 8],
    'greyblue': [0, 13, 31, 21, 22, 23],
    'paleeye': [22, 23, 28],
    'sand': [7, 8, 9, 10, 11, 12],
    'sand_dark': [7, 8, 9, 10],
    'olivegrey': [0, 1, 2, 3, 14, 15, 16],
    'olivegrey_dark': [0, 1, 2, 13],
    'browngreen': [0, 7, 8, 3, 4, 5],
    'shell': [0, 13, 21, 14, 22],
    'shell_dark': [0, 0, 13, 21],
    'turtle_skin': [13, 14, 15, 16],
    'quill': [8, 10, 11, 12],
    'greyblue_dark': [0, 13, 31],
    'micro_wing': [0, 0, 0, 0, 0, 31, 27],
    'micro_sheen': [27, 31],
}


# ---------------------------------------------------------------- geometry
def norm(v):
    v = np.asarray(v, dtype=float)
    n = np.linalg.norm(v)
    return v / n if n > 1e-9 else v


def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.0]])


def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1.0, 0, 0], [0, c, -s], [0, s, c]])


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1.0, 0], [-s, 0, c]])


def frame_from_tangent(t, up_hint=(0, 0, 1.0)):
    t = norm(t)
    side = np.cross(up_hint, t)
    if np.linalg.norm(side) < 1e-6:
        side = np.array([0, 1.0, 0])
    side = norm(side)
    up = np.cross(t, side)
    return np.stack([t, side, up], axis=1)  # columns = local axes


class Ell:
    """Ellipsoid primitive. R columns are local axes in model space."""
    kind = 'ell'

    def __init__(self, c, r, R=None, mat='body', tag='body', paint=None, u0=0.0, ua=None):
        self.c = np.asarray(c, dtype=float)
        self.r = np.maximum(np.asarray(r, dtype=float), 0.05)
        self.R = np.eye(3) if R is None else np.asarray(R, dtype=float)
        self.mat = mat
        self.tag = tag
        self.paint = paint
        self.u0 = float(u0)
        self.ua = float(self.r[0] if ua is None else ua)
        self.gid = 0

    def transformed(self, M, t, k=1.0):
        e = Ell(M @ self.c * k + t, self.r * k, M @ self.R, self.mat, self.tag, self.paint, self.u0, self.ua)
        e.gid = self.gid
        return e


class Slab:
    """Flat polygon with thickness. p = o + s*e1 + t*e2 (model units)."""
    kind = 'slab'

    def __init__(self, o, e1, e2, poly, th=1.5, mat='body', tag='body', paint=None, bend=0.0):
        self.o = np.asarray(o, dtype=float)
        self.e1 = norm(e1)
        e2 = np.asarray(e2, dtype=float)
        e2 = e2 - self.e1 * np.dot(e2, self.e1)
        self.e2 = norm(e2)
        self.poly = [(float(a), float(b)) for a, b in poly]
        self.th = th
        self.mat = mat
        self.tag = tag
        self.paint = paint
        self.bend = bend  # fake normal curvature across t
        self.k = 1.0
        self._mask = None
        self.gid = 0

    def transformed(self, M, t, k=1.0):
        s = Slab(M @ self.o * k + t, M @ self.e1, M @ self.e2, self.poly, self.th, self.mat, self.tag, self.paint, self.bend)
        s.k = self.k * k
        s.gid = self.gid
        s.th = self.th * k
        s._mask = self.mask()
        return s

    def mask(self):
        if self._mask is None:
            xs = [p[0] for p in self.poly]
            ys = [p[1] for p in self.poly]
            g = 0.125
            x0, y0 = min(xs) - 1, min(ys) - 1
            w = int((max(xs) - x0 + 1) / g) + 2
            h = int((max(ys) - y0 + 1) / g) + 2
            im = Image.new('L', (w, h), 0)
            ImageDraw.Draw(im).polygon([((x - x0) / g, (y - y0) / g) for x, y in self.poly], fill=255)
            self._mask = (np.array(im) > 0, x0, y0, g)
        return self._mask


# ---------------------------------------------------------------- renderer
class Buffers:
    def __init__(self, w, h):
        self.lam = np.full((h, w), np.inf)
        self.depth = np.zeros((h, w))
        self.n = np.zeros((h, w, 3))
        self.mat = np.full((h, w), -1, dtype=np.int32)
        self.shade = np.zeros((h, w))
        self.gid = np.full((h, w), -1, dtype=np.int32)
        self.z = np.zeros((h, w))


def render(prims, mats, size=CANVAS, anchor=ANCHOR, pa=PA, pb=PB, ss=SS, light=LIGHT):
    """Ray-cast primitives (already in world space) into supersampled buffers."""
    W = H = size * ss
    D = norm([0.0, pb, -pa])
    B = Buffers(W, H)
    mat_id = {m: i for i, m in enumerate(mats)}

    def pix_range(xc, uc, rb):
        c0 = int(math.floor((anchor[0] + xc - rb) * ss)) - 1
        c1 = int(math.ceil((anchor[0] + xc + rb) * ss)) + 1
        r0 = int(math.floor((anchor[1] - uc - rb) * ss)) - 1
        r1 = int(math.ceil((anchor[1] - uc + rb) * ss)) + 1
        return max(c0, 0), min(c1, W), max(r0, 0), min(r1, H)

    for pr in prims:
        if pr.kind == 'ell':
            rb = float(np.max(pr.r)) * 1.02
            xc, uc = pr.c[0], pa * pr.c[1] + pb * pr.c[2]
            c0, c1, r0, r1 = pix_range(xc, uc, rb)
            if c0 >= c1 or r0 >= r1:
                continue
            jj, ii = np.meshgrid(np.arange(c0, c1), np.arange(r0, r1))
            X = (jj + 0.5) / ss - anchor[0]
            U = anchor[1] - (ii + 0.5) / ss
            p0 = np.stack([X, U / pa, np.zeros_like(X)], axis=-1)
            A = ((p0 - pr.c) @ pr.R) / pr.r
            Bv = (D @ pr.R) / pr.r
            aa = float(Bv @ Bv)
            bb = A @ Bv
            cc = np.sum(A * A, axis=-1) - 1.0
            disc = bb * bb - aa * cc
            hit = disc >= 0
            if not hit.any():
                continue
            lam = np.where(hit, (-bb - np.sqrt(np.maximum(disc, 0))) / aa, np.inf)
            sub = B.lam[r0:r1, c0:c1]
            win = hit & (lam < sub)
            if not win.any():
                continue
            q = A[win] + lam[win][:, None] * Bv
            nl = q / pr.r
            nw = nl @ pr.R.T
            nw /= np.linalg.norm(nw, axis=1, keepdims=True)
            m = np.full(q.shape[0], mat_id[pr.mat])
            sh = np.zeros(q.shape[0])
            if pr.paint is not None:
                qn = q / np.maximum(np.linalg.norm(q, axis=1, keepdims=True), 1e-9)
                m, sh = apply_paint(pr.paint, m, sh, mat_id, u=pr.u0 + q[:, 0] * pr.ua, q=qn, n=nw)
            P = p0[win] + lam[win][:, None] * D
            _commit(B, r0, r1, c0, c1, win, lam[win], P @ D, nw, m, sh, pr.gid, P[:, 2])
        else:
            _render_slab(B, pr, mat_id, anchor, pa, pb, ss, D, W, H)
    return B, D


def apply_paint(paint, m, sh, mat_id, **kw):
    li, dd = paint(**kw)
    if li is not None and len(paint.mats):
        lut = np.array([mat_id[x] for x in paint.mats])
        m = np.where(li >= 0, lut[np.maximum(li, 0)], m)
    if dd is not None:
        sh = sh + dd
    return m, sh


class Paint:
    """Callable returning (local material index or -1, shade delta)."""

    def __init__(self, fn, mats=()):
        import inspect
        self.fn = fn
        self.mats = list(mats)
        self.args = [a for a in inspect.signature(fn).parameters]

    def __call__(self, **kw):
        if 'u' in self.args and 'u' not in kw:  # body pattern used on a flat slab
            s, t = kw['s'], kw['t']
            side = np.clip(np.abs(t) / 10.0, 0, 1)
            kw['u'] = s
            kw['q'] = np.stack([np.zeros_like(s), side, np.full(s.shape, 0.5)], axis=1)
        if 's' in self.args and 's' not in kw:
            kw['s'] = kw['u']
            kw['t'] = kw['q'][:, 1]
        return self.fn(**{k: kw[k] for k in self.args if k in kw})

    def remapped(self, f):
        return Paint(self.fn, [f(x) for x in self.mats])


def _commit(B, r0, r1, c0, c1, win, lam, depth, nw, m, sh, gid, z=None):
    ii, jj = np.nonzero(win)
    ii = ii + r0
    jj = jj + c0
    B.lam[ii, jj] = lam
    B.depth[ii, jj] = depth
    B.n[ii, jj] = nw
    B.mat[ii, jj] = m
    B.shade[ii, jj] = sh
    B.gid[ii, jj] = gid
    if z is not None:
        B.z[ii, jj] = z


def _render_slab(B, pr, mat_id, anchor, pa, pb, ss, D, W, H):
    mask, mx0, my0, g = pr.mask()
    k = pr.k
    pts = [pr.o + (a * pr.e1 + b * pr.e2) * k for a, b in pr.poly]
    pts = np.array(pts)
    xs = pts[:, 0]
    us = pa * pts[:, 1] + pb * pts[:, 2]
    pad = pr.th + 1
    c0 = max(int(math.floor((anchor[0] + xs.min() - pad) * ss)) - 1, 0)
    c1 = min(int(math.ceil((anchor[0] + xs.max() + pad) * ss)) + 1, W)
    r0 = max(int(math.floor((anchor[1] - us.max() - pad) * ss)) - 1, 0)
    r1 = min(int(math.ceil((anchor[1] - us.min() + pad) * ss)) + 1, H)
    if c0 >= c1 or r0 >= r1:
        return
    jj, ii = np.meshgrid(np.arange(c0, c1), np.arange(r0, r1))
    X = (jj + 0.5) / ss - anchor[0]
    U = anchor[1] - (ii + 0.5) / ss
    p0 = np.stack([X, U / pa, np.zeros_like(X)], axis=-1)
    n = np.cross(pr.e1, pr.e2)
    nd = float(n @ D)
    dist0 = (p0 - pr.o) @ n
    center = pts.mean(axis=0)
    rad = float(np.max(np.linalg.norm(pts - center, axis=1))) + pr.th
    # lambda range inside bounding sphere
    oc = p0 - center
    bq = oc @ D
    cq = np.sum(oc * oc, axis=-1) - rad * rad
    dq = bq * bq - cq
    ok = dq >= 0
    ls1 = -bq - np.sqrt(np.maximum(dq, 0))
    ls2 = -bq + np.sqrt(np.maximum(dq, 0))
    half = pr.th / 2
    if abs(nd) > 1e-6:
        la = (-half - dist0) / nd
        lb = (half - dist0) / nd
        lo = np.minimum(la, lb)
        hi = np.maximum(la, lb)
        lo = np.maximum(lo, ls1)
        hi = np.minimum(hi, ls2)
    else:
        inside = np.abs(dist0) <= half
        ok = ok & inside
        lo, hi = ls1, ls2
    ok = ok & (hi >= lo)
    if not ok.any():
        return
    K = 10
    found = np.zeros(ok.shape, dtype=bool)
    lam_hit = np.full(ok.shape, np.inf)
    first = np.zeros(ok.shape, dtype=bool)
    s_hit = np.zeros(ok.shape)
    t_hit = np.zeros(ok.shape)
    for kk in range(K):
        f = kk / (K - 1)
        lam = lo + (hi - lo) * f
        P = p0 + lam[..., None] * D
        rel = P - pr.o
        s = (rel @ pr.e1) / k
        t = (rel @ pr.e2) / k
        ix = np.floor((s - mx0) / g).astype(int)
        iy = np.floor((t - my0) / g).astype(int)
        inb = (ix >= 0) & (iy >= 0) & (ix < mask.shape[1]) & (iy < mask.shape[0])
        val = np.zeros(ok.shape, dtype=bool)
        val[inb] = mask[iy[inb], ix[inb]]
        new = ok & val & ~found
        lam_hit[new] = lam[new]
        s_hit[new] = s[new]
        t_hit[new] = t[new]
        first[new] = kk == 0
        found |= new
    sub = B.lam[r0:r1, c0:c1]
    win = found & (lam_hit < sub)
    if not win.any():
        return
    facing = n if nd < 0 else -n
    cnt = int(win.sum())
    nw = np.tile(facing, (cnt, 1))
    tt = t_hit[win]
    if pr.bend:
        # fake curvature: tilt normal toward e2 near the far edge
        tmax = max(p[1] for p in pr.poly)
        tmin = min(p[1] for p in pr.poly)
        f = (tt - tmin) / max(tmax - tmin, 1e-6)
        nw = nw + (pr.bend * (f - 0.35))[:, None] * pr.e2
    side = ~first[win]
    if side.any():
        nw[side] = norm(pr.e2 * 0.8 - D * 0.4)
    nw /= np.linalg.norm(nw, axis=1, keepdims=True)
    m = np.full(cnt, mat_id[pr.mat])
    sh = np.zeros(cnt)
    if pr.paint is not None:
        m, sh = apply_paint(pr.paint, m, sh, mat_id, s=s_hit[win], t=tt, n=nw)
    P = p0[win] + lam_hit[win][:, None] * D
    _commit(B, r0, r1, c0, c1, win, lam_hit[win], P @ D, nw, m, sh, pr.gid, P[:, 2])


def shade_values(B, light=LIGHT, D=None, amb=0.06, dif=0.72, top=0.30, rim=0.55, curve=1.2, gain=0.72, spec=0.30,
                 ao=0.45, zref=7.0, scale=1.0):
    n = B.n
    lam = np.clip(n @ light, 0, 1)
    v = amb + dif * lam + top * np.clip(n[..., 2], 0, 1) ** 3
    if D is not None:
        facing = np.clip(-(n @ D), 0, 1)
        v = v * ((1 - rim) + rim * facing ** 0.6)
        hv = norm(light - D)
        v = gain * np.clip(v, 0, 1.2) ** curve + spec * np.clip(n @ hv, 0, 1) ** 40
    if ao:
        v = v * ((1 - ao) + ao * np.clip(B.z / (zref * scale), 0, 1) ** 0.7)
    return v + B.shade


def downsample(B, v, ss=SS):
    H, W = B.mat.shape
    h, w = H // ss, W // ss
    mat = B.mat.reshape(h, ss, w, ss).transpose(0, 2, 1, 3).reshape(h, w, ss * ss)
    vv = v.reshape(h, ss, w, ss).transpose(0, 2, 1, 3).reshape(h, w, ss * ss)
    dd = B.depth.reshape(h, ss, w, ss).transpose(0, 2, 1, 3).reshape(h, w, ss * ss)
    hit = mat >= 0
    cov = hit.sum(axis=-1)
    alpha = cov * 2 >= ss * ss  # at least half covered
    out_m = np.full((h, w), -1, dtype=np.int32)
    best = np.zeros((h, w), dtype=np.int32)
    for m in np.unique(mat[hit]):
        c = (mat == m).sum(axis=-1)
        better = c > best
        out_m[better] = m
        best[better] = c[better]
    sel = mat == out_m[..., None]
    out_v = np.where(sel, vv, 0).sum(-1) / np.maximum(sel.sum(-1), 1)
    gg = B.gid.reshape(h, ss, w, ss).transpose(0, 2, 1, 3).reshape(h, w, ss * ss)
    dsel = np.where(hit, dd, np.inf)
    front = np.argmin(dsel, axis=-1)
    gid = np.take_along_axis(gg, front[..., None], axis=-1)[..., 0]
    dmin = dsel.min(-1)
    return alpha, out_m, out_v, gid, dmin


def hash_noise(h, w, seed):
    rng = np.random.default_rng(seed)
    return rng.random((h, w))


def quantize(alpha, mat, val, mats, seed, noise=0.10, gamma=1.0):
    h, w = alpha.shape
    idx = np.zeros((h, w), dtype=np.int32)
    nz = hash_noise(h, w, seed) - 0.5
    bay = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    for mi, name in enumerate(mats):
        ramp = RAMPS[name]
        sel = alpha & (mat == mi)
        if not sel.any():
            continue
        v = np.clip(val[sel], 0, 1.2) ** gamma
        f = v * (len(ramp) - 1) + nz[sel] * noise * len(ramp) + (bay[sel] - 0.5) * 0.9
        k = np.clip(np.round(f), 0, len(ramp) - 1).astype(int)
        idx[sel] = np.array(ramp)[k]
    return idx


def to_image(alpha, idx):
    h, w = alpha.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[alpha, :3] = PALETTE[idx[alpha]]
    rgba[alpha, 3] = 255
    return rgba


def outline_pass(rgba, depth, alpha, gid, edge=2.5, inner=True):
    """Inner depth-discontinuity lines and a 1px outer outline (4-connected)."""
    out = rgba.copy()
    a = alpha
    h, w = a.shape
    if inner:
        dark = np.zeros_like(a)
        for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
            nb_a = np.zeros_like(a)
            nb_d = np.full(depth.shape, np.inf)
            nb_g = np.full(gid.shape, -2)
            ys = slice(max(dy, 0), h + min(dy, 0))
            yd = slice(max(-dy, 0), h + min(-dy, 0))
            xs = slice(max(dx, 0), w + min(dx, 0))
            xd = slice(max(-dx, 0), w + min(-dx, 0))
            nb_a[yd, xd] = a[ys, xs]
            nb_d[yd, xd] = depth[ys, xs]
            nb_g[yd, xd] = gid[ys, xs]
            # this pixel is behind a nearer neighbouring part by more than edge
            with np.errstate(invalid='ignore'):
                dark |= a & nb_a & (gid != nb_g) & (depth - nb_d > edge)
        out[dark, :3] = PALETTE[OUTLINE]
    ring = np.zeros_like(a)
    ring[1:, :] |= a[:-1, :]
    ring[:-1, :] |= a[1:, :]
    ring[:, 1:] |= a[:, :-1]
    ring[:, :-1] |= a[:, 1:]
    ring &= ~a
    out[ring, :3] = PALETTE[OUTLINE]
    out[ring, 3] = 255
    return out


# ---------------------------------------------------------------- model building
class Model:
    def __init__(self, variant='alive'):
        self.variant = variant
        self.prims = []
        self.decals = []  # (point, kind)
        self.anchor = np.zeros(3)
        self._gid = 0
        self._group = None

    def new_gid(self):
        self._gid += 1
        return self._gid

    @property
    def alive(self):
        return self.variant == 'alive'

    @property
    def skel(self):
        return self.variant == 'skeleton'

    def add(self, p):
        self.prims.append(p)
        return p

    def ell(self, c, r, R=None, mat='body', tag='body', paint=None, u0=None):
        return self.add(Ell(c, r, R, mat, tag, paint, u0=(c[0] if u0 is None else u0)))

    def tube(self, ctrl, mat, tag='body', paint=None, step=0.45, tags=None, minr=0.35, long=1.6):
        """ctrl: list of (x,y,z,w,h[,tag]). Emits overlapping ellipsoids."""
        P = np.array([c[:3] for c in ctrl], dtype=float)
        WH = np.array([c[3:5] for c in ctrl], dtype=float)
        ctags = [c[5] if len(c) > 5 else tag for c in ctrl]
        samples = catmull(P, WH, step)
        out = []
        gid = self.new_gid()
        for pos, tan, (w, h), seg, u in samples:
            R = frame_from_tangent(tan)
            ra = max(long * step, 0.55 * min(w, h))
            e = Ell(pos, (ra, max(w, minr), max(h, minr)), R, mat, ctags[seg], paint, u0=u, ua=ra)
            e.gid = gid
            out.append(self.add(e))
        return out

    def limb(self, pts, radii, mat, tag='limb', step=0.4, paint=None):
        ctrl = [(p[0], p[1], p[2], r, r) for p, r in zip(pts, radii)]
        return self.tube(ctrl, mat, tag=tag, step=step, paint=paint, long=1.4)

    def slab(self, o, e1, e2, poly, th=1.5, mat='body', tag='body', paint=None, bend=0.0):
        return self.add(Slab(o, e1, e2, poly, th, mat, tag, paint, bend))

    def eye(self, p, kind='eye'):
        self.decals.append((np.asarray(p, dtype=float), kind))

    def apply(self, M, t=(0, 0, 0)):
        t = np.asarray(t, dtype=float)
        self.prims = [p.transformed(M, t) for p in self.prims]
        self.decals = [(M @ p + t, k) for p, k in self.decals]
        self.anchor = M @ self.anchor + t


def catmull(P, WH, step):
    """Sample a Catmull-Rom curve through P at ~uniform arc length."""
    n = len(P)
    Pp = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    Wp = np.vstack([WH[0], WH, WH[-1]])
    dense = []
    for i in range(n - 1):
        p0, p1, p2, p3 = Pp[i], Pp[i + 1], Pp[i + 2], Pp[i + 3]
        w0, w1, w2, w3 = Wp[i], Wp[i + 1], Wp[i + 2], Wp[i + 3]
        for j in range(24):
            t = j / 24
            t2, t3 = t * t, t * t * t
            pos = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
            wh = w1 + (w2 - w1) * (3 * t2 - 2 * t3)
            dense.append((pos, wh, i))
    dense.append((P[-1], WH[-1], n - 2))
    pts = np.array([d[0] for d in dense])
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])
    total = cum[-1]
    m = max(int(total / step), 1)
    out = []
    for s in np.linspace(0, total, m + 1):
        k = min(np.searchsorted(cum, s), len(dense) - 1)
        k0 = max(k - 1, 0)
        k1 = min(k + 1, len(dense) - 1)
        tan = pts[k1] - pts[k0]
        out.append((pts[k], tan, dense[k][1], dense[k][2], pts[k][0]))
    return out


# ---------------------------------------------------------------- views
VIEW_HEADING = {'E': 0.0, 'N': math.pi / 2, 'S': -math.pi / 2}


def place(model, heading, scale=1.0):
    M = rot_z(heading)
    t = -(M @ model.anchor) * scale
    prims = [p.transformed(M, t, scale) for p in model.prims]
    decals = [((M @ p) * scale + t, k) for p, k in model.decals]
    return prims, decals


def draw_view(model, heading, seed, size=CANVAS, anchor=ANCHOR, scale=1.0, pa=PA, pb=PB,
              noise=0.10, edge=2.5, eye_px=1, tags=None, light=LIGHT, shade_kw=None, depth_test=True):
    prims, decals = place(model, heading, scale)
    if tags is not None:
        prims = [p for p in prims if p.tag in tags]
    mats = sorted({p.mat for p in prims} | {m for p in prims for m in getattr(p.paint, 'mats', [])})
    B, D = render(prims, mats, size=size, anchor=anchor, pa=pa, pb=pb)
    skw = dict(scale=scale)
    skw.update(shade_kw or {})
    v = shade_values(B, light, D, **skw)
    alpha, mat, val, gid, dmin = downsample(B, v)
    idx = quantize(alpha, mat, val, mats, seed, noise=noise)
    rgba = to_image(alpha, idx)
    rgba = outline_pass(rgba, dmin, alpha, gid, edge=edge if size == AVATAR else edge * scale ** 0.5)
    # decals (eyes): depth tested against the nearest surface
    for p, kind in decals:
        col = int(math.floor(anchor[0] + p[0]))
        row = int(math.floor(anchor[1] - (pa * p[1] + pb * p[2])))
        if not (0 <= row < size and 0 <= col < size):
            continue
        dp = float(p @ D)
        if kind == 'tooth' and eye_px < 3:
            continue
        if not alpha[row, col] or (depth_test and dp > dmin[row, col] + 2.0 * scale):
            continue
        if eye_px >= 3 and kind.startswith('eye'):
            # keep portrait eyes two pixels inside the silhouette
            step = 1 if col < anchor[0] else -1
            for _ in range(4):
                if alpha[row, col - 2 * step] and alpha[row, col - step] and alpha[row - 2, col] and alpha[row + 2, col]:
                    break
                col += step
        paint_eye(rgba, row, col, kind, eye_px)
    return rgba


EYE_STYLES = {  # kind: (pupil colour, highlight colour or None, minimum size)
    'eye': (0, None, 1),
    'eye_gold': (0, 29, 1),
    'eye_red': (0, 19, 1),
    'eye_big': (0, 23, 2),
    'socket': (0, None, 1),
    'nostril': (0, None, 1),
}


def paint_eye(rgba, row, col, kind, px):
    dark, hi, mn = EYE_STYLES.get(kind, (0, None, 1))
    h, w = rgba.shape[:2]

    def put(r, c, ci):
        if 0 <= r < h and 0 <= c < w and rgba[r, c, 3]:
            rgba[r, c, :3] = PALETTE[ci]
    if kind == 'nostril':
        put(row, col, 0)
        if px >= 3:
            put(row, col + 1, 0)
        return
    if kind == 'tooth':
        put(row, col, 28)
        put(row + 1, col, 0)
        return
    px = max(px, mn)
    if px >= 3:
        # portrait eye: dark socket, coloured iris, small white glint
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                put(row + dy, col + dx, 0)
        put(row, col, hi if hi is not None else 15)
        put(row - 1, col - 1, 28 if kind != 'socket' else 0)
        return
    cells = [(row + dy - (px - 1) // 2, col + dx - (px - 1) // 2) for dy in range(px) for dx in range(px)]
    for r, c in cells:
        put(r, c, dark)
    if hi is not None:
        r, c = cells[0]
        put(r, c, hi)
        if px == 1:
            put(r + 1, c, 0)


# ---------------------------------------------------------------- variants
CORPSE_KEEP = {'claw', 'horn', 'beak', 'bone', 'bone_dark', 'flesh', 'decay', 'decay_dark', 'mouth',
               'eye', 'sail_dark', 'quill', 'shell_dark'}
CORPSE_MAP = {'sail': 'sail_dark', 'rust': 'sail_dark', 'orange_crest': 'sail_dark', 'shell': 'shell_dark',
              'boss': 'horn', 'wing': 'decay_dark'}


def corpse_mat(x):
    if x in CORPSE_KEEP:
        return x
    if x in CORPSE_MAP:
        return CORPSE_MAP[x]
    return 'decay_dark' if x.endswith('_dark') or x in ('stripe', 'tan_band') else 'decay'


class Species(Model):
    """Model with variant-aware helpers (alive / corpse / skeleton)."""

    def add(self, p):
        if p.gid == 0:
            p.gid = self.new_gid()
        if self.variant == 'corpse':
            p.mat = corpse_mat(p.mat)
            if p.paint is not None and not getattr(p.paint, 'corpse_ok', False):
                p.paint = p.paint.remapped(corpse_mat)
        if self.variant == 'skeleton' and p.mat not in ('bone', 'bone_dark', 'claw', 'horn', 'beak', 'shell_dark'):
            p.mat = 'bone'
            p.paint = None
        self.prims.append(p)
        return p

    # body -----------------------------------------------------------------
    def body(self, ctrl, mat, paint=None, torso=(-8, 24), skull_scale=0.85, step=0.45, girth=1.35):
        g = {'body': girth, 'tail': 1.0 + (girth - 1) * 0.5, 'neck': 1.0 + (girth - 1) * 0.6, 'head': 1.0}
        ctrl = [(c[0], c[1], c[2], c[3] * g.get(c[5], 1.0), c[4] * (1.0 + (g.get(c[5], 1.0) - 1) * 0.3), c[5]) for c in ctrl]
        if self.skel:
            self.skeleton_spine(ctrl, torso, skull_scale)
        else:
            if self.variant == 'corpse':
                paint = corpse_paint(torso)
            self.tube(ctrl, mat, paint=paint, step=step)

    def skeleton_spine(self, ctrl, torso, skull_scale):
        P = np.array([c[:3] for c in ctrl], dtype=float)
        WH = np.array([c[3:5] for c in ctrl], dtype=float)
        tags = [c[5] if len(c) > 5 else 'body' for c in ctrl]
        head = [(c[0], c[1], c[2], c[3] * skull_scale, c[4] * skull_scale, 'head') for c in ctrl if (len(c) > 5 and c[5] == 'head')]
        if len(head) >= 2:
            self.tube(head, 'bone', tag='head', step=0.4)
        samples = catmull(P, WH, 0.4)
        last_v = -1e9
        last_r = -1e9
        dist = 0.0
        prev = None
        for pos, tan, (w, h), seg, u in samples:
            if prev is not None:
                dist += float(np.linalg.norm(pos - prev))
            prev = pos
            if tags[min(seg, len(tags) - 1)] == 'head' and tags[min(seg + 1, len(tags) - 1)] == 'head':
                continue
            rv = float(np.clip(min(w, h) * 0.3, 0.75, 2.0))
            R = frame_from_tangent(tan)
            if dist - last_v >= max(rv * 1.5, 1.0):
                self.add(Ell(pos, (rv * 0.75, rv * 0.9, rv * 1.15), R, 'bone', 'body', None, u0=u))
                self.add(Ell(pos + R[:, 2] * rv * 1.2, (rv * 0.4, rv * 0.35, rv * 0.7), R, 'bone_dark', 'body', None, u0=u))
                last_v = dist
            if torso[0] <= u <= torso[1] and dist - last_r >= 2.6:
                for side in (1, -1):
                    arc = []
                    for th in np.linspace(math.radians(70), math.radians(-75), 9):
                        y = math.cos(th) * w * 0.95 * side
                        z = math.sin(th) * h * 0.95
                        arc.append(pos + R[:, 1] * y + R[:, 2] * z - R[:, 0] * (0.6 - math.sin(th)) * 0.8)
                    rr = 0.5 if w < 6 else 0.75
                    self.tube([(a[0], a[1], a[2], rr, rr) for a in arc], 'bone', step=0.35, long=1.3)
                last_r = dist

    def limb(self, pts, radii, mat, tag='limb', step=0.4, paint=None, claws=()):
        if self.skel:
            radii = [max(r * 0.42, 0.45) for r in radii]
            mat = 'bone'
            paint = None
        ctrl = [(p[0], p[1], p[2], r, r) for p, r in zip(pts, radii)]
        out = self.tube(ctrl, mat, tag=tag, step=step, paint=paint, long=1.4)
        for a, b, r in claws:
            self.claw(a, b, r, tag=tag)
        return out

    def claw(self, a, b, r=0.7, mat='claw', tag='limb', lift=0.3):
        a = np.asarray(a, float)
        b = np.asarray(b, float)
        mid = (a + b) / 2 + np.array([0, 0, lift * np.linalg.norm(b - a) * 0.3])
        self.tube([(a[0], a[1], a[2], r, r), (mid[0], mid[1], mid[2], r * 0.7, r * 0.7), (b[0], b[1], b[2], r * 0.3, r * 0.3)],
                  mat, tag=tag, step=0.3, long=1.3, minr=0.25)

    def horn(self, base, tip, r, mat='horn', tag='head', curve=(0, 0, 0)):
        base = np.asarray(base, float)
        tip = np.asarray(tip, float)
        mid = (base + tip) / 2 + np.asarray(curve, float)
        self.tube([(*base, r, r), (*mid, r * 0.6, r * 0.6), (*tip, r * 0.18, r * 0.18)], mat, tag=tag, step=0.3, long=1.3, minr=0.2)

    def eye(self, p, kind='eye'):
        if self.skel:
            kind = 'socket'
        elif self.variant == 'corpse':
            kind = 'eye'
        self.decals.append((np.asarray(p, dtype=float), kind))

    def mirror(self, fn):
        for side in (1, -1):
            fn(side)


def corpse_paint(torso):
    def fn(u, q, n):
        idx = np.full(u.shape, -1)
        blot = (np.sin(u * 1.37 + q[:, 2] * 4.1) * np.sin(u * 0.53 - q[:, 1] * 3.3)) > 0.45
        idx[blot] = 0
        rib = (u > torso[0]) & (u < torso[1]) & (q[:, 1] < 0.1) & (q[:, 2] > -0.75)
        stripe = np.sin(u * 2 * math.pi / 3.0) > 0.1
        idx[rib & stripe] = 1
        idx[rib & ~stripe] = 2
        d = np.where(rib & stripe, 0.12, 0.0)
        return idx, d
    p = Paint(fn, ['decay_dark', 'bone', 'flesh'])
    p.corpse_ok = True
    return p


def body_paint(belly=None, band=None, period=8.0, duty=0.4, bx0=-999, bx1=999, dorsal=None,
               stripes=None, stripe_n=3, spots=None, belly_level=-0.35, band_up=-0.05, ridge=0.08,
               back=None, back_level=0.5):
    """Generic skin/feather pattern in rest-pose body coordinates."""
    mats = []
    ids = {}
    for name in (belly, back, band, dorsal, stripes, spots):
        if name and name not in ids:
            ids[name] = len(mats)
            mats.append(name)

    def fn(u, q, n):
        idx = np.full(u.shape, -1)
        d = np.zeros(u.shape)
        up = q[:, 2]
        if belly:
            idx[up < belly_level] = ids[belly]
        if back:
            idx[up > back_level] = ids[back]
        if band:
            a = np.arctan2(q[:, 1], np.maximum(up, -0.99))
            wob = 0.9 * np.sin(u * 0.53 + a * 2.1) + 0.6 * np.sin(u * 1.37 - a * 3.3) + 0.5 * np.abs(a)
            sv = np.sin(2 * math.pi * u / period + wob)
            thr = 1.0 - 2.0 * duty * np.clip((up - band_up) * 1.4, 0, 1)
            on = (sv > thr) & (u > bx0) & (u < bx1)
            idx[on] = ids[band]
        if stripes:
            ang = np.arctan2(up, np.abs(q[:, 1]))
            on = (np.sin(ang * stripe_n * 2) > 0.55) & (up > -0.1)
            idx[on] = ids[stripes]
        if spots:
            a = np.arctan2(q[:, 1], up)
            sp = (np.sin(u * 1.1 + 2.3 * np.sin(a * 3.0)) * np.sin(a * 5.0 + u * 0.45)) > 0.5
            idx[sp & (up > -0.2)] = ids[spots]
        if dorsal:
            idx[up > 0.9] = ids[dorsal]
        d += ridge * np.clip(up - 0.75, 0, 1) * 4
        return idx, d
    return Paint(fn, mats)


def bend_model(m, x0, z0, length, angle, forward=True):
    """Bend everything beyond x0 (forward) or behind x0 (backward) upward in
    the x-z plane.  The bend grows over `length` and is rigid afterwards.
    Used for the opisthotonic death pose (neck/tail curl north after the roll)."""
    def ang(x):
        d = (x - x0) if forward else (x0 - x)
        f = np.clip(d / length, 0, 1)
        return angle * f * (1 if forward else -1)

    piv = np.array([x0, 0.0, z0])

    def f_pos(p):
        a = ang(p[0])
        if a == 0:
            return p, np.eye(3)
        R = rot_y(-a)
        return piv + R @ (p - piv), R

    out = []
    for p in m.prims:
        if p.kind == 'ell':
            c, R = f_pos(p.c)
            p.c = c
            p.R = R @ p.R
        else:
            o, R = f_pos(p.o)
            p.o = o
            p.e1 = R @ p.e1
            p.e2 = R @ p.e2
        out.append(p)
    m.prims = out
    m.decals = [(f_pos(p)[0], k) for p, k in m.decals]


def ys(ctrl):
    """(x, z, w, h, tag) -> (x, 0, z, w, h, tag)."""
    return [(c[0], 0.0, c[1], c[2], c[3], c[4]) for c in ctrl]


SPRAWL = 1.2


def theropod_leg(m, side, hip, knee, ankle, foot, radii, mat, toe=2.6, claw=0.6, paint=None, toes=3, thigh=None):
    """Hind leg with forward toes (y mirrored by side); optional muscular thigh."""
    def S(p):
        return (p[0], p[1] * side * SPRAWL, p[2])
    m.limb([S(hip), S(knee), S(ankle), S(foot)], radii, mat, paint=paint)
    if thigh is not None and not m.skel:
        a, b = np.array(S(hip)), np.array(S(knee))
        c = a * 0.45 + b * 0.55
        m.ell(c, thigh, frame_from_tangent(b - a), mat=mat, tag='limb', paint=paint)
    fx, fy, fz = S(foot)
    spread = (-1.0, 0.0, 1.0) if toes == 3 else (-1.2, -0.4, 0.4, 1.2)
    for k, dy in enumerate(spread):
        a = (fx + 0.3, fy + dy * radii[-1] * 0.6, fz)
        b = (fx + toe * (1.0 if abs(dy) < 0.5 else 0.8), fy + dy * radii[-1] * 1.5, fz - 0.2)
        m.limb([a, b], [radii[-1] * 0.55, radii[-1] * 0.42], mat)
        m.claw(b, (b[0] + toe * 0.45, b[1] + dy * 0.3, b[2]), claw)


def theropod_arm(m, side, shoulder, elbow, hand, radii, mat, claw_len=2.0, claw_r=0.5, n=3, spread=0.6, paint=None):
    def S(p):
        return (p[0], p[1] * side * SPRAWL, p[2])
    m.limb([S(shoulder), S(elbow), S(hand)], radii, mat, paint=paint)
    hx, hy, hz = S(hand)
    d = norm(np.array(S(hand)) - np.array(S(elbow)))
    for k in range(n):
        off = (k - (n - 1) / 2) * spread
        a = (hx, hy + off * side, hz)
        b = (hx + d[0] * claw_len, hy + d[1] * claw_len + off * side * 1.2, hz - 0.5)
        m.claw(a, b, claw_r)


def quad_leg(m, side, top, mid, foot, radii, mat, toe=1.6, claw=0.6, n=3, paint=None, claw_mat='claw'):
    """Quadruped leg: top joint, knee/elbow, foot with short blunt toes."""
    def S(p):
        return (p[0], p[1] * side * SPRAWL, p[2])
    m.limb([S(top), S(mid), S(foot)], radii, mat, paint=paint)
    fx, fy, fz = S(foot)
    for k in range(n):
        dy = (k - (n - 1) / 2) * radii[-1] * 0.7
        a = (fx + radii[-1] * 0.5, fy + dy, fz)
        b = (fx + radii[-1] * 0.5 + toe, fy + dy * 1.3, fz - 0.1)
        m.claw(a, b, claw, mat=claw_mat)


def teeth(m, xs, wfn, z, r=0.45):
    """Row of teeth along both jaw edges; drawn only in the portrait."""
    if m.skel or not m.alive:
        return
    for x in xs:
        w = wfn(x)
        for side in (1, -1):
            m.decals.append((np.array([x, side * w * 0.98, z], dtype=float), 'tooth'))


def fin(m, outline, base, thick, mat, paint=None, center_th=1.2, tag='body'):
    """Dorsal sail/fin as a wedge: two faces leaning in to a ridge plus a core.
    outline: (x, z_top) along the ridge; base(x) -> z at the back."""
    xs = [p[0] for p in outline]
    zt = max(p[1] for p in outline)
    zb = min(base(x) for x in xs)
    poly = [(x, z) for x, z in outline] + [(x, base(x) - 1.5) for x in xs[::-1]]
    m.slab((0, 0, 0), (1, 0, 0), (0, 0, 1), poly, th=center_th, mat=mat, paint=paint, tag=tag)
    gid = m.prims[-1].gid
    if thick <= 0:
        return
    tan = thick / max(zt - zb, 1)
    th = math.atan(tan)
    for side in (1, -1):
        e2 = np.array([0, -side * math.sin(th), math.cos(th)])
        o = np.array([0, side * tan * zt, 0])
        poly2 = [(x, z / math.cos(th)) for x, z in poly]
        s = m.slab(o, (1, 0, 0), e2, poly2, th=0.8, mat=mat, paint=paint, tag=tag)
        s.gid = gid


# ================================================================ species
# Model units are native pixels at visual scale 1.  x = forward, y = left,
# z = up.  The hip / body anchor sits at the origin and lands on 72,72.

def scaled(ctrl, k, dz=0.0):
    return [(c[0] * k, c[1] * k, c[2] * k + dz, c[3] * k, c[4] * k, c[5]) for c in ctrl]


def P3(p, k=1.0, side=1):
    return (p[0] * k, p[1] * k * side, p[2] * k)


def head_parts(m, jaw, mat_jaw, brows=(), crest=None):
    if m.skel:
        return
    m.tube(jaw, mat_jaw, tag='head')
    for b in brows:
        m.ell(b[0], b[1], mat=b[2] if len(b) > 2 else mat_jaw, tag='head')


def feather_paint(base_dark, chevron=0.62, period=1.6, belly=None, bars=None, bar_period=6.0, bar_x=(-999, 999)):
    """Feather texture: chevrons running back from the spine (+ optional bars)."""
    mats = [base_dark] + ([belly] if belly else []) + ([bars] if bars else [])

    def fn(u, q, n):
        idx = np.full(u.shape, -1)
        up = q[:, 2]
        side = np.abs(q[:, 1])
        ch = np.sin((u + side * 3.5) * (2 * math.pi / period)) > chevron
        idx[ch & (up > -0.4)] = 0
        if belly:
            idx[up < -0.4] = 1
        if bars:
            on = (((u - bar_x[0]) / bar_period) % 1.0 < 0.35) & (u > bar_x[0]) & (u < bar_x[1]) & (up > -0.3)
            idx[on] = mats.index(bars)
        return idx, 0.1 * np.clip(up - 0.7, 0, 1) * 3
    return Paint(fn, mats)


def membrane_paint(dark, ribs=None, rib_period=3.0, edge_light=0.25, span=60.0, axis='t'):
    """Wings/flippers: light toward the outer edge, optional rib lines."""
    mats = [dark]

    def fn(s, t, n):
        v = np.abs(t if axis == 't' else s)
        f = np.clip(v / span, 0, 1)
        idx = np.full(s.shape, -1)
        idx[f < 0.08] = 0
        if ribs is not None:
            r = np.abs(((s + v * ribs) / rib_period) % 1.0 - 0.5) < 0.12
            idx[r & (f > 0.15)] = 0
        return idx, edge_light * f - 0.05
    return Paint(fn, mats)


def flat_poly_slab(m, z, poly, mat, paint=None, tag='body', dihedral=0.0, side=1, th=1.0):
    """Horizontal membrane (wing, flipper, fan).  poly in (x, |y|) for side."""
    e2 = norm((0, side, dihedral))
    m.slab((0, 0, z), (1, 0, 0), e2, [(x, y) for x, y in poly], th=th, mat=mat, paint=paint, tag=tag)


# ---------------------------------------------------------------- big theropods
def spinosaurus(m):
    spine = ys([
        (-66, 4.0, 0.7, 1.0, 'tail'), (-54, 5.0, 1.6, 2.6, 'tail'), (-40, 6.5, 2.6, 4.0, 'tail'),
        (-24, 8.0, 4.6, 5.4, 'tail'), (-9, 9.0, 8.0, 7.4, 'body'), (3, 9.5, 10.2, 8.4, 'body'),
        (15, 9.8, 10.6, 8.6, 'body'), (26, 9.8, 8.0, 7.0, 'body'), (33, 10.5, 4.8, 4.6, 'neck'),
        (39, 11.4, 3.8, 3.8, 'neck'), (44, 12.2, 4.6, 3.9, 'head'), (49, 12.2, 4.0, 3.4, 'head'),
        (55, 11.6, 2.6, 2.6, 'head'), (62, 11.2, 2.2, 2.1, 'head'), (67, 11.0, 3.1, 2.0, 'head'),
        (69.5, 11.0, 2.2, 1.6, 'head')])
    paint = body_paint(belly='tealgrey_belly', band='tealgrey_belly', period=7.5, duty=0.25, bx0=-62, bx1=-14, ridge=0.1)
    m.body(spine, 'tealgrey', paint, torso=(-6, 26))
    head_parts(m, [(42, 0, 9.6, 3.6, 2.2, 'head'), (52, 0, 9.5, 2.5, 1.5, 'head'), (62, 0, 9.4, 2.0, 1.2, 'head'),
                   (67, 0, 9.5, 2.7, 1.3, 'head')], 'tealgrey_belly',
               brows=[((45.2, s * 3.4, 14.4), (2.0, 1.2, 0.9), 'tealgrey') for s in (1, -1)] + [((52, 0, 13.6), (3.5, 0.9, 1.4), 'tealgrey')])
    teeth(m, np.arange(50, 68, 2.0), lambda x: np.interp(x, [44, 55, 62, 67], [3.6, 2.4, 2.0, 2.8]), 9.9)
    base = lambda x: float(np.interp(x, [-20, -9, 3, 15, 26, 31], [12.5, 15.5, 17.0, 17.5, 16.0, 14.5]))
    top = [(-21, 13), (-15, 21), (-8, 28), (0, 33.5), (8, 36.5), (15, 35.5), (21, 31), (27, 24), (31.5, 16.5)]
    if not m.skel:
        if m.variant == 'corpse':  # torn, sagging sail
            top = [(x, z - (2.5 if i % 2 else 0) - (3 if 3 <= i <= 5 else 0)) for i, (x, z) in enumerate(top)]

        def sail_fn(s, t, n):
            b = np.interp(s, [-20, -9, 3, 15, 26, 31], [12.5, 15.5, 17.0, 17.5, 16.0, 14.5])
            f = np.clip((t - b) / 18.0, 0, 1)
            idx = np.full(s.shape, -1)
            spines = np.abs(((s + 1.0) / 3.4) % 1.0 - 0.5) < 0.12
            idx[spines & (f < 0.9)] = 0
            idx[f < 0.08] = 1
            return idx, 0.32 * f - 0.04
        fin(m, top, base, 2.2, 'sail', Paint(sail_fn, ['sail_dark', 'tealgrey']))
        fin(m, [(-62, 4.5), (-56, 8), (-46, 11), (-36, 12.5), (-28, 13.5)],
            lambda x: float(np.interp(x, [-62, -28], [3.5, 11])), 0.0, 'tealgrey')
    else:
        for x in np.arange(-18, 31, 3.0):
            t = float(np.interp(x, [p[0] for p in top], [p[1] for p in top]))
            m.limb([(x, 0, base(x) - 2), (x - 0.5, 0, t)], [0.8, 0.45], 'bone')
    m.mirror(lambda s: theropod_leg(m, s, (1, 6.5, 7), (8, 14, 5), (3.5, 16.5, 2), (9, 18, 0.8), [4.4, 3.0, 1.9, 1.5], 'tealgrey', toe=3.0, claw=0.7,
                                    thigh=(7.0, 4.2, 4.8)))
    m.mirror(lambda s: theropod_arm(m, s, (25, 6, 8.5), (28, 11, 7), (33, 12, 6), [2.4, 1.8, 1.2], 'tealgrey', claw_len=2.6, claw_r=0.55))
    for side in (1, -1):
        m.eye((45.6, side * 4.1, 13.9), 'eye_gold')
        m.eye((66.5, side * 1.4, 12.6), 'nostril')


def allosaurus(m):
    spine = ys([
        (-62, 4.0, 0.8, 1.0, 'tail'), (-50, 5.5, 1.8, 2.4, 'tail'), (-36, 7.0, 3.2, 3.8, 'tail'),
        (-20, 8.5, 5.2, 5.6, 'tail'), (-6, 9.5, 8.6, 7.6, 'body'), (6, 10.0, 10.6, 8.8, 'body'),
        (17, 10.0, 10.0, 8.4, 'body'), (26, 10.5, 7.4, 6.8, 'body'), (32, 11.5, 5.4, 5.0, 'neck'),
        (38, 12.5, 5.2, 4.8, 'neck'), (43, 13.4, 7.2, 5.4, 'head'), (49, 13.2, 6.8, 5.0, 'head'),
        (55, 12.6, 5.4, 4.0, 'head'), (60, 12.2, 4.0, 3.2, 'head'), (63.5, 11.9, 2.6, 2.3, 'head')])
    paint = body_paint(belly='sandbelly', band='tan_band', period=6.5, duty=0.42, bx0=-56, bx1=36, ridge=0.12)
    m.body(spine, 'tan', paint, torso=(-6, 26))
    head_parts(m, [(42, 0, 10.0, 5.8, 3.0, 'head'), (51, 0, 9.8, 4.9, 2.3, 'head'), (59, 0, 9.8, 3.5, 1.7, 'head'),
                   (63, 0, 9.8, 2.4, 1.3, 'head')], 'sandbelly',
               brows=[((46.5, s * 5.2, 16.6), (2.6, 1.5, 1.1), 'tan') for s in (1, -1)] + [((55, 0, 15.8), (5.0, 1.3, 1.2), 'tan')])
    teeth(m, np.arange(48, 63, 1.8), lambda x: np.interp(x, [43, 55, 60, 63], [6.0, 5.2, 3.8, 2.6]), 10.2)
    for side in (1, -1):
        m.horn((47.5, side * 4.4, 17.2), (50.0, side * 5.0, 20.4), 1.6, mat='rust', curve=(0, side * 0.3, 0.3))
        m.eye((46.5, side * 6.1, 15.0), 'eye_red')
        m.eye((61.6, side * 2.0, 13.8), 'nostril')
    m.mirror(lambda s: theropod_leg(m, s, (1, 7, 8), (9, 15, 6), (4, 17.5, 2.5), (10, 19, 0.8), [5.0, 3.4, 2.1, 1.7], 'tan', toe=3.2, claw=0.75,
                                    thigh=(8.0, 4.8, 5.4)))
    m.mirror(lambda s: theropod_arm(m, s, (26, 6.5, 9), (29, 11.5, 7.5), (35, 12.5, 7), [2.5, 2.0, 1.4], 'tan', claw_len=3.0, claw_r=0.6))


def therizinosaurus(m):
    spine = ys([
        (-46, 8.0, 1.4, 1.8, 'tail'), (-38, 9.5, 3.0, 3.4, 'tail'), (-28, 11.0, 5.2, 5.6, 'tail'),
        (-16, 12.5, 9.0, 8.6, 'body'), (-4, 13.0, 12.8, 11.0, 'body'), (8, 13.5, 12.6, 11.0, 'body'),
        (18, 15.0, 9.0, 8.4, 'body'), (25, 17.5, 5.4, 5.0, 'neck'), (32, 20.0, 3.8, 3.6, 'neck'),
        (39, 22.0, 3.2, 3.2, 'neck'), (45, 23.0, 3.4, 3.2, 'head'), (49, 22.8, 2.8, 2.6, 'head'),
        (52.5, 22.2, 1.6, 1.8, 'head')])
    paint = feather_paint('feather_grey_dark', belly='pale', bars='feather_grey_dark', bar_period=5.5, bar_x=(-46, -20))
    m.body(spine, 'feather_grey', paint, torso=(-12, 18))
    if not m.skel:
        m.ell((53, 0, 21.6), (2.2, 1.3, 1.4), mat='beak', tag='head')
        # neck ruff and tail fan of feathers
        for side in (1, -1):
            flat_poly_slab(m, 9.0, [(-34, 0), (-38, 3.2), (-41, 2.6), (-44, 4.2), (-47, 3.2), (-50, 4.2), (-53, 2.4), (-55, 0)],
                           'feather_grey', feather_paint('feather_grey_dark', period=1.4), side=side, dihedral=0.15)
    def arm(side):
        S = lambda p: (p[0], p[1] * side, p[2])
        m.limb([S((18, 8, 14)), S((22, 15, 12)), S((32, 17, 10.5))], [3.6, 2.8, 2.0], 'feather_grey')
        if not m.skel:
            # forearm feathers trailing back from the arm
            poly = [(18, 9), (24, 15.5), (32, 17.5), (30, 21), (24, 21.5), (18, 16)]
            m.slab((0, 0, 10.0), (1, 0, 0), norm((0, side, 0.12)), [(x, y) for x, y in poly], th=0.9,
                   mat='feather_grey', paint=feather_paint('feather_grey_dark', period=1.3), tag='limb')
        for k, off in enumerate((-1.8, 0.0, 1.8)):
            L = (15.0, 17.0, 14.0)[k]
            base = np.array(S((32.5, 17 + off * 0.7, 10.2)))
            L = L * 1.2
            mid = base + np.array([L * 0.55, side * (1.6 + off * 0.5), -0.6])
            tip = base + np.array([L, side * (-0.6 + off * 0.7), -1.4])
            m.tube([(*base, 1.35, 1.35), (*mid, 0.9, 0.9), (*tip, 0.25, 0.25)], 'claw_dark', tag='limb', step=0.3, long=1.3, minr=0.25)
    m.mirror(arm)
    m.mirror(lambda s: theropod_leg(m, s, (0, 8, 12), (7, 16, 8), (2.5, 17.5, 3), (8, 18.5, 0.8), [5.6, 3.8, 2.3, 1.9], 'feather_grey', toe=2.4, claw=0.65, toes=4,
                                    thigh=(8.0, 5.0, 6.0)))
    for side in (1, -1):
        m.eye((46.2, side * 2.9, 24.4), 'eye')
        m.eye((53.6, side * 0.9, 23.0), 'nostril')


def pteranodon(m):
    dead = not m.alive  # corpse and skeleton share the folded-wing pose
    spine = ys([
        (-12, 10.0, 0.8, 0.8, 'tail'), (-8, 10.0, 2.4, 2.4, 'body'), (-1, 10.2, 4.0, 3.4, 'body'),
        (6, 10.4, 3.6, 3.0, 'body'), (11, 10.8, 2.2, 2.2, 'neck'), (15, 11.2, 1.9, 1.9, 'neck'),
        (19, 11.6, 2.6, 2.4, 'head'), (23, 11.6, 1.8, 1.7, 'head'), (29, 11.3, 1.1, 1.1, 'head'),
        (35, 11.0, 0.5, 0.5, 'head')])
    m.body(spine, 'pale', body_paint(belly='pale', back='wing', back_level=0.55), torso=(-6, 8))
    # backward crest
    if not m.skel:
        m.tube([(21, 0, 12.6, 1.4, 1.6, 'head'), (16, 0, 14.0, 1.6, 1.8, 'head'), (11, 0, 15.2, 1.0, 1.0, 'head'),
                (7.5, 0, 16.0, 0.4, 0.5, 'head')], 'rust', tag='head')
        m.tube([(22, 0, 10.4, 1.3, 0.9, 'head'), (28, 0, 10.5, 0.9, 0.7, 'head'), (34, 0, 10.6, 0.4, 0.4, 'head')], 'beak', tag='head')
    else:
        m.tube([(21, 0, 12.6, 1.0, 1.2, 'head'), (16, 0, 14.0, 1.0, 1.2, 'head'), (10, 0, 15.2, 0.5, 0.5, 'head')], 'bone', tag='head')

    def wing(side):
        S = lambda p: (p[0], p[1] * side, p[2])
        span = 1.0 if not dead or side > 0 else 0.55
        el = (2, 15 * span, 11.5)
        wr = (5, 29 * span, 12.0)
        tip = (-5, 61 * span, 11.5) if span == 1.0 else (-14, 40 * span + 4, 10.5)
        wr_r = [1.8, 1.4, 1.1, 0.4] if not m.skel else [2.6, 2.2, 1.9, 1.3]
        m.limb([S((7, 3, 11)), S(el), S(wr), S(tip)], wr_r, 'pale', tag='limb')
        if not m.skel:
            if span == 1.0:
                poly = [(7, 2.5), (2, 15), (5, 29), (-5, 61), (-9, 52), (-12, 38), (-14, 22), (-12, 8), (-8, 2.5)]
            else:
                poly = [(7, 2.5), (2, 8.2), (5, 16), (-14, 26), (-16, 18), (-12, 8), (-8, 2.5)]
            m.slab((0, 0, 11.2), (1, 0, 0), norm((0, side, 0.04)), poly, th=0.8, mat='wing',
                   paint=membrane_paint('wing', ribs=0.0, rib_period=7.0, span=60.0), tag='limb')
        # small hind legs trailing back
        m.limb([S((-6, 2.6, 9.5)), S((-11, 4.5, 9.2)), S((-15, 5.2, 9.0))], [1.2, 0.9, 0.6], 'pale', tag='limb')
    m.mirror(wing)
    for side in (1, -1):
        m.eye((20.5, side * 2.2, 13.2), 'eye')


def microraptor(m):
    spine = ys([
        (-24, 5.0, 0.4, 0.5, 'tail'), (-16, 5.5, 0.8, 0.8, 'tail'), (-8, 6.0, 1.3, 1.3, 'tail'),
        (-2, 6.5, 2.6, 2.5, 'body'), (4, 7.0, 2.8, 2.5, 'body'), (8, 7.6, 1.8, 1.8, 'neck'),
        (11, 8.4, 1.5, 1.5, 'neck'), (13.5, 8.9, 1.9, 1.7, 'head'), (16, 8.7, 1.2, 1.0, 'head'),
        (18, 8.5, 0.6, 0.6, 'head')])
    m.body(spine, 'iridescent', feather_paint('iridescent_dark', period=1.4), torso=(-2, 6))
    # black flight feathers with blue/indigo sheen streaks along each vane
    fpaint = Paint(lambda s, t, n: (np.where(np.sin(s * 2.2 - np.abs(t) * 0.35) > 0.5, 0, -1),
                                    0.18 * np.clip(np.abs(t) / 14, 0, 1)), ['micro_sheen'])

    def wings(side):
        S = lambda p: (p[0], p[1] * side, p[2])
        m.limb([S((5, 1.8, 7)), S((3, 6, 7.2)), S((7, 9, 7.2))], [0.9, 0.7, 0.5], 'iridescent', tag='limb')
        m.limb([S((-1, 2, 5.5)), S((-4, 6, 4.2)), S((-8, 8.5, 3.5))], [1.2, 0.9, 0.6], 'iridescent', tag='limb')
        if not m.skel:
            arm = [(6, 1.5), (3, 6), (7, 9.5), (5, 17), (2, 20.5), (0.5, 18.5), (-1, 19), (-2.5, 16.5), (-4, 16.5),
                   (-5, 13.5), (-6.5, 12.5), (-6, 9.5), (-7, 7.5), (-4, 4), (-1, 2)]
            leg = [(-1, 1.8), (-5, 6), (-9, 9), (-15, 12), (-18.5, 12.8), (-19, 11), (-20.5, 10), (-19.5, 8),
                   (-20.5, 6.5), (-17, 5), (-16, 3), (-10, 2)]
            m.slab((0, 0, 7.0), (1, 0, 0), norm((0, side, 0.10)), arm, th=0.7, mat='micro_wing', paint=fpaint, tag='limb')
            m.slab((0, 0, 4.4), (1, 0, 0), norm((0, side, 0.06)), leg, th=0.7, mat='micro_wing', paint=fpaint, tag='limb')
            if side > 0:
                fan = [(-14, 0), (-18, 2.4), (-22, 3.2), (-26, 3.6), (-29, 3.0), (-30, 1.8), (-31.5, 0.8), (-31, 0)]
                fan = fan + [(x, -y) for x, y in fan[::-1][1:-1]]
                m.slab((0, 0, 5.2), (1, 0, 0), (0, 1, 0), fan, th=0.7, mat='micro_wing', paint=fpaint, tag='body')
        m.claw(S((7, 9, 7.2)), S((8.6, 9.6, 6.8)), 0.35)
    m.mirror(wings)
    for side in (1, -1):
        m.eye((14.2, side * 1.5, 10.2), 'eye_gold')


# ---------------------------------------------------------------- feathered / small bipeds
def oviraptor(m):
    spine = ys([
        (-40, 6.0, 0.8, 0.8, 'tail'), (-30, 7.0, 1.8, 1.8, 'tail'), (-20, 8.0, 3.0, 3.0, 'tail'),
        (-8, 9.0, 5.4, 5.2, 'body'), (4, 9.5, 6.2, 5.6, 'body'), (12, 10.0, 5.0, 4.6, 'body'),
        (18, 11.5, 2.8, 2.6, 'neck'), (24, 13.0, 2.2, 2.2, 'neck'), (29, 14.0, 2.8, 2.8, 'head'),
        (32.5, 13.8, 2.4, 2.4, 'head')])
    m.body(spine, 'brown', feather_paint('brown_dark', belly='sandbelly', bars='brown_dark', bar_period=4.5, bar_x=(-40, -12)),
           torso=(-6, 12))
    if not m.skel:
        m.ell((35, 0, 12.8), (2.4, 1.6, 1.7), mat='beak', tag='head')
        m.ell((30.5, 0, 17.0), (3.0, 1.4, 2.6), mat='orange_crest', tag='head')
        fan = [(-30, 0), (-34, 3.0), (-37, 2.4), (-40, 4.0), (-43, 3.0), (-46, 3.6), (-48, 1.6), (-49, 0)]
        fan = fan + [(x, -y) for x, y in fan[::-1][1:-1]]
        m.slab((0, 0, 7.4), (1, 0, 0), (0, 1, 0), fan, th=0.8, mat='brown_dark',
               paint=feather_paint('brown', period=1.3, chevron=0.4))
    else:
        m.ell((34.5, 0, 12.8), (2.0, 1.3, 1.4), mat='bone', tag='head')
        m.ell((30.5, 0, 16.6), (2.4, 0.9, 2.2), mat='bone', tag='head')

    def arm(side):
        S = lambda p: (p[0], p[1] * side, p[2])
        m.limb([S((12, 4, 9.5)), S((8, 8.5, 8.2)), S((17, 10, 8.0))], [1.8, 1.4, 1.0], 'brown')
        if not m.skel:
            poly = [(12, 4.5), (8, 9), (17, 10.5), (13, 14), (6, 13.5), (4, 9)]
            m.slab((0, 0, 7.6), (1, 0, 0), norm((0, side, 0.1)), poly, th=0.7, mat='brown',
                   paint=feather_paint('brown_dark', period=1.2, chevron=0.3), tag='limb')
        for k, off in enumerate((-0.8, 0.0, 0.8)):
            a = np.array(S((17, 10 + off, 8.0)))
            m.claw(a, a + np.array([2.8, side * (0.6 + off * 0.4), -0.8]), 0.45)
    m.mirror(arm)
    m.mirror(lambda s: theropod_leg(m, s, (0, 4.5, 6), (5, 8.5, 4), (2, 9.5, 1.5), (6, 10, 0.6), [3.2, 2.2, 1.3, 1.0], 'brown', toe=2.0, claw=0.45))
    for side in (1, -1):
        m.eye((30.2, side * 2.4, 15.2), 'eye_gold')
        m.eye((35.6, side * 0.8, 13.8), 'nostril')


def small_ornithopod(m, k, base, belly, pattern, tail=1.0, eye='eye', head_big=1.0, quills=False, beak=None,
                     back=None):
    """Dryosaurus / Hypsilophodon / Leaellynasaura / Psittacosaurus template."""
    t = tail
    spine = [(-38 * t - 0.0, 5.0, 0.6, 0.7, 'tail'), (-28 * t, 6.0, 1.4, 1.5, 'tail'), (-18 * (0.6 + 0.4 * t), 7.0, 2.4, 2.6, 'tail'),
             (-7, 8.0, 5.6, 4.8, 'body'), (4, 8.5, 6.2, 5.0, 'body'), (12, 9.0, 4.6, 4.0, 'body'),
             (18, 10.5, 2.6, 2.5, 'neck'), (22.5, 11.5, 2.3, 2.2, 'neck'),
             (26.5, 12.0, 2.9 * head_big, 2.6 * head_big, 'head'), (29.5, 11.6, 2.0 * head_big, 1.8 * head_big, 'head'),
             (31.5, 11.2, 1.2 * head_big, 1.2 * head_big, 'head')]
    spine = scaled(ys(spine), k)
    m.body(spine, base, pattern, torso=(-6 * k, 12 * k))
    if beak and not m.skel:
        m.ell((31.8 * k, 0, 10.6 * k), (1.6 * k, 1.3 * k, 1.5 * k), mat=beak, tag='head')
    if quills:
        for i, x in enumerate(np.arange(-16, -3, 1.4)):
            zb = 7.2 + (x + 16) * 0.06
            m.limb([(x * k, 0, (zb + 1.4) * k), ((x - 1.6) * k, 0, (zb + 6.5 - 0.15 * abs(x + 9)) * k)], [0.35 * k + 0.25, 0.25], 'quill')
    m.mirror(lambda s: theropod_leg(m, s, P3((0, 4.5, 6), k), P3((5, 9.5, 4), k), P3((1.5, 11, 1.5), k), P3((6, 12, 0.6), k),
                                    [3.4 * k, 2.2 * k, 1.4 * k, 1.1 * k], base, toe=2.4 * k, claw=max(0.35, 0.5 * k),
                                    thigh=(5.0 * k, 3.2 * k, 3.6 * k)))
    m.mirror(lambda s: theropod_arm(m, s, P3((12, 3, 7), k), P3((14, 5, 6), k), P3((17, 5.5, 5.5), k),
                                    [1.1 * k, 0.9 * k, 0.7 * k], base, claw_len=1.2 * k, claw_r=0.3, n=2))
    for side in (1, -1):
        m.eye(P3((27.0, 2.4 * head_big, 13.6), k, side), eye)
        m.eye(P3((31.6, 0.8 * head_big, 12.3), k, side), 'nostril')
    if not m.skel:
        m.tube(scaled([(25, 0, 10.2, 2.2 * head_big, 1.4 * head_big, 'head'), (30, 0, 9.9, 1.3 * head_big, 0.9 * head_big, 'head')], k),
               'sandbelly' if base != 'greyblue' else 'pale', tag='head')


def dryosaurus(m):
    small_ornithopod(m, 1.0, 'lightgreen',
                     None, body_paint(belly='sandbelly', stripes=None, back='green', back_level=0.6, spots='green'))


def hypsilophodon(m):
    small_ornithopod(m, 0.56, 'browngreen', None,
                     body_paint(belly='sandbelly', stripes='stripe', stripe_n=2.2), eye='eye_gold')


def leaellynasaura(m):
    small_ornithopod(m, 0.44, 'greyblue', None, body_paint(belly='pale', band='greyblue_dark', period=5.0, duty=0.3,
                     bx0=-120, bx1=-8), tail=1.75, eye='eye_big', head_big=1.3)


def psittacosaurus(m):
    small_ornithopod(m, 0.62, 'brown', None,
                     body_paint(belly='sandbelly', back='olive', back_level=0.35), head_big=1.45, quills=True, beak='beak',
                     eye='eye_gold')
    k = 0.62
    if not m.skel:
        for side in (1, -1):
            m.horn(P3((27.0, 2.6, 11.2), k, side), P3((27.5, 4.6, 10.6), k, side), 0.55, mat='horn')


# ---------------------------------------------------------------- quadrupeds
def stegosaurus(m):
    spine = ys([
        (-58, 7.0, 1.2, 1.2, 'tail'), (-48, 9.0, 2.2, 2.4, 'tail'), (-36, 12.0, 3.8, 4.2, 'tail'),
        (-22, 15.0, 6.4, 7.0, 'tail'), (-8, 16.5, 10.4, 10.2, 'body'), (4, 15.8, 11.6, 10.8, 'body'),
        (16, 13.6, 10.2, 9.2, 'body'), (25, 11.0, 7.0, 6.4, 'body'), (31, 9.0, 4.2, 3.8, 'neck'),
        (37, 8.0, 3.0, 2.8, 'neck'), (42, 7.6, 3.2, 2.9, 'head'), (47, 7.0, 2.4, 2.2, 'head'),
        (51, 6.4, 1.4, 1.4, 'head')])
    m.body(spine, 'olive', body_paint(belly='sandbelly', spots='olive_dark', back=None), torso=(-10, 20))
    back = lambda x: float(np.interp(x, [-58, -48, -36, -22, -8, 4, 16, 25, 31, 37],
                                     [8.2, 11.4, 16.2, 22.0, 26.7, 26.6, 22.8, 17.4, 12.8, 10.8]))
    xs = np.arange(33, -45, -4.6)
    for i, x in enumerate(xs):
        side = 1 if i % 2 == 0 else -1
        H = 3.5 + 13.0 * math.exp(-((x + 4) / 21.0) ** 2)
        L = 0.95 * H + 1.5
        poly = [(-L / 2, -1.5), (-L * 0.42, H * 0.45), (-L * 0.12, H * 0.92), (L * 0.05, H), (L * 0.3, H * 0.62),
                (L / 2, -1.5)]
        zb = back(x) - 1.6
        lean = 0.20
        o = (x, side * 1.3, zb)
        if m.skel:
            m.slab(o, (1, 0, 0), norm((0, side * lean, 1)), poly, th=1.0, mat='bone_dark')
            continue

        def plate_fn(s, t, n, H=H):
            f = np.clip(t / H, 0, 1)
            idx = np.full(s.shape, -1)
            idx[f < 0.22] = 0
            veins = np.abs(((s * 0.9 + t * 0.35) / 2.2) % 1.0 - 0.5) < 0.1
            idx[veins & (f > 0.3)] = 0
            return idx, 0.3 * f - 0.05
        m.slab(o, (1, 0, 0), norm((0, side * lean, 1)), poly, th=1.3, mat='rust', paint=Paint(plate_fn, ['sail_dark']))
    # thagomizer
    for side in (1, -1):
        for (bx, by, bz), (tx, ty, tz) in (((-49, 1.6, 10.0), (-45, 10.0, 14.0)), ((-54, 1.4, 8.6), (-53, 9.5, 12.5))):
            m.horn((bx, side * by, bz), (tx, side * ty, tz), 1.15, mat='horn', tag='body')
    m.mirror(lambda s: quad_leg(m, s, (-8, 9, 14), (-6, 15, 7), (-9, 16.5, 1.0), [6.2, 4.4, 3.6], 'olive', toe=1.6, claw=0.8, claw_mat='horn'))
    m.mirror(lambda s: quad_leg(m, s, (22, 7, 9), (24, 12.5, 5), (26, 14, 1.0), [4.4, 3.4, 2.8], 'olive', toe=1.4, claw=0.7, claw_mat='horn'))
    if not m.skel:
        m.ell((51.2, 0, 5.8), (1.6, 1.1, 1.1), mat='beak', tag='head')
    for side in (1, -1):
        m.eye((44.0, side * 2.6, 9.0), 'eye')
        m.eye((50.0, side * 0.9, 7.6), 'nostril')
    if not m.skel:
        m.tube([(40, 0, 6.0, 2.4, 1.6, 'head'), (47, 0, 5.4, 1.7, 1.1, 'head'), (50, 0, 5.2, 1.1, 0.8, 'head')], 'sandbelly', tag='head')


def ceratopsian(m, k, base, frill_mat, rim_mat, boss=False, horns=False, beak_len=1.0, frill_w=13, frill_h=14,
                frill_spikes=0, big_spikes=False, paint=None, girth=1.2):
    spine = scaled(ys([
        (-48, 6.0, 1.2, 1.2, 'tail'), (-38, 8.0, 2.6, 2.8, 'tail'), (-26, 10.5, 5.0, 5.4, 'tail'),
        (-12, 12.5, 10.0, 9.4, 'body'), (2, 13.0, 12.0, 10.4, 'body'), (14, 12.5, 11.0, 9.6, 'body'),
        (23, 11.5, 6.0, 6.4, 'neck'), (29, 11.0, 6.6, 6.4, 'head'), (35, 10.5, 6.4, 5.8, 'head'),
        (41, 9.5, 4.8, 4.6, 'head'), (45.5, 8.6, 3.2, 3.4, 'head'), (48.5 + 1.5 * (beak_len - 1), 7.8, 1.8, 2.2, 'head')]), k)
    m.body(spine, base, paint or body_paint(belly='sandbelly', spots=None), torso=(-10 * k, 18 * k), girth=girth)
    if not m.skel:
        m.ell(P3((48.5 + 1.5 * (beak_len - 1), 0, 7.6), k), (2.3 * k, 1.7 * k, 2.1 * k), mat='beak', tag='head')
    # frill
    phi = math.radians(46)
    e2 = (-math.cos(phi), 0, math.sin(phi))
    pts = []
    n = 26
    for i in range(n + 1):
        a = math.pi * i / n
        r = 1.0
        if frill_spikes and 0 < i < n and i % 2 == 0:
            r = 1.18
        pts.append((frill_w * math.cos(a) * r, frill_h * math.sin(a) * r))
    pts = [(-frill_w * 0.55, -3.0)] + pts[::-1] + [(frill_w * 0.55, -3.0)]
    pts = [(-p[0], p[1]) for p in pts]

    def frill_fn(s, t, n):
        rr = np.sqrt((s / frill_w) ** 2 + (np.maximum(t, 0) / frill_h) ** 2)
        idx = np.full(s.shape, -1)
        idx[rr > 0.8] = 0
        rad = np.abs(((np.arctan2(np.maximum(t, 0.01), s) * 7 / math.pi) % 1.0) - 0.5) < 0.08
        idx[rad & (rr < 0.78) & (rr > 0.35)] = 1
        return idx, 0.18 * np.clip(rr, 0, 1) - 0.05
    m.slab(P3((28, 0, 14.5), k), (0, 1, 0), e2, [(x * k, y * k) for x, y in pts], th=1.6 * k, mat=frill_mat,
           paint=Paint(frill_fn, [rim_mat, rim_mat]), tag='head')
    if big_spikes:
        top = np.array(P3((28, 0, 14.5), k)) + np.array(e2) * frill_h * k
        for side in (1, -1):
            b = top + np.array([0, side * 3.0 * k, 0])
            m.horn(b, b + np.array([-5.5 * k, side * 4.0 * k, 4.0 * k]), 1.3 * k, mat='horn', curve=(0, side * 1.0 * k, 1.2 * k))
    if boss:
        bp = None if m.skel else Paint(lambda u, q, n: (None, 0.18 * np.sin(u * 2.3) * np.sin(q[:, 1] * 6)), [])
        m.ell(P3((41.5, 0, 13.4), k), (6.0 * k, 4.0 * k, 2.4 * k), mat='boss', tag='head', paint=bp)
        for side in (1, -1):
            m.ell(P3((34.5, 3.2, 15.4), k, side), (2.2 * k, 1.5 * k, 1.1 * k), mat='boss', tag='head')
    if horns:
        for side in (1, -1):
            m.horn(P3((40, 4.6, 11.0), k, side), P3((41, 6.4, 10.4), k, side), 0.8 * k, mat='horn')
    m.mirror(lambda s: quad_leg(m, s, P3((22, 8, 8), k), P3((24, 13.5, 4), k), P3((25, 14, 0.8), k),
                                [4.0 * k, 3.2 * k, 2.6 * k], base, toe=1.4 * k, claw=max(0.35, 0.7 * k), claw_mat='horn'))
    m.mirror(lambda s: quad_leg(m, s, P3((-8, 8.5, 9), k), P3((-6, 14, 4.5), k), P3((-8, 14.5, 0.8), k),
                                [5.0 * k, 3.8 * k, 3.0 * k], base, toe=1.5 * k, claw=max(0.35, 0.75 * k), claw_mat='horn'))
    for side in (1, -1):
        m.eye(P3((35.0, 4.7, 13.0), k, side), 'eye_gold' if k > 0.7 else 'eye')
        m.eye(P3((46.4, 1.7, 10.6), k, side), 'nostril')


def pachyrhinosaurus(m):
    ceratopsian(m, 0.98, 'brown', 'brown', 'rust', boss=True, frill_spikes=True, big_spikes=True, frill_w=16, frill_h=16,
                paint=body_paint(belly='sandbelly', band='brown_dark', period=7.0, duty=0.12, bx0=-46, bx1=20))


def protoceratops(m):
    ceratopsian(m, 0.56, 'sand', 'sand_dark', 'brown_dark', frill_w=21, frill_h=19, beak_len=1.6, girth=1.12,
                paint=body_paint(belly='sandbelly', spots='sand_dark'))


def iguanodon(m):
    spine = ys([
        (-62, 6.0, 1.0, 1.4, 'tail'), (-50, 8.0, 2.4, 3.2, 'tail'), (-36, 10.0, 4.4, 5.4, 'tail'),
        (-20, 12.0, 7.0, 7.6, 'tail'), (-6, 13.0, 10.0, 9.6, 'body'), (8, 13.0, 10.6, 9.8, 'body'),
        (20, 12.5, 9.0, 8.6, 'body'), (28, 13.0, 5.2, 5.0, 'neck'), (35, 14.5, 4.0, 4.0, 'neck'),
        (41, 15.0, 4.4, 4.6, 'head'), (47, 14.5, 3.6, 3.8, 'head'), (52, 13.5, 2.8, 2.8, 'head'),
        (55, 13.0, 2.4, 2.0, 'head')])
    m.body(spine, 'olivegrey', body_paint(belly='pale', band='olivegrey_dark', period=9.0, duty=0.25, bx0=-60, bx1=20),
           torso=(-6, 22))
    if not m.skel:
        m.ell((55.5, 0, 12.4), (1.8, 2.0, 1.4), mat='beak', tag='head')
        m.tube([(41, 0, 12.4, 3.6, 2.2, 'head'), (49, 0, 11.6, 2.6, 1.6, 'head'), (54, 0, 11.4, 2.0, 1.2, 'head')], 'pale', tag='head')
    m.mirror(lambda s: theropod_leg(m, s, (0, 8.5, 11), (8, 16, 7), (3, 17.5, 2.5), (8, 18.5, 0.8), [5.8, 4.0, 2.6, 2.0], 'olivegrey', toe=2.2, claw=0.9,
                                    thigh=(8.0, 5.0, 5.6)))

    def arm(side):
        quad_leg(m, side, (22, 7.5, 9), (25, 14, 5), (29, 15.5, 1.0), [3.8, 2.8, 2.2], 'olivegrey', toe=1.2, claw=0.6, claw_mat='horn')
        m.horn((29.5, side * 14.0, 2.6), (32.5, side * 9.6, 6.5), 1.5, mat='claw', tag='limb')
    m.mirror(arm)
    for side in (1, -1):
        m.eye((42.0, side * 4.0, 17.0), 'eye')
        m.eye((53.4, side * 1.6, 15.0), 'nostril')


def edmontosaurus(m):
    spine = ys([
        (-60, 6.0, 1.0, 1.4, 'tail'), (-48, 8.0, 2.4, 3.4, 'tail'), (-34, 10.0, 4.4, 5.6, 'tail'),
        (-18, 12.0, 7.2, 7.8, 'tail'), (-4, 13.0, 10.2, 9.6, 'body'), (9, 13.0, 10.4, 9.6, 'body'),
        (20, 12.5, 8.6, 8.2, 'body'), (28, 13.0, 5.0, 4.8, 'neck'), (35, 14.5, 4.0, 4.0, 'neck'),
        (41, 15.0, 4.4, 4.4, 'head'), (47, 14.4, 3.8, 3.6, 'head'), (52, 13.2, 3.8, 2.6, 'head'),
        (56.5, 12.4, 4.6, 1.8, 'head'), (59, 12.2, 4.2, 1.5, 'head')])
    m.body(spine, 'brown', body_paint(belly='sandbelly', back='olive', back_level=0.72, spots='brown_dark'), torso=(-6, 22))
    if not m.skel:
        m.tube([(52, 0, 11.4, 3.6, 1.2, 'head'), (57, 0, 11.0, 4.2, 1.0, 'head'), (59.5, 0, 11.0, 3.8, 0.9, 'head')], 'beak', tag='head')
        m.tube([(41, 0, 12.4, 3.6, 2.2, 'head'), (49, 0, 11.6, 3.0, 1.6, 'head')], 'sandbelly', tag='head')
    m.mirror(lambda s: theropod_leg(m, s, (0, 8.5, 11), (8, 16, 7), (3, 17.5, 2.5), (8, 18.5, 0.8), [5.8, 4.0, 2.6, 2.0], 'brown', toe=2.2, claw=0.9,
                                    thigh=(8.0, 5.0, 5.6)))
    m.mirror(lambda s: quad_leg(m, s, (22, 7.5, 9), (25, 14, 5), (28, 15.5, 1.0), [3.8, 2.8, 2.2], 'brown', toe=1.2, claw=0.6, claw_mat='horn'))
    for side in (1, -1):
        m.eye((42.0, side * 4.1, 16.8), 'eye')
        m.eye((56.5, side * 2.6, 13.6), 'nostril')


def archelon(m):
    def shell_fn(u, q, n):
        idx = np.full(u.shape, -1)
        ay = np.abs(q[:, 1])
        keel = (ay < 0.05) | (np.abs(ay - 0.36) < 0.04) | (np.abs(ay - 0.68) < 0.04)
        lit = (ay < 0.1) | (np.abs(ay - 0.36) < 0.09) | (np.abs(ay - 0.68) < 0.09)
        idx[keel & (q[:, 2] > 0)] = 0
        idx[q[:, 2] < -0.2] = 1
        return idx, 0.18 * lit - 0.08 * keel
    sp = Paint(shell_fn, ['shell_dark', 'turtle_skin'])
    if m.skel:
        sp = None
    if m.skel:
        # carapace reduced to spine plus radiating ribs
        m.tube([(-30, 0, 9, 1.6, 1.6, 'body'), (0, 0, 12.5, 2.0, 2.0, 'body'), (30, 0, 9, 1.6, 1.6, 'body')], 'bone')
        for x in np.arange(-26, 28, 4.5):
            half = 27 * math.sqrt(max(0.0, 1 - (x / 36) ** 2))
            for side in (1, -1):
                m.limb([(x, 0, 12), (x * 1.05, side * half * 0.6, 10), (x * 1.1, side * half, 5)], [0.9, 0.8, 0.6], 'bone')
        ring = [(36 * math.cos(a) * 1.02, 27 * math.sin(a) * 1.02, 5.0, 1.0, 1.0, 'body') for a in np.linspace(0, 2 * math.pi, 33)]
        m.tube(ring, 'bone', step=0.4)
    else:
        e = m.ell((0, 0, 6.0), (36, 27, 7.5), mat='shell', paint=sp)
        e.u0, e.ua = 0.0, 36.0
    if not m.skel:
        m.ell((-1, 0, 2.8), (33, 24, 3.6), mat='turtle_skin')
    m.tube([(30, 0, 5.0, 6.6, 4.6, 'head'), (38, 0, 5.6, 6.6, 5.0, 'head'), (44, 0, 5.2, 5.0, 4.0, 'head'),
            (48.5, 0, 4.4, 2.6, 2.8, 'head')], 'turtle_skin', tag='head')
    if not m.skel:
        m.tube([(47, 0, 4.0, 2.2, 2.2, 'head'), (50, 0, 3.0, 1.1, 1.2, 'head')], 'beak', tag='head')
    m.tube([(-34, 0, 4.0, 3.0, 2.0, 'tail'), (-42, 0, 3.6, 1.2, 1.2, 'tail')], 'turtle_skin')
    fp = membrane_paint('turtle_skin', span=56.0)
    skin_spots = Paint(lambda s, t, n: (np.where(np.sin(s * 1.3) * np.sin(t * 1.1) > 0.6, 0, -1), 0.2 * np.clip(np.abs(t) / 56, 0, 1)), ['shell_dark'])

    def flippers(side):
        front = [(20, 18), (17, 32), (8, 50), (-2, 60), (-6, 56), (-2, 42), (4, 28), (8, 18)]
        hind = [(-22, 17), (-30, 27), (-38, 30), (-41, 26), (-34, 18), (-28, 14)]
        if m.skel:
            m.limb([(14, side * 18, 4), (8, side * 34, 3.6), (-1, side * 52, 3.4)], [2.4, 1.6, 0.8], 'bone')
            m.limb([(-26, side * 16, 3.6), (-36, side * 27, 3.4)], [1.8, 0.9], 'bone')
            return
        m.slab((0, 0, 3.6), (1, 0, 0), norm((0, side, -0.05)), front, th=2.0, mat='turtle_skin', paint=skin_spots, tag='limb', bend=0.5)
        m.slab((0, 0, 3.2), (1, 0, 0), norm((0, side, -0.05)), hind, th=1.8, mat='turtle_skin', paint=skin_spots, tag='limb', bend=0.5)
    m.mirror(flippers)
    for side in (1, -1):
        m.eye((44.5, side * 4.3, 7.4), 'eye')
        m.eye((48.6, side * 0.9, 6.8), 'nostril')


SPECIES = {
    'spinosaurus': dict(fn=spinosaurus, role='playable', visual_scale=2, scale=0.95, bend=(30, 10, 14, 0.75, -20, 8, 40, 1.3),
                        look='long crocodile-like snout, tall rust/orange sail, dark teal-grey body, long tail'),
    'allosaurus': dict(fn=allosaurus, role='playable', visual_scale=1, bend=(30, 11, 14, 0.7, -16, 8.5, 40, 1.2),
                       look='large theropod, small rust horn crests above the eyes, tan/brown with dark bands'),
    'stegosaurus': dict(fn=stegosaurus, role='playable', visual_scale=1, bend=(28, 10, 12, 0.5, -24, 14, 30, 0.8),
                        look='olive quadruped, two alternating rows of rust plates, four-spike thagomizer, small head'),
    'therizinosaurus': dict(fn=therizinosaurus, role='playable', visual_scale=1, bend=(22, 16, 22, 0.9, -28, 11, 18, 0.6),
                            look='pot-bellied, grey/cream feathers, long neck, small beaked head, long scythe claws'),
    'pteranodon': dict(fn=pteranodon, role='playable', visual_scale=1, bend=(11, 11, 8, 0.5, 0, 0, 1, 0.0), roll=0.0,
                       look='pterosaur in flight from above, pale/grey wings, long beak, rust backward crest'),
    'microraptor': dict(fn=microraptor, role='playable', visual_scale=1, bend=(8, 7.6, 6, 0.6, -6, 6, 16, 0.8),
                        look='tiny four-winged raptor, dark iridescent black/blue/indigo'),
    'pachyrhinosaurus': dict(fn=pachyrhinosaurus, role='playable', visual_scale=1, bend=(22, 11, 8, 0.25, -24, 10, 24, 0.7),
                             look='ceratopsian with a thick flat pale nasal boss (no nose horn), spiked frill'),
    'oviraptor': dict(fn=oviraptor, role='playable', visual_scale=1, bend=(17, 11, 12, 0.8, -18, 8, 22, 1.0),
                      look='feathered, toothless beak, rounded orange crest, long clawed arms'),
    'dryosaurus': dict(fn=dryosaurus, role='wild', visual_scale=1, bend=(17, 10, 10, 0.8, -16, 7, 22, 1.0),
                       look='small slender bipedal herbivore, light green/tan'),
    'hypsilophodon': dict(fn=hypsilophodon, role='wild', visual_scale=1, bend=(9.5, 6, 6, 0.8, -9, 4, 12, 1.0),
                          look='small biped, green-brown with dark stripes'),
    'leaellynasaura': dict(fn=leaellynasaura, role='wild', visual_scale=1, bend=(7, 4.2, 4, 0.8, -7, 2.8, 30, 1.6),
                           look='tiny, very long tail, big pale eyes, grey/blue'),
    'protoceratops': dict(fn=protoceratops, role='wild', visual_scale=1, bend=(11, 6, 4, 0.2, -13, 5, 12, 0.7),
                          look='small sandy quadruped with frill and beak, no horns'),
    'iguanodon': dict(fn=iguanodon, role='wild', visual_scale=1, bend=(26, 13, 12, 0.6, -18, 12, 36, 1.0),
                      look='large olive/grey herbivore with thumb spikes'),
    'psittacosaurus': dict(fn=psittacosaurus, role='wild', visual_scale=1, bend=(11, 6.5, 6, 0.7, -10, 4.5, 14, 0.9),
                           look='small biped, parrot beak, quill bristles on the tail, brown/olive'),
    'edmontosaurus': dict(fn=edmontosaurus, role='wild', visual_scale=1, bend=(26, 13, 12, 0.6, -16, 12, 36, 1.0),
                          look='large crestless duck-billed hadrosaur, brown/green'),
    'archelon': dict(fn=archelon, role='wild', visual_scale=1, bend=(0, 0, 1, 0.0, 0, 0, 1, 0.0), roll=math.pi,
                     look='giant grey-teal sea turtle, ridged shell, four flippers'),
}


# ================================================================ export
def build(sid, variant):
    m = Species(variant)
    spec = SPECIES[sid]
    spec['fn'](m)
    if variant != 'alive':
        nx, nz, nl, na, tx, tz, tl, ta = spec['bend']
        if na:
            bend_model(m, nx, nz, nl, na, forward=True)
        if ta:
            bend_model(m, tx, tz, tl, ta, forward=False)
        roll = spec.get('roll', -math.pi / 2)
        if roll:
            m.apply(rot_x(roll))
    return m


def seed_for(sid, view):
    return int(hashlib.sha256(f'{sid}:{view}'.encode()).hexdigest()[:8], 16)


def draw_avatar(m, sid):
    """64x64 head portrait: the model's head parts seen from the front and a
    little above (like assets/avatars), scaled to the existing head size."""
    import copy
    head = [p for p in m.prims if p.tag == 'head']
    cs = np.array([p.c if p.kind == 'ell' else p.o for p in head])
    lo, hi = cs.min(axis=0), cs.max(axis=0)
    mm = copy.copy(m)
    mm.anchor = (lo + hi) / 2
    pa, pb = 0.42, 0.90
    kw = dict(pa=pa, pb=pb, tags={'head'}, light=AVATAR_LIGHT, shade_kw=dict(rim=0.75, gain=0.78), depth_test=False)
    probe = draw_view(mm, VIEW_HEADING['S'], seed_for(sid, 'avatar'), size=192, anchor=(96, 96), **kw)
    bb = Image.fromarray(probe).getbbox()
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    k = min(27.0 / bw, 40.0 / bh, 10.0)
    img = draw_view(mm, VIEW_HEADING['S'], seed_for(sid, 'avatar'), size=AVATAR, anchor=(32, 30), scale=k,
                    eye_px=3, noise=0.16, **kw)
    bb = Image.fromarray(img).getbbox()
    dx = 32 - (bb[0] + bb[2]) // 2
    dy = 29 - (bb[1] + bb[3]) // 2
    img = np.roll(np.roll(img, dy, axis=0), dx, axis=1)
    return img


CORPSE_CENTRE = (74, 78)  # mean bbox centre of the existing assets/corpses E frames


def export_species(sid, out=OUT):
    """Render one species; returns {key: path}."""
    out.mkdir(parents=True, exist_ok=True)
    spec = SPECIES[sid]
    k = spec.get('scale', 1.0)
    files = {}
    alive = build(sid, 'alive')
    imgs = {}
    for d in ('E', 'S', 'N'):
        imgs[d] = draw_view(alive, VIEW_HEADING[d], seed_for(sid, d), scale=k)
    imgs['W'] = imgs['E'][:, ::-1].copy()
    for d in ('S', 'N', 'E', 'W'):
        p = out / f'{sid}_{d}.png'
        Image.fromarray(imgs[d], 'RGBA').save(p)
        files[d] = p
    # corpse and skeleton share one registration: the carcass is centred like
    # the existing corpse props (bbox centre ~74,78), the skeleton follows it.
    corpse = build(sid, 'corpse')
    skel = build(sid, 'skeleton')
    probe = draw_view(corpse, VIEW_HEADING['E'], seed_for(sid, 'corpse'), scale=k)
    bb = Image.fromarray(probe).getbbox()
    anchor = (ANCHOR[0] + round(CORPSE_CENTRE[0] - (bb[0] + bb[2]) / 2), ANCHOR[1] + round(CORPSE_CENTRE[1] - (bb[1] + bb[3]) / 2))
    p = out / f'{sid}_corpse.png'
    Image.fromarray(draw_view(corpse, VIEW_HEADING['E'], seed_for(sid, 'corpse'), scale=k, anchor=anchor), 'RGBA').save(p)
    files['corpse'] = p
    p = out / f'{sid}_skeleton.png'
    Image.fromarray(draw_view(skel, VIEW_HEADING['E'], seed_for(sid, 'skeleton'), noise=0.06, scale=k, anchor=anchor), 'RGBA').save(p)
    files['skeleton'] = p
    p = out / f'{sid}_avatar.png'
    Image.fromarray(draw_avatar(alive, sid), 'RGBA').save(p)
    files['avatar'] = p
    return files, anchor


def contact_sheet(ids, path, scale=2, bg=(104, 116, 96, 255)):
    cols = ['S', 'N', 'E', 'W', 'corpse', 'skeleton', 'avatar']
    cell = CANVAS * scale
    sheet = Image.new('RGBA', (cell * len(cols), cell * len(ids)), bg)
    for r, sid in enumerate(ids):
        for c, k in enumerate(cols):
            name = f'{sid}_{k}.png'
            im = Image.open(OUT / name).convert('RGBA')
            if k == 'avatar':
                im = im.resize((AVATAR * scale * 2, AVATAR * scale * 2), Image.NEAREST)
                sheet.alpha_composite(im, (c * cell + (cell - im.width) // 2, r * cell + (cell - im.height) // 2))
            else:
                im = im.resize((cell, cell), Image.NEAREST)
                sheet.alpha_composite(im, (c * cell, r * cell))
    d = ImageDraw.Draw(sheet)
    for c in range(1, len(cols)):
        d.line([(c * cell, 0), (c * cell, sheet.height)], fill=(70, 80, 66, 255))
    for r in range(1, len(ids)):
        d.line([(0, r * cell), (sheet.width, r * cell)], fill=(70, 80, 66, 255))
    sheet.save(path)


# ================================================================ ambient creatures (stretch goal)
# Small scenery critters, drawn like assets/ecology/beetle_0.png: head toward
# the top of the image, centred on a small square canvas, same palette rules.
# The 3D ones use the same renderer with a flatter (more overhead) camera.
AMB_PA, AMB_PB = 0.94, 0.30
RAMPS.update({
    'millipede': [0, 17, 18, 8, 9],
    'millipede_leg': [7, 8, 9, 10],
})


def amb_view(m, name, frame, size, scale=1.0, zref=3.0, noise=0.08, edge=1.2):
    return draw_view(m, VIEW_HEADING['N'], seed_for(name, f'frame{frame}'), size=size, anchor=(size // 2, size // 2),
                     scale=scale, pa=AMB_PA, pb=AMB_PB, noise=noise, edge=edge, shade_kw=dict(zref=zref))


def amb_feet(m, foot, side, direction, mat, r=0.45, n=3, length=1.6):
    """Little splayed toes at a foot point (direction: unit xy vector)."""
    fx, fy, fz = foot
    dx, dy = direction
    for k in range(n):
        a = (k - (n - 1) / 2) * 0.55
        c, s = math.cos(a), math.sin(a)
        tx, ty = dx * c - dy * s * side, dx * s * side + dy * c
        m.limb([(fx, fy, fz), (fx + tx * length, fy + ty * length, fz - 0.1)], [r, r * 0.7], mat)


def amb_frog(frame):
    """Frog: crouched (0) and mid-hop with stretched legs (1)."""
    m = Species('alive')
    hop = frame == 1
    dz = 0.8 if hop else 0.0
    skin = body_paint(spots='olive_dark', belly='sandbelly', belly_level=-0.55)
    m.ell((-1.0, 0, 2.0 + dz), (5.2, 4.5, 2.3), mat='lightgreen', paint=skin)
    m.ell((3.6, 0, 2.3 + dz), (2.8, 3.9, 1.8), mat='lightgreen', tag='head')
    for side in (1, -1):
        m.ell((4.3, side * 2.6, 3.5 + dz), (1.2, 1.1, 1.0), mat='lightgreen', tag='head')
        m.eye((4.6, side * 2.8, 4.5 + dz), 'eye_gold')
        if not hop:  # crouched: hind legs folded beside the body
            m.limb([(-4, side * 3.4, 1.6), (0.0, side * 7.2, 1.2), (-4.0, side * 8.0, 0.8), (-6.4, side * 6.6, 0.6)],
                   [1.7, 1.4, 1.0, 0.8], 'lightgreen')
            amb_feet(m, (-6.4, side * 6.6, 0.6), side, (-0.7, 0.7), 'green', length=1.8)
            m.limb([(2.4, side * 3.4, 1.5), (3.8, side * 5.4, 0.9), (5.6, side * 6.2, 0.6)], [1.0, 0.8, 0.6], 'lightgreen')
            amb_feet(m, (5.6, side * 6.2, 0.6), side, (0.8, 0.6), 'green', length=1.2, r=0.4)
        else:  # mid-hop: hind legs stretched back, front legs reaching forward
            m.limb([(-4, side * 3.2, 1.8 + dz), (-8.4, side * 5.0, 1.4), (-12.2, side * 4.4, 1.0), (-14.8, side * 5.2, 0.8)],
                   [1.7, 1.3, 1.0, 0.8], 'lightgreen')
            amb_feet(m, (-14.8, side * 5.2, 0.8), side, (-0.9, 0.4), 'green', length=1.8)
            m.limb([(2.6, side * 3.0, 1.8 + dz), (5.4, side * 4.4, 1.4), (8.0, side * 4.6, 1.0)], [1.0, 0.8, 0.6], 'lightgreen')
            amb_feet(m, (8.0, side * 4.6, 1.0), side, (1.0, 0.2), 'green', length=1.2, r=0.4)
    return amb_view(m, 'frog', frame, 32)


def amb_mammal(frame):
    """Small shrew-like early mammal: two scurry poses (legs and tail swap)."""
    m = Species('alive')
    sw = 1 if frame == 0 else -1
    m.tube([(-5, 0, 2.3, 3.4, 2.5, 'body'), (-1, 0, 2.7, 4.0, 2.9, 'body'), (3, 0, 2.6, 3.2, 2.5, 'body'),
            (5.6, 0, 2.4, 2.3, 1.9, 'head'), (8.0, 0, 2.0, 1.2, 1.1, 'head'), (9.4, 0, 1.8, 0.5, 0.5, 'head')],
           'tan', paint=body_paint(belly='sandbelly', ridge=0.0))
    m.ell((9.5, 0, 1.8), (0.5, 0.5, 0.45), mat='flesh', tag='head')
    m.tube([(-5.8, 0, 1.7, 0.75, 0.75), (-9.0, sw * 1.4, 1.1, 0.55, 0.55), (-12.5, sw * 0.4, 0.8, 0.45, 0.45),
            (-15.5, -sw * 1.4, 0.7, 0.35, 0.35)], 'sand_dark', tag='tail')
    for side in (1, -1):
        m.ell((3.9, side * 2.6, 5.0), (0.9, 1.4, 0.7), R=rot_x(side * 0.5), mat='brown_dark', tag='head')
        m.eye((6.3, side * 1.3, 3.5), 'eye')
        st = sw * side
        m.limb([(3.0, side * 2.6, 1.3), (4.0 + st * 1.2, side * 4.6, 0.3)], [0.8, 0.6], 'brown')
        m.limb([(-3.4, side * 3.0, 1.3), (-3.8 - st * 1.2, side * 5.0, 0.3)], [0.9, 0.6], 'brown')
    return amb_view(m, 'small_mammal', frame, 32)


def amb_butterfly(frame):
    """Butterfly from above: wings open (0) and wings raised mid-flap (1)."""
    m = Species('alive')
    lift = 0.12 if frame == 0 else 1.15
    m.tube([(-4.5, 0, 3.0, 0.6, 0.6, 'body'), (-1, 0, 3.0, 0.9, 0.9, 'body'), (1.5, 0, 3.1, 0.9, 0.9, 'body'),
            (3.0, 0, 3.2, 0.8, 0.8, 'head')], 'brown_dark')
    vein = Paint(lambda s, t, n: (np.where(np.sin(np.arctan2(np.abs(t), s + 1.0) * 9.0) > 0.86, 0, -1), 0.0), ['brown_dark'])
    spot = Paint(lambda s, t, n: (np.where((np.sin(s * 1.9) * np.sin(np.abs(t) * 1.7) > 0.72) & (np.abs(t) > 6), 0, -1), 0.0),
                 ['paleeye'])
    fore = [(1.5, 0.6), (5.5, 4.0), (6.8, 8.6), (4.4, 11.2), (0.6, 10.2), (-1.0, 5.0), (-0.4, 0.6)]
    hind = [(-0.4, 0.6), (-1.4, 5.0), (-2.8, 8.6), (-6.4, 8.2), (-7.6, 5.0), (-5.6, 1.4)]
    for side in (1, -1):
        e2 = np.array([0.0, side * math.cos(lift), math.sin(lift)])
        nrm = np.cross([1.0, 0, 0], e2)
        nrm = nrm if nrm[2] > 0 else -nrm
        for poly in (fore, hind):
            cx = sum(p[0] for p in poly) / len(poly)
            cy = sum(p[1] for p in poly) / len(poly)
            inner = [(cx + (x - cx) * 0.74, cy + (y - cy) * 0.74) for x, y in poly]
            m.slab((0, 0, 3.0), (1, 0, 0), e2, poly, th=0.5, mat='brown_dark', paint=spot, tag='limb')
            m.slab(np.array([0, 0, 3.0]) + nrm * 0.45, (1, 0, 0), e2, inner, th=0.5, mat='orange_crest', paint=vein, tag='limb')
        m.limb([(3.4, side * 0.4, 3.4), (6.0, side * 1.6, 3.6), (7.6, side * 2.6, 3.7)], [0.25, 0.22, 0.32], 'brown_dark')
    return amb_view(m, 'butterfly', frame, 32, zref=4.0)


def amb_millipede(frame):
    """Giant millipede: body wave and leg phase alternate between the frames."""
    m = Species('alive')
    ph = 0.0 if frame == 0 else math.pi * 0.5
    n, gap = 15, 1.75
    seg = []
    for i in range(n):
        x = 12.5 - i * gap
        y = 1.4 * math.sin(i * 0.5 + ph)
        r = 1.5 if i == 0 else (1.25 if i > n - 3 else 1.8)
        seg.append((x, y, 1.6, r, 1.3, 'head' if i == 0 else 'body'))
    rings = Paint(lambda u, q, n: (np.where(np.mod(u, gap) < 0.42, 0, -1), np.where(np.abs(q[:, 1]) > 0.75, -0.15, 0.0)),
                  ['brown_dark'])
    m.tube(seg, 'millipede', paint=rings, step=0.35)
    for i in range(1, n - 1):
        x, y = seg[i][0], seg[i][1]
        for side in (1, -1):
            sw = 0.6 if (i + frame + (side > 0)) % 2 else -0.6
            m.limb([(x, y + side * 1.4, 1.0), (x + sw, y + side * 3.7, 0.2)], [0.38, 0.3], 'millipede_leg')
    hx, hy = seg[0][0], seg[0][1]
    for side in (1, -1):
        m.limb([(hx + 0.8, hy + side * 0.6, 2.0), (hx + 2.4, hy + side * 1.8, 2.1), (hx + 3.4, hy + side * 3.0, 2.0)],
               [0.25, 0.22, 0.2], 'millipede_leg')
    return amb_view(m, 'millipede', frame, 32, scale=0.95, zref=2.5)


PTERO_SHADOW = [  # right half, image coords relative to the centre, head toward -y
    (0, -19), (0.9, -14), (1.6, -9.5), (2.6, -8.2), (1.6, -6.4), (2.2, -3.5), (7, -5.2), (12.5, -5.6),
    (17, -3.8), (23, 0.6), (17.5, 0.2), (13, 1.2), (8, 3.0), (3.4, 4.4), (3.0, 7.4), (2.0, 9.8), (0.8, 8.2), (0, 9.0)]


def amb_pterosaur_shadow(frame):
    """Flying pterosaur as a flat #151b19 silhouette (ground shadow / distant
    flyer): long beak, narrow wings with a forward wrist and swept tips.
    Frame 1 is the upstroke with the wings pulled in."""
    size, ss = 48, 4
    pts = PTERO_SHADOW
    if frame == 1:
        pts = [(x if x < 3 else 3 + (x - 3) * 0.68, y + (0.12 * (x - 3) if x >= 3 else 0)) for x, y in pts]
    poly = pts + [(-x, y) for x, y in pts[::-1][1:-1]]
    c = size / 2
    im = Image.new('L', (size * ss, size * ss), 0)
    ImageDraw.Draw(im).polygon([((c + x) * ss, (c + y) * ss) for x, y in poly], fill=255)
    cov = np.array(im, dtype=float).reshape(size, ss, size, ss).mean(axis=(1, 3))
    a = cov >= 128
    rgba = np.zeros((size, size, 4), dtype=np.uint8)
    rgba[a, :3] = PALETTE[OUTLINE]
    rgba[a, 3] = 255
    return rgba


def _glow(size, radius, ramp, cutoff=0.0, seed=0):
    """Round glow disc: palette ramp from the rim inward with ordered dither."""
    yy, xx = np.mgrid[0:size, 0:size]
    c = (size - 1) / 2
    d = np.hypot(yy - c, xx - c)
    v = 1.0 - d / radius
    bay = np.tile(BAYER4, (size // 4 + 1, size // 4 + 1))[:size, :size]
    on = v + (bay - 0.5) * 0.35 > cutoff
    k = np.clip(np.floor(np.clip(v, 0, 0.999) * len(ramp) + (bay - 0.5) * 0.8), 0, len(ramp) - 1).astype(int)
    rgba = np.zeros((size, size, 4), dtype=np.uint8)
    rgba[on, :3] = PALETTE[np.array(ramp)[k[on]]]
    rgba[on, 3] = 255
    return rgba


def amb_firefly_glow(frame):
    """Light halo to lay over assets/ecology/firefly_*: dim (0) and bright (1)."""
    return _glow(16, 4.4 if frame == 0 else 6.6, [5, 6, 29, 28], cutoff=0.04)


EMBER_MAPS = (
    ['............',
     '............',
     '............',
     '.....d......',
     '....dOod....',
     '....oYWo....',
     '....dOYo....',
     '.....dod....',
     '......d.....',
     '............',
     '............',
     '............'],
    ['............',
     '............',
     '............',
     '......d.....',
     '.....dod....',
     '....drOod...',
     '....dOYOd...',
     '.....doOd...',
     '......dd....',
     '............',
     '............',
     '............'],
)
EMBER_KEY = {'d': 17, 'r': 18, 'o': 19, 'O': 20, 'Y': 29, 'W': 12}


def amb_ash_ember(frame):
    """Floating ash ember (volcano levels): two flicker frames, hand-placed pixels."""
    rows = EMBER_MAPS[frame]
    rgba = np.zeros((len(rows), len(rows[0]), 4), dtype=np.uint8)
    for r, line in enumerate(rows):
        for c, ch in enumerate(line):
            if ch in EMBER_KEY:
                rgba[r, c, :3] = PALETTE[EMBER_KEY[ch]]
                rgba[r, c, 3] = 255
    return rgba


AMBIENT_SPECS = {  # name: (drawer, frames, suggested fps, note)
    'butterfly': (amb_butterfly, 2, 10, 'wings open / wings raised'),
    'frog': (amb_frog, 2, 6, 'crouched / mid-hop'),
    'small_mammal': (amb_mammal, 2, 10, 'shrew-like early mammal, scurry cycle'),
    'firefly_glow': (amb_firefly_glow, 2, 3, 'glow halo to lay over assets/ecology/firefly_*, dim / bright'),
    'pterosaur_shadow': (amb_pterosaur_shadow, 2, 4, 'flat #151b19 silhouette of a flying pterosaur, glide / upstroke; '
                                                     'draw with reduced opacity as a ground shadow'),
    'millipede': (amb_millipede, 2, 8, 'giant millipede, body wave and leg phase alternate'),
    'ash_ember': (amb_ash_ember, 2, 8, 'floating ember for lava/volcano levels, flicker'),
}


def recentre(frames, pad=1):
    """Shift all frames by one common offset so the union bbox is centred."""
    union = None
    for im in frames:
        bb = Image.fromarray(im).getbbox()
        union = bb if union is None else (min(union[0], bb[0]), min(union[1], bb[1]), max(union[2], bb[2]), max(union[3], bb[3]))
    h, w = frames[0].shape[:2]
    dx = (w - union[2] - union[0]) // 2
    dy = (h - union[3] - union[1]) // 2
    assert union[2] - union[0] + 2 * pad <= w and union[3] - union[1] + 2 * pad <= h, 'ambient sprite too big for canvas'
    return [np.roll(np.roll(im, dy, axis=0), dx, axis=1) for im in frames]


def export_ambient():
    AMBIENT.mkdir(parents=True, exist_ok=True)
    out = {}
    for name, (fn, frames, fps, note) in AMBIENT_SPECS.items():
        imgs = recentre([fn(f) for f in range(frames)])
        files = []
        for f, im in enumerate(imgs):
            p = AMBIENT / f'{name}_{f}.png'
            Image.fromarray(im, 'RGBA').save(p)
            files.append(rel(p))
        h, w = imgs[0].shape[:2]
        out[name] = {
            'files': files,
            'size': [w, h],
            'frames': frames,
            'suggested_fps': fps,
            'facing': 'head toward the top of the image, like assets/ecology/beetle_0.png',
            'note': note,
            'status': STATUS,
            'alpha_bbox': [bbox(GAME / f) for f in files],
            'sha256': [hashlib.sha256((GAME / f).read_bytes()).hexdigest() for f in files],
        }
        print('drew ambient', name)
    return out


REFERENCE = [  # existing species shown for scale (path, visual scale used in game)
    ('tyrannosaurus', 'assets/enemy_full/tyrannosaurus_idle_E_000.png', 2),
    ('triceratops', 'assets/enemy_full/triceratops_idle_E_000.png', 1),
    ('parasaurolophus', 'assets/enemy_full/parasaurolophus_idle_E_000.png', 1),
    ('carnotaurus', 'assets/player_full/carnotaurus_idle_E_000.png', 1),
    ('utahraptor', 'assets/player_full/utahraptor_idle_E_000.png', 1),
    ('velociraptor', 'assets/player_full/velociraptor_idle_E_000.png', 1),
    ('compy', 'assets/player_full/compy_idle_E_000.png', 1),
]
STATUS = 'placeholder static drawing; Codex to animate'


def rel(p):
    return Path(p).relative_to(GAME).as_posix()


def lineup(path, bg=(104, 116, 96, 255)):
    """PNG: E views at in-game scale (native x visual scale) next to existing species."""
    items = [(n, GAME / f, vs) for n, f, vs in REFERENCE]
    items += [(sid, OUT / f'{sid}_E.png', SPECIES[sid]['visual_scale']) for sid in SPECIES]
    crops = []
    for name, f, vs in items:
        im = Image.open(f).convert('RGBA')
        im = im.crop(im.getbbox())
        im = im.resize((im.width * vs, im.height * vs), Image.NEAREST)
        crops.append((name, im))
    W = 1500
    rows, row, x = [], [], 0
    for name, im in crops:
        cw = max(im.width, 6 * len(name) + 8)  # keep labels apart
        if x + cw > W and row:
            rows.append(row)
            row, x = [], 0
        row.append((name, im))
        x += cw + 16
    rows.append(row)
    H = sum(max(i.height for _, i in r) + 28 for r in rows) + 16
    sheet = Image.new('RGBA', (W, H), bg)
    d = ImageDraw.Draw(sheet)
    y = 8
    for r in rows:
        h = max(i.height for _, i in r)
        x = 8
        for name, im in r:
            sheet.alpha_composite(im, (x, y + h - im.height))
            d.text((x, y + h + 4), name, fill=(232, 236, 225, 255))
            x += max(im.width, 6 * len(name) + 8) + 16
        y += h + 28
    sheet.save(path)


# ---------------------------------------------------------------- manifest + review page
def bbox(p):
    with Image.open(p) as im:
        return list(im.getbbox())


def write_manifest(results, ambient):
    species = {}
    for sid, (files, corpse_anchor) in results.items():
        spec = SPECIES[sid]
        species[sid] = {
            'role': spec['role'],
            'look': spec['look'],
            'status': STATUS,
            'asset_status': 'prototype_static',
            'production_approved': False,
            'animation_ready': False,
            'runtime_enabled': False,
            'suggested_visual_scale': spec['visual_scale'],
            'files': {k: rel(v) for k, v in files.items()},
            'size': {k: ([AVATAR, AVATAR] if k == 'avatar' else [CANVAS, CANVAS]) for k in files},
            'origin': {k: ([32, 32] if k == 'avatar' else [72, 72]) for k in files},
            'body_anchor': [72, 72],
            'corpse_model_anchor': list(corpse_anchor),
            'alpha_bbox': {k: bbox(v) for k, v in files.items()},
            'derived': {'W': 'exact horizontal mirror of E'},
            'sha256': {k: hashlib.sha256(Path(v).read_bytes()).hexdigest() for k, v in files.items()},
        }
    data = {
        'generator': 'tools/draw_new_species.py',
        'validator': 'tools/validate_new_species.py',
        'review': 'new_species_review.html',
        'handoff': 'NEW_SPECIES_ART.md',
        'status': STATUS,
        'palette': 'palette.json (Primal Earth 32), alpha 0/255, transparent RGB 0',
        'method': ('Deterministic procedural drawing: each animal is one small 3D model of ellipsoids and flat '
                   'polygon slabs, ray-cast from a fixed overhead camera (image_up = 0.82*y + 0.36*z) with a fixed '
                   'light, 3x supersampled, quantised to palette ramps with ordered dithering, 1 px #151b19 outline. '
                   'S/E/N are separate renders of the same model (consistent light); W is the exact mirror of E. '
                   'Corpse = same model in an opisthotonic pose rolled onto its side with decayed colours; '
                   'skeleton = vertebrae, ribs, skull and limb bones of the same pose.'),
        'conventions': {
            'live': '144x144 RGBA, origin/body anchor (hip) 72,72, directions S N E W like assets/enemy_full and assets/player_full',
            'corpse_skeleton': ('144x144 RGBA, E orientation, like assets/corpses/<species>_decayed_E_0.png and '
                                '<species>_skeleton_E_0.png (origin 72,72); carcass bbox centred near 74,78 like the existing props; '
                                'skeleton shares the corpse registration'),
            'avatar': '64x64 RGBA, origin 32,32, head only, like assets/avatars/<species>_idle_000.png',
        },
        'not_wired': 'No game code, project.json or runtime manifest references these files.',
        'species': species,
        'ambient': ambient,
    }
    MANIFEST.write_text(json.dumps(data, indent=2) + '\n')


def write_review(ambient):
    def img(src, w, cls=''):
        return f'<img src="{src}" width="{w}" alt="" loading="lazy"{cls}>'
    parts = ['<!doctype html><html lang="da"><meta charset="utf-8">',
             '<meta name="viewport" content="width=device-width,initial-scale=1">',
             '<title>Nye arter — pladsholdertegninger</title>',
             '<style>body{background:#151b19;color:#edd0a0;font:15px system-ui;margin:24px;max-width:1500px}'
             'a{color:#a2d4c1}img{image-rendering:pixelated;image-rendering:crisp-edges;vertical-align:bottom}'
             '.row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:8px 0 20px}'
             'figure{margin:0;padding:6px;background:#28372a}figure.ref{background:#3b4144}'
             'figcaption{font-size:12px;color:#bab8a2;margin-top:4px}'
             'body.light figure{background:#bab8a2}body.light figure.ref{background:#929387}'
             'h2{margin-top:32px;border-bottom:1px solid #3f5030}button{padding:8px 12px;background:#28372a;'
             'color:#edd0a0;border:1px solid #799447}</style>',
             '<h1>Nye arter — statiske pladsholdertegninger</h1>',
             '<p>16 nye arter tegnet procedurelt (tools/draw_new_species.py) i Primal Earth 32-paletten. '
             'Det er <b>statiske pladsholdere</b>: én pose pr. retning, ingen animation. Codex skal lave de '
             'rigtige animationsark (se NEW_SPECIES_ART.md). Intet her er koblet ind i spillet.</p>',
             '<p><button onclick="document.body.classList.toggle(\'light\')">Lys / mørk baggrund</button> '
             '<a href="new_species_manifest.json">Manifest</a> · <a href="NEW_SPECIES_ART.md">Overdragelse til Codex</a></p>',
             '<h2>Spilskala (E, native × foreslået visualScale, vist 2×)</h2>',
             '<p>Grå felter er eksisterende arter til sammenligning. T. rex og Spinosaurus vises med visualScale 2.</p>',
             '<div class="row">']
    for name, f, vs in REFERENCE:
        parts.append(f'<figure class="ref">{img(f, CANVAS * vs * 2)}<figcaption>{name} (eksisterende, ×{vs})</figcaption></figure>')
    for sid, spec in SPECIES.items():
        parts.append(f'<figure>{img(f"assets/new_species/{sid}_E.png", CANVAS * spec["visual_scale"] * 2)}'
                     f'<figcaption>{sid} (×{spec["visual_scale"]})</figcaption></figure>')
    parts.append('</div>')
    parts.append('<h2>Alle tegninger pr. art (2×)</h2>')
    for sid, spec in SPECIES.items():
        role = 'spilbar' if spec['role'] == 'playable' else 'vild'
        parts.append(f'<h3>{sid} <small>({role}) — {spec["look"]}</small></h3><div class="row">')
        for k in ('S', 'N', 'E', 'W', 'corpse', 'skeleton'):
            parts.append(f'<figure>{img(f"assets/new_species/{sid}_{k}.png", CANVAS * 2)}<figcaption>{k}</figcaption></figure>')
        parts.append(f'<figure>{img(f"assets/new_species/{sid}_avatar.png", AVATAR * 2)}<figcaption>avatar</figcaption></figure>')
        ref = {'spinosaurus': 'tyrannosaurus', 'allosaurus': 'carnotaurus', 'stegosaurus': 'triceratops',
               'pachyrhinosaurus': 'triceratops', 'therizinosaurus': 'tyrannosaurus', 'iguanodon': 'parasaurolophus',
               'edmontosaurus': 'parasaurolophus', 'microraptor': 'velociraptor'}.get(sid)
        if ref:
            src = dict((n, f) for n, f, _ in REFERENCE)[ref]
            parts.append(f'<figure class="ref">{img(src, CANVAS * 2)}<figcaption>{ref} E (eksisterende)</figcaption></figure>')
        parts.append('</div>')
    if ambient:
        parts.append('<h2>Små omgivelsesdyr (4×)</h2><div class="row">')
        for name, e in ambient.items():
            for f in e['files']:
                parts.append(f'<figure>{img(f, e["size"][0] * 4)}<figcaption>{Path(f).name}</figcaption></figure>')
        parts.append('</div>')
    parts.append('<p>Status: prototype_static, production_approved=false, animation_ready=false, runtime_enabled=false.</p>')
    (GAME / 'new_species_review.html').write_text('\n'.join(parts) + '\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='', help='comma separated species ids (skips manifest/review)')
    ap.add_argument('--sheet', default='', help='write a contact sheet PNG (review aid, not committed)')
    ap.add_argument('--lineup', default='', help='write an in-game scale lineup PNG (review aid, not committed)')
    a = ap.parse_args()
    ids = [x for x in a.only.split(',') if x] or list(SPECIES)
    results = {}
    for sid in ids:
        results[sid] = export_species(sid)
        print('drew', sid)
    if not a.only:
        ambient = export_ambient()
        write_manifest(results, ambient)
        write_review(ambient)
        print('wrote', rel(MANIFEST), 'and new_species_review.html')
    if a.sheet:
        contact_sheet(ids, a.sheet)
    if a.lineup:
        lineup(a.lineup)


if __name__ == '__main__':
    main()
