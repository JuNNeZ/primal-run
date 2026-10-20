#!/usr/bin/env python3
"""Rig frames straight into the game: one command per species, no hand drawing.

Renders the rig (tools/rig_animate.py), checks every frame (tools/validate_rig_frames.py),
copies the 120 frames to PRIMAL_RUN_Game/assets/rig_full/ and writes their manifest and
animation entries.  The game shows them behind FEATURES.rigSprites for the ids in
RIG_SPECIES in src/core.js.  Everything stays prototype_static: Jonas approves the art,
file checks never do.

  python tools/rig_to_game.py --species allosaurus            # one species
  python tools/rig_to_game.py --species all --jobs 4          # every new species
  python tools/rig_to_game.py --species allosaurus --review DIR   # also GIFs + contact sheet
  python tools/rig_to_game.py --species iguanodon --paint DIR --pattern '{sid}_walk_{d}_000.png' --ref walk:0
      # every frame coloured from four drawn poses (tools/rig_paint_transfer.py)

Then: python tools/rebuild_generated.py, npm test.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
ASSETS = GAME / 'assets' / 'rig_full'
SOURCE = GAME / 'Source_Generated' / 'rig_full'
MANIFEST = GAME / 'rig_full_manifest.json'
ANIMATIONS = GAME / 'rig_full_animations.json'
sys.path.insert(0, str(Path(__file__).resolve().parent))


def render(sid: str, review: str, paint: tuple | None = None, cutout: str = '') -> tuple[str, list, list]:
    """Render, validate and copy one species; returns (id, manifest entries, animations).
    paint = (folder, file pattern, painted pose): recolour every frame from four drawn poses.
    cutout = folder of parts drawn by an artist (tools/cutout_rig.py): the rig's motion moves those parts."""
    with tempfile.TemporaryDirectory() as tmp:
        rig_out = out = Path(tmp) / sid
        cmd = [sys.executable, str(ROOT / 'tools/rig_animate.py'), '--species', sid, '--out', str(out)]
        if review:
            cmd += ['--sheet', str(Path(review) / f'{sid}_sheet.png'), '--gif', str(Path(review) / sid)]
        subprocess.run(cmd, cwd=ROOT, check=True, capture_output=True)
        paint_sources = []
        if cutout:
            out = Path(tmp) / f'{sid}_cutout'
            cmd = [sys.executable, str(ROOT / 'tools/cutout_rig.py'), '--species', sid, '--parts', cutout, '--out', str(out)]
            if review:
                cmd += ['--sheet', str(Path(review) / f'{sid}_cutout_sheet.png'), '--gif', str(Path(review) / f'{sid}_cutout')]
            done = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
            if done.returncode:
                raise SystemExit(f'{sid}: cutout parts refused\n{done.stdout[-2000:]}{done.stderr[-2000:]}')
            parts = Path(cutout) / f'{sid}_parts.json'
            paint_sources.append({'file': str(parts.resolve().relative_to(GAME)), 'kind': 'cutout parts',
                                  'sha256': hashlib.sha256(parts.read_bytes()).hexdigest()})
        if paint:
            folder, pattern, ref = paint
            out = Path(tmp) / f'{sid}_painted'
            subprocess.run([sys.executable, str(ROOT / 'tools/rig_paint_transfer.py'), '--species', sid, '--paint', folder,
                            '--pattern', pattern, '--ref', ref, '--out', str(out)], cwd=ROOT, check=True, capture_output=True)
            (SOURCE / 'paint').mkdir(parents=True, exist_ok=True)
            for d in ('S', 'N', 'E', 'W'):
                src = Path(folder) / pattern.format(sid=sid, d=d)
                dst = SOURCE / 'paint' / f'{sid}_{d}.png'
                shutil.copy2(src, dst)
                paint_sources.append({'direction': d, 'file': f'Source_Generated/rig_full/paint/{dst.name}', 'pose': ref,
                                      'sha256': hashlib.sha256(dst.read_bytes()).hexdigest()})
        # cutout art has its own silhouette, so the rig-shape check does not apply; cutout_rig.py checked the parts
        check = subprocess.run([sys.executable, str(ROOT / 'tools/validate_rig_frames.py'), '--species', sid,
                                '--frames', str(out), '--rig', str(rig_out)], cwd=ROOT, capture_output=True, text=True)
        if check.returncode and not cutout:
            raise SystemExit(f'{sid}: rig frames fail validate_rig_frames\n{check.stdout[-2000:]}')
        rig = json.loads((rig_out / f'{sid}_rig.json').read_text())
        SOURCE.mkdir(parents=True, exist_ok=True)
        ASSETS.mkdir(parents=True, exist_ok=True)
        shutil.copy2(rig_out / f'{sid}_rig.json', SOURCE / f'{sid}_rig.json')
        rig_sha = hashlib.sha256((rig_out / f'{sid}_rig.json').read_bytes()).hexdigest()
        entries, animations = [], []
        for state, info in rig['states'].items():
            for d in ('S', 'N', 'E', 'W'):
                frames = []
                for f in range(info['frames']):
                    name = f'{sid}_{state}_{d}_{f:03d}.png'
                    shutil.copy2(out / name, ASSETS / name)
                    file = f'assets/rig_full/{name}'
                    frames.append(file)
                    entries.append({'file': file, 'size': [144, 144], 'origin': [72, 72], 'body_anchor': [72, 72],
                                    'species': sid, 'direction': d, 'state': state, 'frame': f,
                                    'source': f'Source_Generated/rig_full/{sid}_rig.json', 'source_sha256': rig_sha,
                                    'export_sha256': hashlib.sha256((ASSETS / name).read_bytes()).hexdigest(),
                                    'status': 'prototype_static', 'production_approved': False, 'animation_ready': False,
                                    **({'paint_sources': paint_sources} if paint_sources else {}),
                                    'export': ('tools/cutout_rig.py: drawn rest-pose parts moved by the rig motion; parts pass the cutout check. '
                                               if cutout else
                                               ('tools/rig_paint_transfer.py: rig frame recoloured from the four drawn poses in paint_sources; '
                                                if paint_sources else 'tools/rig_to_game.py: rig_animate.py render copied byte for byte; ')
                                               + 'passes validate_rig_frames.py. ') + 'Not approved art.'})
                animations.append({'name': f'{sid}_{state}_{d}', 'species': sid, 'state': state, 'direction': d,
                                   'frames': frames, 'fps': info['fps'], 'loop': info['loop'], 'origin': [72, 72],
                                   'contact_frame': info['contact_frame'], 'validated_animation': False,
                                   'production_approved': False})
        return sid, entries, animations


