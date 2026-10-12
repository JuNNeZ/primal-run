"""Technical check of the static placeholder art in assets/new_species.

Checks files, sizes, RGBA mode, Primal Earth 32 palette, binary alpha,
transparent RGB = 0, padding, W = exact mirror of E, centring within the
spread of the existing frames, and that new_species_manifest.json matches
the files on disk.  It does not approve the artwork.

Usage: python tools/validate_new_species.py   (exit code 1 on any failure)
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
OUT = GAME / 'assets' / 'new_species'
MANIFEST = GAME / 'new_species_manifest.json'

PLAYABLE = ['spinosaurus', 'allosaurus', 'stegosaurus', 'therizinosaurus', 'pteranodon', 'microraptor',
            'pachyrhinosaurus', 'oviraptor']
WILD = ['dryosaurus', 'hypsilophodon', 'leaellynasaura', 'protoceratops', 'iguanodon', 'psittacosaurus',
        'edmontosaurus', 'archelon']
LIVE = ('S', 'N', 'E', 'W')
KEYS = LIVE + ('corpse', 'skeleton', 'avatar')
CANVAS, AVATAR = 144, 64
PAD = 2          # min transparent margin for species frames (like player_combat)
AMBIENT_PAD = 1
STATUS = 'placeholder static drawing; Codex to animate'

palette = {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))
           for c in json.loads((GAME / 'palette.json').read_text())['colors']}
errors: list[str] = []


def err(msg):
    errors.append(msg)


def load(path):
    with Image.open(path) as im:
        mode, size = im.mode, im.size
        a = np.asarray(im.convert('RGBA'))
    return mode, size, a


def centroid(a):
    ys, xs = np.nonzero(a[..., 3] > 0)
    return xs.mean() + 0.5, ys.mean() + 0.5


def check_pixels(rel, a, mode, size, want, pad):
    if mode != 'RGBA':
        err(f'{rel}: mode {mode}, want RGBA')
    if list(size) != list(want):
        err(f'{rel}: size {list(size)}, want {list(want)}')
    alpha = a[..., 3]
    if not set(np.unique(alpha)).issubset({0, 255}):
        err(f'{rel}: alpha not 0/255')
    if np.any(a[alpha == 0, :3]):
        err(f'{rel}: transparent pixels with nonzero RGB')
    colours = {tuple(c) for c in a[alpha == 255, :3]}
    extra = colours - palette
    if extra:
        err(f'{rel}: {len(extra)} colours outside palette.json')
    bb = Image.fromarray(a).getbbox()
    if not bb:
        err(f'{rel}: empty image')
        return None
    if bb[0] < pad or bb[1] < pad or bb[2] > a.shape[1] - pad or bb[3] > a.shape[0] - pad:
        err(f'{rel}: bbox {list(bb)} closer than {pad}px to the edge')
    return list(bb)


def tolerance(pattern, origin):
    """Largest centroid offset (per axis) among existing frames + 2 px."""
    files = sorted(GAME.glob(pattern))
    if not files:
        err(f'no reference frames for {pattern}')
        return (0.0, 0.0), 0
    off = np.array([np.subtract(centroid(load(f)[2]), origin) for f in files])
    return tuple(np.abs(off).max(axis=0) + 2.0), len(files)


def main():
    if not MANIFEST.exists():
        err('new_species_manifest.json missing')
        report()
        return
    man = json.loads(MANIFEST.read_text())
    tol_live, n_live = tolerance('assets/*_full/*_idle_*_000.png', (72, 72))
    tol_corpse, n_corpse = tolerance('assets/corpses/*_E_0.png', (72, 72))
    tol_avatar, n_avatar = tolerance('assets/avatars/*_idle_000.png', (32, 32))
    print(f'centring tolerance (max offset of existing frames + 2 px): live ±{tol_live[0]:.1f},±{tol_live[1]:.1f} '
          f'from {n_live} frames; corpse ±{tol_corpse[0]:.1f},±{tol_corpse[1]:.1f} from {n_corpse}; '
          f'avatar ±{tol_avatar[0]:.1f},±{tol_avatar[1]:.1f} from {n_avatar}')

    expected = set()
    species = man.get('species', {})
    if sorted(species) != sorted(PLAYABLE + WILD):
        err(f'manifest species {sorted(species)} != expected 16 ids')
    rows = []
    for sid in PLAYABLE + WILD:
        e = species.get(sid, {})
        role = 'playable' if sid in PLAYABLE else 'wild'
        if e.get('role') != role:
            err(f'{sid}: role {e.get("role")!r}, want {role!r}')
        if e.get('status') != STATUS:
            err(f'{sid}: status {e.get("status")!r}, want {STATUS!r}')
        if e.get('runtime_enabled') is not False or e.get('production_approved') is not False:
            err(f'{sid}: must stay runtime_enabled=false and production_approved=false')
        imgs = {}
        for k in KEYS:
            rel = f'assets/new_species/{sid}_{k}.png'
            expected.add(rel)
            path = GAME / rel
            if not path.exists():
                err(f'{rel}: missing')
                continue
            if e.get('files', {}).get(k) != rel:
                err(f'{sid}: manifest files[{k}] != {rel}')
            want = (AVATAR, AVATAR) if k == 'avatar' else (CANVAS, CANVAS)
            mode, size, a = load(path)
            bb = check_pixels(rel, a, mode, size, want, PAD)
            imgs[k] = a
            if bb is None:
                continue
            if e.get('alpha_bbox', {}).get(k) != bb:
                err(f'{sid}: manifest alpha_bbox[{k}] {e.get("alpha_bbox", {}).get(k)} != actual {bb}')
            sha = hashlib.sha256(path.read_bytes()).hexdigest()
            if e.get('sha256', {}).get(k) != sha:
                err(f'{sid}: manifest sha256[{k}] is stale')
            cx, cy = centroid(a)
            if k in LIVE:
                ox, oy, tol = cx - 72, cy - 72, tol_live
            elif k == 'avatar':
                ox, oy, tol = cx - 32, cy - 32, tol_avatar
            else:
                ox, oy, tol = cx - 72, cy - 72, tol_corpse
            if abs(ox) > tol[0] or abs(oy) > tol[1]:
                err(f'{rel}: centroid offset ({ox:+.1f},{oy:+.1f}) outside tolerance (±{tol[0]:.1f},±{tol[1]:.1f})')
        if 'E' in imgs and 'W' in imgs and not np.array_equal(imgs['W'], imgs['E'][:, ::-1]):
            err(f'{sid}: W is not the exact horizontal mirror of E')
        if 'corpse' in imgs and 'skeleton' in imgs:
            # the skeleton shares the corpse registration: bbox centres stay close
            b1, b2 = Image.fromarray(imgs['corpse']).getbbox(), Image.fromarray(imgs['skeleton']).getbbox()
            if b1 and b2 and abs((b1[1] + b1[3]) - (b2[1] + b2[3])) / 2 > 12:
                err(f'{sid}: skeleton is vertically far from the corpse registration')
        bbs = e.get('alpha_bbox', {})
        rows.append(f'  {sid:17s} {role:8s} E {bbs.get("E")}  S {bbs.get("S")}')

    # ambient creatures (stretch goal)
    amb = man.get('ambient', {}) or {}
    for name, e in amb.items():
        files = e.get('files', [])
        if len(files) != e.get('frames'):
            err(f'ambient {name}: {len(files)} files but frames={e.get("frames")}')
        w, h = e.get('size', [0, 0])
        if not (8 <= w <= 48 and 8 <= h <= 48):
            err(f'ambient {name}: size {w}x{h} outside 8-48 px')
        for i, rel in enumerate(files):
            expected.add(rel)
            path = GAME / rel
            if not rel.startswith('assets/new_species/ambient/') or not path.exists():
                err(f'ambient {name}: bad or missing file {rel}')
                continue
            mode, size, a = load(path)
            bb = check_pixels(rel, a, mode, size, (w, h), AMBIENT_PAD)
            if bb is not None and e.get('alpha_bbox', [None] * len(files))[i] != bb:
                err(f'{rel}: manifest alpha_bbox is stale')
            if e.get('sha256', [None] * len(files))[i] != hashlib.sha256(path.read_bytes()).hexdigest():
                err(f'{rel}: manifest sha256 is stale')

    actual = {p.relative_to(GAME).as_posix() for p in OUT.rglob('*') if p.is_file()}
    if actual != expected:
        err('inventory mismatch in assets/new_species: ' + str(sorted(actual ^ expected)))

    # placeholders must not be wired into the game yet
    for path in sorted((GAME / 'src').glob('*.js')) + [GAME / 'project.json', GAME / 'manifest.json']:
        if path.exists() and 'new_species' in path.read_text(encoding='utf-8', errors='ignore'):
            err(f'{path.relative_to(GAME).as_posix()} references new_species (placeholders are not to be wired)')

    print(f'species: {len(species)}  species files: {len([x for x in expected if "/ambient/" not in x])}  '
          f'ambient creatures: {len(amb)} ({sum(len(e.get("files", [])) for e in amb.values())} files)')
    print('alpha bbox (E, S):')
    print('\n'.join(rows))
    report()


def report():
    if errors:
        print(f'FAIL: {len(errors)} problem(s)')
        for e in errors:
            print('  -', e)
        raise SystemExit(1)
    print('PASS: technical checks only (size, mode, palette, alpha, padding, mirror, centring, manifest, inventory); '
          'not an art approval')


if __name__ == '__main__':
    main()
