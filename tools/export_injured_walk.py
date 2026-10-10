"""Assemble injury cycles from reviewed authored keyposes and untouched native gait.

No anatomy is drawn here. Registration/extraction lives in preserved revision2 reviews.
"""
from pathlib import Path
import hashlib,json,shutil
from PIL import Image,ImageDraw
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
legacy={e['file']:e for family in ('player_full','enemy_full') for e in json.loads((G/f'{family}_manifest.json').read_text())}
species=['ankylosaurus','baryonyx','carnotaurus','compy','deinonychus','deinosuchus','gallimimus','pachycephalosaurus','parasaurolophus','triceratops','tyrannosaurus','utahraptor','velociraptor']
manifest=[];summary=[]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for name in species:
 reviewPath=G/f'Source_Generated/behavior_limp/{name}_revision2_review.json';review=json.loads(reviewPath.read_text())
 if name=='ankylosaurus':entries=json.loads((G/'Source_Generated/behavior_limp/ankylosaurus_revision2_manifest.json').read_text())
 else:entries=review.get('entries',review.get('frames',review.get('poses',[])))
 assert len(entries)==8,(name,len(entries));poses={(e['direction'],e['frame']):e for e in entries}
 family='enemy_full' if name in ('parasaurolophus','triceratops','tyrannosaurus','deinosuchus') else 'player_full';counts={'drawn':0,'native_continuity':0,'rejected_keypose_fallback':0}
 previews={bg:Image.new('RGBA',(864,656),color) for bg,color in [('light','#e8ece1'),('dark','#151b19')]}
 for row,direction in enumerate('SNEW'):
  for frame in range(6):
   canonical=f'assets/{family}/{name}_walk_{direction}_{frame:03}.png';old=legacy[canonical];pose=poses.get((direction,frame));technical=pose and pose.get('technical_candidate',pose.get('technical_usable',pose.get('runtime_enabled',False)));visual=pose and pose.get('visual_candidate',pose.get('runtime_enabled',False));accepted=bool(technical and visual)
   file=f'assets/behavior_injured/{name}_limp_{direction}_{frame:03}.png';target=G/file;target.parent.mkdir(parents=True,exist_ok=True)
   if accepted:
    source=G/pose['file'];assert sha(source)==pose['export_sha256'],source;shutil.copyfile(source,target)
    e={**pose,'file':file,'review_export':pose['file'],'origin':old['origin'],'species':name,'state':'limp','direction':direction,'frame':frame,'runtime_enabled':True,'status':'prototype_static','production_approved':False,'animation_ready':False,'export_sha256':sha(target),'authored_injury_keypose':True,'review_manifest':reviewPath.relative_to(G).as_posix()};counts['drawn']+=1
   else:
    shutil.copyfile(G/canonical,target);reason=(pose.get('rejection_reason') or 'Drawn keypose did not pass native visual/geometry review') if pose else 'Preserve canonical gait continuity around injury keyposes'
    e={**old,'file':file,'origin':old['origin'],'species':name,'state':'limp','direction':direction,'frame':frame,'runtime_enabled':True,'status':'prototype_static','production_approved':False,'animation_ready':False,'reused_from':canonical,'reused_sha256':sha(G/canonical),'export_sha256':sha(target),'authored_injury_keypose':False,'fallback_reason':reason,'rejected_review_export':pose['file'] if pose else None};counts['rejected_keypose_fallback' if pose else 'native_continuity']+=1
   manifest.append(e)
   for grid in previews.values():
    grid.alpha_composite(Image.open(target).convert('RGBA'),(frame*144,row*164+20));ImageDraw.Draw(grid).text((frame*144+2,row*164+3),f'{direction}{frame} {"drawn" if accepted else "native"}',fill='#65998e')
 for bg,grid in previews.items():grid.save(G/f'previews/behavior/{name}_injured_cycle_{bg}_1x.png')
 summary.append(dict(species=name,**counts,review=review.get('review','')))
(G/'injured_walk_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(G/'INJURED_WALK_VALIDATION.json').write_text(json.dumps(dict(status='prototype_static',production_approved=False,animation_ready=False,scope='Native export assembly; runtime evidence recorded separately',count=len(manifest),authored=sum(s['drawn'] for s in summary),native_continuity=sum(s['native_continuity'] for s in summary),rejected_keypose_fallback=sum(s['rejected_keypose_fallback'] for s in summary),species=summary),indent=2)+'\n')
print('Assembled',len(manifest),'injured frames:',sum(s['drawn'] for s in summary),'drawn keyposes;',sum(s['rejected_keypose_fallback'] for s in summary),'rejected-pose native fallbacks.')
