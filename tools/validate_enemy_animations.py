"""Technical asset checks, never production art approval."""
from pathlib import Path
import json,hashlib
from PIL import Image
import numpy as np
GAME=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game';entries=json.loads((GAME/'enemy_animation_manifest.json').read_text())
palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in json.loads((GAME/'palette.json').read_text())['colors']}
errors=[];stats={}
for e in entries:
 if hashlib.sha256((GAME/e['file']).read_bytes()).hexdigest()!=e['export_sha256']:errors.append(e['file']+': export hash')
 im=Image.open(GAME/e['file']);a=np.asarray(im);bbox=im.getbbox()
 if im.mode!='RGBA' or im.size!=(128,128):errors.append(e['file']+': size/mode')
 if not bbox or min(bbox[:2])<2 or max(bbox[2:])>126:errors.append(e['file']+': padding/empty')
 if set(np.unique(a[:,:,3]))-{0,255} or np.any(a[a[:,:,3]==0,:3]):errors.append(e['file']+': transparency')
 if {tuple(c) for c in a[a[:,:,3]==255,:3]}-palette:errors.append(e['file']+': palette')
 if e['origin']!=[64,64] or e['body_anchor']!=[64,64]:errors.append(e['file']+': anchor')
 if hashlib.sha256((GAME/e['source']).read_bytes()).hexdigest()!=e['source_sha256']:errors.append(e['file']+': source hash')
 stats[e['file']]={'bbox':list(bbox),'origin':e['origin'],'opaque_pixels':int((a[:,:,3]==255).sum())}
actual={p.relative_to(GAME).as_posix() for p in (GAME/'assets/enemy_animations').glob('*.png')}
if actual!={e['file'] for e in entries} or len(entries)!=64:errors.append('inventory must be64')
for species in ['compy','parasaurolophus','carnotaurus','ankylosaurus']:
 for d in ['S','E','N','W']:
  frames=[np.asarray(Image.open(GAME/f'assets/enemy_animations/{species}_{state}_{d}_000.png')) for state in ['step_left','step_right']]
  if np.array_equal(*frames):errors.append(species+d+': duplicate strides')
report={'technical_export_result':'FAIL' if errors else 'PASS','frames':stats,'new_enemy_assets':len(entries),'errors':errors,'production_approved':False,'visual_review':'Native1x dark/light grids and enemy_review.html4x. Generated studies have minor anatomy/marking/registration variation. No production visual approval. Rejected clips and lateral Compy gapes excluded.','scope':'RGBA binary alpha, palette, native size, fixed declared pivots, source SHA, padding, inventory and distinct stride images. Does not prove anatomical alignment or temporal art quality.'}
(GAME/'enemy_sprite_validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='frames'},indent=2));raise SystemExit(bool(errors))
