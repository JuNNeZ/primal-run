from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json, shutil, zipfile
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'PRIMAL_RUN_Demo_v5'
shutil.copytree(ROOT/'PRIMAL_RUN_Demo_v4',OUT,dirs_exist_ok=True)
SOURCE=OUT/'Source_Generated/utahraptor_walk_E_W_sheet.png'
# Source sheet is already stored in this repository.
colors=json.loads((OUT/'palette.json').read_text(encoding='utf-8'))['colors']
palette=np.array([[int(c[j:j+2],16) for j in (1,3,5)] for c in colors],dtype=np.int32)
sheet=Image.open(SOURCE).convert('RGBA');w,h=sheet.size
origins={'S':[64,72],'N':[64,56],'E':[68,64],'W':[60,64]}
frames={'S':[Image.open(OUT/f'assets/player/utahraptor_walk_S_{i:03}.png').convert('RGBA') for i in range(6)]}
for direction,row_offset in [('E',0),('W',2)]:
    frames[direction]=[]
    for i in range(6):
        col=i%3;row=row_offset+i//3
        box=(round(col*w/3),round(row*h/4),round((col+1)*w/3),round((row+1)*h/4))
        sample=sheet.crop(box).resize((120,120),Image.Resampling.NEAREST)
        a=np.array(sample);visible=a[:,:,3]>=128;rgb=a[:,:,:3].astype(np.int32)
        index=((rgb[:,:,None,:]-palette[None,None,:,:])**2).sum(3).argmin(2)
        a[:,:,:3]=palette[index].astype(np.uint8);a[:,:,3]=np.where(visible,255,0);a[~visible,:3]=0
        # Manual spine registration from frame review: the generated lower
        # rows place the back axis too high in their cells. Correct whole poses
        # with integer offsets, not independent bounding-box centering.
        offset_y=(0 if i<3 else 7) if direction=='E' else (13 if i<3 else 25)
        pic=Image.new('RGBA',(128,128));pic.paste(Image.fromarray(a),(4,4+offset_y))
        pic.save(OUT/f'assets/player/utahraptor_walk_{direction}_{i:03}.png');frames[direction].append(pic)
    frames[direction][0].save(OUT/f'assets/player/utahraptor_idle_{direction}_000.png')
