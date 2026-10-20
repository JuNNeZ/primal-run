#!/usr/bin/env python3
"""Cutout rig: animate a species drawn as separate parts (tools/CODEX_CUTOUT_BRIEF.md).

The artist draws only the rest pose, one PNG per part and direction plus <id>_parts.json with each part's
pivot and tip.  This tool takes the motion of tools/rig_animate.py (same states, frame counts, gait, IK feet,
tail wave, neck reach, death roll), measures how every bone turns and stretches on screen, and moves the
drawn parts the same way, parent before child, so joints stay closed.  The art decides the shape; the rig
only decides the motion.  Output frames are named like assets/rig_full and stay prototype art until Jonas
approves them.

  python tools/cutout_rig.py --species allosaurus --parts DIR --out OUT [--sheet S.png] [--gif DIR]
  python tools/cutout_rig.py --species allosaurus --template DIR   # parts cut from the 3D model (test/guide)
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import draw_new_species as D  # noqa: E402
import rig_animate as R  # noqa: E402

# part -> (parent, bone as (from, to) key points of the 3D rig).  Spine parts every species has; limb parts
# come from the rig's chains and appendages (skeleton()), so quadrupeds, wings and flippers get their own.
SPINE_PARTS = {'body': (None, ('hip', 'neck0')), 'neck': ('body', ('neck0', 'head0')), 'head': ('neck', ('head0', 'snout')),
               'jaw': ('head', ('head0', 'snout')), 'tail1': ('body', ('tail0', 'tail1')),
               'tail2': ('tail1', ('tail1', 'tail2')), 'tail3': ('tail2', ('tail2', 'tail3'))}
# limb parts per chain kind as (part, from joint, to joint); the first hangs on the body, each next on the one before
LIMB_PARTS = {'hind': [('thigh', 0, 1), ('shin', 1, 2), ('foot', 2, 3)],  # two-legged hind leg
              'back': [('thigh', 0, 1), ('shin', 1, 2)],  # four-legged hind leg
              'fore': [('upperarm', 0, 1), ('forearm', 1, 2)],  # four-legged front leg
              'arm': [('arm', 0, 2)]}  # small arm held off the ground
# species without a 3D model borrow another's motion; the joint moves are scaled to the drawn leg length
MOTION = {'tyrannosaurus': 'allosaurus'}
STRETCH = (0.6, 1.4)  # on-screen bone length change allowed (foreshortening)
SPINE = {'body', 'neck', 'head', 'jaw', 'tail1', 'tail2', 'tail3'}  # never outlined against each other
SEAM_INK = [int(c[0]) * 65536 + int(c[1]) * 256 + int(c[2]) for c in D.PALETTE[[D.OUTLINE, 1]]]  # #151b19, #28372a
JOINT_R = 5.0  # px around a joint where parent and child melt together without a line
RIM = 2  # px of a drawn part's own edge shading that is dropped where it lies on kin
# predators open their jaw in the bite (per frame, 1 = JAW_DROP of the jaw length straight down) and roar when hurt
BITERS = {'tyrannosaurus', 'allosaurus', 'spinosaurus', 'microraptor'}
JAW_OPEN = {'attack': [0.0, 0.6, 1.0, 0.8, 0.3, 0.0], 'hurt': [0.5, 0.2]}
JAW_DROP = 0.45
MOUTH = (84, 40, 45)  # palette dark red inside the open mouth
MIN_BONE = 2.0  # px: a drawn bone shorter than this only moves, it does not turn


# ---------------------------------------------------------------- key points of the 3D rig
def chain_key(c):
    """Quadrupeds draw both leg pairs with the same helper; the pair behind the hip is the hind ('back') pair."""
    return 'back' if c.kind == 'fore' and c.rest[0][0] < 0 else c.kind


def chain_name(c):
    return f"{chain_key(c)}_{'L' if c.side > 0 else 'R'}"


def skeleton(sid):
    """Parts this species can be drawn in: part -> (parent, bone)."""
    sid = MOTION.get(sid, sid)
    if sid not in D.SPECIES:
        raise SystemExit(f'unknown species {sid}: no 3D model to take the motion from (see MOTION in tools/cutout_rig.py)')
    info = R.RigInfo(sid)
    sk = {n: v for n, v in SPINE_PARTS.items() if info.tail or not n.startswith('tail')}
    for c in R.build(sid).chains:
        key, s = chain_key(c), 'L' if c.side > 0 else 'R'
        prev = 'body'
        for part, a, b in LIMB_PARTS[key]:
            sk[f'{part}_{s}'] = (prev, (f'{key}_{s}{a}', f'{key}_{s}{b}'))
            prev = f'{part}_{s}'
    for g, side in info.tips:
        s = 'L' if side > 0 else 'R'
        sk[f'{g}_{s}'] = ('body', (f'{g}_{s}0', f'{g}_{s}1'))
    return sk


def rest_points(sid, info):
    m = R.build(sid)
    ells = [p for p in m.prims if p.kind == 'ell']

    def axis_z(x, tags):
        pts = sorted((p.c[0], p.c[2]) for p in ells if p.tag in tags)
        return float(np.interp(x, [a for a, _ in pts], [b for _, b in pts])) if pts else info.hip_z

    pts = {'hip': np.array([0.0, 0.0, info.hip_z])}
    x0, length, z0 = info.neck if info.neck else (20.0, 1.0, info.hip_z)
    pts['neck0'] = np.array([x0, 0.0, z0])
    pts['head0'] = np.array([x0 + length, 0.0, axis_z(x0 + length, ('head', 'neck'))])
    hx = max((p.c[0] + p.r[0] for p in ells if p.tag == 'head'), default=x0 + length + 6)
    pts['snout'] = np.array([hx, 0.0, axis_z(hx, ('head',))])
    if info.tail:
        t0, tl = info.tail
        for i in range(4):
            x = t0 - tl * i / 3
            pts[f'tail{i}'] = np.array([x, 0.0, axis_z(x, ('tail', 'body'))])
    for c in m.chains:
        for i, p in enumerate(c.rest):
            pts[f'{chain_name(c)}{i}'] = c.world(p)
    for (g, side), tip in info.tips.items():
        n = f"{g}_{'L' if side > 0 else 'R'}"
        pts[n + '0'], pts[n + '1'] = R.side_point(info.pivots[g], side), np.asarray(tip, float)
    return pts


def posed_points(sid, info, rest, state, frame, nframes):
    if state == 'death':
        return death_points(sid, info, rest, frame, nframes)
    pose = R.Pose(info, state, frame, nframes)
    m = R.build(sid, pose)
    out = {}
    for k, p in rest.items():
        out[k] = pose.carry(p)[0]
    for c in m.chains:
        for i, p in enumerate(c.posed):
            out[f'{chain_name(c)}{i}'] = c.world(p)
    for n, (piv, tip) in getattr(m, 'app_joints', {}).items():
        out[n + '0'], out[n + '1'] = np.asarray(piv, float), np.asarray(tip, float)
    return out


def death_points(sid, info, rest, frame, nframes):
    """Same bend, roll and drop as rig_animate.build_death, applied to marker points."""
    f = R.ease(frame / (nframes - 1))
    m = R.build(sid)
    keys = list(rest)
    marks = [D.Ell(rest[k], (0.05, 0.05, 0.05), tag='marker') for k in keys]
    m.prims += marks
    spec = D.SPECIES[sid]
    nx, nz, nl, na, tx, tz, tl, ta = spec['bend']
    if na:
        D.bend_model(m, nx, nz, nl, na * f, forward=True)
    if ta:
        D.bend_model(m, tx, tz, tl, ta * f, forward=False)
    roll = spec.get('roll', -math.pi / 2) * f
    if roll:
        m.apply(D.rot_x(roll))
    lows = [p.c[2] - min(p.r) for p in m.prims if p.kind == 'ell' and p.tag != 'marker']
    drop = -min(lows) if lows else 0.0
    marks = m.prims[-len(keys):]
    return {k: p.c + np.array([0.0, 0.0, drop * f]) for k, p in zip(keys, marks)}


# ---------------------------------------------------------------- 2D cutout
def load_parts(folder, sid):
    folder = Path(folder)
    spec = json.loads((folder / f'{sid}_parts.json').read_text())
    sk = skeleton(sid)
    views = {}
    for d, v in spec['directions'].items():
        parts = {}
        for name, p in v['parts'].items():
            if name not in sk:
                raise SystemExit(f'{sid} {d}: unknown part {name} (allowed: {", ".join(sk)})')
            img = np.array(Image.open(folder / f'{sid}_{d}_{name}.png').convert('RGBA'))
            parts[name] = dict(img=img, pivot=np.array(p['pivot'], float), tip=np.array(p['tip'], float),
                               parent=p.get('parent', sk[name][0]))
        views[d] = dict(order=v['order'], parts=parts, bones={n: sk[n][1] for n in parts})
    problems = check(folder, sid, views)
    if problems:
        raise SystemExit(f'{sid}: parts fail the cutout check\n  ' + '\n  '.join(problems))
    return views


def shrink(m, r=1):
    for _ in range(r):
        e = m.copy()
        e[1:] &= m[:-1]
        e[:-1] &= m[1:]
        e[:, 1:] &= m[:, :-1]
        e[:, :-1] &= m[:, 1:]
        e[0], e[-1], e[:, 0], e[:, -1] = False, False, False, False
        m = e
    return m


def grow1(m):
    g = m.copy()
    g[1:] |= m[:-1]
    g[:-1] |= m[1:]
    g[:, 1:] |= m[:, :-1]
    g[:, :-1] |= m[:, 1:]
    return g


def check(folder, sid, views):
    """Canvas, palette, binary alpha, pivots on the part, layer order, and the rest pose matches _full.png."""
    pal = {tuple(int(v) for v in c) for c in D.PALETTE}
    bad = []
    for d, view in views.items():
        missing = [n for n in view['parts'] if n not in view['order']] + [n for n in view['order'] if n not in view['parts']]
        if missing:
            bad.append(f'{d}: order and parts differ: {", ".join(missing)}')
        for name, part in view['parts'].items():
            img = part['img']
            if img.shape[:2] != (D.CANVAS, D.CANVAS):
                bad.append(f'{d} {name}: canvas {img.shape[1]}x{img.shape[0]}, want {D.CANVAS}x{D.CANVAS}')
                continue
            a = img[..., 3]
            if not np.isin(a, (0, 255)).all():
                bad.append(f'{d} {name}: alpha must be 0 or 255')
            colours = {tuple(int(v) for v in c) for c in img[a > 0][:, :3]}
            if colours - pal:
                bad.append(f'{d} {name}: {len(colours - pal)} colours outside Primal Earth 32')
            on = a > 0
            if not on.any():
                bad.append(f'{d} {name}: empty')
                continue
            ys, xs = np.nonzero(on)
            for key in ('pivot', 'tip'):
                x, y = part[key]
                if np.min((xs - x) ** 2 + (ys - y) ** 2) > 2.5 ** 2:
                    bad.append(f'{d} {name}: {key} {part[key]} is not on the part')
        full = Path(folder) / f'{sid}_{d}_full.png'
        if full.exists() and not missing:
            ident = {n: (np.eye(2), np.zeros(2)) for n in view['parts']}
            got = compose(view, ident)[..., 3] > 0
            want = np.array(Image.open(full).convert('RGBA'))[..., 3] > 0
            diff = ((got & ~grow1(want)).sum() + (want & ~grow1(got)).sum()) / max(want.sum(), 1)
            if diff > 0.05:  # more than 1 px off
                bad.append(f'{d}: parts put together differ from {full.name} on {diff:.0%} of the silhouette')
    return bad


def bone2d(pts, bone, heading, k):
    a, b = bone
    if a not in pts or b not in pts:
        return None
    return np.array(R.project(pts[a], heading, k)), np.array(R.project(pts[b], heading, k))


def transforms(view, rest, posed, heading, k, rigid_limbs=False, gain=1.0, jaw=0.0):
    """Per part: 2x2 matrix A and offset t with screen point q = A @ p + t (p in the drawn rest pose)."""
    out = {}
    names = list(view['parts'])
    done, turned = set(), set()
    while len(done) < len(names):
        for name in names:
            part = view['parts'][name]
            par = part['parent']
            if name in done or (par and par in view['parts'] and par not in done):
                continue
            if rigid_limbs and name not in SPINE and par in out:
                # dying: legs and arms ride their parent; the roll onto the side would fling them across the frame
                out[name] = out[par]
                if par in turned:
                    turned.add(name)
                done.add(name)
                continue
            bone = view['bones'][name]
            r, q = bone2d(rest, bone, heading, k), bone2d(posed, bone, heading, k)
            if par and par in out and par in turned:
                Ap, tp = out[par]
                pivot = Ap @ part['pivot'] + tp
            else:  # root, or a parent too short on screen to turn: follow the rig's joint directly
                pivot = part['pivot'] + (gain * (q[0] - r[0]) if r else 0)
            # the drawn tip moves on screen like the rig's joint does; the part turns and stretches to reach it
            tip = part['tip'] + (gain * (q[1] - r[1]) if r else 0)
            if name == 'jaw' and jaw:
                # open the mouth: the jaw turns down (straight down on screen in every direction), same length
                closed = tip
                L = float(np.linalg.norm(closed - pivot))
                tip = closed + np.array([0.0, jaw * JAW_DROP * float(np.linalg.norm(part['tip'] - part['pivot']))])
                tip = pivot + (tip - pivot) * (L / max(float(np.linalg.norm(tip - pivot)), 1e-6))
                out['_mouth'] = (pivot, closed, tip)
            vr, vp = part['tip'] - part['pivot'], tip - pivot
            A = np.eye(2)
            if np.linalg.norm(vr) >= MIN_BONE and np.linalg.norm(vp) > 1e-6:
                a = math.atan2(vp[1], vp[0]) - math.atan2(vr[1], vr[0])
                sc = float(np.clip(np.linalg.norm(vp) / np.linalg.norm(vr), *STRETCH))
                u = vr / np.linalg.norm(vr)
                A = np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]]) @ (np.eye(2) + (sc - 1) * np.outer(u, u))
                turned.add(name)
            out[name] = (A, pivot - A @ part['pivot'])
            done.add(name)
    return out


def warp(img, A, t, size=D.CANVAS):
    inv = np.linalg.inv(A)
    c = -inv @ t
    # PIL maps output (x, y) -> input (a x + b y + c, d x + e y + f); keep pixel centres aligned
    coeff = (inv[0, 0], inv[0, 1], c[0] + 0.5 * (inv[0, 0] + inv[0, 1]) - 0.5,
             inv[1, 0], inv[1, 1], c[1] + 0.5 * (inv[1, 0] + inv[1, 1]) - 0.5)
    return np.array(Image.fromarray(img, 'RGBA').transform((size, size), Image.AFFINE, coeff, resample=Image.NEAREST))


def small_islands(a, limit):
    """Pixels in 8-connected islands under `limit` px, except the largest island."""
    h, w = a.shape
    seen = np.zeros_like(a, bool)
    groups = []
    for y, x in zip(*np.nonzero(a)):
        if seen[y, x]:
            continue
        seen[y, x] = True
        stack, pix = [(y, x)], []
        while stack:
            cy, cx = stack.pop()
            pix.append((cy, cx))
            for ny in (cy - 1, cy, cy + 1):
                for nx in (cx - 1, cx, cx + 1):
                    if 0 <= ny < h and 0 <= nx < w and a[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        groups.append(pix)
    out = np.zeros_like(a, bool)
    groups.sort(key=len)
    for pix in groups[:-1]:
        if len(pix) < limit:
            for y, x in pix:
                out[y, x] = True
    return out


def compose(view, tf, size=D.CANVAS):
    """Paste the moved parts back to front, then draw one outline: around the whole animal and where a part
    lies over another part, but not across the joint where a part meets its parent or child."""
    canvas = np.zeros((size, size, 4), np.uint8)
    owner = np.full((size, size), -1)
    order = [n for n in view['order'] if n in view['parts']]
    masks, joints = {}, {}
    for i, name in enumerate(order):
        A, t = tf[name]
        warped = warp(view['parts'][name]['img'], A, t, size)
        on = warped[..., 3] > 127
        if name == 'jaw' and '_mouth' in tf:
            # the open mouth between upper and lower jaw is dark red, not a hole
            from PIL import ImageDraw
            tri = Image.new('L', (size, size), 0)
            ImageDraw.Draw(tri).polygon([tuple(map(float, q)) for q in tf['_mouth']], fill=255)
            mouth = (np.array(tri) > 0) & ~on
            warped[mouth] = (*MOUTH, 255)
            on = on | mouth
        if name in SPINE:
            # a dark edge the artist drew where this piece meets the trunk/tail/neck under it is a seam, not a
            # contour: keep the colour underneath there
            kin = {view['parts'][name]['parent']} | {n for n in order if view['parts'][n]['parent'] == name}
            under = np.isin(owner, [order.index(n) for n in kin if n in SPINE and n in order[:i]])
            ink = np.isin(warped[..., :3] @ [65536, 256, 1], SEAM_INK)
            on = on & ~(ink & under & ~np.isin(canvas[..., :3] @ [65536, 256, 1], SEAM_INK))
            # the shaded rim along the piece's edge (2 px) is a seam too where kin lies underneath
            on = on & ~(under & ~shrink(on, RIM))
        elif view['parts'][name]['parent'] in order[:i]:
            # a limb's rim melts into its parent around the joint
            pj = A @ view['parts'][name]['pivot'] + t
            yy, xx = np.mgrid[:size, :size]
            near = (xx - pj[0]) ** 2 + (yy - pj[1]) ** 2 <= JOINT_R ** 2
            under = owner == order.index(view['parts'][name]['parent'])
            on = on & ~(near & under & ~shrink(on, RIM))
        canvas[on] = warped[on]
        owner[on] = i
        masks[name] = on
        joints[name] = A @ view['parts'][name]['pivot'] + t
    # lone pixels and 1 px spurs left by turning the parts with nearest-neighbour sampling
    for _ in range(2):
        a = owner >= 0
        n = np.zeros((size, size), int)
        n[1:] += a[:-1]
        n[:-1] += a[1:]
        n[:, 1:] += a[:, :-1]
        n[:, :-1] += a[:, 1:]
        lone = a & (n <= 1)
        owner[lone] = -1
        canvas[lone] = 0
        for m in masks.values():
            m &= ~lone
    # a thin tail tip can come loose when it turns; drop small islands apart from the body
    loose = small_islands(owner >= 0, 16)
    owner[loose] = -1
    canvas[loose] = 0
    for m in masks.values():
        m &= ~loose
    yy, xx = np.mgrid[:size, :size]
    line = np.zeros((size, size), bool)
    for i, name in enumerate(order):
        m = masks[name]
        ring = grow1(m) & ~m & (owner < i)  # background, or a part behind this one
        kin = [n for n in order if view['parts'][n]['parent'] == name] + [view['parts'][name]['parent']]
        for n in kin:
            if n in SPINE and name in SPINE and n in masks:  # trunk, neck, head and tail are one surface,
                ring &= ~masks[n]  # even where a limb behind them peeks over the joint
            elif n in masks:
                j = joints[name] if n == view['parts'][name]['parent'] else joints[n]
                near = (xx - j[0]) ** 2 + (yy - j[1]) ** 2 <= JOINT_R ** 2
                ring &= ~(near & (owner == order.index(n)))
        line |= ring
    canvas[line] = (*D.PALETTE[D.OUTLINE], 255)
    canvas[canvas[..., 3] == 0] = 0
    canvas[..., 3] = np.where(canvas[..., 3] > 0, 255, 0)
    return canvas


def motion_gain(views, rest, k):
    """Drawn hind-leg length over the borrowed rig's, side views: a bigger animal takes longer strides."""
    drawn = model = 0.0
    for d in ('E', 'W'):
        view = views.get(d)
        for name in (view or {}).get('parts', {}):
            if name.split('_')[0] in ('thigh', 'shin', 'foot'):
                part, bone = view['parts'][name], view['bones'][name]
                a, b = bone2d(rest, bone, R.HEADING[d], k) or (np.zeros(2),) * 2
                drawn += float(np.linalg.norm(part['tip'] - part['pivot']))
                model += float(np.linalg.norm(b - a))
    return float(np.clip(drawn / model, 0.5, 2.5)) if model > 1 else 1.0