def main():
    import draw_new_species as D
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--species', required=True, help='comma separated ids, or "all"')
    ap.add_argument('--jobs', type=int, default=1)
    ap.add_argument('--review', default='', help='folder for review GIFs and contact sheets (not game assets)')
    ap.add_argument('--paint', default='', help='one species: folder with four drawn poses to paint every frame from')
    ap.add_argument('--pattern', default='{sid}_rest_{d}.png', help='drawn pose file names, e.g. {sid}_walk_{d}_000.png')
    ap.add_argument('--cutout', default='', help='one species: folder with drawn parts (tools/CODEX_CUTOUT_BRIEF.md)')
    ap.add_argument('--ref', default='rest', help='pose that was drawn: rest or state:frame (see rig_paint_transfer.py)')
    a = ap.parse_args()
    ids = list(D.SPECIES) if a.species == 'all' else [s for s in a.species.split(',') if s]
    for sid in ids:
        if sid not in D.SPECIES:
            raise SystemExit(f'unknown species {sid}')
    if (a.paint or a.cutout) and len(ids) != 1:
        raise SystemExit('--paint and --cutout take one species')
    paint = (str(Path(a.paint).resolve()), a.pattern, a.ref) if a.paint else None
    if a.review:
        Path(a.review).mkdir(parents=True, exist_ok=True)
    with ProcessPoolExecutor(max_workers=max(1, a.jobs)) as pool:
        cutout = str(Path(a.cutout).resolve()) if a.cutout else ''
        results = list(pool.map(render, ids, [a.review] * len(ids), [paint] * len(ids), [cutout] * len(ids)))
    done = {sid for sid, _, _ in results}
    manifest = [e for e in (json.loads(MANIFEST.read_text()) if MANIFEST.exists() else []) if e['species'] not in done]
    animations = [x for x in (json.loads(ANIMATIONS.read_text())['animations'] if ANIMATIONS.exists() else [])
                  if x['species'] not in done]
    for _, entries, anims in results:
        manifest += entries
        animations += anims
    manifest.sort(key=lambda e: e['file'])
    animations.sort(key=lambda x: x['name'])
    MANIFEST.write_text(json.dumps(manifest, indent=1) + '\n')
    ANIMATIONS.write_text(json.dumps({'animations': animations}, indent=1) + '\n')
    core = (GAME / 'src/core.js').read_text()
    missing = [s for s in sorted(done) if f"'{s}'" not in core.split('RIG_SPECIES=new Set(')[-1].split(')')[0]]
    print(f'{len(done)} species, {sum(len(e) for _, e, _ in results)} frames -> assets/rig_full/')
    if missing:
        print('add to RIG_SPECIES in src/core.js so the game uses them:', ', '.join(missing))
    print('next: python tools/rebuild_generated.py && npm test')


if __name__ == '__main__':
    main()