# User explicitly requested a 180-degree north prototype. This is a lossless
# pixel transpose. The edge-coordinate pivot transforms to (128-x,128-y).
frames['N']=[p.transpose(Image.Transpose.ROTATE_180) for p in frames['S']]
for i,pic in enumerate(frames['N']):pic.save(OUT/f'assets/player/utahraptor_walk_N_{i:03}.png')
Image.open(OUT/'assets/player/utahraptor_idle_S_000.png').transpose(Image.Transpose.ROTATE_180).save(OUT/'assets/player/utahraptor_idle_N_000.png')
manifest=[e for e in json.loads((OUT/'manifest.json').read_text(encoding='utf-8')) if not e['file'].startswith('assets/player/')]
animations=[]
for direction in ['S','N','E','W']:
    for state,amount in [('idle',1),('walk',6)]:
        files=[f'assets/player/utahraptor_{state}_{direction}_{i:03}.png' for i in range(amount)]
        for file in files:
            manifest.append({'file':file,'size':[128,128],'origin':origins[direction],'body_anchor':origins[direction],'status':'prototype_static','animation_ready':False,'direction':direction,'source':'Source_Generated/utahraptor_walk_E_W_sheet.png' if direction in ['E','W'] else 'Source_Generated/utahraptor_walk_S_sheet.png','export':'whole-pose nearest-neighbor palette export' if direction!='N' else 'user-requested lossless 180-degree rotation of South; lighting rotates too'})
        animations.append({'name':state.title()+'_'+direction,'frames':files,'origin':origins[direction],'loop':state=='walk','fps':8 if state=='walk' else None,'production_approved':False})
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
(OUT/'animation_manifest.json').write_text(json.dumps({'object':'Player','canvas':[128,128],'animations':animations,'direction_origins':origins,'north_caveat':'Rotated South prototype; lighting rotates. Collision must remain independent of image silhouette.','GDevelop_runtime':'NOT RUN'},indent=2))
js=(ROOT/'PRIMAL_RUN_Demo_v4/demo.js').read_text(encoding='utf-8')
js=js.replace('/* PRIMAL RUN art demo v3: fixed-body six-frame South walk prototype. */','/* PRIMAL RUN v5: four cardinal walk prototypes. */')
js=js.replace("for(let i=0;i<6;i++)paths['walk'+i]='assets/player/utahraptor_walk_S_'+String(i).padStart(3,'0')+'.png';", "const playerOrigins={S:[64,72],N:[64,56],E:[68,64],W:[60,64]};\nfor(const d of ['S','N','E','W']){paths['idle'+d]='assets/player/utahraptor_idle_'+d+'_000.png';for(let i=0;i<6;i++)paths['walk'+d+i]='assets/player/utahraptor_walk_'+d+'_'+String(i).padStart(3,'0')+'.png';}")
js=js.replace("playerAnimation:'Idle_S',walkTime", "facing:'S',playerAnimation:'Idle_S',walkTime")
start=js.index(' const walksSouth=');end=js.index(' if(state.spawn>=',start)
js=js[:start]+''' const moving=n>0&&Math.hypot(movedX,movedY)>.001;
 if(n){const next=Math.abs(dx)>Math.abs(dy)?(dx>0?'E':'W'):(dy>0?'S':'N');if(next!==state.facing){state.facing=next;state.walkTime=0;state.walkFrame=0;}}
 if(moving){state.playerAnimation='Walk_'+state.facing;state.walkTime=(state.walkTime+dt)%.75;state.walkFrame=Math.min(5,Math.floor(state.walkTime*8));}
 else{state.playerAnimation='Idle_'+state.facing;state.walkTime=0;state.walkFrame=0;}
'''+js[end:]
js=js.replace("{...state.player,name:'player',origin:[64,72]}","{...state.player,name:'player',origin:playerOrigins[state.facing]}")
js=js.replace("o.name==='player'&&state.playerAnimation==='Walk_S'?'walk'+state.walkFrame:o.name", "o.name==='player'?(state.playerAnimation.startsWith('Walk_')?'walk'+state.facing+state.walkFrame:'idle'+state.facing):o.name")
js=js.replace("(state.playerAnimation==='Walk_S'?'Walk S · frame '+(state.walkFrame+1)+'/6':'Idle S')", "(state.playerAnimation.startsWith('Walk_')?'Walk '+state.facing+' · frame '+(state.walkFrame+1)+'/6':'Idle '+state.facing)")
(OUT/'demo.js').write_text(js,encoding='utf-8')
html=(ROOT/'PRIMAL_RUN_Demo_v4/demo.html').read_text(encoding='utf-8').replace('v4','v5').replace('V4','V5').replace('SOUTH WALK PROTOTYPE','FOUR DIRECTIONS PROTOTYPE')
html=html.replace('Tryk <kbd>S</kbd> eller <kbd>↓</kbd> for at se Utahraptorens seks-frame gå-loop mod syd. De øvrige retninger bruger stadig en fast pose.','WASD viser nu gå-loops i alle fire retninger. Op er en foreløbig 180° drejning af syd. Diagonal bevægelse bruger den nærmeste af de fire retninger.')
(OUT/'demo.html').write_text(html,encoding='utf-8')
rules='''# PRIMAL RUN - four-direction prototype v5
Follow the included v1/v2 references. Preserve V4.
Four directions: S/N/E/W, six walk frames each at 8 fps, one matching idle each.
Every player image is native RGBA 128x128, fixed 24-color palette, binary alpha,
transparent RGB zero, at least two pixels padding. Export whole poses.
Logical origins: S=(64,72), N=(64,56), E=(68,64), W=(60,64).
Direction origins are fixed throughout each series. Collision stays at gameplay
position with a fixed radius; visible tails and limbs do not alter collision.
E/W are separately generated overhead poses; never use rejected side-profile art.
N is a user-requested lossless 180-degree South rotation. Its light also rotates;
this explicit prototype exception must be resolved before production approval.
No filtering or smoothed rotation. Cardinal facing persists when stopped.
Diagonal movement selects a cardinal view, with vertical input winning ties.
Review light/dark loops, frame seams, anatomy and texture variation. Generated
pose details may vary; export checks do not certify perfect animation.
Browser movement tests are separate from GDevelop runtime, which is NOT RUN.
All sprites remain prototypes, production_approved=false.
'''
(OUT/'SPRITE_RULES.md').write_text(rules)
(OUT/'README.md').write_text('''# PRIMAL RUN v5
Open demo.html. WASD/arrows move in four directions; Space bites, R restarts.
Import individual PNGs from assets/player, not the Source_Generated sheets.
Create Idle_S/N/E/W and Walk_S/N/E/W. Import frames _000 through _005 in order.
Use 0.125 seconds per walk frame, loop enabled, nearest-neighbor pixel rendering.
Set each animation origin from animation_manifest.json: S 64,72; N 64,56;
E 68,64; W 60,64. Keep a fixed torso collision shape independent of animation.
North is a lossless 180-degree South rotation, including its lighting, as a demo
shortcut. East and West are separately drawn top-down poses. Diagonal input
uses a cardinal view. Facing persists on stop; blockage does not animate walking.
This is a browser-tested prototype, not a GDevelop project/runtime certification.
Generated texture/shape variation remains for visual review. All prior packs remain.
Built-in imagegen was used; final directional prompt is included.
''')
(OUT/'walk_assembly.json').write_text(json.dumps({'method':'whole-pose exports, North lossless rotation','spine_registration_offsets_y':{'E':[0,0,0,7,7,7],'W':[13,13,13,25,25,25]},'direction_origins':origins,'source_sheet_size':[w,h],'fps':8,'production_approved':False},indent=2))
for direction in ['E','W','N']:
    for label,color,scale in [('dark',(40,55,42),4),('light',(226,228,219),4),('native',(40,55,42),1)]:
        views=[]
        for pic in frames[direction]:
            bg=Image.new('RGB',(128,128),color);bg.paste(pic,(0,0),pic)
            views.append(bg.resize((128*scale,128*scale),Image.Resampling.NEAREST))
        views[0].save(OUT/f'walk_{direction}_{label}.gif',save_all=True,append_images=views[1:],duration=[120,130]*3,loop=0,disposal=2)
