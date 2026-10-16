from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import shutil,json,html
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'PRIMAL_RUN_Prototype_Kit'
OUT.mkdir(exist_ok=True)
shutil.copytree(ROOT/'PRIMAL_RUN_Demo_v5/assets',OUT/'assets',dirs_exist_ok=True)
shutil.copytree(ROOT/'PRIMAL_RUN_Demo_v5/Source_Generated',OUT/'Source_Generated',dirs_exist_ok=True)
for name in ['demo.html','demo.js','animation_manifest.json']:
    shutil.copy2(ROOT/'PRIMAL_RUN_Demo_v5'/name,OUT/name)
for name in ['SPRITE_RULES_v1_reference.md','SPRITE_RULES_v2_reference.md']:
    shutil.copy2(ROOT/'PRIMAL_RUN_Demo_v5'/name,OUT/name)
base=json.loads((ROOT/'PRIMAL_RUN_Demo_v5/palette.json').read_text(encoding='utf-8'))
base['name']='Primal Earth 32 - original 24 plus fixed UI/VFX accents'
base['colors']+=['#56346f','#8853b0','#bb80d9','#563f8e','#e8ece1','#dfbc52','#8d2028','#2466a0']
(OUT/'palette.json').write_text(json.dumps(base,indent=2))
palette=np.array([[int(c[j:j+2],16) for j in (1,3,5)] for c in base['colors']],dtype=np.int32)
manifest=json.loads((ROOT/'PRIMAL_RUN_Demo_v5/manifest.json').read_text(encoding='utf-8'))
# Reviewed generation sheets are versioned under OUT/Source_Generated.

