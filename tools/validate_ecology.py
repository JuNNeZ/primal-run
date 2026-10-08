from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'PRIMAL_RUN_Game';manifest=json.loads((GAME/'ecology_manifest.json').read_text());palette={tuple(int(c[i:i+2],16)for i in (1,3,5))for c in json.loads((GAME/'palette.json').read_text())['colors']};errors=[]
for entry in manifest:
 p=GAME/entry['file'];im=Image.open(p);a=np.asarray(im);bbox=im.getbbox()
 if im.mode!='RGBA' or list(im.size)!=entry['size']:errors.append(entry['file']+': canvas')
 if not set(np.unique(a[:,:,3]))<={0,255} or np.any(a[a[:,:,3]==0,:3]):errors.append(entry['file']+': transparency')
 if {tuple(v)for v in a[a[:,:,3]==255,:3]}-palette:errors.append(entry['file']+': palette')
 if not bbox or min(bbox[:2])<2 or bbox[2]>im.width-2 or bbox[3]>im.height-2:errors.append(entry['file']+': clipped/padding')
 for field,file in [('source_sha256',GAME/entry['source']),('export_sha256',p)]:
  if hashlib.sha256(file.read_bytes()).hexdigest()!=entry[field]:errors.append(entry['file']+': hash')
 if entry['production_approved'] or entry['animation_ready']:errors.append(entry['file']+': approval')
if len(manifest)!=24 or len({e['file']for e in manifest})!=24:errors.append('inventory')
for kind in ['dragonfly','beetle','firefly']:
 if (GAME/f'assets/ecology/{kind}_0.png').read_bytes()==(GAME/f'assets/ecology/{kind}_1.png').read_bytes():errors.append(kind+': duplicate poses')
report={'status':'FAIL'if errors else'PASS','assets':24,'props':18,'insect_poses':6,'errors':errors,'checks':['RGBA/native size','fixed32 palette','binary alpha/transparent RGB0','two pixel padding','source/export integrity','distinct insect studies'],'production_approved':False};(GAME/'ecology_validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));raise SystemExit(bool(errors))
