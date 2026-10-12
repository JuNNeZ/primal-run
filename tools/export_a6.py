"""Extract authored A6 sources using fixed integer samples, alpha and palette only."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image

G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
S=G/'Source_Generated/a6'
PALETTE=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((G/'palette.json').read_text())['colors']],dtype=np.int32)
LAVA={'54282d','913b32','c6663c','de954a','ded392'}
BOUNDS=[0,314,627,941,1254]
NAMES=['food_meat','food_plants','food_fish','dna_chip','zone_chip','pack_follow','pack_focus','reroll']
manifest=[]

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def extract(source,crop,stride,offset,size,placement,opaque):
    raw=np.array(Image.open(source).convert('RGBA').crop(crop))[offset::stride,offset::stride].copy()
    h,w=size[1],size[0]
    if opaque:raw=raw[:h,:w]
    else:
        canvas=np.zeros((h,w,4),dtype=np.uint8)
        canvas[placement[1]:placement[1]+raw.shape[0],placement[0]:placement[0]+raw.shape[1]]=raw
        raw=canvas
    assert raw.shape==(h,w,4),(source,raw.shape,size)
    rgb=raw[:,:,:3].astype(np.int32)
    idx=np.argmin(((rgb[:,:,None,:]-PALETTE[None,None,:,:])**2).sum(axis=3),axis=2)
    raw[:,:,:3]=PALETTE[idx]
    raw[:,:,3]=255 if opaque else np.where(raw[:,:,3]>=192,255,0)
    raw[raw[:,:,3]==0,:3]=0
    return Image.fromarray(raw)

def export(source,crop,stride,offset,size,placement,file,family,mask=None):
    image=extract(source,crop,stride,offset,size,placement,family=='lava_ash')
    output=G/file;output.parent.mkdir(parents=True,exist_ok=True);image.save(output)
    entry=dict(file=file,size=size,origin=[0,0] if family=='lava_ash' else [12,12],family=family,
        source=source.relative_to(G).as_posix(),source_sha256=sha(source),source_crop=crop,
        sampling_stride=stride,sampling_offset=offset,placement=placement,
        export_sha256=sha(output),status='prototype_static',production_approved=False,animation_ready=False)
    if mask is not None:entry['mask']=mask
    manifest.append(entry)

for n,name in enumerate(NAMES):
    row,col=divmod(n,4)
    export(S/'hud_revision1.png',[BOUNDS[col],row*392,BOUNDS[col+1],(row+1)*392],20,10,[24,24],[4,2],f'assets/a6_hud/{name}.png','hud_chip')
corrections=json.loads((S/'corrections.json').read_text()) if (S/'corrections.json').exists() else {}
for mask in range(16):
    row,col=divmod(mask,4);source=S/'lava_revision1.png';crop=[BOUNDS[col],BOUNDS[row],BOUNDS[col+1],BOUNDS[row+1]]
    if str(mask) in corrections:
        correction=corrections[str(mask)];source=G/correction['source'];crop=correction['crop']
    export(source,crop,10,1,[32,32],[0,0],f'assets/lava_ash/lava_ash_{mask:02}.png','lava_ash',mask)
(G/'a6_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
out=G/'previews/a6';out.mkdir(parents=True,exist_ok=True)
for bg,name in [('#e8ece1','light'),('#151b19','dark')]:
    grid=Image.new('RGBA',(192,48),bg)
    for i,n in enumerate(NAMES):grid.alpha_composite(Image.open(G/f'assets/a6_hud/{n}.png'),((i%8)*24,0))
    grid.save(out/f'hud_{name}_1x.png')
    grid.resize((768,192),Image.Resampling.NEAREST).save(out/f'hud_{name}_4x.png')
grid=Image.new('RGBA',(128,128))
for mask in range(16):grid.alpha_composite(Image.open(G/f'assets/lava_ash/lava_ash_{mask:02}.png'),((mask%4)*32,(mask//4)*32))
grid.save(out/'lava_masks_1x.png');grid.resize((512,512),Image.Resampling.NEAREST).save(out/'lava_masks_4x.png')
print('Exported eight native HUD icons and sixteen lava/ash tiles; prototypes only.')
