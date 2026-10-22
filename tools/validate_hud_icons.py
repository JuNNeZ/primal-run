"""Independent native PNG and source integrity gate. Approval comes only from approval.json (Jonas), never from these checks."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'PRIMAL_RUN_Game'
entries=json.loads((GAME/'hud_icons_manifest.json').read_text(encoding='utf-8'))
palette={tuple(bytes.fromhex(c[1:])) for c in json.loads((GAME/'palette.json').read_text())['colors']}
errors=[]
# Jonas' visual approval lives in assets/hud_icons/approval.json, tied to each PNG hash, so a redraw drops it again.
approval_file=GAME/'assets/hud_icons/approval.json'
approval=json.loads(approval_file.read_text(encoding='utf-8')) if approval_file.exists() else {'icons':{}}
details=[]
for e in entries:
    file=GAME/e['file']
    im=Image.open(file)
    pixels=list(im.getdata())
    if im.mode!='RGBA' or list(im.size)!=e['size']: errors.append(e['id']+': mode/size')
    if not all(p[3] in (0,255) for p in pixels): errors.append(e['id']+': alpha')
    if not all(p[:3] in palette for p in pixels if p[3]): errors.append(e['id']+': palette')
    if not all(p[:3]==(0,0,0) for p in pixels if not p[3]): errors.append(e['id']+': transparent RGB')
    ok=approval['icons'].get(e['id'])==e['sha256']
    if (e['status'],e['production_approved'])!=(('approved_static',True) if ok else ('prototype_static',False)): errors.append(e['id']+': status')
    if hashlib.sha256(file.read_bytes()).hexdigest()!=e['sha256']: errors.append(e['id']+': PNG hash')
    source=GAME/e['source_pixels']
    if hashlib.sha256(source.read_bytes()).hexdigest()!=e['source_sha256']: errors.append(e['id']+': source hash')
    src=json.loads(source.read_text())
    rows=src['icons'][e['id']]
    reconstructed=[(0,0,0,0) if ch=='.' else (*bytes.fromhex(src['palette'][src['symbols'].index(ch)][1:]),255) for row in rows for ch in row]
    if reconstructed!=pixels: errors.append(e['id']+': source pixels differ')
    bbox=im.getbbox()
    if not bbox: errors.append(e['id']+': empty')
    if e['id']!='reel_frame' and (min(bbox[:2])<2 or bbox[2]>im.width-2 or bbox[3]>im.height-2): errors.append(e['id']+': padding')
    details.append(dict(id=e['id'],size=list(im.size),bbox=bbox,colors=len({p[:3] for p in pixels if p[3]})))
listed={e['file'] for e in entries}
actual={p.relative_to(GAME).as_posix() for p in (GAME/'assets/hud_icons').rglob('*.png')}
if listed!=actual or len(listed)!=len(entries): errors.append('inventory/duplicate mismatch')
expected={'relics':20,'sets':4,'loot':6}
for group,count in {'rarity':7,'tags':6,'mutations':14,'ui':13,'difficulty':2,'future':8}.items():
    if any(e['group']==group for e in entries): expected[group]=count
if {g:sum(e['group']==g for e in entries) for g in expected}!=expected: errors.append('group counts')
frame=Image.open(GAME/'assets/hud_icons/loot/reel_frame.png')
if frame.crop((8,8,16,16)).getbbox(): errors.append('9-slice center not transparent')
for box in [(8,0,16,8),(8,16,16,24)]:
    strip=frame.crop(box)
    if any(list(strip.crop((x,0,x+1,8)).getdata())!=list(strip.crop((0,0,1,8)).getdata()) for x in range(8)): errors.append('9-slice horizontal seam')
for box in [(0,8,8,16),(16,8,24,16)]:
    strip=frame.crop(box)
    if any(list(strip.crop((0,y,8,y+1)).getdata())!=list(strip.crop((0,0,8,1)).getdata()) for y in range(8)): errors.append('9-slice vertical seam')
armor=Image.open(GAME/'assets/hud_icons/loot/armor_points.png')
if armor.crop((16,0,24,24)).getbbox(): errors.append('armor number space occupied')
report=dict(result='FAIL' if errors else 'PASS',files=len(entries),groups=expected,errors=errors,approved=sum(e['status']=='approved_static' for e in entries),scope='Native dimensions, RGBA, fixed palette, binary alpha, transparent RGB, padding, inventory, source reconstruction, hashes, 9-slice seams, armor number space. No runtime or visual approval.',icons=details)
(GAME/'hud_icons_validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='icons'},indent=2))
raise SystemExit(bool(errors))
