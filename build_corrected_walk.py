from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json, shutil, zipfile

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'PRIMAL_RUN_Demo_v4'
SOURCE=OUT/'Source_Generated/utahraptor_walk_S_sheet.png'
OUT.mkdir(exist_ok=True)
for name in ['assets','palette.json','demo.js','animation_manifest.json','manifest.json','SPRITE_RULES_v1_reference.md','SPRITE_RULES_v2_reference.md']:
    src=ROOT/'PRIMAL_RUN_Demo_v3'/name
    if src.is_dir(): shutil.copytree(src,OUT/name,dirs_exist_ok=True)
    else: shutil.copy2(src,OUT/name)
sources=OUT/'Source_Generated';sources.mkdir(exist_ok=True)
# Source sheet is already stored in this repository.
for name in ['compy','grass','fern','rock','meat']:
    shutil.copy2(ROOT/'PRIMAL_RUN_Demo_v3/Source_Generated'/f'{name}.png',sources/f'{name}.png')
colors=json.loads((OUT/'palette.json').read_text(encoding='utf-8'))['colors']
palette=np.array([[int(c[j:j+2],16) for j in (1,3,5)] for c in colors],dtype=np.int32)
sheet=Image.open(SOURCE).convert('RGBA');assert sheet.size==(1536,1024)
frames=[]
for i in range(6):
    x=i%3*512;y=i//3*512
    # Export whole generated poses, never replace the torso with a frozen layer.
    sampled=sheet.crop((x,y,x+512,y+512)).resize((120,120),Image.Resampling.NEAREST)
    pic=Image.new('RGBA',(128,128));pic.paste(sampled,(4,4))
    a=np.array(pic);visible=a[:,:,3]>=128
    rgb=a[:,:,:3].astype(np.int32)
    index=((rgb[:,:,None,:]-palette[None,None,:,:])**2).sum(3).argmin(2)
    a[:,:,:3]=palette[index].astype(np.uint8);a[:,:,3]=np.where(visible,255,0);a[~visible,:3]=0
    pic=Image.fromarray(a);pic.save(OUT/f'assets/player/utahraptor_walk_S_{i:03}.png');frames.append(pic)
frames[2].save(OUT/'assets/player/utahraptor_idle_S_000.png')
html=(ROOT/'PRIMAL_RUN_Demo_v3/demo.html').read_text(encoding='utf-8').replace('v3','v4').replace('V3','V4')
(OUT/'demo.html').write_text(html,encoding='utf-8')
manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
for entry in manifest:
    if entry['file'].startswith('assets/player/'):
        entry['source']='Source_Generated/utahraptor_walk_S_sheet.png'
        entry['export']='whole pose; nearest-neighbor sampling; fixed palette and binary alpha'
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
animations=json.loads((OUT/'animation_manifest.json').read_text(encoding='utf-8'))
animations['body_motion']='Whole generated poses; torso, hips and tail may move around the fixed logical pivot. Anatomical registration remains subject to visual review.'
(OUT/'animation_manifest.json').write_text(json.dumps(animations,indent=2))
(OUT/'walk_assembly.json').write_text(json.dumps({'method':'whole generated frames; no frozen torso and no limb-window composites','canvas':[128,128],'origin':[64,72],'idle_source_frame':2,'fps':8,'production_approved':False},indent=2))
rules='''# PRIMAL RUN - corrected walk prototype v4

Follow the included v1/v2 rules with these user-requested corrections to v3.
- Six South-facing whole poses at 8 fps; fixed 128x128 canvas and logical origin (64,72).
- Replace the v3 frozen-body rule: hip, torso and tail motion is intentional.
- Keep two muscular hind legs and two small tucked forearms attached at the chest.
  The skull and neck must not acquire ear-like feather fans.
- Native lossless PNG; shared 24-color palette; binary alpha; transparent RGB zero.
- No smoothing, scaling per frame, automatic bounding-box recentering or limb-window assembly.
- Collision and movement use the fixed logical pivot, independent of visible pose motion.
- Review all six whole poses, light/dark previews and 5-to-0 loop closure.
- Browser tests cover movement, stop, blockage, restart and existing demo mechanics.
- Automated checks certify export structure, not anatomy or perfect animation.
- Anatomical registration and residual generated texture variation require visual review.
- Other directions remain static placeholders. GDevelop runtime has not been tested.
- All artwork remains prototype status; production_approved is false.
'''
(OUT/'SPRITE_RULES.md').write_text(rules)
readme=(ROOT/'PRIMAL_RUN_Demo_v3/README.md').read_text(encoding='utf-8').replace('v3','v4').replace('V3','V4')
readme=readme.replace('Space bites, meat heals, and R restarts. V2 is preserved separately.','Space bites, meat heals, and R restarts. V2 and V3 are preserved separately.')
readme=readme.replace('fixed-body/limb-window assembly details','whole-pose export details').replace('and deterministic layer assembly','and whole-pose export')
readme+='\nV4 corrects the ear-like forearm silhouette and replaces the frozen body with whole-frame motion. The fixed origin is a logical gameplay pivot; generated anatomy and texture continuity still require visual review.\n'
(OUT/'README.md').write_text(readme)
preview=Image.new('RGB',(6*272,552));draw=ImageDraw.Draw(preview)
for i,pic in enumerate(frames):
    for row,color in enumerate([(226,228,219),(40,55,42)]):
        x=i*272;y=row*276;draw.rectangle((x,y,x+271,y+275),fill=color)
        p=pic.resize((256,256),Image.Resampling.NEAREST);preview.paste(p,(x+8,y+6),p)
        draw.text((x+8,y+262),str(i),fill=(21,27,25) if row==0 else (237,208,160))
