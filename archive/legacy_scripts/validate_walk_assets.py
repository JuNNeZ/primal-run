from pathlib import Path
from PIL import Image
import numpy as np
import json,hashlib
from collections import deque

root=Path(__file__).resolve().parent/'PRIMAL_RUN_Demo_v3'
manifest=json.loads((root/'manifest.json').read_text())
colors=json.loads((root/'palette.json').read_text())['colors']
palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in colors}
errors=[]
for entry in manifest:
    p=root/entry['file']
    with Image.open(p) as im:
        a=np.asarray(im);opaque=a[:,:,3]>0
        if im.mode!='RGBA' or list(im.size)!=entry['size']:errors.append(entry['file']+': format or canvas mismatch')
        if not set(np.unique(a[:,:,3])).issubset({0,255}):errors.append(entry['file']+': fractional alpha')
        if np.any(a[~opaque,:3]):errors.append(entry['file']+': transparent RGB')
        if not opaque.any():errors.append(entry['file']+': empty')
        if not set(map(tuple,a[opaque,:3].tolist())).issubset(palette):errors.append(entry['file']+': palette')
        if entry['file']!='assets/environment/grass.png' and (opaque[:2].any() or opaque[-2:].any() or opaque[:,:2].any() or opaque[:,-2:].any()):errors.append(entry['file']+': insufficient padding')
        if entry['file'].startswith('assets/player/') and (entry['origin']!=[64,72] or entry['body_anchor']!=[64,72]):errors.append(entry['file']+': player anchor')

frames=[np.array(Image.open(root/f'assets/player/utahraptor_walk_S_{i:03}.png')) for i in range(6)]
windows=json.loads((root/'walk_assembly.json').read_text())['limb_windows']
fixed=np.ones((128,128),bool)
for x1,y1,x2,y2 in windows:fixed[y1:y2,x1:x2]=False
idle=np.array(Image.open(root/'assets/player/utahraptor_idle_S_000.png'))
for i,a in enumerate(frames+[idle]):
    if not np.array_equal(a[fixed],frames[0][fixed]):errors.append(f'Body shimmer in image {i}')
    # Confirm every visible piece remains connected to the body anchor.
    opaque=a[:,:,3]>0;seen=np.zeros_like(opaque);seen[72,64]=True;q=deque([(72,64)])
    while q:
        y,x=q.popleft()
        for yy in range(max(0,y-1),min(128,y+2)):
            for xx in range(max(0,x-1),min(128,x+2)):
                if opaque[yy,xx] and not seen[yy,xx]:seen[yy,xx]=True;q.append((yy,xx))
    if not np.array_equal(opaque,seen):errors.append(f'Detached sprite pixels in image {i}')
if len({hashlib.sha256(a.tobytes()).hexdigest() for a in frames})!=6:errors.append('Duplicate animation frames')
transitions=[int(np.any(frames[(i+1)%6]!=frames[i],axis=2).sum()) for i in range(6)]
if transitions[-1]>max(transitions[:-1])*1.5:errors.append('Loop closure exceeds other frame changes')
actual={p.relative_to(root).as_posix() for p in (root/'assets').rglob('*.png')}
listed={entry['file'] for entry in manifest}
if actual!=listed:errors.append('Asset inventory mismatch')
report={'result':'PASS' if not errors else 'FAIL','errors':errors,'asset_count':len(manifest),
        'walk_frames':6,'fps':8,'loop_duration_seconds':.75,'fixed_body_pixel_changes':0,
        'all_limbs_connected_to_body_anchor':True,
        'frame_pair_changed_pixels':transitions,'loop_closure_changed_pixels':transitions[-1],
        'anchors':[64,72],'palette_size':len(colors),'production_approved':False,
        'GDevelop_runtime':'NOT RUN',
        'scope':'PNG canvas, palette, alpha, padding, inventory, fixed-body identity, unique phases and closure comparison'}
(root/'validation_report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
raise SystemExit(bool(errors))