def animate(sid, views, out, states=tuple(R.STATES)):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    msid = MOTION.get(sid, sid)
    k = D.SPECIES[msid].get('scale', 1.0)
    info = R.RigInfo(msid)
    rest = rest_points(msid, info)
    gain = motion_gain(views, rest, k) if msid != sid else 1.0
    rig = {'species': sid, 'source': 'tools/cutout_rig.py', 'motion': msid, 'motion_gain': round(gain, 3),
           'states': {}, 'frames': {}}
    for state in states:
        n, fps, loop, contact = R.STATES[state]
        rig['states'][state] = {'frames': n, 'fps': fps, 'loop': loop, 'contact_frame': contact}
        for f in range(n):
            posed = posed_points(msid, info, rest, state, f, n)
            for d, view in views.items():
                jaw = JAW_OPEN.get(state, [0.0] * n)[f] if msid in BITERS or sid in BITERS else 0.0
                img = compose(view, transforms(view, rest, posed, R.HEADING[d], k, rigid_limbs=state == 'death', gain=gain,
                                               jaw=jaw))
                name = f'{sid}_{state}_{d}_{f:03d}'
                Image.fromarray(img, 'RGBA').save(out / f'{name}.png')
                rig['frames'][name] = {'file': f'{name}.png', 'bbox': list(Image.fromarray(img).getbbox() or (0, 0, 0, 0))}
    (out / f'{sid}_cutout.json').write_text(json.dumps(rig, indent=1) + '\n')
    return rig


