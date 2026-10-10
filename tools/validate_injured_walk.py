"""Validate injury export provenance, fixed geometry, palette and reused native pixels."""
from pathlib import Path
import hashlib,json
from collections import Counter
import numpy as np
from PIL import Image
G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
manifest=json.loads((G/'injured_walk_manifest.json').read_text());palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in json.loads((G/'palette.json').read_text())['colors']};seen=set();counts=Counter();errors=[]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for e in manifest:
 key=(e['species'],e['direction'],e['frame']);assert key not in seen;seen.add(key);path=G/e['file'];a=np.array(Image.open(path).convert('RGBA'));assert list(a.shape[:2])==[144,144]
 if set(np.unique(a[:,:,3]))!={0,255}:errors.append(e['file']+': nonbinary alpha')
 if np.any(a[a[:,:,3]==0,:3]):errors.append(e['file']+': hidden RGB')
 colors={tuple(v) for v in np.unique(a[a[:,:,3]>0,:3],axis=0)}
 if not colors<=palette:errors.append(e['file']+': palette')
 if sha(path)!=e['export_sha256']:errors.append(e['file']+': changed hash')
 ys,xs=np.where(a[:,:,3]>0)
 if min(xs)<2 or min(ys)<2 or max(xs)>141 or max(ys)>141:errors.append(e['file']+': transparent safety border')
 assert e['status']=='prototype_static' and e['production_approved'] is False and e['animation_ready'] is False
 if e.get('reused_from'):
  assert path.read_bytes()==(G/e['reused_from']).read_bytes();assert e['reused_sha256']==sha(G/e['reused_from']);counts['reused']+=1
 else:
  assert e['authored_injury_keypose'] and e['frame'] in (2,3);assert sha(G/e['source'])==e['source_sha256'];assert sha(G/e['review_export'])==e['export_sha256'];counts['authored']+=1
  # Rebuild exactly from tracked source/cell/anchor metadata, never temporary tools.
  step=e['sampling_stride'];offset=e['sampling_offset'];source=np.array(Image.open(G/e['source']).convert('RGBA').crop(e['source_crop']))[offset::step,offset::step].copy();mask=source[:,:,3]>=e.get('alpha_threshold',192);sy,sx=np.where(mask);rgb=source[:,:,:3].astype(np.int32)
  # Palette order determines equidistant colour ties, so use the original declared order.
  declared=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((G/'palette.json').read_text())['colors']],dtype=np.int32)
  index=np.argmin(((rgb[:,:,None,:]-declared[None,None,:,:])**2).sum(3),axis=2);source[:,:,:3]=declared[index];source[:,:,3]=np.where(mask,255,0);source[~mask]=0;reconstructed=np.zeros((144,144,4),np.uint8);dx,dy=e['registration_offset'];reconstructed[sy+dy,sx+dx]=source[sy,sx]
  assert np.array_equal(reconstructed,a),(e['file'],'source metadata does not reproduce pixels')
 counts[e['species']]+=1
assert len(manifest)==312 and all(counts[s]==24 for s in {e['species'] for e in manifest})
if errors:raise ValueError('\n'.join(errors))
report=json.loads((G/'INJURED_WALK_VALIDATION.json').read_text());report['technical_validation']='PASS';report['validated_pngs']=len(manifest);report['validated_reused_native_hashes']=counts['reused'];report['validated_authored_source_hashes']=counts['authored'];report['validated_authored_source_reextractions']=counts['authored'];report['runtime_validation']='Parent-agent browser tests required; PNG validation is not runtime or anatomy approval';(G/'INJURED_WALK_VALIDATION.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS',len(manifest),'native injury frames;',counts['authored'],'authored source checks;',counts['reused'],'byte-identical native reuse checks.')
