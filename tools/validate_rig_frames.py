#!/usr/bin/env python3
"""Validate a species' animation frames, against the rig guide or on their own.

Built for frames that are painted or generated from the guides of
tools/rig_animate.py.  It catches the usual failures of generated animation:

  * legs that do not move (copied from one frame) or move out of phase,
  * a different camera angle, scale or anchor in one direction,
  * frozen frames, a jump at the loop seam,
  * technical faults (size, RGBA, palette, binary alpha, margin).

Frames are named <id>_<state>_<S|N|E|W>_<NNN>.png, as in assets/player_full
and assets/enemy_full.

  python tools/validate_rig_frames.py --species iguanodon --frames DIR --rig PRIMAL_RUN_Rig/iguanodon
  python tools/validate_rig_frames.py --species iguanodon --frames DIR          # without a rig

With --rig, every frame is compared with the rig frame of the same name
(silhouette, bounding box, centroid, leg band, leg phase, leg motion).  Without
--rig only the technical, motion and cross-direction checks run; the static
drawing in assets/new_species is then the reference for proportions when it
exists.  --sheet writes an overlay (rig outline red, leg band cyan, failing
frames framed red).  Exit code 1 when any error is found.  The check is
technical: it does not approve the art.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
CANVAS = 144
DIRECTIONS = ('S', 'N', 'E', 'W')
STATES = {'idle': 4, 'walk': 6, 'run': 6, 'attack': 6, 'hurt': 2, 'death': 6}
LOCOMOTION = ('walk', 'run')
WINGED = ('pteranodon', 'microraptor')  # as APPENDAGES 'flap' in tools/rig_animate.py
LIMITS = {
    'margin': 2,             # px of transparent border
    'silhouette': 0.85,      # min tolerant precision/recall against the rig silhouette (2 px slack)
    'bbox_centre': 3.0,      # px
    'bbox_size': 0.10,       # relative width/height difference
    'centroid': 3.0,         # px against the rig centroid
    'leg_band': 0.70,        # min tolerant IoU inside the leg band (1 px slack)
    'leg_phase': 0.03,       # own rig frame must be within this of the best matching rig frame
    'leg_motion': 0.50,      # candidate leg-band motion / rig leg-band motion
    'frozen': 0.004,         # min share of pixels that change between consecutive frames (after bob)
    'outline_motion': 0.07,  # min mean outline change per walk/run frame (rig 0.14-0.18, game sprites 0.14-0.35)
    'loop_seam': 3.0,        # last->first change / median consecutive change
    'mirror': 0.80,          # min tolerant IoU of W against mirrored E
    'pair_size': 0.10,       # N vs S and E vs W bbox size difference
    'small_px': 3,           # size differences up to this many px always pass (tiny animals)
    'aspect': 0.12,          # E width / S height against the reference
    'drift': 4.0,            # px centroid spread inside one state (no rig)
}
NAME = re.compile(r'^(?P<sid>[a-z_]+?)_(?P<state>idle|walk|run|attack|hurt|death)_(?P<dir>[SNEW])_(?P<n>\d{3})\.png$')


def palette():
    cols = json.loads((GAME / 'palette.json').read_text())['colors']
    return {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in cols}


def load(path):
    im = Image.open(path)
    return im.mode, np.array(im.convert('RGBA'))


def mask(a):
    return a[..., 3] > 0


def dilate(m, r):
    if r <= 0:
        return m
    out = m.copy()
    h, w = m.shape
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy > r * r:
                continue
            sh = np.zeros_like(m)
            sh[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = m[max(-dy, 0):h + min(-dy, 0), max(-dx, 0):w + min(-dx, 0)]
            out |= sh
    return out


def tolerant(c, g, r):
    """(precision, recall) of mask c against g with r px slack; 1.0 for two empty masks."""
    nc, ng = int(c.sum()), int(g.sum())
    if nc == 0 and ng == 0:
        return 1.0, 1.0
    p = float((c & dilate(g, r)).sum()) / nc if nc else 0.0
    q = float((g & dilate(c, r)).sum()) / ng if ng else 0.0
    return p, q


def bbox(m):
    ys, xs = np.nonzero(m)
    if not len(xs):
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def centroid(m):
    ys, xs = np.nonzero(m)
    return (float(xs.mean()), float(ys.mean())) if len(xs) else (math.nan, math.nan)


def core(m):
    """Centre of the thick part of the silhouette (the torso): pixels at least half as deep inside
    the shape as the deepest one.  Unlike the centroid it does not move when the tail or a leg swings."""
    depth, cur = np.zeros(m.shape, dtype=int), m.copy()
    while cur.any():
        depth += cur
        cur = cur & np.roll(cur, 1, 0) & np.roll(cur, -1, 0) & np.roll(cur, 1, 1) & np.roll(cur, -1, 1)
    return centroid(depth >= max(1, depth.max() / 2))


def band(joints, chains, r=2.5):
    """Pixels within r of the lower leg segments (knee to foot) of the given chains."""
    yy, xx = np.mgrid[0:CANVAS, 0:CANVAS]
    out = np.zeros((CANVAS, CANVAS), dtype=bool)
    for name in chains:
        pts = joints.get(name) or []
        pts = pts[1:] if len(pts) > 2 else pts
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            dx, dy = x1 - x0, y1 - y0
            L2 = dx * dx + dy * dy or 1e-9
            t = np.clip(((xx + 0.5 - x0) * dx + (yy + 0.5 - y0) * dy) / L2, 0, 1)
            d2 = (xx + 0.5 - x0 - t * dx) ** 2 + (yy + 0.5 - y0 - t * dy) ** 2
            out |= d2 <= r * r
    return out


def change(a, b, shift=2, outline=False):
    """Share of pixels that differ between two frames after the best small shift (removes body bob).
    outline=True compares only the silhouettes, so repainted texture does not count as motion."""
    ma, mb = mask(a), mask(b)
    area = max(1.0, (ma.sum() + mb.sum()) / 2)
    best = math.inf
    for dy in range(-shift, shift + 1):
        for dx in range(-shift, shift + 1):
            bs = np.roll(np.roll(b, dy, axis=0), dx, axis=1)
            mbs = mask(bs)
            diff = ma != mbs
            if not outline:
                diff |= ma & mbs & np.any(a[..., :3] != bs[..., :3], axis=-1)
            best = min(best, float(diff.sum()) / area)
    return best


class Report:
    def __init__(self):
        self.errors, self.warnings, self.frames = [], [], {}

    def err(self, where, msg):
        self.errors.append(f'{where}: {msg}')

    def warn(self, where, msg):
        self.warnings.append(f'{where}: {msg}')

    def metric(self, name, **kw):
        self.frames.setdefault(name, {}).update({k: (round(v, 4) if isinstance(v, float) else v) for k, v in kw.items()})


def check(sid, frames_dir, rig_dir=None, states=None, rep=None, dirs=DIRECTIONS):
    rep = rep or Report()
    frames_dir = Path(frames_dir)
    rig = None
    if rig_dir:
        rig_dir = Path(rig_dir)
        rig = json.loads((rig_dir / f'{sid}_rig.json').read_text())
    states = [s for s in (states or STATES) if not rig or s in rig['states']]
    pal = palette()
    imgs, rigimgs = {}, {}

    # technical -----------------------------------------------------------
    for state in states:
        n = rig['states'][state]['frames'] if rig else STATES[state]
        for d in dirs:
            for f in range(n):
                name = f'{sid}_{state}_{d}_{f:03d}'
                p = frames_dir / f'{name}.png'
                if not p.exists():
                    rep.err(name, 'missing')
                    continue
                mode, a = load(p)
                if a.shape[:2] != (CANVAS, CANVAS):
                    rep.err(name, f'size {a.shape[1]}x{a.shape[0]}, expected {CANVAS}x{CANVAS}')
                    continue
                if mode != 'RGBA':
                    rep.err(name, f'mode {mode}, expected RGBA')
                al = a[..., 3]
                if not np.isin(al, (0, 255)).all():
                    rep.err(name, 'alpha is not binary (0/255)')
                if (a[al == 0][:, :3] != 0).any():
                    rep.err(name, 'transparent pixels must have RGB 0')
                cols = {tuple(c) for c in a[al > 0][:, :3].tolist()}
                extra = cols - pal
                if extra:
                    rep.err(name, f'{len(extra)} colours outside palette.json')
                m = mask(a)
                bb = bbox(m)
                if bb is None:
                    rep.err(name, 'empty frame')
                    continue
                M = LIMITS['margin']
                if bb[0] < M or bb[1] < M or bb[2] > CANVAS - M or bb[3] > CANVAS - M:
                    rep.err(name, f'less than {M} px transparent margin (bbox {bb})')
                imgs[name] = a
                if rig:
                    rigimgs[name] = load(rig_dir / rig['frames'][name]['file'])[1]
        if rig is None:
            extra = sorted(p.name for p in frames_dir.glob(f'{sid}_{state}_*.png')
                           if NAME.match(p.name) and int(NAME.match(p.name)['n']) >= STATES[state])
            for e in extra:
                rep.warn(e, f'more frames than the {STATES[state]} expected for {state}')

    # against the rig -----------------------------------------------------
    if rig:
        legs = [c for c in rig['skeleton']['chains'] if c.split('_')[0] in ('hind', 'fore', 'wing', 'forewing', 'hindwing', 'front')]
        for name, a in imgs.items():
            g = rigimgs[name]
            m, mg = mask(a), mask(g)
            p, q = tolerant(m, mg, 2)
            bc, bg = bbox(m), bbox(mg)
            cc, cg = centroid(m), centroid(mg)
            dc = math.hypot((bc[0] + bc[2] - bg[0] - bg[2]) / 2, (bc[1] + bc[3] - bg[1] - bg[3]) / 2)
            dw = abs((bc[2] - bc[0]) - (bg[2] - bg[0])) / max(1, bg[2] - bg[0])
            dh = abs((bc[3] - bc[1]) - (bg[3] - bg[1])) / max(1, bg[3] - bg[1])
            dcen = math.hypot(cc[0] - cg[0], cc[1] - cg[1])
            rep.metric(name, silhouette_precision=p, silhouette_recall=q, bbox_centre_px=dc, bbox_w=dw, bbox_h=dh, centroid_px=dcen)
            if min(p, q) < LIMITS['silhouette']:
                rep.err(name, f'silhouette differs from the rig (precision {p:.2f}, recall {q:.2f}, need {LIMITS["silhouette"]})')
            if dc > LIMITS['bbox_centre']:
                rep.err(name, f'bbox centre {dc:.1f} px from the rig (camera or anchor moved)')
            big = max(abs((bc[2] - bc[0]) - (bg[2] - bg[0])), abs((bc[3] - bc[1]) - (bg[3] - bg[1])))
            if max(dw, dh) > LIMITS['bbox_size'] and big > LIMITS['small_px']:
                rep.err(name, f'bbox size differs from the rig by {100 * max(dw, dh):.0f}% (scale or angle changed)')
            if '_death_' not in name and dcen > LIMITS['centroid']:
                rep.err(name, f'centroid {dcen:.1f} px from the rig (anchor 72,72 moved)')
            joints = rig['frames'][name].get('joints')
            if joints and legs:
                b = band(joints, legs)
                if b.any():
                    lp, lq = tolerant(m & b, mg & b, 1)
                    rep.metric(name, leg_band=min(lp, lq))
                    if min(lp, lq) < LIMITS['leg_band']:
                        rep.err(name, f'legs do not follow the rig pose (leg band {min(lp, lq):.2f}, need {LIMITS["leg_band"]})')
        # leg phase and leg motion per locomotion loop
        for state in [s for s in states if s in LOCOMOTION]:
            n = rig['states'][state]['frames']
            for d in dirs:
                names = [f'{sid}_{state}_{d}_{f:03d}' for f in range(n)]
                if not all(x in imgs for x in names):
                    continue
                bands = [band(rig['frames'][x].get('joints', {}), legs) for x in names]
                union = np.logical_or.reduce(bands)
                if not union.any():
                    continue
                for i, x in enumerate(names):
                    scores = []
                    for j, y in enumerate(names):
                        lp, lq = tolerant(mask(imgs[x]) & union, mask(rigimgs[y]) & union, 1)
                        scores.append(min(lp, lq))
                    best = int(np.argmax(scores))
                    rep.metric(x, leg_phase_best=best, leg_phase_own=scores[i], leg_phase_top=scores[best])
                    if scores[best] - scores[i] > LIMITS['leg_phase']:
                        rep.err(x, f'legs match rig frame {best:03d} better than their own frame (static or out-of-phase legs)')
                cm = [float((mask(imgs[names[i]]) ^ mask(imgs[names[(i + 1) % n]]))[union].sum()) for i in range(n)]
                gm = [float((mask(rigimgs[names[i]]) ^ mask(rigimgs[names[(i + 1) % n]]))[union].sum()) for i in range(n)]
                ratio = sum(cm) / max(1.0, sum(gm))
                rep.metric(f'{sid}_{state}_{d}', leg_motion_ratio=ratio)
                if ratio < LIMITS['leg_motion']:
                    rep.err(f'{sid}_{state}_{d}', f'legs move {100 * ratio:.0f}% as much as in the rig (need {100 * LIMITS["leg_motion"]:.0f}%)')

    # motion and loop seam (with or without rig) -----------------------------
    for state in states:
        n = rig['states'][state]['frames'] if rig else STATES[state]
        for d in dirs:
            names = [f'{sid}_{state}_{d}_{f:03d}' for f in range(n)]
            if not all(x in imgs for x in names) or n < 2:
                continue
            pairs = [change(imgs[names[i]], imgs[names[i + 1]]) for i in range(n - 1)]
            for i, c in enumerate(pairs):
                rep.metric(names[i + 1], change_from_previous=c)
                if state in LOCOMOTION + ('attack', 'death') and c < LIMITS['frozen']:
                    rep.err(names[i + 1], f'frame is (nearly) identical to the previous one ({100 * c:.2f}% changed)')
            if state in LOCOMOTION:
                om = float(np.mean([change(imgs[names[i]], imgs[names[(i + 1) % n]], outline=True) for i in range(n)]))
                rep.metric(f'{sid}_{state}_{d}', outline_motion=om)
                if om < LIMITS['outline_motion']:
                    rep.err(f'{sid}_{state}_{d}', f'outline barely moves ({100 * om:.1f}% per frame, need '
                                                   f'{100 * LIMITS["outline_motion"]:.0f}%): legs and tail look frozen')
            if state in LOCOMOTION or state == 'idle':
                seam = change(imgs[names[-1]], imgs[names[0]])
                med = float(np.median(pairs)) or 1e-6
                rep.metric(f'{sid}_{state}_{d}', loop_seam=seam / med)
                if state in LOCOMOTION and seam / med > LIMITS['loop_seam']:
                    rep.err(f'{sid}_{state}_{d}', f'loop jumps from the last to the first frame ({seam / med:.1f}x the usual change)')
            # attack lunges and hurt recoils may move; beating wings outweigh a flyer's thin body
            if rig is None and state in ('idle', 'walk', 'run') and sid not in WINGED:
                cs = np.array([core(mask(imgs[x])) for x in names])
                spread = float(np.max(np.hypot(*(cs - np.median(cs, axis=0)).T)))
                rep.metric(f'{sid}_{state}_{d}', centroid_spread=spread)
                if spread > LIMITS['drift']:
                    rep.err(f'{sid}_{state}_{d}', f'body drifts {spread:.1f} px inside the state (fixed anchor)')

    # same camera in every direction ------------------------------------------
    ref = None
    if not rig:
        e, s = GAME / 'assets' / 'new_species' / f'{sid}_E.png', GAME / 'assets' / 'new_species' / f'{sid}_S.png'
        if e.exists() and s.exists():
            be, bs = bbox(mask(load(e)[1])), bbox(mask(load(s)[1]))
            ref = (be[2] - be[0]) / max(1, bs[3] - bs[1])
    # With a rig every frame is compared with the rig's own direction ratios.  Without one, the legs
    # of a true W render are in a different near/far phase than mirrored E, so whole states are
    # compared (union of all frames) and only for the loops, where N=S and W=E in size.
    units = []
    for state in states:
        if state == 'death':
            continue
        n = rig['states'][state]['frames'] if rig else STATES[state]
        if rig:
            for f in range(n):
                nm = {d: f'{sid}_{state}_{d}_{f:03d}' for d in DIRECTIONS}
                if all(x in imgs for x in nm.values()):
                    units.append((f'{sid}_{state}_{f:03d}', state, {d: mask(imgs[x]) for d, x in nm.items()},
                                  {d: mask(rigimgs[x]) for d, x in nm.items()}))
        else:
            nm = {d: [f'{sid}_{state}_{d}_{f:03d}' for f in range(n)] for d in DIRECTIONS}
            if all(x in imgs for v in nm.values() for x in v):
                units.append((f'{sid}_{state}', state, {d: np.logical_or.reduce([mask(imgs[x]) for x in v]) for d, v in nm.items()}, None))
    for where, state, mk, gk in units:
        bb = {d: bbox(m) for d, m in mk.items()}
        p, q = tolerant(mk['W'], mk['E'][:, ::-1], 2)
        rep.metric(where, w_vs_mirrored_e=min(p, q))
        if min(p, q) < LIMITS['mirror']:
            rep.err(where, f'W is not the same pose and angle as E mirrored ({min(p, q):.2f}, need {LIMITS["mirror"]})')
        for a, b in (('N', 'S'), ('W', 'E')):
            # head-down or rearing poses make N and S differ a little; the rig says by how much
            if gk:
                ga, gb = bbox(gk[a]), bbox(gk[b])
                tw, th = (ga[2] - ga[0]) / max(1, gb[2] - gb[0]), (ga[3] - ga[1]) / max(1, gb[3] - gb[1])
            elif state in ('idle', 'walk', 'run'):
                tw = th = 1.0
            else:
                continue
            # relative limit, but a few pixels are always allowed for small animals
            off = [abs((bb[a][2] - bb[a][0]) - tw * (bb[b][2] - bb[b][0])), abs((bb[a][3] - bb[a][1]) - th * (bb[b][3] - bb[b][1]))]
            rel = [off[0] / max(1, tw * (bb[b][2] - bb[b][0])), off[1] / max(1, th * (bb[b][3] - bb[b][1]))]
            if any(o > LIMITS['small_px'] and r > LIMITS['pair_size'] for o, r in zip(off, rel)):
                rep.err(where, f'{a} and {b} differ {100 * max(rel):.0f}% more in size than they should (same camera expected)')
        if state in ('idle', 'walk'):
            aspect = (bb['E'][2] - bb['E'][0]) / max(1, bb['S'][3] - bb['S'][1])
            if gk:
                ge, gs = bbox(gk['E']), bbox(gk['S'])
                target = (ge[2] - ge[0]) / max(1, gs[3] - gs[1])
            else:
                target = ref
            if target:
                rep.metric(where, e_width_over_s_height=aspect, reference=target)
                if abs(aspect / target - 1) > LIMITS['aspect']:
                    rep.err(where, f'E length / S length is {aspect:.2f}, reference {target:.2f} (different camera tilt between directions)')
    return rep, imgs, rigimgs, rig


def overlay(path, sid, imgs, rigimgs, rig, rep, scale=2):
    names = sorted(imgs)
    rows = sorted({n.rsplit('_', 1)[0] for n in names}, key=lambda r: (list(STATES).index(r.split('_')[-2]), DIRECTIONS.index(r[-1])))
    cols = max(int(n.rsplit('_', 1)[1]) for n in names) + 1
    cell = CANVAS * scale
    im = Image.new('RGBA', (cols * cell, len(rows) * cell), (104, 116, 96, 255))
    draw = ImageDraw.Draw(im)
    bad = {e.split(':')[0] for e in rep.errors}
    legs = [c for c in (rig or {}).get('skeleton', {}).get('chains', [])]
    for r, row in enumerate(rows):
        for f in range(cols):
            name = f'{row}_{f:03d}'
            if name not in imgs:
                continue
            x0, y0 = f * cell, r * cell
            im.alpha_composite(Image.fromarray(imgs[name]).resize((cell, cell), Image.NEAREST), (x0, y0))
            if rig and name in rigimgs:
                g = mask(rigimgs[name])
                edge = g & ~np.logical_and.reduce([np.roll(g, s, a) for s in (1, -1) for a in (0, 1)])
                b = band(rig['frames'][name].get('joints', {}), legs)
                bedge = b & ~np.logical_and.reduce([np.roll(b, s, a) for s in (1, -1) for a in (0, 1)])
                for ys, xs, col in ((*np.nonzero(edge), (230, 60, 50, 255)), (*np.nonzero(bedge), (80, 220, 230, 255))):
                    for y, x in zip(ys, xs):
                        draw.rectangle((x0 + x * scale, y0 + y * scale, x0 + x * scale + scale - 1, y0 + y * scale + scale - 1), fill=col)
            if name in bad or f'{row}' in bad:
                draw.rectangle((x0, y0, x0 + cell - 1, y0 + cell - 1), outline=(230, 40, 40, 255), width=3)
        draw.text((4, r * cell + 4), row.replace(sid + '_', ''), fill=(237, 208, 160, 255))
    im.save(path)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--species', required=True)
    ap.add_argument('--frames', required=True, help='folder with <id>_<state>_<dir>_<NNN>.png')
    ap.add_argument('--rig', default='', help='rig folder from tools/rig_animate.py (with <id>_rig.json)')
    ap.add_argument('--states', default='', help='comma separated subset, default all')
    ap.add_argument('--directions', default='SNEW', help='subset such as E for a one-direction pilot; '
                    'the cross-direction checks need all four')
    ap.add_argument('--report', default='', help='write metrics, errors and warnings as JSON')
    ap.add_argument('--sheet', default='', help='write an overlay PNG (rig outline red, leg band cyan, errors framed)')
    a = ap.parse_args()
    states = [s for s in a.states.split(',') if s] or None
    dirs = tuple(d for d in DIRECTIONS if d in a.directions.upper())
    rep, imgs, rigimgs, rig = check(a.species, a.frames, a.rig or None, states, dirs=dirs)
    if a.report:
        Path(a.report).write_text(json.dumps({'species': a.species, 'rig': bool(a.rig), 'limits': LIMITS,
                                               'errors': rep.errors, 'warnings': rep.warnings, 'metrics': rep.frames}, indent=1) + '\n')
    if a.sheet and imgs:
        overlay(a.sheet, a.species, imgs, rigimgs, rig, rep)
    for w in rep.warnings:
        print('WARN', w)
    for e in rep.errors:
        print('FAIL', e)
    mode = 'against the rig' if rig else 'without a rig (technical, motion and direction checks only)'
    print(f'{"FAIL" if rep.errors else "PASS"}: {a.species}, {len(imgs)} frames checked {mode}; '
          f'{len(rep.errors)} errors, {len(rep.warnings)} warnings. Technical check only; it does not approve the art.')
    sys.exit(1 if rep.errors else 0)


if __name__ == '__main__':
    main()