# ---------------------------------------------------------------- template from the 3D model
def assign(m, info, rest):
    """Part name for every prim of the rest model."""
    names = [None] * len(m.prims)
    def seg_dist(q, a, b):
        v = b - a
        f = float(np.clip(np.dot(q - a, v) / (np.dot(v, v) or 1.0), 0, 1))
        return float(np.linalg.norm(q - (a + f * v)))

    for c in m.chains:
        world = [c.world(p) for p in c.rest]
        segs = list(zip(world[:-1], world[1:]))
        side = 'L' if c.side > 0 else 'R'
        labels = [next(part for part, a, b in LIMB_PARTS[chain_key(c)] if a <= i < b) for i in range(len(segs))]
        for i in range(c.start, c.end):
            p = m.prims[i]
            q = p.c if p.kind == 'ell' else R.slab_centre(p)
            names[i] = f'{labels[int(np.argmin([seg_dist(q, a, b) for a, b in segs]))]}_{side}'
    for (g, side), parts in R.appendage_parts(m, info.pivots).items():
        for start, end, _, _ in parts:
            for i in range(start, end):
                names[i] = f"{g}_{'L' if side > 0 else 'R'}"
    t = [rest.get(f'tail{i}', None) for i in range(4)]
    for i, p in enumerate(m.prims):
        if names[i]:
            continue
        x = (p.c if p.kind == 'ell' else R.slab_centre(p))[0]
        if p.tag == 'head' or x >= rest['head0'][0]:
            names[i] = 'head'
        elif x >= rest['neck0'][0]:
            names[i] = 'neck'
        elif t[0] is not None and x < t[0][0]:
            names[i] = 'tail1' if x >= t[1][0] else ('tail2' if x >= t[2][0] else 'tail3')
        else:
            names[i] = 'body'
    return names


