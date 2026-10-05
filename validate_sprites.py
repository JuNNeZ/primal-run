from pathlib import Path
from PIL import Image
import numpy as np
import json

root=Path(__file__).resolve().parent/'PRIMAL_RUN_Sprites'
manifest=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
errors=[]
canvases={'01_Player_Utahraptor':(128,128), 'compy':(64,96),
          'parasaurolophus_young':(96,128),'carnotaurus_young':(96,128),
          'trex':(96,160),'06_Pickups':(80,80)}
for entry in manifest:
    path=root/entry['file']
    with Image.open(path) as pic:
        if pic.mode!='RGBA': errors.append(entry['file']+': not RGBA')
        if pic.size!=(entry['width'],entry['height']): errors.append(entry['file']+': wrong dimensions')
        if pic.getbbox() is None: errors.append(entry['file']+': empty')
        a=np.asarray(pic)
        if not set(np.unique(a[:,:,3])).issubset({0,255}): errors.append(entry['file']+': intermediate alpha')
        if np.any(a[a[:,:,3]==0,:3]): errors.append(entry['file']+': nonzero transparent RGB')
        for segment,expected in canvases.items():
            if segment in Path(entry['file']).parts and pic.size!=expected:
                errors.append(entry['file']+': family canvas mismatch')
        if entry['file'].startswith('05_UI/Icons/') and pic.size!=(40,40): errors.append(entry['file']+': icon size')
        if entry['file'].startswith(('05_UI/Buttons/','05_UI/Slots/')) and pic.size!=(64,64): errors.append(entry['file']+': button size')
        if not entry['file'].startswith('03_Environment/'):
            edges=np.concatenate([a[:2,:,3].flatten(),a[-2:,:,3].flatten(),a[:,:2,3].flatten(),a[:,-2:,3].flatten()])
            if np.any(edges): errors.append(entry['file']+': insufficient outer padding')
        if entry['status']!='prototype_static' or entry['animation_ready'] is not False:
            errors.append(entry['file']+': unsupported approval claim')
        if entry['suggested_origin']!=[pic.width//2,pic.height//2]:
            errors.append(entry['file']+': wrong prototype center/origin')

actual={p.relative_to(root).as_posix() for p in root.rglob('*.png')}
listed={e['file'] for e in manifest}
if actual!=listed: errors.append('Manifest does not match PNG inventory')
if len(manifest)!=len(listed):errors.append('Duplicate manifest entries')

report={'asset_count':len(manifest),'technical_export_result':'PASS' if not errors else 'FAIL',
        'errors':errors,'approved_animations':0,
        'style_review':'UNAPPROVED: source concept inconsistencies; palette/master pending',
        'runtime_test':'NOT RUN',
        'scope':'RGBA, binary alpha, transparent RGB, padding, family canvas, inventory and truthful status only'}
(root/'validation_report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
raise SystemExit(bool(errors))
