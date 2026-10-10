"""Extract generated ground-food props with fixed cells and integer sampling."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'PRIMAL_RUN_Game'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
source=GAME/'Source_Generated/forage/food_pickups.png';pic=Image.open(source).convert('RGBA');palette=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((GAME/'palette.json').read_text())['colors']],dtype=np.int32);manifest=[];grid=Image.new('RGBA',(4*64,2*84),'#e8ece1');d=ImageDraw.Draw(grid)
for i,(kind,variant) in enumerate([(k,v) for k in ['fruit','roots','mushrooms','toxic_mushrooms'] for v in [0,1]]):
 row,col=divmod(i,4);crop=[col*384,row*512,(col+1)*384,(row+1)*512];a=np.array(pic.crop(crop))[4::8,4::8].copy();visible=a[:,:,3]>=192;rgb=a[:,:,:3].astype(np.int32);idx=np.argmin(((rgb[:,:,None,:]-palette[None,None,:,:])**2).sum(axis=3),axis=2);a[:,:,:3]=palette[idx];a[:,:,3]=np.where(visible,255,0);a[~visible]=0;out=np.zeros((64,64,4),dtype=np.uint8);out[:,8:56]=a;file=f'assets/forage/{kind}_{variant}.png';p=GAME/file;p.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(out).save(p)
 manifest.append({'file':file,'food_type':kind,'variant':variant,'size':[64,64],'origin':[32,32],'source':source.relative_to(GAME).as_posix(),'source_sha256':sha(source),'export_sha256':sha(p),'source_crop':crop,'source_sample_stride':8,'alpha_threshold':192,'status':'prototype_static','production_approved':False,'animation_ready':False})
 grid.alpha_composite(Image.fromarray(out),(col*64,row*84+20));d.text((col*64,row*84),kind[:8]+str(variant),fill='#28372a')
(GAME/'forage_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');p=GAME/'previews/forage/native.png';p.parent.mkdir(parents=True,exist_ok=True);grid.save(p)
(GAME/'Source_Generated/forage/sources.json').write_text(json.dumps({'source':source.relative_to(GAME).as_posix(),'sha256':sha(source),'layout':'four columns/two rows; fruit2, roots2, edible mushrooms2, poisonous mushrooms2','reference':'Canonical herb/fruit_bush/roots/mushrooms ecological props','review':'Fallen fruit replaces whole fruit bush at edible pickups; toxic olive caps and explicit warning remain distinguishable. Native technical checks are not production approval.','production_approved':False},indent=2)+'\n');print('Exported8 ground-food prototypes.')
