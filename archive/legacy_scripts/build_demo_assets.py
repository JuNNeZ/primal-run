from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json, shutil, zipfile

root=Path(__file__).resolve().parent
out=root/'PRIMAL_RUN_Demo_v2'
paths=json.loads((out/'source_paths.json').read_text())
colors=['151b19','28372a','3f5030','586d38','799447','a8b15b','ded392',
        '443027','674333','8d6042','b98252','d4a36c','edd0a0',
        '3b4144','626861','929387','bab8a2',
        '54282d','913b32','c6663c','de954a','3c7180','69a4a0','a2d4c1']
palette=np.array([[int(c[i:i+2],16) for i in (0,2,4)] for c in colors],dtype=np.int32)
(out/'palette.json').write_text(json.dumps({'name':'Primal Earth 24','colors':['#'+c for c in colors]},indent=2))
specs=[('master','player/utahraptor_idle_S_000.png',(128,128),(64,72)),
       ('compy','enemy/compy_idle_S_000.png',(64,96),(32,54)),
       ('grass','environment/grass.png',(32,32),(0,0)),
       ('fern','environment/fern.png',(64,64),(32,36)),
       ('rock','environment/rock.png',(64,64),(32,36)),
       ('meat','pickups/meat.png',(32,32),(16,16))]
manifest=[];pics={}
source_dir=out/'Source_Generated';source_dir.mkdir(exist_ok=True)
for name,file,size,origin in specs:
    src=source_dir/(name+'.png')
    if not src.exists():shutil.copy2(paths[name],src)
    source=Image.open(src).convert('RGBA')
    # Match aspect ratio without distorting anatomy. Fit to requested canvas.
    if name=='grass': pic=source.resize(size,Image.Resampling.NEAREST)
    else:
        factor=min(size[0]/source.width,size[1]/source.height)
        fitted=source.resize((round(source.width*factor),round(source.height*factor)),Image.Resampling.NEAREST)
        pic=Image.new('RGBA',size);pic.alpha_composite(fitted,((size[0]-fitted.width)//2,(size[1]-fitted.height)//2))
    a=np.array(pic);visible=a[:,:,3]>=128
    if name=='grass':visible[:]=True
    if name!='grass':visible[:2]=False;visible[-2:]=False;visible[:,:2]=False;visible[:,-2:]=False
    rgb=a[:,:,:3].astype(np.int32)
    distances=((rgb[:,:,None,:]-palette[None,None,:,:])**2).sum(axis=3)
    a[:,:,:3]=palette[distances.argmin(axis=2)].astype(np.uint8)
    a[:,:,3]=np.where(visible,255,0);a[~visible,:3]=0
    pic=Image.fromarray(a,'RGBA');dest=out/'assets'/file;dest.parent.mkdir(parents=True,exist_ok=True);pic.save(dest)
    pics[name]=pic
    manifest.append({'file':'assets/'+file,'size':list(size),'origin':list(origin),
                     'body_anchor':list(origin) if name in ('master','compy') else None,
                     'status':'prototype_static','direction':'S' if name in ('master','compy') else None,
                     'frame_count':1,'animation_ready':False,'source':'Source_Generated/'+name+'.png',
                     'export':'aspect-preserving nearest-neighbor sampling, fixed 24-color palette, binary alpha'})
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))

# Show exported assets at true integer 2x, with light and dark backing.
sheet=Image.new('RGB',(960,700),(21,27,25));d=ImageDraw.Draw(sheet)
d.text((28,18),'PRIMAL RUN  /  ORIGINAL DEMO KIT V2',fill=(237,208,160))
for i,(name,file,size,origin) in enumerate(specs):
    x=20+(i%3)*314;y=52+(i//3)*310
    d.rectangle((x,y,x+299,y+265),fill=(225,228,218))
    d.rectangle((x+150,y,x+299,y+265),fill=(40,55,42))
    pic=pics[name].resize((size[0]*2,size[1]*2),Image.Resampling.NEAREST)
    sheet.paste(pic,(x+(300-pic.width)//2,y+(266-pic.height)//2),pic)
    d.text((x+8,y+273),name+'  /  '+str(size[0])+'x'+str(size[1]),fill=(237,208,160))
sheet.save(out/'preview.png')

# Terrain repetition review at integer 4x, no smoothing.
tile=pics['grass'];grid=Image.new('RGBA',(96,96))
for y in range(3):
    for x in range(3):grid.alpha_composite(tile,(x*32,y*32))
grid.resize((384,384),Image.Resampling.NEAREST).save(out/'grass_repeat_review.png')

errors=[]
valid_colors=set(map(tuple,palette.tolist()))
for e in manifest:
    pic=Image.open(out/e['file']);a=np.array(pic);visible=a[:,:,3]>0
    if pic.mode!='RGBA' or pic.size!=tuple(e['size']):errors.append(e['file']+':format/dimensions')
    if not set(np.unique(a[:,:,3])).issubset({0,255}):errors.append(e['file']+':alpha')
    if np.any(a[~visible,:3]):errors.append(e['file']+':transparent RGB')
    if not set(map(tuple,a[visible,:3].tolist())).issubset(valid_colors):errors.append(e['file']+':palette')
    if not visible.any():errors.append(e['file']+':empty')
    if e['file']!='assets/environment/grass.png' and (visible[:2].any() or visible[-2:].any() or visible[:,:2].any() or visible[:,-2:].any()):errors.append(e['file']+':padding')
report={'technical_export':'PASS' if not errors else 'FAIL','errors':errors,'asset_count':len(manifest),
        'palette_color_count':len(colors),'frame_animations':0,'GDevelop_runtime':'NOT RUN',
        'style_status':'demo prototype; reviewed at native export resolution',
        'grass_status':'repeat preview supplied; final seamless production tiles pending'}
(out/'validation_report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
if errors:raise SystemExit(1)