preview.save(OUT/'walk_contact_sheet.png')
for name,color,scale in [('walk_loop_dark',(40,55,42),4),('walk_loop_light',(226,228,219),4),('walk_loop_native',(40,55,42),1)]:
    views=[]
    for pic in frames:
        bg=Image.new('RGB',(128,128),color);bg.paste(pic,(0,0),pic)
        views.append(bg.resize((128*scale,128*scale),Image.Resampling.NEAREST))
    views[0].save(OUT/(name+'.gif'),save_all=True,append_images=views[1:],duration=[120,130,120,130,120,130],loop=0,disposal=2)
allowed={tuple(v) for v in palette};assets=list((OUT/'assets').rglob('*.png'))
assert len(assets)==12
for entry in manifest:
    pic=Image.open(OUT/entry['file']);assert pic.mode=='RGBA' and list(pic.size)==entry['size']
    a=np.asarray(pic);assert set(np.unique(a[:,:,3])).issubset({0,255})
    assert np.all(a[a[:,:,3]==0,:3]==0)
    assert all(tuple(v) in allowed for v in a[a[:,:,3]>0,:3])
    if '/player/' in entry['file']:
        box=pic.getbbox();assert box[0]>=2 and box[1]>=2 and box[2]<=126 and box[3]<=126,box
arrays=[np.asarray(p) for p in frames]
assert len({a.tobytes() for a in arrays})==6
changes=[int(np.any(a!=arrays[(i+1)%6],axis=2).sum()) for i,a in enumerate(arrays)]
body_changes=[int(np.any(a[5:120,55:75]!=arrays[0][5:120,55:75],axis=2).sum()) for a in arrays]
assert all(v>0 for v in body_changes[1:]),body_changes
assert changes[-1]<=max(changes[:-1])*1.5,changes
report={'result':'PASS','assets':12,'checks':['RGBA sizes','24-color palette','binary alpha','transparent RGB zero','player edge padding','six unique whole poses','central body changes across phases','loop seam difference within 1.5x largest adjacent difference'],'adjacent_pixel_changes':changes,'central_body_changes_from_frame_0':body_changes,'visual_caveat':'Pixel differences do not certify anatomical coherence; generated markings can vary.','GDevelop_runtime':'NOT RUN'}
(OUT/'validation_report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
