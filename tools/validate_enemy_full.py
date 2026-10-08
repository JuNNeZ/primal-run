"""Technical checks for full enemy frames; explicitly not production art approval."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'PRIMAL_RUN_Game'
manifest=json.loads((GAME/'enemy_full_manifest.json').read_text());animations=json.loads((GAME/'enemy_full_animations.json').read_text())['animations']
palette={tuple(int(c[i:i+2],16) for i in [1,3,5]) for c in json.loads((GAME/'palette.json').read_text())['colors']};errors=[];stats={}
plan={'idle':4,'walk':6,'run':6,'attack':6,'hurt':2,'death':6}
if len(manifest)!=480 or len(animations)!=96:errors.append('Full plan requires 480 frames / 96 directional state sequences')
for e in manifest:
 file=GAME/e['file'];im=Image.open(file);a=np.array(im);box=im.getbbox()
 if im.mode!='RGBA' or im.size!=(144,144) or e['size']!=[144,144]:errors.append(e['file']+': native canvas')
 if not set(np.unique(a[:,:,3])).issubset({0,255}) or np.any(a[a[:,:,3]==0,:3]):errors.append(e['file']+': alpha/transparent RGB')
 if {tuple(c) for c in a[a[:,:,3]==255,:3]}-palette:errors.append(e['file']+': palette')
 if not box or min(box[:2])<2 or max(box[2:])>142:errors.append(e['file']+': padding/empty')
 if e['origin']!=e['body_anchor']:errors.append(e['file']+': body registration')
 if hashlib.sha256((GAME/e['source']).read_bytes()).hexdigest()!=e['source_sha256'] or hashlib.sha256(file.read_bytes()).hexdigest()!=e['export_sha256']:errors.append(e['file']+': integrity')
 if e['status']!='prototype_static' or e['production_approved'] or e['animation_ready']:errors.append(e['file']+': unsupported approval')
 stats[e['file']]={'bbox':box,'origin':e['origin'],'opaque_pixels':int(np.count_nonzero(a[:,:,3]))}
listed={e['file'] for e in manifest};actual={p.relative_to(GAME).as_posix() for p in (GAME/'assets/enemy_full').glob('*.png')}
if actual!=listed:errors.append('Full-enemy overlay inventory mismatch')
for species in ['parasaurolophus','deinosuchus','triceratops','tyrannosaurus']:
 for d in ['S','E','N','W']:
  for state,count in plan.items():
   group=[a for a in animations if a['species']==species and a['direction']==d and a['state']==state]
   if len(group)!=1 or len(group[0]['frames'])!=count:errors.append(f'{species}_{state}_{d}: missing sequence');continue
   anim=group[0];hashes=[hashlib.sha256((GAME/f).read_bytes()).hexdigest() for f in anim['frames']]
   if len(set(hashes))!=count:errors.append(anim['name']+': duplicate drawn poses')
   if anim['loop']!=(state in ['idle','walk','run']):errors.append(anim['name']+': loop plan')
report={'technical_export_result':'FAIL' if errors else 'PASS','assets':len(manifest),'sequences':len(animations),'errors':errors,'frames':stats,'production_approved':False,'scope':'Complete directional/state inventory, lossless native144 pixels, palette, alpha, padding, hashes, fixed declared hips, separate temporal frames. No anatomical/temporal production certification.','visual_notes':'See enemy_full_review.html and native grids on both backgrounds. Small generated body/marking variation remains; no mirrored/rotated directions. Legacy PNGs preserved.'}
(GAME/'enemy_full_validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='frames'},indent=2));raise SystemExit(1 if errors else 0)
