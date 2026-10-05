from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'manifest.json').read_text())
colors=json.loads((root/'palette.json').read_text())['colors']
palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in colors}
errors=[]
for entry in manifest:
    path=root/entry['file']
    with Image.open(path) as pic:
        if pic.mode!='RGBA' or list(pic.size)!=entry['size']:errors.append(entry['file']+' dimensions/mode')
        for r,g,b,a in pic.getdata():
            if a not in (0,255) or (a==0 and (r,g,b)!=(0,0,0)) or (a==255 and (r,g,b) not in palette):
                errors.append(entry['file']+' palette/alpha');break
        if '/tiles/' not in entry['file'] and not entry['file'].endswith('/grass.png'):
            box=pic.getbbox()
            if not box or min(box[:2])<2 or box[2]>pic.width-2 or box[3]>pic.height-2:errors.append(entry['file']+' padding')
files={p.relative_to(root).as_posix() for p in (root/'assets').rglob('*.png')}
if files!={e['file'] for e in manifest}:errors.append('Manifest inventory differs from assets')
print(json.dumps({'result':'FAIL' if errors else 'PASS','assets':len(files),'errors':errors,'scope':'PNG export only; no anatomy or GDevelop runtime certification'},indent=2))
raise SystemExit(1 if errors else 0)
