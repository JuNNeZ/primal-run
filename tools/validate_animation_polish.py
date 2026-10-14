"""Verify lossless registered poses and immutable source/weapon provenance.

The anatomical review is documented separately. Pixel digests prove that
registration does not redraw, scale, lose or invent pixels.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'PRIMAL_RUN_Game'

def validate():
    plan=json.loads((GAME/'Source_Generated/animation_polish/hip_registration.json').read_text())
    manifest={e['file']:e for family in ['player_full','enemy_full']
        for e in json.loads((GAME/f'{family}_manifest.json').read_text())}
    errors=[];groups={};moved=0
    for entry in plan['frames']:
        file=entry['file'];meta=manifest.get(file,{})
        rgba=np.array(Image.open(GAME/file).convert('RGBA'))
        delta=entry['delta'];ys,xs=np.where(rgba[:,:,3]!=0)
        px,py=xs-delta[0],ys-delta[1]
        if min(px)<0 or min(py)<0 or max(px)>143 or max(py)>143:
            errors.append('Cannot recover sampled pixels: '+file);continue
        recovered=np.zeros_like(rgba);recovered[py,px]=rgba[ys,xs]
        if hashlib.sha256(recovered.tobytes()).hexdigest()!=entry['sampled_rgba_sha256']:
            errors.append('Registration altered sampled pixels: '+file)
        if [entry['sampled_landmark'][i]+delta[i] for i in range(2)]!=entry['target_landmark']:
            errors.append('Landmark: '+file)
        if meta.get('native_registration_delta')!=delta or meta.get('sampled_rgba_sha256')!=entry['sampled_rgba_sha256']:
            errors.append('Manifest registration provenance: '+file)
        if meta.get('source_sha256')!=entry['source_sha256'] or hashlib.sha256((GAME/entry['source']).read_bytes()).hexdigest()!=entry['source_sha256']:
            errors.append('Unreviewed source revision: '+file)
        if min(xs)<2 or min(ys)<2 or max(xs)>141 or max(ys)>141:
            errors.append('Clipped outer padding: '+file)
        key=(meta['species'],meta['direction']);groups.setdefault(key,set()).add(tuple(entry['target_landmark']))
        moved+=delta!=[0,0]
    for group,targets in groups.items():
        if len(targets)!=1:errors.append('Changing canonical anatomical target: '+str(group))
    # Weapon overlays that reuse the matching native body must stay byte-identical.
    attacks=json.loads((GAME/'species_attack_manifest.json').read_text());reused=0
    for entry in attacks:
        if entry.get('reused_from'):
            reused+=1
            if (GAME/entry['file']).read_bytes()!=(GAME/entry['reused_from']).read_bytes():
                errors.append('Weapon body diverges from native reference: '+entry['file'])
        else:
            # Independently reconstruct local weapon edits from raw provenance,
            # including single-cell overrides and reviewed neighbour exclusions.
            stride=entry.get('sampling_stride',2);sample_offset=entry.get('sampling_offset',1)
            crop=entry['source_crop'];source=np.array(Image.open(GAME/entry['source']).convert('RGBA').crop(crop))[sample_offset::stride,sample_offset::stride].copy()
            mask=source[:,:,3]>=entry.get('alpha_threshold',192)
            sy,sx=np.indices(mask.shape);inset=entry.get('source_crop_inset',0)
            for x1,y1,x2,y2 in entry.get('source_cell_exclusions',[]):
                cx=inset+sample_offset+sx*stride;cy=inset+sample_offset+sy*stride
                mask[(cx>=x1)&(cx<x2)&(cy>=y1)&(cy<y2)]=False
            palette=np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in json.loads((GAME/'palette.json').read_text())['colors']],dtype=np.int32)
            index=np.argmin(((source[:,:,:3].astype(np.int32)[:,:,None,:]-palette[None,None,:,:])**2).sum(3),axis=2)
            source[:,:,:3]=palette[index];source[:,:,3]=np.where(mask,255,0);source[~mask]=0
            ys,xs=np.where(mask);dx,dy=entry['registration_offset'];reconstructed=np.zeros((144,144,4),np.uint8);reconstructed[ys+dy,xs+dx]=source[ys,xs]
            if not np.array_equal(reconstructed,np.array(Image.open(GAME/entry['file']).convert('RGBA'))):
                errors.append('Weapon raw source re-extraction: '+entry['file'])
    review=json.loads((GAME/'Source_Generated/animation_polish/generation_review.json').read_text())
    for entry in review.values():
        file=GAME/'Source_Generated/animation_polish'/entry['source']
        if hashlib.sha256(file.read_bytes()).hexdigest()!=entry['sha256']:
            errors.append('Raw generation hash: '+entry['source'])
    report=dict(result='FAIL' if errors else 'PASS',registered_poses=len(plan['frames']),
        translated_poses=moved,canonical_targets=len(groups),byte_identical_weapon_poses=reused,
        errors=errors,production_approved=False,
        scope='Independent inverse translation/pixel digests, source binding, canonical anatomical targets, padding and native weapon reuse. Does not certify anatomy or interpolate motion.')
    (GAME/'animation_polish_validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))
    return not errors

if __name__=='__main__':raise SystemExit(0 if validate() else 1)
