#!/usr/bin/env python3
"""PixelLab paints a species' rest pose seen from above; this tool cuts it into parts for tools/cutout_rig.py.

Two steps, both driven by PRIMAL_RUN_Game/Source_Generated/cutout/<id>/pixellab/cut_spec.json:

  python tools/pixellab_cutout.py --species iguanodon generate   # one PixelLab call (edit-images-v2), all 4 directions
  python tools/pixellab_cutout.py --species iguanodon cut        # images -> <id>_<D>_<part>.png + <id>_parts.json

generate sends topdown_input_<D>.png (128x128) in one edit-images-v2 request and writes topdown_output_<D>.png.
One call costs 10 PixelLab generations.  The API key is never read here: the cloud proxy adds the Authorization
header for api.pixellab.ai.

The game is seen from above in all four directions, E and W too.  E/W are therefore S turned a quarter (cut_spec
"turn"), so cut uses the 3D-model template's part masks and pivots for S/N and the same S template turned for E/W,
with E/W's own layer order (far side first).  Pixels are snapped to Primal Earth 32 with binary alpha and the
outer outline is stripped (the rig draws its own).  Everything stays prototype art until Jonas approves it.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
API = 'https://api.pixellab.ai/v2'
PAL = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)]
                for h in json.loads((GAME / 'palette.json').read_text())['colors']], float)
INK = np.array([0x15, 0x1b, 0x19])
DIRS = 'SNEW'
C = 72  # canvas centre and hip anchor


def call(path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None,
                                 headers={'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        raise SystemExit(f'PixelLab {path}: {e.code} {e.read()[:500]!r}')


def png64(img):
    buf = io.BytesIO()
    img.save(buf, 'PNG')
    return {'type': 'base64', 'base64': base64.b64encode(buf.getvalue()).decode(), 'format': 'png'}


def template(sid):
    tmp = Path(tempfile.mkdtemp(prefix=f'{sid}_tmpl_'))
    subprocess.run([sys.executable, str(ROOT / 'tools/cutout_rig.py'), '--species', sid, '--template', str(tmp)],
                   check=True, capture_output=True)
    return tmp


def generate(folder, spec):
    req = spec['topdown']
    size = req['size']
    images = [{'image': png64(Image.open(folder / f'topdown_input_{d}.png').convert('RGBA')), 'width': size, 'height': size}
              for d in DIRS]
    # free plan: one job at a time, and a proxy 502 can still have started (and billed) a job, so never retry blindly
    job = call('/edit-images-v2', dict(method=req['method'], edit_images=images, image_size={'width': size, 'height': size},
                                       description=req['description'], seed=req['seed'], no_background=True))
    for _ in range(90):
        time.sleep(8)
        state = call('/background-jobs/' + job['background_job_id'])
        if state.get('status') != 'processing':
            break
    if state.get('status') != 'completed':
        raise SystemExit(f'PixelLab job {job["background_job_id"]}: {state.get("status")}')
    for d, img in zip(DIRS, state['last_response']['images']):
        Image.open(io.BytesIO(base64.b64decode(img['base64'].split(',', 1)[-1]))).save(folder / f'topdown_output_{d}.png')
    print('PixelLab billed', state['last_response'].get('billing_usage'), '- left:', call('/balance')['subscription'])


def snap(path, offset):
    """A 128 crop on the 144 canvas: Primal Earth 32, alpha 0/255."""
    a = np.array(Image.open(path).convert('RGBA')).astype(float)
    on = a[..., 3] >= 128
    idx = ((a[..., None, :3] - PAL[None, None]) ** 2).sum(-1).argmin(-1)
    sub = np.zeros(a.shape, np.uint8)
    sub[..., :3] = PAL[idx]
    sub[..., 3] = 255
    sub[~on] = 0
    out = np.zeros((144, 144, 4), np.uint8)
    x, y = offset
    out[y:y + sub.shape[0], x:x + sub.shape[1]] = sub
    return out


def strip_outline(a):
    on = a[..., 3] > 0
    ink = on & (np.abs(a[..., :3].astype(int) - INK).sum(-1) == 0)
    pad = np.pad(on, 1)
    edge = np.zeros_like(on)
    for dy, dx in ((0, 1), (2, 1), (1, 0), (1, 2)):
        edge |= ~pad[dy:dy + 144, dx:dx + 144]
    a[ink & edge] = 0


def turn_mask(m, deg):
    """Quarter turn about the hip (72,72), counter-clockwise for +90 like PIL's rotate."""
    return np.rot90(m, deg // 90)


def turn_point(p, deg):
    x, y = p
    if deg == 90:
        return [round(C + (y - C), 1), round(C - (x - C), 1)]
    if deg == -90:
        return [round(C - (y - C), 1), round(C + (x - C), 1)]
    return [x, y]


def blobs(mask):
    """4-connected components of a boolean mask, as lists of (y, x)."""
    seen = np.zeros_like(mask)
    out = []
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        seen[y, x] = True
        stack, pts = [(y, x)], []
        while stack:
            cy, cx = stack.pop()
            pts.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < 144 and 0 <= nx < 144 and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        out.append(pts)
    return out


def adopt_strays(top, on, n_parts):
    """A part keeps only its largest blob; a loose bit (a thumb spike the template put in the neck) goes to the
    part it touches most, so it moves with that limb instead of floating.  Returns per part the pixels it lost."""
    moved = [np.zeros_like(on) for _ in range(n_parts)]
    for i in range(n_parts):
        parts = sorted(blobs(top == i), key=len, reverse=True)
        for pts in parts[1:]:
            votes = {}
            for y, x in pts:
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    j = top[ny, nx]
                    if j >= 0 and j != i:
                        votes[j] = votes.get(j, 0) + 1
            if not votes:
                continue
            j = max(votes, key=votes.get)
            for y, x in pts:
                top[y, x] = j
                moved[i][y, x] = True
    return moved


def cut(sid, folder, spec, out_dir):
    tmpl = template(sid)
    tspec = json.loads((tmpl / f'{sid}_parts.json').read_text())
    parts_json = {'species': sid, 'source': 'PixelLab top-down rest pose cut by tools/pixellab_cutout.py (prototype)',
                  'directions': {}}
    for d in DIRS:
        src, deg = spec.get('turn', {}).get(d, [d, 0])
        order = tspec['directions'][d]['order']
        sv = tspec['directions'][src]
        a = snap(folder / spec['images'].format(d=d), spec['offset'])
        strip_outline(a)
        on = a[..., 3] > 0
        masks = {n: turn_mask(np.array(Image.open(tmpl / f'{sid}_{src}_{n}.png'))[..., 3] > 0, deg) for n in order}
        top = np.full((144, 144), -1)
        for i, n in enumerate(order):
            top[masks[n]] = i
        ys, xs = np.nonzero(top >= 0)
        for y, x in zip(*np.nonzero(on & (top < 0))):  # painted outside the template: nearest template part
            k = ((ys - y) ** 2 + (xs - x) ** 2).argmin()
            top[y, x] = top[ys[k], xs[k]]
        moved = adopt_strays(top, on, len(order))
        full = np.zeros_like(a)
        meta = {}
        for i, n in enumerate(order):
            m = ((masks[n] & ~moved[i]) | (top == i)) & on
            part = np.where(m[..., None], a, 0).astype(np.uint8)
            full[m] = part[m]
            Image.fromarray(part).save(out_dir / f'{sid}_{d}_{n}.png')
            p = sv['parts'][n]
            meta[n] = dict(parent=p['parent'], pivot=turn_point(p['pivot'], deg), tip=turn_point(p['tip'], deg))
        Image.fromarray(full).save(out_dir / f'{sid}_{d}_full.png')
        lost = int((on & (full[..., 3] == 0)).sum())
        if lost:
            print(f'{d}: {lost} painted pixels belong to no part')
        parts_json['directions'][d] = dict(order=order, parts=meta)
    (out_dir / f'{sid}_parts.json').write_text(json.dumps(parts_json, indent=1) + '\n')
    rel = out_dir.relative_to(ROOT)
    print(f'parts -> {rel}; next: python tools/rig_to_game.py --species {sid} --cutout {rel}')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--species', required=True)
    ap.add_argument('step', choices=['generate', 'cut'])
    a = ap.parse_args()
    out_dir = GAME / 'Source_Generated/cutout' / a.species
    folder = out_dir / 'pixellab'
    spec = json.loads((folder / 'cut_spec.json').read_text())
    if a.step == 'generate':
        generate(folder, spec)
    else:
        cut(a.species, folder, spec, out_dir)


if __name__ == '__main__':
    main()