def strip_outline(img):
    """Drop the outer outline ring; parts are drawn without it and the rig outlines the whole frame."""
    a = img[..., 3] > 0
    ink = a & np.all(img[..., :3] == D.PALETTE[D.OUTLINE], axis=-1)
    inner = np.zeros_like(a)
    inner[1:-1, 1:-1] = a[:-2, 1:-1] & a[2:, 1:-1] & a[1:-1, :-2] & a[1:-1, 2:]
    fill = a & ~ink
    near = np.zeros_like(a)  # next to the coloured inside; a 1 px tip that is all outline stays
    near[1:] |= fill[:-1]
    near[:-1] |= fill[1:]
    near[:, 1:] |= fill[:, :-1]
    near[:, :-1] |= fill[:, 1:]
    out = img.copy()
    out[ink & ~inner & near] = 0
    return out


def template(sid, folder):
    """Cut the rest model into parts (a test input, and a guide for the artist's pivots)."""
    import copy
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    if sid not in D.SPECIES:
        raise SystemExit(f'{sid} has no 3D model to cut; start from --template {MOTION.get(sid, "allosaurus")}')
    k = D.SPECIES[sid].get('scale', 1.0)
    info = R.RigInfo(sid)
    rest = rest_points(sid, info)
    sk = skeleton(sid)
    m = R.build(sid)
    names = assign(m, info, rest)
    spec = {'species': sid, 'note': 'cut from the 3D model by tools/cutout_rig.py --template', 'directions': {}}
    for d in R.DIRECTIONS:
        heading = R.HEADING[d]
        Mz = D.rot_z(heading)
        parts, depth = {}, {}
        full = D.draw_view(m, heading, D.seed_for(sid, d), scale=k)
        Image.fromarray(full, 'RGBA').save(folder / f'{sid}_{d}_full.png')
        for name in sorted(set(names), key=list(sk).index):
            sub = copy.copy(m)
            sub.prims = [p for p, n in zip(m.prims, names) if n == name]
            sub.decals = m.decals if name == 'head' else []
            img = strip_outline(D.draw_view(sub, heading, D.seed_for(sid, d), scale=k))
            Image.fromarray(img, 'RGBA').save(folder / f'{sid}_{d}_{name}.png')
            a, b = bone2d(rest, sk[name][1], heading, k) or (np.array(R.project(rest['hip'], heading, k)),) * 2
            ys, xs = np.nonzero(img[..., 3] > 0)

            def snap(q):  # keep the point on the part's own pixels (a thin tip can end past them)
                i = int(np.argmin((xs - q[0]) ** 2 + (ys - q[1]) ** 2))
                return q if (xs[i] - q[0]) ** 2 + (ys[i] - q[1]) ** 2 <= 4 else np.array([xs[i], ys[i]], float)
            parts[name] = {'parent': sk[name][0], 'pivot': [round(float(v), 1) for v in snap(a)],
                           'tip': [round(float(v), 1) for v in snap(b)]}
            cs = [Mz @ (p.c if p.kind == 'ell' else R.slab_centre(p)) for p in sub.prims]
            depth[name] = float(np.mean([0.82 * c[2] - 0.36 * c[1] for c in cs]))  # nearer the camera = larger
        spec['directions'][d] = {'order': sorted(parts, key=depth.get), 'parts': parts}
    (folder / f'{sid}_parts.json').write_text(json.dumps(spec, indent=1) + '\n')
    return folder


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--species', required=True)
    ap.add_argument('--parts', help='folder with <id>_<D>_<part>.png and <id>_parts.json')
    ap.add_argument('--template', help='write parts cut from the 3D model to this folder and stop')
    ap.add_argument('--out', help='folder for the 120 frames')
    ap.add_argument('--states', default=','.join(R.STATES))
    ap.add_argument('--sheet', default='')
    ap.add_argument('--gif', default='')
    a = ap.parse_args()
    if a.template:
        print('template ->', template(a.species, a.template))
        return
    if not (a.parts and a.out):
        raise SystemExit('--parts and --out are required (or --template)')
    views = load_parts(a.parts, a.species)
    rig = animate(a.species, views, a.out, [s for s in a.states.split(',') if s])
    if a.sheet:
        R.sheet(Path(a.out), rig, a.sheet)
    if a.gif:
        R.gifs(Path(a.out), rig, a.gif)
    print(len(rig['frames']), 'frames ->', a.out)


if __name__ == '__main__':
    main()
