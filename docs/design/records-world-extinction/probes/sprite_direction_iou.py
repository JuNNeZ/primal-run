#!/usr/bin/env python3
"""Read-only: E vs mirrored-W alpha IoU and N/S vs E silhouette area per species/state.
Run from repo root: python docs/design/records-world-extinction/probes/sprite_direction_iou.py"""
import glob, re, numpy as np
from collections import defaultdict
from PIL import Image, ImageOps
def mask(f, mirror=False):
    im = Image.open(f).convert('RGBA')
    return np.array(ImageOps.mirror(im) if mirror else im)[:, :, 3] > 40
rows = []
for folder in ['player_full', 'enemy_full']:
    groups = defaultdict(list)
    for f in glob.glob(f'PRIMAL_RUN_Game/assets/{folder}/*_E_*.png'):
        m = re.match(r'.*/(\w+?)_(idle|walk|run|attack|hurt|death)_E_(\d+)\.png', f)
        if m: groups[(m[1], m[2])].append(f)
    for (sp, st), files in sorted(groups.items()):
        ious, area = [], defaultdict(list)
        for e in sorted(files):
            a, b = mask(e), mask(e.replace('_E_', '_W_'), True)
            ious.append((a & b).sum() / max(1, (a | b).sum()))
            for d in 'ENS': area[d].append(mask(e.replace('_E_', f'_{d}_')).sum())
        ae = np.mean(area['E'])
        rows.append((folder, sp, st, np.mean(ious), min(ious), np.mean(area['N']) / ae, np.mean(area['S']) / ae))
print('folder sp state meanIoU(E,mirrorW) minIoU areaN/E areaS/E')
for r in sorted(rows, key=lambda r: r[4]): print('%-11s %-19s %-7s %.2f %.2f %.2f %.2f' % r)
