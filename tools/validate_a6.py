"""A6 native pixels, sampling provenance and actual sixteen-mask corner topology."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image

G=Path(__file__).resolve().parents[1]/'PRIMAL_RUN_Game'
manifest=json.loads((G/'a6_manifest.json').read_text())
palette={tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in json.loads((G/'palette.json').read_text())['colors']}
errors=[];masks=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def warm(a):return (a[:,:,0]>75)&(a[:,:,0]>a[:,:,2]*1.2)&(a[:,:,0]>a[:,:,1]*.95)
for e in manifest:
    p=G/e['file'];im=Image.open(p);a=np.array(im)
    if im.mode!='RGBA' or list(im.size)!=e['size']:errors.append(e['file']+': native format')
    if sha(p)!=e['export_sha256'] or sha(G/e['source'])!=e['source_sha256']:errors.append(e['file']+': provenance hash')
    if set(np.unique(a[:,:,3]))-{0,255} or np.any(a[a[:,:,3]==0,:3]):errors.append(e['file']+': alpha')
    if {tuple(v) for v in a[a[:,:,3]==255,:3]}-palette:errors.append(e['file']+': fixed palette')
    # Independently reconstruct the declared source samples (no exporter import/mutations).
    raw=np.array(Image.open(G/e['source']).convert('RGBA').crop(e['source_crop']))[e['sampling_offset']::e['sampling_stride'],e['sampling_offset']::e['sampling_stride']]
    if e['family']=='lava_ash':raw=raw[:32,:32]
    else:
        placed=np.zeros((24,24,4),dtype=np.uint8);x,y=e['placement'];placed[y:y+raw.shape[0],x:x+raw.shape[1]]=raw;raw=placed
    pal=np.array(list(sorted(palette)),dtype=np.int32);rgb=raw[:,:,:3].astype(np.int32)
    distances=((rgb[:,:,None,:]-pal[None,None,:,:])**2).sum(axis=3)
    # Ties may choose any equally close existing palette colour; source alpha is exact.
    actual=((rgb-a[:,:,:3])**2).sum(axis=2)
    opaque=a[:,:,3]>0
    if np.any(actual[opaque]!=distances.min(axis=2)[opaque]):errors.append(e['file']+': pixels not nearest source palette')
    expected_alpha=np.full(raw.shape[:2],255) if e['family']=='lava_ash' else np.where(raw[:,:,3]>=192,255,0)
    if np.any(a[:,:,3]!=expected_alpha):errors.append(e['file']+': source alpha')
    if e['family']=='hud_chip':
        if any(np.any(part[:,:,3]) for part in [a[:2],a[-2:],a[:,:2],a[:,-2:]]):errors.append(e['file']+': transparent padding')
        if not np.any(opaque):errors.append(e['file']+': empty icon')
    else:
        corners=[a[:4,:4],a[:4,-4:],a[-4:,-4:],a[-4:,:4]]
        mask=sum(int(warm(c).mean()>.5)*(1<<i) for i,c in enumerate(corners));masks.append(mask)
        if mask!=e['mask']:errors.append(e['file']+': corner mask '+str(mask))
        if np.any(a[:,:,3]!=255):errors.append(e['file']+': tile is not opaque')
if len(manifest)!=24 or sorted(masks)!=list(range(16)):errors.append('A6 inventory/masks incomplete')
report=dict(result='FAIL' if errors else 'PASS',assets=len(manifest),hud_icons=8,lava_ash_masks=masks,errors=errors,production_approved=False,scope='Native sampling, palette, alpha, source hashes and actual corner topology. Does not certify seamlessness, art approval or GDJS.')
(G/'a6_validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
raise SystemExit(bool(errors))
