"""Assert authored corner connectivity; wave highlights may occupy half a corner patch."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game';rows=[];errors=[]
for family in ['shore_soil','shore_sand','water_depth']:
 for mask in range(16):
  a=np.array(Image.open(G/f'assets/water_transitions/{family}_{mask:02}.png'))[:,:,:3].astype(int)
  material=(a[:,:,2]>a[:,:,0])&(a[:,:,1]>a[:,:,0]+8) if family!='water_depth' else a[:,:,1]<95
  patches=[material[:4,:4],material[:4,-4:],material[-4:,-4:],material[-4:,:4]];scores=[float(p.mean()) for p in patches]
  actual=sum(1<<i for i,v in enumerate(scores) if v>=.5);e=dict(family=family,mask=mask,actual=actual,scores=scores);rows.append(e)
  if actual!=mask:errors.append(e)
report=dict(status='FAIL' if errors else 'PASS',rows=rows,errors=errors,scope='Native4x4 corner material patches at NW/NE/SE/SW, majorityincludingties; not texture-seam or production approval.',production_approved=False)
(G/'water_corner_validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(dict(status=report['status'],tiles=len(rows),errors=errors),indent=2));raise SystemExit(bool(errors))
