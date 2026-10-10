"""Extract dedicated HUD heads. No anatomy drawing, interpolation or bbox recentering."""
from pathlib import Path
import hashlib,json,sys
import numpy as np
from PIL import Image,ImageDraw
from export_enemy_animations import isolate
ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'PRIMAL_RUN_Game'
STATES=['idle','eat','fight','hurt','sneak']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def export():
 config=json.loads((GAME/'Source_Generated/avatars/sources.json').read_text());manifest=[]
 palette=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((GAME/'palette.json').read_text())['colors']],dtype=np.int32)
 for sheet in config:
  source=GAME/sheet['source'];pic=Image.open(source).convert('RGBA')
  for row,species in enumerate(sheet['species']):
   grid=Image.new('RGBA',(20*64,84),'#e8ece1');d=ImageDraw.Draw(grid)
   for stateIndex,state in enumerate(STATES):
    for frame in range(4):
     col=stateIndex*4+frame;cx=sheet['centres_x'][col];cy=sheet['centres_y'][row];crop=[cx-36,cy-90,cx+36,cy+90];sample=np.array(pic.crop(crop))[1::3,1::3].copy();visible=isolate(sample[:,:,3]>=248,0)
     colors=sample[:,:,:3].astype(np.int32);idx=np.argmin(((colors[:,:,None,:]-palette[None,None,:,:])**2).sum(axis=3),axis=2);sample[:,:,:3]=palette[idx];sample[:,:,3]=np.where(visible,255,0);sample[~visible]=0
     out=np.zeros((64,64,4),dtype=np.uint8);out[2:62,20:44]=sample;file=f'assets/avatars/{species}_{state}_{frame:03}.png';p=GAME/file;p.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(out).save(p)
     manifest.append({'file':file,'species':species,'state':state,'frame':frame,'size':[64,64],'origin':[32,32],'source':sheet['source'],'source_sha256':sha(source),'export_sha256':sha(p),'source_crop':crop,'source_anchor':[cx,cy],'source_sample_stride':3,'alpha_threshold':248,'status':'prototype_static','production_approved':False,'animation_ready':False})
     grid.alpha_composite(Image.fromarray(out),(col*64,20));d.text((col*64,3),f'{state} {frame}',fill='#28372a')
   p=GAME/f'previews/avatars/{species}.png';p.parent.mkdir(parents=True,exist_ok=True);grid.save(p)
 (GAME/'avatar_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(f'Exported {len(manifest)} dedicated HUD heads for {len(manifest)//20} species; prototypes, not anatomy-approved.')
if __name__=='__main__':export()
