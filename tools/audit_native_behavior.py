"""Report outline changes for human comparison, never automatically approve anatomy."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
M=json.loads((G/'native_behavior_manifest.json').read_text());audit=[]
for e in M:
 a=np.array(Image.open(G/e['file']).convert('RGBA'));b=np.array(Image.open(G/e['reference']).convert('RGBA'));mask=a[:,:,3]>0;refmask=b[:,:,3]>0;bbox=Image.fromarray(a).getbbox();ref=Image.fromarray(b).getbbox()
 audit.append(dict(file=e['file'],source=e['source'],runtime_enabled=e['runtime_enabled'],native_fallback=e.get('native_fallback',False),fallback_reason=e.get('fallback_reason'),area_ratio=round(float(mask.sum()/refmask.sum()),3),width_ratio=round((bbox[2]-bbox[0])/(ref[2]-ref[0]),3),height_ratio=round((bbox[3]-bbox[1])/(ref[3]-ref[1]),3),silhouette_iou=round(float((mask&refmask).sum()/(mask|refmask).sum()),3),bounds=bbox,reference_bounds=ref))
report=dict(scope='Measurements flag source differences. Limb/head articulation affects extents; no automatic anatomy or animation approval.',drawn=sum(not e.get('native_fallback',False) for e in M),native_fallback=sum(bool(e.get('native_fallback')) for e in M),runtime_enabled=sum(bool(e['runtime_enabled']) for e in M),frames=audit)
(G/'NATIVE_BEHAVIOR_BODY_AUDIT.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='frames'},indent=2))
