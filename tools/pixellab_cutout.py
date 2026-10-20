#!/usr/bin/env python3
"""PixelLab paints a species' rest pose; this tool cuts it into parts for tools/cutout_rig.py.

Two steps, both driven by PRIMAL_RUN_Game/Source_Generated/cutout/<id>/pixellab/cut_spec.json:

  python tools/pixellab_cutout.py --species iguanodon generate   # one PixelLab call (edit-images-v2), all 4 directions
  python tools/pixellab_cutout.py --species iguanodon cut        # outputs -> <id>_<D>_<part>.png + <id>_parts.json

generate sends the 3D-model template (cutout_rig.py --template) for S/N/E/W in one edit-images-v2 request, so
PixelLab keeps the game's camera and size and only repaints.  The API key is never read here: the cloud proxy adds
the Authorization header for api.pixellab.ai.  cut snaps the result to Primal Earth 32 with binary alpha, strips
PixelLab's outer outline (the rig draws its own), then
  S/N: keeps the template's part masks, because PixelLab keeps the top-down silhouette;
  E/W: cuts the spine by x ranges and the limbs by the polygons/ellipses in cut_spec.json, because PixelLab moves
       the legs under the body there.  The far arm is hidden in a side view, so it is the near arm one shade darker.
Everything stays prototype art until Jonas approves it.
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
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
API = 'https://api.pixellab.ai/v2'
PAL = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)]
                for h in json.loads((GAME / 'palette.json').read_text())['colors']], float)
INK = np.array([0x15, 0x1b, 0x19])
DIRS = 'SNEW'


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


def generate(sid, folder, spec):
    req = spec['request']
    size = req['size']
    tmpl = template(sid)
    images = []
    for d in DIRS:
        x, y = req['offsets'][d]
        crop = Image.open(tmpl / f'{sid}_{d}_full.png').convert('RGBA').crop((x, y, x + size, y + size))
        crop.save(folder / f'input_{d}.png')
        images.append({'image': png64(crop), 'width': size, 'height': size})
    before = call('/balance')['subscription']
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
        raw = base64.b64decode(img['base64'].split(',', 1)[-1])
        Image.open(io.BytesIO(raw)).save(folder / f'output_{d}.png')
    after = call('/balance')['subscription']
    print(f'PixelLab: {before["generations"]} -> {after["generations"]} generations left')


def snap(sid, folder, spec, d):
    """PixelLab output for one direction on the 144 canvas: Primal Earth 32, alpha 0/255."""
    a = np.array(Image.open(folder / f'output_{d}.png').convert('RGBA')).astype(float)
    on = a[..., 3] >= 128
    idx = ((a[..., None, :3] - PAL[None, None]) ** 2).sum(-1).argmin(-1)
    sub = np.zeros(a.shape, np.uint8)
    sub[..., :3] = PAL[idx]
    sub[..., 3] = 255
    sub[~on] = 0
    out = np.zeros((144, 144, 4), np.uint8)
    x, y = spec['request']['offsets'][d]
    s = spec['request']['size']
    out[y:y + s, x:x + s] = sub
    return out


def shape(s):
    m = Image.new('L', (144, 144), 0)
    if s[0] == 'ell':
        _, cx, cy, rx, ry = s
        ImageDraw.Draw(m).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255, outline=255)
    else:
        ImageDraw.Draw(m).polygon([tuple(p) for p in s], fill=255, outline=255)
    return np.array(m) > 0


def strip_outline(a, keep):
    on = a[..., 3] > 0
    ink = on & (np.abs(a[..., :3].astype(int) - INK).sum(-1) == 0)
    pad = np.pad(on, 1)
    edge = np.zeros_like(on)
    for dy, dx in ((0, 1), (2, 1), (1, 0), (1, 2)):
        edge |= ~pad[dy:dy + 144, dx:dx + 144]
    a[ink & edge & ~keep] = 0


def darker(img):
    out = img.copy()
    on = img[..., 3] > 0
    idx = ((img[on][:, None, :3].astype(float) * 0.72 - PAL[None]) ** 2).sum(-1).argmin(-1)
    out[on, :3] = PAL[idx]
    return out


def cut(sid, folder, spec, out_dir):
    tmpl = template(sid)
    tspec = json.loads((tmpl / f'{sid}_parts.json').read_text())
    parts_json = {'species': sid, 'source': 'PixelLab rest pose cut by tools/pixellab_cutout.py (prototype)', 'directions': {}}
    for d in DIRS:
        tv = tspec['directions'][d]
        a = snap(sid, folder, spec, d)
        side = spec['side'].get(d)
        keep = np.zeros((144, 144), bool)
        if side:  # the far leg is drawn mostly in the outline colour; stripping it would erase it
            for n, (s, _, _) in side['limbs'].items():
                if n.endswith('_' + side['far']):
                    keep |= shape(s)
        strip_outline(a, keep)
        on = a[..., 3] > 0
        parts, meta = {}, {}
        if not side:
            masks = {n: np.array(Image.open(tmpl / f'{sid}_{d}_{n}.png'))[..., 3] > 0 for n in tv['order']}
            top = np.full((144, 144), -1)
            for i, n in enumerate(tv['order']):
                top[masks[n]] = i
            ys, xs = np.nonzero(top >= 0)
            for y, x in zip(*np.nonzero(on & (top < 0))):  # outside the template: nearest template part
                k = ((ys - y) ** 2 + (xs - x) ** 2).argmin()
                top[y, x] = top[ys[k], xs[k]]
            for i, n in enumerate(tv['order']):
                m = (masks[n] | (top == i)) & on
                parts[n] = np.where(m[..., None], a, 0).astype(np.uint8)
                meta[n] = tv['parts'][n]
        else:
            yy, xx = np.mgrid[0:144, 0:144]
            limb = {n: shape(s) & on for n, (s, _, _) in side['limbs'].items()}
            fore = next(n for n in side['limbs'] if n.startswith('forearm'))
            spine = on & (yy <= side['spine_y']) & ~limb[fore]

            def mid_y(x):
                x = int(round(x))
                while not spine[:, x].any():
                    x += 1 if x < 72 else -1
                return float(np.round(np.nonzero(spine[:, x])[0].mean(), 1))

            for n, (x0, x1) in side['cuts'].items():
                m = spine & (xx >= x0) & (xx <= x1)
                parts[n] = np.where(m[..., None], a, 0).astype(np.uint8)
                px, tx = side['pivot_x'][n], side['tip_x'][n]
                meta[n] = dict(parent=tv['parts'][n]['parent'], pivot=[px, mid_y(px)], tip=[tx, mid_y(tx)])
            for n, (_, pv, tp) in side['limbs'].items():
                parts[n] = np.where(limb[n][..., None], a, 0).astype(np.uint8)
                meta[n] = dict(parent=tv['parts'][n]['parent'], pivot=pv, tip=tp)
            dx, dy = side['far_shift']
            for seg in ('upperarm', 'forearm'):
                near, far = f'{seg}_{side["near"]}', f'{seg}_{side["far"]}'
                parts[far] = darker(np.roll(parts[near], (dy, dx), (0, 1)))
                meta[far] = dict(parent=tv['parts'][far]['parent'],
                                 pivot=[meta[near]['pivot'][0] + dx, meta[near]['pivot'][1] + dy],
                                 tip=[meta[near]['tip'][0] + dx, meta[near]['tip'][1] + dy])
        full = np.zeros_like(a)
        for n in tv['order']:
            m = parts[n][..., 3] > 0
            full[m] = parts[n][m]
            Image.fromarray(parts[n]).save(out_dir / f'{sid}_{d}_{n}.png')
        Image.fromarray(full).save(out_dir / f'{sid}_{d}_full.png')
        lost = int((on & (full[..., 3] == 0)).sum())
        if lost:
            print(f'{d}: {lost} painted pixels belong to no part')
        parts_json['directions'][d] = dict(order=tv['order'], parts={n: meta[n] for n in tv['order']})
    (out_dir / f'{sid}_parts.json').write_text(json.dumps(parts_json, indent=1) + '\n')
    print(f'parts -> {out_dir.relative_to(ROOT)}; next: python tools/cutout_rig.py --species {sid} --parts {out_dir.relative_to(ROOT)} --out OUT --gif GIF')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--species', required=True)
    ap.add_argument('step', choices=['generate', 'cut'])
    a = ap.parse_args()
    out_dir = GAME / 'Source_Generated/cutout' / a.species
    folder = out_dir / 'pixellab'
    spec = json.loads((folder / 'cut_spec.json').read_text())
    if a.step == 'generate':
        generate(a.species, folder, spec)
    else:
        cut(a.species, folder, spec, out_dir)


if __name__ == '__main__':
    main()
