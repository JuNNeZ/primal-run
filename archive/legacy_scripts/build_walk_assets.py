from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json,shutil

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'PRIMAL_RUN_Demo_v3'
OUT.mkdir(exist_ok=True)
SOURCE=OUT/'Source_Generated/utahraptor_walk_S_sheet.png'
source_dir=OUT/'Source_Generated';source_dir.mkdir(exist_ok=True)
# Source sheet is already stored in this repository.
palette_json=json.loads((ROOT/'PRIMAL_RUN_Demo_v2/palette.json').read_text(encoding='utf-8'))
palette=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in palette_json['colors']],dtype=np.int32)
sheet=Image.open(SOURCE).convert('RGBA')
assert sheet.size==(1536,1024),sheet.size
frames=[]
dest=OUT/'assets/player';dest.mkdir(parents=True,exist_ok=True)
for i in range(6):
    x=(i%3)*512;y=(i//3)*512
    pic=sheet.crop((x,y,x+512,y+512)).resize((128,128),Image.Resampling.NEAREST)
    a=np.array(pic);visible=a[:,:,3]>=128
    rgb=a[:,:,:3].astype(np.int32)
    index=((rgb[:,:,None,:]-palette[None,None,:,:])**2).sum(axis=3).argmin(axis=2)
    a[:,:,:3]=palette[index].astype(np.uint8);a[:,:,3]=np.where(visible,255,0);a[~visible,:3]=0
    pic=Image.fromarray(a,'RGBA');frames.append(pic)

# Animation assembly: reuse a single generated body layer, with generated
# foot-phase pixels in two fixed limb windows. This prevents identity shimmer.
# The original generated sheet remains intact for review.
limb_windows=[(34,79,52,114),(76,78,96,114)]
body=frames[0].copy()
for box in limb_windows:body.paste((0,0,0,0),box)
assembled=[]
for i,phase in enumerate(frames):
    frame=body.copy()
    for box in limb_windows:frame.alpha_composite(phase.crop(box),(box[0],box[1]))
    frame.save(dest/f'utahraptor_walk_S_{i:03}.png');assembled.append(frame)
frames=assembled

# Use a matching rest frame, so changing state cannot change body scale/identity.
frames[1].save(dest/'utahraptor_idle_S_000.png')
(OUT/'walk_assembly.json').write_text(json.dumps({'canvas':[128,128],'origin':[64,72],
    'body_source_frame':0,'limb_windows':limb_windows,'idle_source_frame':1,
    'method':'fixed generated body layer with six generated foot phases; no body resynthesis',
    'fps':8,'loop':True,'direction':'S','production_approved':False},indent=2))

preview=Image.new('RGB',(6*272,552),(21,27,25));d=ImageDraw.Draw(preview)
for i,pic in enumerate(frames):
    x=i*272
    for row,color in enumerate([(226,228,219),(40,55,42)]):
        y=row*276;d.rectangle((x,y,x+267,y+271),fill=color)
        preview.paste(pic.resize((256,256),Image.Resampling.NEAREST),(x+6,y+6),pic.resize((256,256),Image.Resampling.NEAREST))
        d.text((x+6,y+262),str(i),fill=(0,0,0) if row==0 else (237,208,160))
preview.save(OUT/'walk_contact_sheet.png')
for name,color,scale in [('walk_loop_dark',(40,55,42),4),('walk_loop_light',(226,228,219),4),('walk_loop_native',(40,55,42),1)]:
    views=[]
    for pic in frames:
        view=Image.new('RGB',(128,128),color);view.paste(pic,(0,0),pic)
        views.append(view.resize((128*scale,128*scale),Image.Resampling.NEAREST))
    views[0].save(OUT/(name+'.gif'),save_all=True,append_images=views[1:],duration=[120,130,120,130,120,130],loop=0,disposal=2)

# Compare only the central torso/head/tail columns, avoiding the moving legs.
arrays=[np.asarray(pic) for pic in frames]
reference=arrays[0][4:125,59:69]
metrics=[]
for i,a in enumerate(arrays):
    matches=[]
    for dy in range(-2,3):
        for dx in range(-2,3):
            sample=a[4+dy:125+dy,59+dx:69+dx]
            score=np.mean(np.any(sample!=reference,axis=2));matches.append((score,dx,dy))
    best=min(matches)
    metrics.append({'frame':i,'central_pixel_difference_fraction':float(np.mean(np.any(a[4:125,59:69]!=reference,axis=2))),
                    'best_body_translation':[best[1],best[2]],'best_difference_fraction':float(best[0]),
                    'bounds':frames[i].getbbox()})
(OUT/'walk_alignment_review.json').write_text(json.dumps(metrics,indent=2))
print(json.dumps(metrics,indent=2))
