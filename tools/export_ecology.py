"""Lossless source sampling, binary alpha and fixed-palette export; no art edits."""
from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
from export_enemy_animations import isolate
ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'PRIMAL_RUN_Game'
source=GAME/'Source_Generated/ecology/jungle_props.png';sheet=Image.open(source).convert('RGBA')
names=['cycad','broad_fern','seed_fern','conifer','horsetail','reeds','shrub','fruit_bush','herb','dry_grass','moss','lichen','roots','mushrooms','leaf_litter','flowers','succulent','twigs','dragonfly_0','dragonfly_1','beetle_0','beetle_1','firefly_0','firefly_1']
palette=np.array([[int(c[i:i+2],16)for i in (1,3,5)]for c in json.loads((GAME/'palette.json').read_text())['colors']],dtype=np.int32)
manifest=[];previews={}
for n,name in enumerate(names):
 row,col=divmod(n,6);ys=[0,320,575,790,1024];crop=[col*256,ys[row],(col+1)*256,ys[row+1]];step=3 if n<18 else 10;size=112 if n<18 else 32
 a=np.array(sheet.crop(crop))[step//2::step,step//2::step].copy();mask=isolate(a[:,:,3]>=192);rgb=a[:,:,:3].astype(np.int32);idx=np.argmin(((rgb[:,:,None,:]-palette[None,None,:,:])**2).sum(axis=3),axis=2);a[:,:,:3]=palette[idx];a[:,:,3]=np.where(mask,255,0);a[~mask]=0
 canvas=np.zeros((size,size,4),dtype=np.uint8);oy=(size-a.shape[0])//2;ox=(size-a.shape[1])//2;canvas[oy:oy+a.shape[0],ox:ox+a.shape[1]]=a;pic=Image.fromarray(canvas);bbox=pic.getbbox()
 if not bbox or min(bbox[:2])<2 or max(bbox[2:])>size-2:raise ValueError((name,bbox))
 path=GAME/'assets/ecology'/f'{name}.png';path.parent.mkdir(exist_ok=True);pic.save(path)
 manifest.append({'file':path.relative_to(GAME).as_posix(),'size':[size,size],'origin':[size//2,size//2],'source':source.relative_to(GAME).as_posix(),'source_crop':crop,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'export_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sampling_step':step,'bbox':list(bbox),'status':'prototype_static','animation_ready':False,'production_approved':False})
 previews[name]=pic
for color,label in [('#151b19','dark'),('#e8ece1','light')]:
 grid=Image.new('RGBA',(6*112,4*112),color)
 for i,name in enumerate(names):grid.alpha_composite(previews[name],(i%6*112+(112-previews[name].width)//2,i//6*112+(112-previews[name].height)//2))
 out=GAME/'previews/ecology';out.mkdir(parents=True,exist_ok=True);grid.save(out/f'{label}_1x.png')
(GAME/'ecology_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Exported 24 ecology studies: 18 props and 6 insect poses.')