contact=Image.new('RGB',(6*264,4*278),(40,55,42));draw=ImageDraw.Draw(contact)
for row,d in enumerate(['S','N','E','W']):
    for i,pic in enumerate(frames[d]):
        enlarged=pic.resize((256,256),Image.Resampling.NEAREST);contact.paste(enlarged,(i*264+4,row*278+4),enlarged)
        draw.text((i*264+4,row*278+262),f'{d} {i}',fill=(237,208,160))
contact.save(OUT/'direction_contact_sheet.png')
allowed={tuple(v) for v in palette};checks=[]
for entry in manifest:
    pic=Image.open(OUT/entry['file']);a=np.asarray(pic)
    assert pic.mode=='RGBA' and list(pic.size)==entry['size']
    assert set(np.unique(a[:,:,3])).issubset({0,255}) and np.all(a[a[:,:,3]==0,:3]==0)
    assert all(tuple(v) in allowed for v in a[a[:,:,3]>0,:3])
    if '/player/' in entry['file']:
        x0,y0,x1,y1=pic.getbbox();assert min(x0,y0)>=2 and max(x1,y1)<=126
for d,series in frames.items():
    arr=[np.asarray(p) for p in series];assert len({a.tobytes() for a in arr})==6
    delta=[int(np.any(a!=arr[(i+1)%6],axis=2).sum()) for i,a in enumerate(arr)]
    checks.append({'direction':d,'pixel_changes_between_frames':delta,'loop_seam_within_1_5x_max':delta[-1]<=max(delta[:-1])*1.5})
assert all(e['loop_seam_within_1_5x_max'] for e in checks)
assert len(manifest)==33 and len(list((OUT/'assets').rglob('*.png')))==33
(OUT/'validation_report.json').write_text(json.dumps({'result':'PASS','asset_count':33,'checks':['canvas sizes','RGBA','binary alpha','24-color palette','padding','unique frames','loop seam difference'],'directions':checks,'visual_review':'Prototype; generated markings vary. North lighting is rotated.','GDevelop_runtime':'NOT RUN'},indent=2))
print('PASS: 33 PNGs, four directions, six-frame loops. Source size:',sheet.size)
