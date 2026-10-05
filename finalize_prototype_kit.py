from pathlib import Path
from PIL import Image,ImageDraw
import html,json,csv,shutil,zipfile
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'PRIMAL_RUN_Prototype_Kit'
manifest=json.loads((OUT/'manifest.json').read_text());families={}
for entry in manifest:families.setdefault(entry['file'].split('/')[1],[]).append(entry)
for family,entries in families.items():
    for name,color,ink in [('dark',(40,55,42),(237,208,160)),('light',(226,228,219),(21,27,25))]:
        view=Image.new('RGB',(5*220,((len(entries)+4)//5)*240),color);draw=ImageDraw.Draw(view)
        for i,e in enumerate(entries):
            pic=Image.open(OUT/e['file']);factor=max(1,min(4,192//max(pic.size)));p=pic.resize((pic.width*factor,pic.height*factor),Image.Resampling.NEAREST)
            x=i%5*220;y=i//5*240;view.paste(p,(x+(220-p.width)//2,y+(204-p.height)//2),p);draw.text((x+5,y+210),Path(e['file']).stem[:30],fill=ink)
        view.save(OUT/'previews'/f'{family}_{name}.png')
balance={'player':{'hp':100,'speed':160,'bite_damage':1,'bite_radius':74,'bite_cooldown_seconds':0.55,'stamina':100,'stamina_regen_per_second':18,'pounce_cost':30,'pounce_seconds':0.25,'pounce_multiplier':2.3,'pounce_cooldown_seconds':2},'enemies':{'compy':{'hp':1,'speed':44,'xp':4,'touch_damage':12},'parasaurolophus':{'hp':2,'speed':44,'xp':6,'touch_damage':0,'flee_radius':170},'carnotaurus':{'hp':3,'speed':65,'xp':8,'touch_damage':18}},'progression':{'initial_next_xp':8,'next_xp_increase_per_level':4,'food_heal':14,'legs_speed_bonus_per_stack':0.15,'feathers_regen_bonus_per_stack':0.2,'bleed_seconds':2,'bleed_tick_seconds':0.5,'bleed_damage_per_tick_per_stack':0.5},'demo':{'width':960,'height':640,'survive_seconds':60,'spawn_interval_seconds':3.2,'max_enemies':8,'parasaurolophus_available_seconds':10,'carnotaurus_available_seconds':20},'future_full_run_minutes':{'deinosuchus':5,'carnotaurus_boss':10,'tyrannosaurus':15,'extinction':20},'status':'Prototype tuning values; full-run bosses/events are not implemented'}
(OUT/'balance.json').write_text(json.dumps(balance,indent=2))
with (OUT/'object_list.csv').open('w',newline='',encoding='utf-8-sig') as f:
    writer=csv.writer(f);writer.writerow(['file','width','height','origin_x','origin_y','status','note'])
    for e in manifest:writer.writerow([e['file'],*e['size'],*e['origin'],e['status'],e.get('note',e.get('export',''))])
docs=['HANDOFF.md','GDEVELOP_BYGGEGUIDE.md','EVENT_OPSKRIFTER.md','TEST_OG_FEJLFINDING.md','SPRITE_RULES.md']
nav=' · '.join(f'<a href="#{i}">{html.escape(name.removesuffix(".md").replace("_"," "))}</a>' for i,name in enumerate(docs))
parts=[]
for i,name in enumerate(docs):
    # Self-contained text rendition: no markdown library, remote CSS or scripts.
    parts.append(f'<section id="{i}"><pre>{html.escape((OUT/name).read_text(encoding="utf-8"))}</pre></section>')
(OUT/'GUIDE.html').write_text('<!doctype html><html lang="da"><meta charset="utf-8"><title>PRIMAL RUN - lokal byggeguide</title><style>body{background:#151b19;color:#edd0a0;font:16px system-ui;max-width:1050px;margin:30px auto;padding:20px}a{color:#a8b15b}nav{position:sticky;top:0;background:#28372a;padding:18px;line-height:2;border:1px solid #586d38}section{background:#202a21;padding:24px;margin:24px 0;scroll-margin-top:100px}pre{font:15px/1.65 ui-monospace,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:32px}</style><h1>PRIMAL RUN — guide uden Codex</h1><p><a href="START_HER.html">Asset-katalog</a> · <a href="demo.html">Spil demo</a></p><nav>'+nav+'</nav>'+''.join(parts),encoding='utf-8')
start=(OUT/'START_HER.html').read_text(encoding='utf-8').replace('Start med <a','Læs <a href="GUIDE.html">den samlede lokale guide</a>, eller start med <a')
start=start.replace('minmax(220px,1fr)','minmax(220px,1fr)')
(OUT/'START_HER.html').write_text(start,encoding='utf-8')
shutil.copy2(ROOT/'PRIMAL_RUN_Demo_v5/walk_assembly.json',OUT/'walk_assembly.json')
(OUT/'Source_Generated/README.md').write_text('Raw imagegen reference sheets. Import individual PNGs from assets/. Enemy sheet has rejected profile/wrong-facing samples; only reviewed South cells were exported. Action drawings are pose studies, not approved animations. Atlas layouts can be uneven; source_crop in manifest records reviewed extraction boundaries.')
(OUT/'README.md').write_text('PRIMAL RUN offline prototype kit\n\nExtract the whole folder and open START_HER.html. GUIDE.html contains the local Danish build guide, event recipes and handoff. demo.html runs without Codex, a server, Python or internet in a browser that permits local files. Assets are individual PNGs; GDevelop must be available separately. This is not a project.json export. See HANDOFF.md for scope and limitations. Art generated with built-in imagegen; generation_prompts.json includes final prompts.\n')
assert all((OUT/name).is_file() for name in ['GUIDE.html','START_HER.html','demo.html','manifest.json','validation_report.json','cardinal_test_report.json','progression_test_report.json','generation_prompts.json'])
destination=ROOT/'PRIMAL_RUN_Prototype_Kit.zip'
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as archive:
    for p in sorted(OUT.rglob('*')):
        if p.is_file():archive.write(p,p.relative_to(ROOT))
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    assert len([n for n in archive.namelist() if '/assets/' in n and n.endswith('.png')])==104
print(json.dumps({'zip':str(destination),'bytes':destination.stat().st_size,'assets':104,'zip_integrity':'PASS','offline_entry':'START_HER.html'}))