def export(sheet_name,cols,rows,index,file,size,origin,note,opaque=False,content=None):
    sheet=Image.open(OUT/'Source_Generated'/f'{sheet_name}_sheet.png').convert('RGBA');w,h=sheet.size
    col=index%cols;row=index//cols
    crop=(round(col*w/cols),round(row*h/rows),round((col+1)*w/cols),round((row+1)*h/rows))
    if sheet_name=='enemies':
        # The generated atlas rows are uneven: use reviewed row boundaries,
        # otherwise the next animal's tail leaks into the exported cell.
        boundaries=[0,267,565,855,h]
        crop=(crop[0],boundaries[row],crop[2],boundaries[row+1])
    if sheet_name=='effects' and row==1:
        # The preceding slash row spills red flecks into the dust cell tops.
        # Review places all dust artwork below this crop line.
        crop=(crop[0],crop[1]+45,crop[2],crop[3])
    tile=sheet.crop(crop)
    if sheet_name=='enemies':
        visible_box=Image.fromarray(np.where(np.asarray(tile)[:,:,3]>=192,255,0).astype(np.uint8)).getbbox()
        tile=tile.crop(visible_box)
    if opaque:target=tile.resize(size,Image.Resampling.NEAREST)
    else:
        cw,ch=content or (size[0]-12,size[1]-12)
        if sheet_name=='enemies':
            scale=min(cw/tile.width,ch/tile.height);cw=max(1,round(tile.width*scale));ch=max(1,round(tile.height*scale))
        sampled=tile.resize((cw,ch),Image.Resampling.NEAREST)
        target=Image.new('RGBA',size);target.paste(sampled,((size[0]-cw)//2,(size[1]-ch)//2))
    a=np.array(target);visible=np.ones(a.shape[:2],dtype=bool) if opaque else a[:,:,3]>=192
    if file.startswith('assets/ui/') or file.startswith('assets/player_actions/'):
        # UI symbols have no particle effect. Exclude detached fragments from
        # the neighboring meteor row instead of importing them as icon detail.
        remaining=set(map(tuple,np.argwhere(visible)));components=[]
        while remaining:
            start=remaining.pop();component={start};queue=[start]
            while queue:
                y,x=queue.pop()
                for dy in [-1,0,1]:
                    for dx in [-1,0,1]:
                        n=(y+dy,x+dx)
                        if n in remaining:remaining.remove(n);component.add(n);queue.append(n)
            components.append(component)
        visible[:]=False
        selected=[max(components,key=len)] if file.startswith('assets/ui/') else [c for c in components if len(c)>2]
        for component in selected:
            for y,x in component:visible[y,x]=True
    rgb=a[:,:,:3].astype(np.int32)
    indices=((rgb[:,:,None,:]-palette[None,None,:,:])**2).sum(3).argmin(2)
    a[:,:,:3]=palette[indices].astype(np.uint8);a[:,:,3]=np.where(visible,255,0);a[~visible,:3]=0
    pic=Image.fromarray(a);p=OUT/file;p.parent.mkdir(parents=True,exist_ok=True);pic.save(p)
    manifest.append({'file':file,'size':list(size),'origin':list(origin),'body_anchor':list(origin) if file.startswith('assets/enemies/') or file.startswith('assets/player_actions/') else None,'source':f'Source_Generated/{sheet_name}_sheet.png','source_crop':list(crop),'status':'prototype_static','animation_ready':False,'production_approved':False,'note':note})

# Only overhead South cells pass camera review. Profile samples and incorrectly
# facing North samples are deliberately excluded from the importable assets.
enemies=[(0,'compy',(64,96)),(4,'parasaurolophus',(96,128)),(8,'carnotaurus',(96,128)),(12,'deinosuchus',(192,192)),(13,'tyrannosaurus',(192,192)),(14,'triceratops',(128,128)),(15,'ankylosaurus',(128,128))]
for index,name,size in enemies:export('enemies',4,4,index,f'assets/enemies/{name}_idle_S_000.png',size,(size[0]//2,size[1]//2),'Overhead South static prototype. No walk/run/death animation. Other source directions failed perspective review.')
for index in range(16):
    names=['bite','pounce','death'];state=names[index//4] if index<12 else ['hurt','rest','juvenile','fossil'][index-12]
    frame=index%4 if index<12 else 0
    export('actions',4,4,index,f'assets/player_actions/utahraptor_{state}_S_{frame:03}.png',(128,128),(64,72),'South pose study. Body texture, scale and hip registration differ from walk. Use as optional rough placeholder; not a verified animation.',content=(112,112))
props=['fern_large','boulder_large','dead_tree','fallen_log','tree_canopy','flower_bush','nest_eggs','nest_empty','meat_large','water_pickup','dna_pickup','egg_pickup','skull','ribcage','lava_rock','meteorite']
for index,name in enumerate(props):
    family='pickups' if index in [8,9,10,11] else 'props';size=(32,32) if family=='pickups' else ((128,128) if name in ['tree_canopy','dead_tree','ribcage'] else (64,64))
    export('props',4,4,index,f'assets/{family}/{name}.png',size,(size[0]//2,size[1]//2),'Static overhead/symbol prototype. Props use a conservative center pivot; adjust collision separately.')
for index in range(24):
    if index<12:
        name=['bite_slash','dust','meteor_impact'][index//4];file=f'assets/effects/{name}_{index%4:03}.png';size=(96,96);note='Four-frame non-looping VFX prototype; 10 fps; centered pivot. Verify against gameplay scale.'
    else:
        name=['health','stamina','thirst','hunger','serrated_teeth','powerful_legs','insulating_feathers','dna','xp','bone','armor','escape'][index-12]
        file=f'assets/ui/{name}.png';size=(32,32);note='Static UI icon; fill bars and text are separate functional objects.'
    export('effects',4,6,index,file,size,(size[0]//2,size[1]//2),note)
for index,name in enumerate(['grass_alt','dirt','sand','gravel','forest_floor','shallow_water','deep_water','volcanic']):
    export('tiles',4,2,index,f'assets/tiles/{name}.png',(32,32),(0,0),'Opaque terrain prototype. Tile-repeat preview included; seamless edges and biome transitions not certified.',opaque=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
anim=json.loads((OUT/'animation_manifest.json').read_text(encoding='utf-8'))
anim['optional_pose_studies']=[{'name':name+'_S','frames':[f'assets/player_actions/utahraptor_{name}_S_{i:03}.png' for i in range(4)],'suggested_fps':10 if name=='bite' else 8,'loop':False,'validated_animation':False,'note':'Optional pose study only; not used in browser gameplay.'} for name in ['bite','pounce','death']]
anim['effects']=[{'name':name,'frames':[f'assets/effects/{name}_{i:03}.png' for i in range(4)],'fps':10,'loop':False,'origin':[48,48],'production_approved':False} for name in ['bite_slash','dust','meteor_impact']]
(OUT/'animation_manifest.json').write_text(json.dumps(anim,indent=2))

# An offline catalog links to each PNG and exposes the limitations, not just art.
sections={}
for entry in manifest:sections.setdefault(entry['file'].split('/')[1],[]).append(entry)
cards=[]
for family,items in sections.items():
    cards.append(f'<h2>{html.escape(family)} ({len(items)})</h2><div class="grid">')
    for e in items:
        cards.append(f'<article><a href="{e["file"]}" download><img src="{e["file"]}" alt="{html.escape(Path(e["file"]).name)}"></a><b>{html.escape(Path(e["file"]).name)}</b><p>{e["size"][0]}×{e["size"][1]} · origin {e["origin"]}</p><small>{html.escape(e.get("note",e.get("export","Prototype")))}</small></article>')
    cards.append('</div>')
(OUT/'START_HER.html').write_text('''<!doctype html><html lang="da"><meta charset="utf-8"><title>PRIMAL RUN - prototypepakke</title><style>body{background:#151b19;color:#edd0a0;font:16px system-ui;margin:30px auto;max-width:1250px;padding:20px}a{color:#a8b15b}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}article{padding:16px;background:#28372a;border:1px solid #586d38}img{display:block;width:192px;height:192px;object-fit:contain;image-rendering:pixelated;background:repeating-conic-gradient(#e2e4db 0 25%,#b8bbaa 0 50%) 0/16px 16px}b{display:block;word-break:break-all;font-size:13px;margin-top:12px}small{color:#bab8a2}h2{margin-top:40px}</style><h1>PRIMAL RUN - offline prototypepakke</h1><p>Start med <a href="demo.html">den spilbare demo</a>. WASD/piletaster, Space for bite, 1/2/3 for mutation, R for restart.</p><p><a href="GDEVELOP_BYGGEGUIDE.md">GDevelop byggeguide</a> · <a href="EVENT_OPSKRIFTER.md">Event-opskrifter</a> · <a href="HANDOFF.md">Status og rækkefølge</a> · <a href="SPRITE_RULES.md">Sprite-regler</a></p><p>Alle billeder er prototyper. Klik en sprite for at gemme dens individuelle PNG. Importér assets/, ikke kildearkene.</p>'''+''.join(cards),encoding='utf-8')
previews=OUT/'previews';previews.mkdir(exist_ok=True)
for family,items in sections.items():
    cols=6;rows=(len(items)+cols-1)//cols
    view=Image.new('RGB',(cols*180,rows*192),(40,55,42));draw=ImageDraw.Draw(view)
    for i,e in enumerate(items):
        pic=Image.open(OUT/e['file']);factor=max(1,min(4,160//max(pic.size)));p=pic.resize((pic.width*factor,pic.height*factor),Image.Resampling.NEAREST)
        x=i%cols*180;y=i//cols*192;view.paste(p,(x+(180-p.width)//2,y+(164-p.height)//2),p)
        draw.text((x+4,y+168),Path(e['file']).stem[:25],fill=(237,208,160))
    view.save(previews/f'{family}_contact.png')
for entry in manifest:
    if '/tiles/' in entry['file']:
        tile=Image.open(OUT/entry['file']);repeat=Image.new('RGBA',(96,96))
        for y in range(3):
            for x in range(3):repeat.paste(tile,(x*32,y*32))
        repeat.resize((384,384),Image.Resampling.NEAREST).save(previews/(Path(entry['file']).stem+'_repeat.png'))
for name in ['bite_slash','dust','meteor_impact']:
    views=[]
    for i in range(4):
        pic=Image.open(OUT/f'assets/effects/{name}_{i:03}.png');bg=Image.new('RGB',(96,96),(40,55,42));bg.paste(pic,(0,0),pic);views.append(bg.resize((384,384),Image.Resampling.NEAREST))
    views[0].save(previews/f'{name}.gif',save_all=True,append_images=views[1:],duration=100,loop=0,disposal=2)
allowed={tuple(v) for v in palette};errors=[]
for e in manifest:
    pic=Image.open(OUT/e['file']);a=np.asarray(pic)
    if pic.mode!='RGBA' or list(pic.size)!=e['size']:errors.append(e['file']+' size/mode')
    if not set(np.unique(a[:,:,3])).issubset({0,255}):errors.append(e['file']+' alpha')
    if not np.all(a[a[:,:,3]==0,:3]==0):errors.append(e['file']+' transparent RGB')
    if not all(tuple(v) in allowed for v in a[a[:,:,3]>0,:3]):errors.append(e['file']+' palette')
    if not ('/tiles/' in e['file'] or e['file'].endswith('/grass.png')):
        b=pic.getbbox()
        if not b or min(b[:2])<2 or b[2]>pic.width-2 or b[3]>pic.height-2:errors.append(e['file']+' padding')
files=list((OUT/'assets').rglob('*.png'));assert len(files)==len(manifest)==104
report={'result':'FAIL' if errors else 'PASS','asset_count':len(files),'new_assets':71,'palette_size':32,'errors':errors,'scope':['inventory','RGBA dimensions','binary alpha','transparent RGB zero','fixed palette','object padding'],'visual_limits':['Enemy directions except South excluded: source profile/polarity failures.','Action drawings are pose studies; detail/scale/registration vary.','Terrain repeat previews available; seamless transitions not certified.','North player rotation carries rotated lighting.'],'GDevelop_runtime':'NOT RUN'}
(OUT/'validation_report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));assert not errors
