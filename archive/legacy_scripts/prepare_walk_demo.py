from pathlib import Path
import shutil,json

root=Path(__file__).resolve().parent
old=root/'PRIMAL_RUN_Demo_v2';out=root/'PRIMAL_RUN_Demo_v3'
for folder in ['enemy','environment','pickups']:
    shutil.copytree(old/'assets'/folder,out/'assets'/folder,dirs_exist_ok=True)
for name in ['compy','grass','fern','rock','meat']:
    shutil.copy2(old/'Source_Generated'/(name+'.png'),out/'Source_Generated'/(name+'.png'))
shutil.copy2(old/'palette.json',out/'palette.json')
shutil.copy2(old/'SPRITE_RULES.md',out/'SPRITE_RULES_V2_REFERENCE.md')
shutil.copy2(root/'PRIMAL_RUN_Sprites/SPRITE_RULES.md',out/'SPRITE_RULES_V1_REFERENCE.md')
for file in ['demo.html','demo.js']:
    if not (out/file).exists():shutil.copy2(old/file,out/file)
entries=json.loads((old/'manifest.json').read_text())
for entry in entries:
    if entry['file'].startswith('assets/player/'):
        entry['source']='Source_Generated/utahraptor_walk_S_sheet.png'
        entry['export']='fixed body assembly, idle uses walk phase 1'
    else:entry['source']=entry['source']
for i in range(6):
    entries.append({'file':f'assets/player/utahraptor_walk_S_{i:03}.png','size':[128,128],
        'origin':[64,72],'body_anchor':[64,72],'status':'prototype_static',
        'direction':'S','animation':'Walk_S','frame':i,'frame_count':6,
        'animation_ready':False,'source':'Source_Generated/utahraptor_walk_S_sheet.png',
        'export':'fixed body layer with generated limb phases; palette and binary alpha export'})
(out/'manifest.json').write_text(json.dumps(entries,indent=2))
(out/'animation_manifest.json').write_text(json.dumps({'object':'Player','canvas':[128,128],
    'origin':[64,72],'body_anchor':[64,72],'animations':[
        {'name':'Idle_S','frames':['assets/player/utahraptor_idle_S_000.png'],'loop':False},
        {'name':'Walk_S','frames':[f'assets/player/utahraptor_walk_S_{i:03}.png' for i in range(6)],
         'fps':8,'loop':True,'duration_seconds':.75,'demo_ready':True,'production_approved':False}],
    'direction_scope':'South only; other views are static placeholders',
    'GDevelop_runtime':'NOT RUN'},indent=2))
print('V3 demo assets and manifests prepared; V2 preserved')
