"""Native integer source sampling; no synthesized fish poses or interpolation."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
GAME=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
source=GAME/'Source_Generated/fishing/fish_sheet.png'
image=Image.open(source).convert('RGBA');assert image.size==(1254,1254)
palette=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((GAME/'palette.json').read_text())['colors']],dtype=np.int32)
manifest=[]
for n in range(4):
 x,y=n%2*627,n//2*627;crop=[x,y,x+627,y+627];a=np.array(image.crop(crop))[1::13,1::13].copy();visible=a[:,:,3]>=192
 colors=a[:,:,:3].astype(np.int32);idx=np.argmin(((colors[:,:,None,:]-palette[None,None,:,:])**2).sum(axis=3),axis=2);a[:,:,:3]=palette[idx];a[:,:,3]=np.where(visible,255,0);a[~visible]=0
 out=np.zeros((64,64,4),dtype=np.uint8);out[8:8+a.shape[0],8:8+a.shape[1]]=a
 file=f'assets/fishing/fish_{n:03}.png';p=GAME/file;p.parent.mkdir(parents=True,exist_ok=True);im=Image.fromarray(out);im.save(p)
 box=im.getbbox();assert box and min(box[:2])>=2 and max(box[2:])<=62
 manifest.append(dict(file=file,size=[64,64],origin=[32,32],body_anchor=[32,32],source=str(source.relative_to(GAME)),source_crop=crop,source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),export_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),status='prototype_static',production_approved=False,animation_ready=False,export='Integer13 sampling at offset1, fixed32 palette, alpha>=192; no interpolation.'))
for colour,label in [('#151b19','dark'),('#e8ece1','light')]:
 grid=Image.new('RGBA',(256,64),colour)
 for n,e in enumerate(manifest):grid.alpha_composite(Image.open(GAME/e['file']),(n*64,0))
 p=GAME/f'previews/fishing/{label}_1x.png';p.parent.mkdir(parents=True,exist_ok=True);grid.save(p)
(GAME/'fishing_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(GAME/'fishing_validation.json').write_text(json.dumps(dict(result='PASS',frames=4,native_size=[64,64],padding=True,palette=True,binary_alpha=True,production_approved=False,scope='Technical extraction only, not visual animation approval.'),indent=2)+'\n')
print('Exported and technically validated four native fish poses.')
