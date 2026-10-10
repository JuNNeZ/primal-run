"""Compare authored limp keyposes against untouched canonical walk pixels.

Measurements are rejection aids; anatomical review is always required.
"""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
manifest=json.loads((G/'behavior_manifest.json').read_text())
records=[]
for e in manifest:
 if e['state']!='limp' or e['frame'] not in (2,3):continue
 species=e['species'];family='enemy_full' if species in ('parasaurolophus','triceratops','tyrannosaurus','deinosuchus') else 'player_full'
 canonical=f"assets/{family}/{species}_walk_{e['direction']}_{e['frame']:03}.png"
 a=np.array(Image.open(G/e['file']).convert('RGBA'));b=np.array(Image.open(G/canonical).convert('RGBA'))
 am=a[:,:,3]>0;bm=b[:,:,3]>0;union=int((am|bm).sum());iou=float((am&bm).sum()/max(1,union))
 def bounds(m):
  ys,xs=np.where(m);return [int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
 ab=bounds(am);bb=bounds(bm);ratio=[round((ab[2]-ab[0])/(bb[2]-bb[0]),4),round((ab[3]-ab[1])/(bb[3]-bb[1]),4)]
 # Deliberately strict gate: foot-only edits should not replace body markings.
 changed=int(np.any(a!=b,axis=2).sum());budget=max(16,round(bm.sum()*.12))
 safe=iou>=.9 and all(.9<=r<=1.1 for r in ratio) and changed<=budget
 records.append(dict(species=species,direction=e['direction'],frame=e['frame'],file=e['file'],canonical=canonical,canonical_sha256=hashlib.sha256((G/canonical).read_bytes()).hexdigest(),silhouette_iou=round(iou,4),extent_ratio=ratio,changed_pixels=changed,foot_edit_budget=budget,conservative_geometry_gate=safe,runtime_enabled=e.get('runtime_enabled',False)))
report=dict(status='prototype_static',production_approved=False,animation_ready=False,scope='REJECTED revision1 only: 104 drawn keyposes compared with canonical walk2/3 under strict foot-pixel-preservation gate; revision2 runtime prototypes are evaluated separately in INJURED_WALK_VALIDATION.json',count=len(records),geometry_pass=sum(e['conservative_geometry_gate'] for e in records),runtime_enabled=sum(e['runtime_enabled'] for e in records),records=records)
(G/'INJURED_POSE_AUDIT.json').write_text(json.dumps(report,indent=2)+'\n')
for species in sorted({r['species'] for r in records}):
 rows=[r for r in records if r['species']==species]
 for bg,name in [('#e8ece1','light'),('#151b19','dark')]:
  grid=Image.new('RGBA',(576,656),bg);draw=ImageDraw.Draw(grid)
  for row,d in enumerate('SNEW'):
   for col,f in enumerate((2,3)):
    r=next(r for r in rows if r['direction']==d and r['frame']==f)
    for idx,key in enumerate(('canonical','file')):
     x=(col*2+idx)*144;y=row*164;grid.alpha_composite(Image.open(G/r[key]).convert('RGBA'),(x,y+20));draw.text((x+2,y+3),f"{d}{f} {'old' if idx==0 else 'draft'}",fill='#65998e')
  out=G/f'previews/behavior/{species}_injury_comparison_{name}_1x.png';out.parent.mkdir(parents=True,exist_ok=True);grid.save(out)
print(f"Compared {len(records)} injury keyposes; conservative geometry PASS {report['geometry_pass']}; enabled {report['runtime_enabled']}.")
