#!/usr/bin/env python3
"""Rig animator: deterministic sprite animations for the new species.

The procedural models in tools/draw_new_species.py are built from joint
chains (theropod_leg, quad_leg, theropod_arm) on a spine.  This tool records
those chains as a skeleton, poses them per frame (gait cycle with planted
feet, two-bone IK, body bob, tail sway, neck pitch, attack/hurt/death keys)
and renders every frame through the same fixed camera and light as the static
drawings.  Because geometry comes from one model and one camera, the angle,
scale and light are identical in S/E/N/W and the legs always move with the
gait.  W is rendered from its own heading (like the existing player_full
frames), not mirrored, so the light stays top-left in every direction.

Output per species (default PRIMAL_RUN_Rig/<id>/):
  <id>_<state>_<S|N|E|W>_<NNN>.png  144x144, origin/hip anchor 72,72
  <id>_rig.json                      frames, fps/loop/contact, projected
                                     joints and foot contacts per frame
States and frame counts follow player_full / enemy_full: idle 4, walk 6,
run 6, attack 6, hurt 2, death 6 (30 per direction).

The frames are a guide for Codex (pose, silhouette, foot placement) and can
be used directly as prototypes; tools/validate_rig_frames.py checks repainted
frames against them.  Nothing here is wired into the game.

Usage: python tools/rig_animate.py --species iguanodon [--states walk,run]
       [--out DIR] [--sheet PNG] [--gif DIR]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import draw_new_species as D  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'PRIMAL_RUN_Rig'
DIRECTIONS = ('S', 'N', 'E', 'W')
HEADING = dict(D.VIEW_HEADING, W=math.pi)
STATES = {  # frames, fps, loop, contact frame
    'idle': (4, 4, True, None),
    'walk': (6, 8, True, None),
    'run': (6, 12, True, None),
    'attack': (6, 12, False, 3),
    'hurt': (2, 8, False, None),
    'death': (6, 8, False, None),
}
# same mapping as ATTACK_STYLE in PRIMAL_RUN_Game/src/app.js
ATTACK_STYLE = {'stegosaurus': 'tail', 'therizinosaurus': 'claws', 'microraptor': 'claws', 'iguanodon': 'claws',
                'pachyrhinosaurus': 'horns', 'protoceratops': 'horns', 'oviraptor': 'peck', 'pteranodon': 'peck',
                'psittacosaurus': 'peck', 'archelon': 'bite'}
LIMB_ATTACH = 6.0  # loose limb parts (thumb spikes) follow a chain joint within this distance
# Species without leg chains move appendages instead: wings flap, flippers row.  Each group is a
# shoulder pivot (side +1, y is mirrored for side -1); limb parts whose root lies within
# APPENDAGE_RADIUS of a pivot rotate about it.  A new winged or finned species needs an entry here.
APPENDAGES = {
    'pteranodon': ('flap', {'wing': (5.0, 3.0, 11.2)}),
    'microraptor': ('flap', {'forewing': (5.0, 1.8, 7.0), 'hindwing': (-1.0, 2.0, 5.0)}),
    'archelon': ('swim', {'front': (14.0, 18.0, 3.0), 'hind': (-26.0, 16.0, 3.0)}),
}
APPENDAGE_RADIUS = 8.0
TAIL_HINGES, TAIL_LAG = 3, 0.9  # tail wave: hinges along the tail and phase lag per hinge (rad)


# ---------------------------------------------------------------- skeleton
class Chain:
    """One limb chain as passed to the draw_new_species helper (y unmirrored)."""

    def __init__(self, kind, side, rest, posed, start, end):
        self.kind, self.side = kind, side
        self.rest = [np.asarray(p, dtype=float) for p in rest]
        self.posed = [np.asarray(p, dtype=float) for p in posed]
        self.start, self.end = start, end

    @property
    def name(self):
        return f"{self.kind}_{'L' if self.side > 0 else 'R'}"

    def world(self, p):
        return np.array([p[0], p[1] * self.side * D.SPRAWL, p[2]])


RIG = {'pose': None}


def _patch_helpers():
    """Record every limb chain and let the active pose move its joints."""
    for name, kind, n in (('theropod_leg', 'hind', 4), ('quad_leg', 'fore', 3), ('theropod_arm', 'arm', 3)):
        orig = getattr(D, name)
        if getattr(orig, 'rig', False):
            continue

        def make(orig=orig, kind=kind, n=n):
            def helper(m, side, *args, **kw):
                rest = [np.asarray(p, dtype=float) for p in args[:n]]
                pose = RIG['pose']
                posed = pose.solve(kind, side, rest) if pose is not None else rest
                start = len(m.prims)
                orig(m, side, *[tuple(float(v) for v in p) for p in posed], *args[n:], **kw)
                m.__dict__.setdefault('chains', []).append(Chain(kind, side, rest, posed, start, len(m.prims)))
            helper.rig = True
            return helper
        setattr(D, name, make())


    for name in ('limb', 'slab', 'claw', 'horn'):
        orig = getattr(D.Species, name)
        if getattr(orig, 'rig', False):
            continue

        def make_part(orig=orig, name=name):
            def method(self, *args, **kw):
                start = len(self.prims)
                out = orig(self, *args, **kw)
                if name == 'slab':
                    o, e1, e2, poly = (np.asarray(a, dtype=float) if i < 3 else a for i, a in enumerate(args[:4]))
                    t0 = min(abs(t) for _, t in poly)
                    root = [o + a * e1 + b * e2 for a, b in poly if abs(b) <= t0 + 1.0]
                    tips = [o + a * e1 + b * e2 for a, b in poly]
                    root = np.mean(root, axis=0)
                else:
                    pts = args[0] if name == 'limb' else args[:2]
                    tips = [np.asarray(q, dtype=float) for q in pts]
                    root = tips[0]
                self.__dict__.setdefault('parts', []).append((start, len(self.prims), root, tips))
                return out
            method.rig = True
            return method
        setattr(D.Species, name, make_part())


_patch_helpers()


def build(sid, pose=None):
    RIG['pose'] = pose
    try:
        m = D.Species('alive')
        m.chains, m.parts = [], []
        D.SPECIES[sid]['fn'](m)
    finally:
        RIG['pose'] = None
    if pose is not None:
        pose.finish(m)
    return m


# ---------------------------------------------------------------- maths
def rot2(v, a):
    """Rotate an (x, z) vector by a in the sagittal plane (positive lifts +x)."""
    c, s = math.cos(a), math.sin(a)
    return np.array([v[0] * c - v[1] * s, v[0] * s + v[1] * c])


def xz(p):
    return np.array([p[0], p[2]])


def with_xz(p, q):
    return np.array([q[0], p[1], q[1]])


def ik2(root, target, a, b, sign):
    """Two-bone IK in the x-z plane; returns (mid, end) with the rest bend side."""
    d = target - root
    L = float(np.linalg.norm(d))
    L = min(max(L, abs(a - b) + 1e-3), a + b - 1e-3)
    u = d / (np.linalg.norm(d) or 1.0)
    cos_a = (a * a + L * L - b * b) / (2 * a * L)
    ang = math.acos(max(-1.0, min(1.0, cos_a)))
    mid = root + a * rot2(u, sign * ang)
    return mid, root + u * L


def bend_sign(root, mid, end):
    d, k = xz(end) - xz(root), xz(mid) - xz(root)
    return 1.0 if d[0] * k[1] - d[1] * k[0] > 0 else -1.0


def ease(s):
    return 0.5 - 0.5 * math.cos(math.pi * s)


# ---------------------------------------------------------------- rig info
class RigInfo:
    """Rest skeleton of a species: chains, hip height, tail/neck extents."""

    def __init__(self, sid):
        m = build(sid)
        self.sid = sid
        self.chains = {(c.kind, c.side): c for c in m.chains}
        hind = [c for c in m.chains if c.kind == 'hind']
        fore = [c for c in m.chains if c.kind == 'fore']
        legs = hind or fore
        self.quadruped = bool(hind and fore) or (not hind and len(fore) >= 2)
        body_z = [p.c[2] for p in m.prims if p.kind == 'ell' and p.tag == 'body']
        # hip height above ground; for legless species the body height sets the motion scale
        self.leg = max((c.rest[0][2] for c in legs), default=float(np.median(body_z)) if body_z else 8.0)
        self.hip_z = self.leg
        tail = [p.c[0] for p in m.prims if p.kind == 'ell' and p.tag == 'tail']
        neck = [p.c for p in m.prims if p.kind == 'ell' and p.tag == 'neck']
        head = [p.c for p in m.prims if p.kind == 'ell' and p.tag == 'head']
        self.tail = (max(tail), max(max(tail) - min(tail), 1.0)) if tail else None
        # the neck bends and stretches between x0 and x0+length; the head beyond it moves rigidly
        if neck:
            x0 = min(c[0] for c in neck)
            x1 = min(c[0] for c in head) if head else max(c[0] for c in neck)
            self.neck = (x0, max(x1 - x0, 1.0), float(np.median([c[2] for c in neck])))
        elif head:
            self.neck = (min(c[0] for c in head) - 1.0, 1.0, float(np.median([c[2] for c in head])))
        else:
            self.neck = None
        self.head = np.mean(head, axis=0) if head else None
        self.length = max((p.c[0] for p in m.prims if p.kind == 'ell'), default=40) - min((p.c[0] for p in m.prims if p.kind == 'ell'), default=-40)
        self.style = ATTACK_STYLE.get(sid, 'bite')
        self.has_arms = any(c.kind == 'arm' for c in m.chains)
        # free canvas in front of and behind the animal in E (model units), so lunges stay on the canvas
        k = D.SPECIES[sid].get('scale', 1.0)
        bb = Image.fromarray(D.draw_view(m, 0.0, D.seed_for(sid, 'E'), scale=k)).getbbox() or (0, 0, D.CANVAS, D.CANVAS)
        self.room = ((D.CANVAS - 3 - bb[2]) / k, (bb[0] - 3) / k)
        mode, pivots = APPENDAGES.get(sid, ('legs', {}))
        self.locomotion = mode if pivots else ('legs' if m.chains else 'flap')
        self.pivots = pivots
        # rest tip of each appendage (farthest point from its pivot), for the joint export
        self.tips = {}
        for (group, side), parts in appendage_parts(m, pivots).items():
            piv = side_point(pivots[group], side)
            pts = [q for _, _, _, tips in parts for q in tips]
            self.tips[(group, side)] = max(pts, key=lambda q: float(np.linalg.norm(q - piv)))


def side_point(p, side):
    return np.array([p[0], p[1] * side, p[2]], dtype=float)


def appendage_parts(m, pivots):
    """Group the loose limb parts (not inside a leg chain) by nearest shoulder pivot and side."""
    out = {}
    if not pivots:
        return out
    taken = np.zeros(len(m.prims), dtype=bool)
    for c in m.chains:
        taken[c.start:c.end] = True
    # outer helper calls first, so a claw drawn inside a limb call is not moved twice
    for part in sorted(getattr(m, 'parts', []), key=lambda q: (q[0], -q[1])):
        start, end, root, _ = part
        if end <= start or taken[start:end].any() or m.prims[start].tag != 'limb':
            continue
        side = 1 if root[1] >= 0 else -1
        d, group = min((float(np.linalg.norm(root - side_point(p, side))), g) for g, p in pivots.items())
        if d <= APPENDAGE_RADIUS:
            out.setdefault((group, side), []).append(part)
            taken[start:end] = True
    return out


def appendage_rotation(roll, sweep, side):
    """Roll lifts the tip (+), sweep folds it back toward the tail (+), mirrored per side."""
    return D.rot_z(side * sweep) @ D.rot_x(side * roll)


# ---------------------------------------------------------------- poses
class Pose:
    """Pose for one frame: body offset/pitch, spine bends, foot targets."""

    def __init__(self, info, state, frame, nframes):
        self.info = info
        self.state = state
        self.t = frame / nframes
        self.frame = frame
        self.dx = self.dz = self.pitch = 0.0
        self.tail_yaw = self.neck_pitch = 0.0
        self.tail_phase = None  # set for a travelling tail wave (gait); otherwise one even bend
        self.neck_yaw = 0.0
        self.arm = 0.0
        self.reach = 0.0  # neck/head stretch forward (model units at the head)
        self.app = {}  # appendage group -> (roll, sweep)
        self.feet = {}  # (kind, side) -> (dx, dz, heel)
        self.raise_fore = 0.0
        self.contact = {}
        getattr(self, '_' + state)()

    # gait -------------------------------------------------------------
    def _gait(self, run):
        i = self.info
        L = i.leg
        if i.locomotion != 'legs':
            return self._paddle(run)
        if i.quadruped:
            duty = 0.5 if run else 0.75
            ph = ({('hind', 1): 0.0, ('fore', -1): 0.0, ('hind', -1): 0.5, ('fore', 1): 0.5} if run else
                  {('hind', 1): 0.0, ('fore', 1): 0.25, ('hind', -1): 0.5, ('fore', -1): 0.75})  # trot / LH-LF-RH-RF walk
        else:
            duty = 0.38 if run else 0.62
            ph = {('hind', 1): 0.0, ('hind', -1): 0.5, ('fore', 1): 0.0, ('fore', -1): 0.5}
        stride = (1.5 if run else 1.15) * L
        lift = (0.34 if run else 0.22) * L
        heel = 0.8 if run else 0.5
        for key, off in ph.items():
            p = (self.t + off) % 1.0
            if p < duty:
                s = p / duty
                fx, fz, h = stride * (0.5 - s), 0.0, 0.0
                self.contact[key] = True
            else:
                s = (p - duty) / (1 - duty)
                fx, fz, h = stride * (-0.5 + ease(s)), lift * math.sin(math.pi * s), -heel * math.sin(math.pi * s)
                self.contact[key] = False
            k = (0.6 if key[0] == 'fore' and not i.quadruped else 1.0)  # small hands of bipeds swing less
            self.feet[key] = (fx * k, fz * k, h)
        beats = 4 if i.quadruped else 2
        bob = (0.05 if i.quadruped else 0.08) * L * (1.6 if run else 1.0)
        self.dz = -bob * 0.5 * (1 + math.cos(2 * math.pi * beats * self.t))
        self.pitch = -0.04 if run else 0.0
        # the tail swings once per stride as a wave from root to tip, the head counters a little
        self.tail_yaw = (0.22 if run else 0.30) * (0.75 if i.quadruped else 1.0)
        self.tail_phase = 2 * math.pi * self.t
        self.neck_yaw = -0.08 * math.sin(2 * math.pi * self.t)
        self.neck_pitch = (0.05 if run else 0.03) * math.cos(2 * math.pi * beats * self.t)
        self.arm = (0.35 if run else 0.22) * math.sin(2 * math.pi * self.t)

    def _paddle(self, run):
        """Wing beat (flap) or flipper stroke (swim) for species without legs."""
        i, w = self.info, 2 * math.pi * self.t
        L = i.leg
        if i.locomotion == 'flap':
            A, B = (0.60, 0.50) if run else (0.35, 0.30)
            for n, g in enumerate(i.pivots):
                k = 1.0 if n == 0 else 0.6  # hind wings follow with less amplitude
                # t=0 wings up; downstroke to t=.5, upstroke folds the wing back
                self.app[g] = (k * A * math.cos(w), k * B * max(0.0, -math.sin(w)))
            self.dz = 0.08 * L * math.sin(w)
        else:
            S, R = (0.60, 0.35) if run else (0.45, 0.25)
            for n, g in enumerate(i.pivots):
                k, ph = (1.0, 0.0) if n == 0 else (0.6, math.pi)
                self.app[g] = (R * k * math.cos(w + ph), S * k * math.sin(w + ph))
            self.dz = -0.03 * L * (0.5 + 0.5 * math.cos(2 * w))
        self.tail_yaw, self.tail_phase = 0.12, w
        self.neck_pitch = 0.03 * math.cos(2 * w)

    def _walk(self):
        self._gait(False)

    def _run(self):
        self._gait(True)

    def _idle(self):
        w = 2 * math.pi * self.t
        self.dz = -0.03 * self.info.leg * (0.5 - 0.5 * math.cos(w))
        self.neck_pitch = 0.04 * math.sin(w)
        self.tail_yaw = 0.03 * math.sin(w + 1.0)
        self.arm = 0.05 * math.sin(w)
        for n, g in enumerate(self.info.pivots):
            self.app[g] = (0.12 * math.cos(w), 0.0) if self.info.locomotion == 'flap' else (0.0, 0.10 * math.sin(w + n * math.pi))

    # Per attack frame, in hip heights where a length is meant:
    # (body dx, body dz, pitch, neck pitch, tail yaw, arm swing, fore-leg raise, neck reach).
    # The camera looks down, so the readable parts are horizontal: lunge, reach and yaw.
    KEYS = {
        'bite': [(-.15, 0, .04, .12, 0, 0, 0, -.10), (-.28, 0, .06, .22, 0, 0, 0, -.20), (-.10, 0, .02, .10, 0, 0, 0, -.05),
                 (.40, -.03, -.05, -.20, 0, 0, 0, .70), (.24, 0, -.03, -.12, 0, 0, 0, .40), (.06, 0, 0, -.04, 0, 0, 0, .08)],
        'horns': [(-.18, 0, .03, .08, 0, 0, 0, -.05), (-.32, -.02, .04, .10, 0, 0, 0, -.10), (-.10, -.03, -.02, -.14, 0, 0, 0, 0),
                  (.55, -.04, -.07, -.30, 0, 0, 0, .25), (.32, -.02, -.04, -.18, 0, 0, 0, .12), (.08, 0, 0, -.05, 0, 0, 0, .02)],
        'peck': [(0, 0, 0, .14, 0, 0, 0, -.15), (-.08, 0, .02, .30, 0, 0, 0, -.30), (0, 0, 0, .10, 0, 0, 0, -.05),
                 (.20, 0, -.04, -.40, 0, 0, 0, .95), (.10, 0, -.02, -.22, 0, 0, 0, .55), (0, 0, 0, -.06, 0, 0, 0, .10)],
        'tail': [(0, 0, 0, .04, .20, 0, 0, 0), (-.06, 0, 0, .06, .42, 0, 0, 0), (0, 0, 0, .02, .20, 0, 0, 0),
                 (.06, 0, 0, -.04, -.62, 0, 0, 0), (.03, 0, 0, -.02, -.44, 0, 0, 0), (0, 0, 0, 0, -.14, 0, 0, 0)],
        'claws': [(-.10, 0, .05, .10, 0, .45, .30, -.05), (-.20, 0, .08, .16, 0, .80, .55, -.10), (-.06, 0, .04, .06, 0, .50, .45, 0),
                  (.32, -.02, -.04, -.12, 0, -.70, .20, .30), (.18, 0, -.02, -.08, 0, -.45, .08, .15), (.04, 0, 0, -.03, 0, -.10, 0, .03)],
    }

    def _attack(self):
        keys = self.KEYS[self.info.style]
        dx, dz, pitch, neck, tail, arm, raise_, reach = keys[self.frame]
        L = self.info.leg
        # one factor per species and direction of travel keeps the motion smooth and on the canvas
        front, back = self.info.room
        fwd = max(max(k[0], 0) + max(k[7], 0) for k in keys) * L
        bwd = max(max(-k[0], 0) for k in keys) * L
        sf = min(1.0, max(front - 1, 0) / fwd) if fwd else 1.0
        sb = min(1.0, max(back - 1, 0) / bwd) if bwd else 1.0
        dx, reach = dx * (sf if dx > 0 else sb), reach * (sf if reach > 0 else 1.0)
        self.dx, self.dz, self.pitch, self.neck_pitch, self.tail_yaw, self.arm = dx * L, dz * L, pitch, neck, tail, arm
        self.reach = reach * L
        self.raise_fore = raise_ * L if not self.info.has_arms else 0.0
        keys = self.APP_ATTACK['flap' if self.info.locomotion == 'flap' else 'swim']
        for n, g in enumerate(self.info.pivots):
            roll, sweep = keys[self.frame]
            self.app[g] = (roll * (1.0 if n == 0 else 0.6), sweep * (1.0 if n == 0 else 0.6))

    APP_ATTACK = {  # (roll, sweep) per attack frame: wings mantle up then strike; flippers pull back
        'flap': [(.25, 0), (.45, .10), (.30, 0), (-.30, -.10), (-.15, 0), (0, 0)],
        'swim': [(0, -.20), (0, -.35), (0, -.20), (0, .40), (0, .25), (0, .05)],
    }

    def _hurt(self):
        k = (1.0, 0.5)[self.frame]
        L = self.info.leg
        self.dx, self.pitch, self.neck_pitch, self.tail_yaw, self.arm = -0.22 * L * k, 0.06 * k, 0.22 * k, 0.16 * k, 0.3 * k
        self.reach = -0.25 * L * k
        for g in self.info.pivots:
            self.app[g] = (0.40 * k, 0.25 * k) if self.info.locomotion == 'flap' else (0.0, 0.30 * k)

    def _death(self):
        pass  # handled by build_death

    # posing -----------------------------------------------------------
    def body_point(self, p):
        """Rest-model point -> posed point for anything carried by the body."""
        piv = np.array([0.0, 0.0, self.info.hip_z])
        q = D.rot_y(-self.pitch) @ (np.asarray(p, dtype=float) - piv) + piv
        return q + np.array([self.dx, 0.0, self.dz])

    def solve(self, kind, side, rest):
        i = self.info
        root = self.body_point(rest[0])
        if kind == 'arm':
            a = self.arm * (1 if side > 0 else -1) if self.state in ('walk', 'run', 'idle') else self.arm
            out = [root]
            for p in rest[1:]:
                out.append(with_xz(p, xz(root) + rot2(xz(p) - xz(rest[0]), a)))
            return out
        fx, fz, heel = self.feet.get((kind, side), (0.0, 0.0, 0.0))
        if kind == 'fore' and side > 0 and self.raise_fore:
            fz += self.raise_fore
            fx += 0.9 * self.raise_fore
        foot = xz(rest[-1]) + np.array([fx, fz])
        if kind == 'hind' and len(rest) == 4:
            H, K, A, F = rest
            toe = rot2(xz(A) - xz(F), heel)
            a, b = np.linalg.norm(xz(K) - xz(H)), np.linalg.norm(xz(A) - xz(K))
            mid, end = ik2(xz(root), foot + toe, a, b, bend_sign(H, K, A))
            return [root, with_xz(K, mid), with_xz(A, end), with_xz(F, end - toe)]
        T, M, F = rest[0], rest[1], rest[-1]
        a, b = np.linalg.norm(xz(M) - xz(T)), np.linalg.norm(xz(F) - xz(M))
        mid, end = ik2(xz(root), foot, a, b, bend_sign(T, M, F))
        return [root, with_xz(M, mid), with_xz(F, end)]

    def spine(self, p):
        """Tail sway and neck pitch, progressive along the spine (rest coords)."""
        i = self.info
        p = np.asarray(p, dtype=float)
        R = np.eye(3)
        if i.tail and self.tail_yaw:
            x0, length = i.tail
            seg = length / TAIL_HINGES
            # distal hinges first, so each proximal hinge carries everything behind it
            for h in reversed(range(TAIL_HINGES)):
                if self.tail_phase is None:
                    amp = self.tail_yaw / TAIL_HINGES
                else:
                    amp = self.tail_yaw / TAIL_HINGES * math.sin(self.tail_phase - TAIL_LAG * h)
                xh = x0 - h * seg
                a = amp * float(np.clip((xh - p[0]) / seg, 0, 1))
                if a:
                    Rz = D.rot_z(a)
                    piv = np.array([xh, 0.0, p[2]])
                    p, R = piv + Rz @ (p - piv), Rz @ R
        if i.neck and (self.neck_pitch or self.reach or self.neck_yaw):
            x0, length, z0 = i.neck
            frac = float(np.clip((p[0] - x0) / length, 0, 1))
            a = self.neck_pitch * frac
            if a:
                Ry = D.rot_y(-a)
                piv = np.array([x0, 0.0, z0])
                p, R = piv + Ry @ (p - piv), Ry @ R
            a = self.neck_yaw * frac
            if a:
                Rz = D.rot_z(a)
                piv = np.array([x0, 0.0, p[2]])
                p, R = piv + Rz @ (p - piv), Rz @ R
            if self.reach:
                p = p + np.array([self.reach * frac, 0.0, 0.0])
        return p, R

    def carry(self, p):
        q, R = self.spine(p)
        return self.body_point(q), D.rot_y(-self.pitch) @ R

    def finish(self, m):
        """Move everything that is not a posed limb chain with the body."""
        in_chain = np.zeros(len(m.prims), dtype=bool)
        joints = []
        for c in m.chains:
            in_chain[c.start:c.end] = True
            joints += [(c.world(r), c.world(p)) for r, p in zip(c.rest, c.posed)]
        m.app_joints = {}
        rigid = np.zeros(len(m.prims), dtype=bool)  # appendages ride the body, not the spine bends
        for (group, side), parts in appendage_parts(m, self.info.pivots).items():
            roll, sweep = self.app.get(group, (0.0, 0.0))
            piv = side_point(self.info.pivots[group], side)
            R = appendage_rotation(roll, sweep, side)
            rotate_parts(m, parts, piv, R)
            for start, end, _, _ in parts:
                rigid[start:end] = True
            tip = piv + R @ (self.info.tips[(group, side)] - piv)
            m.app_joints[f"{group}_{'L' if side > 0 else 'R'}"] = [self.body_point(piv), self.body_point(tip)]
        Rb = D.rot_y(-self.pitch)
        for idx, p in enumerate(m.prims):
            if in_chain[idx]:
                continue
            centre = p.c if p.kind == 'ell' else slab_centre(p)
            if rigid[idx]:
                q = self.body_point(centre)
                if p.kind == 'ell':
                    p.c, p.R = q, Rb @ p.R
                else:
                    p.o = q + Rb @ (p.o - centre)
                    p.e1, p.e2 = Rb @ p.e1, Rb @ p.e2
                continue
            if p.tag == 'limb' and joints:
                d, (r, q) = min(((float(np.linalg.norm(centre - r)), (r, q)) for r, q in joints), key=lambda x: x[0])
                if d <= LIMB_ATTACH:
                    shift = q - r
                    if p.kind == 'ell':
                        p.c = p.c + shift
                    else:
                        p.o = p.o + shift
                    continue
            q, R = self.carry(centre)
            if p.kind == 'ell':
                p.c, p.R = q, R @ p.R
            else:
                p.o = q + R @ (p.o - centre)
                p.e1, p.e2 = R @ p.e1, R @ p.e2
        m.decals = [(self.carry(pt)[0], k) for pt, k in m.decals]


def rotate_parts(m, parts, piv, R):
    for start, end, _, _ in parts:
        for p in m.prims[start:end]:
            if p.kind == 'ell':
                p.c, p.R = piv + R @ (p.c - piv), R @ p.R
            else:
                p.o, p.e1, p.e2 = piv + R @ (p.o - piv), R @ p.e1, R @ p.e2


def slab_centre(s):
    ss = np.mean([a for a, _ in s.poly])
    tt = np.mean([b for _, b in s.poly])
    return s.o + ss * s.e1 + tt * s.e2


def build_death(sid, info, frame, nframes):
    """Fall onto the side: bend neck/tail and roll toward the corpse pose."""
    f = ease(frame / (nframes - 1))
    m = build(sid)
    spec = D.SPECIES[sid]
    if info.locomotion == 'flap':  # wings fold back and droop before the body settles
        for (group, side), parts in appendage_parts(m, info.pivots).items():
            rotate_parts(m, parts, side_point(info.pivots[group], side), appendage_rotation(-0.15 * f, 0.9 * f, side))
    nx, nz, nl, na, tx, tz, tl, ta = spec['bend']
    if na:
        D.bend_model(m, nx, nz, nl, na * f, forward=True)
    if ta:
        D.bend_model(m, tx, tz, tl, ta * f, forward=False)
    roll = spec.get('roll', -math.pi / 2) * f
    if roll:
        m.apply(D.rot_x(roll))
    lows = [p.c[2] - min(p.r) for p in m.prims if p.kind == 'ell']
    drop = -min(lows) if lows else 0.0
    m.apply(np.eye(3), (0.0, 0.0, drop * f))
    return m


# ---------------------------------------------------------------- render
def project(p, heading, k):
    q = D.rot_z(heading) @ np.asarray(p, dtype=float) * k
    return [round(D.ANCHOR[0] + float(q[0]), 2), round(D.ANCHOR[1] - (D.PA * float(q[1]) + D.PB * float(q[2])), 2)]


def render_species(sid, states=tuple(STATES), out=None):
    out = Path(out or OUT / sid)
    out.mkdir(parents=True, exist_ok=True)
    spec = D.SPECIES[sid]
    k = spec.get('scale', 1.0)
    info = RigInfo(sid)
    rig = {'species': sid, 'canvas': [D.CANVAS, D.CANVAS], 'origin': list(D.ANCHOR), 'model_scale': k,
           'visual_scale': spec.get('visual_scale', 1),
           'camera': {'image_x': 'x', 'image_up': f'{D.PA}*y + {D.PB}*z', 'light': [round(float(v), 4) for v in D.LIGHT],
                      'note': 'Same fixed overhead camera and light for every direction; each direction is its own render.'},
           'skeleton': {'locomotion': info.locomotion, 'quadruped': info.quadruped, 'hip_height': round(info.leg, 2),
                        'chains': sorted([c.name for c in info.chains.values()] +
                                         [f"{g}_{'L' if s > 0 else 'R'}" for g, s in info.tips]),
                        'attack_style': info.style},
           'states': {}, 'frames': {}}
    for state in states:
        n, fps, loop, contact = STATES[state]
        rig['states'][state] = {'frames': n, 'fps': fps, 'loop': loop, 'contact_frame': contact}
        for f in range(n):
            if state == 'death':
                m, pose = build_death(sid, info, f, n), None
            else:
                pose = Pose(info, state, f, n)
                m = build(sid, pose)
            imgs = {d: D.draw_view(m, HEADING[d], D.seed_for(sid, d), scale=k) for d in DIRECTIONS}
            for d in DIRECTIONS:
                name = f'{sid}_{state}_{d}_{f:03d}'
                path = out / f'{name}.png'
                Image.fromarray(imgs[d], 'RGBA').save(path)
                entry = {'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                         'bbox': list(Image.fromarray(imgs[d]).getbbox() or (0, 0, 0, 0))}
                if pose is not None:
                    heading = HEADING[d]
                    joints, contact_flags = {}, {}
                    chains = [(c.name, [c.world(p) for p in c.posed]) for c in m.chains] + list(m.app_joints.items())
                    for cname, world in chains:
                        joints[cname] = [project(p, heading, k) for p in world]
                    for c in m.chains:
                        if c.kind in ('hind', 'fore'):
                            contact_flags[c.name] = bool(pose.contact.get((c.kind, c.side), True)) and not (
                                c.kind == 'fore' and c.side > 0 and pose.raise_fore > 0)
                    entry['joints'] = joints
                    entry['foot_contact'] = contact_flags
                rig['frames'][name] = entry
        print('rendered', sid, state)
    (out / f'{sid}_rig.json').write_text(json.dumps(rig, indent=1) + '\n')
    return out, rig


# ---------------------------------------------------------------- previews
def sheet(out, rig, path, scale=2, bg=(104, 116, 96, 255), joints=False):
    sid = rig['species']
    rows = [(s, d) for s in rig['states'] for d in DIRECTIONS]
    cols = max(v['frames'] for v in rig['states'].values())
    cell = D.CANVAS * scale
    im = Image.new('RGBA', (cols * cell, len(rows) * cell), bg)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(im)
    for r, (s, d) in enumerate(rows):
        for f in range(rig['states'][s]['frames']):
            name = f'{sid}_{s}_{d}_{f:03d}'
            fr = Image.open(Path(out) / f'{name}.png').resize((cell, cell), Image.NEAREST)
            im.alpha_composite(fr, (f * cell, r * cell))
            e = rig['frames'][name]
            if joints and 'joints' in e:
                for cname, pts in e['joints'].items():
                    xy = [(f * cell + x * scale, r * cell + y * scale) for x, y in pts]
                    draw.line(xy, fill=(240, 70, 60, 255) if cname.endswith('L') else (70, 160, 240, 255), width=1)
                    fx, fy = xy[-1]
                    on = e.get('foot_contact', {}).get(cname)
                    draw.rectangle((fx - 2, fy - 2, fx + 2, fy + 2), outline=(255, 255, 255, 255) if on else (0, 0, 0, 255))
        draw.text((4, r * cell + 4), f'{s} {d}', fill=(237, 208, 160, 255))
    im.save(path)


def gifs(out, rig, folder, scale=3, bg=(104, 116, 96)):
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    sid = rig['species']
    for s, v in rig['states'].items():
        for d in DIRECTIONS:
            frames = []
            for f in range(v['frames']):
                fr = Image.open(Path(out) / f'{sid}_{s}_{d}_{f:03d}.png').resize((D.CANVAS * scale,) * 2, Image.NEAREST)
                base = Image.new('RGBA', fr.size, bg + (255,))
                base.alpha_composite(fr)
                frames.append(base.convert('P', palette=Image.ADAPTIVE))
            frames[0].save(folder / f'{sid}_{s}_{d}.gif', save_all=True, append_images=frames[1:],
                           duration=int(1000 / v['fps']), loop=0, disposal=2)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--species', required=True, help='comma separated ids from draw_new_species.SPECIES, or "all"')
    ap.add_argument('--states', default=','.join(STATES))
    ap.add_argument('--out', default='', help='output folder (default PRIMAL_RUN_Rig/<id>)')
    ap.add_argument('--sheet', default='', help='write a contact sheet PNG with joint overlay (review aid)')
    ap.add_argument('--gif', default='', help='write preview GIFs to this folder (review aid, not game assets)')
    a = ap.parse_args()
    ids = list(D.SPECIES) if a.species == 'all' else [s for s in a.species.split(',') if s]
    states = [s for s in a.states.split(',') if s]
    for sid in ids:
        if sid not in D.SPECIES:
            raise SystemExit(f'unknown species {sid}')
        out, rig = render_species(sid, states, Path(a.out) / sid if a.out and len(ids) > 1 else (a.out or None))
        if a.sheet:
            p = Path(a.sheet)
            sheet(out, rig, p.with_name(f'{sid}_{p.name}') if len(ids) > 1 else p, joints=True)
        if a.gif:
            gifs(out, rig, a.gif)


if __name__ == '__main__':
    main()
