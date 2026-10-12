"""Audit active dinosaur sequences and emit a native-pixel review catalog.

Silhouette measurements flag review candidates, never certify anatomy or
recenter sprites. Source art, manifests and approval states are untouched.
"""
import hashlib
import json
import subprocess
from collections import defaultdict
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'PRIMAL_RUN_Game'
PLAN={'idle':4,'walk':6,'run':6,'attack':6,'hurt':2,'death':6}

def audit():
    script="""const C=require('./PRIMAL_RUN_Game/src/core.js'),fs=require('fs');
const all=['player_full_animations.json','enemy_full_animations.json'].flatMap(f=>JSON.parse(fs.readFileSync('PRIMAL_RUN_Game/'+f)).animations);
const species=[...new Set(all.map(a=>a.species))];
const sequences=[];for(const id of species)for(const direction of ['S','E','N','W'])for(const [state,count]of Object.entries({idle:4,walk:6,run:6,attack:6,hurt:2,death:6})){
sequences.push({species:id,direction,state,frames:Array.from({length:count},(_,i)=>C.playerFrame(id,state,direction,i))});}
console.log(JSON.stringify({species,sequences,colors:C.SPECIES_COLORS,night:C.NIGHT_PALETTE,features:C.FEATURES}));"""
    catalog=json.loads(subprocess.check_output(['node','-e',script],cwd=ROOT,text=True))
    manifest={e['file']:e for e in json.loads((GAME/'manifest.json').read_text())}
    errors=[];risks=[];exact=defaultdict(set);coverage={}
    for seq in catalog['sequences']:
        stats=[];digests=[]
        for frame,file in enumerate(seq['frames']):
            entry=manifest.get(file)
            if not entry or entry.get('runtime_enabled') is False or not (GAME/file).exists():
                errors.append('Missing/disabled active frame: '+file);continue
            with Image.open(GAME/file) as im:
                rgba=np.array(im.convert('RGBA'));box=im.getbbox()
            if list(rgba.shape[:2][::-1])!=entry['size']: errors.append('Size: '+file)
            if entry['origin']!=entry.get('body_anchor',entry['origin']):errors.append('Body origin: '+file)
            if entry.get('frame',frame)!=frame:errors.append('Frame index: '+file)
            digest=hashlib.sha256(rgba.tobytes()).hexdigest();digests.append(digest)
            ys,xs=np.where(rgba[:,:,3]>0)
            if not len(xs):errors.append('Empty: '+file);continue
            if min(box[:2])<2 or max(box[2:])>142:errors.append('Clipped padding: '+file)
            original=rgba.copy()
            for key,color in catalog['colors'][seq['species']].items():
                mask=(original[:,:,3]>0)&np.all(original[:,:,:3]==tuple(bytes.fromhex(key)),axis=2)
                rgba[mask,:3]=tuple(bytes.fromhex(color))
            exact[hashlib.sha256(rgba.tobytes()).hexdigest()].add(seq['species'])
            stats.append(dict(file=file,origin=entry['origin'],bbox=list(box),opaque_pixels=len(xs),
                centroid=[round(float(xs.mean()),3),round(float(ys.mean()),3)]))
        if len(set(digests))!=len(digests):errors.append('Repeated temporal pose: '+str(seq))
        if len({tuple(s['origin']) for s in stats})>1:errors.append('Changing origin: '+str(seq))
        if stats:
            deltas=[round(float(np.linalg.norm(np.array(stats[i]['centroid'])-stats[i-1]['centroid'])),3) for i in range(1,len(stats))]
            closure=round(float(np.linalg.norm(np.array(stats[-1]['centroid'])-stats[0]['centroid'])),3)
            ratio=round(max(s['opaque_pixels'] for s in stats)/min(s['opaque_pixels'] for s in stats),3)
            seq['metrics']=dict(area_ratio=ratio,adjacent_centroid_steps=deltas,loop_centroid_step=closure if seq['state'] in ['idle','walk','run'] else None)
            if ratio>1.35 or max(deltas,default=0)>7 or seq['state'] in ['idle','walk','run'] and closure>7:
                risks.append(dict(species=seq['species'],direction=seq['direction'],state=seq['state'],**seq['metrics']))
            seq['origins']=[s['origin'] for s in stats]
        coverage.setdefault(seq['species'],dict(states={},directions=['S','E','N','W'],frames=0))
        coverage[seq['species']]['states'][seq['state']]=PLAN[seq['state']]
        coverage[seq['species']]['frames']+=len(stats)
    for species,entry in coverage.items():
        if entry['frames']!=120 or entry['states']!=PLAN:errors.append('Incomplete plan: '+species)
    matches=[sorted(species) for species in exact.values() if len(species)>1]
    if matches:errors.append('Exact cross-species render clones: '+str(matches))
    report=dict(technical_result='FAIL' if errors else 'PASS',species=len(coverage),sequences=len(catalog['sequences']),
        frames=sum(e['frames'] for e in coverage.values()),coverage=coverage,errors=errors,
        exact_cross_species_RGBA_matches=matches,review_candidates=risks,
        visual_result='REQUIRES_SOURCE_POLISH',production_approved=False,
        metric_scope='Centroid/area changes are review flags. Tail swing, limb motion and death can legitimately change them. Fixed declared hips do not prove fixed drawn hips. No bbox recentering or pixel edits.',
        runtime_policy={'stable_idle':'ordinary/player/pack idle holds pose0; stored4 poses are reviewed independently',
            'pack':'nonlethal companions use idle/walk/run/attack; hp is clamped at1, so death is deliberately unavailable',
            'attack':'gameplay duration/contact timing; species weapon differs; six poses in order',
            'extras':'diet-specific forage/drink/sleep/scratch and wounded poses are separate overlays, with documented native fallbacks'},
        known_art_issues=['Tyrannosaurus N body volume varies between preserved idle/attack and revised walk/run',
            'Cross-state matching of independently generated Triceratops/Pachy/Galli/Para attacks needs polish',
            'Generated gait/loop body and colour landmarks require visual review; source centroids are not anatomical pivots',
            'Deinonychus S hurt poses shift visibly; keep prototype until source hips/anatomy are reviewed'],
        source_policy='Raw masters/native exports unchanged; no anatomical approval inferred from technical checks')
    (GAME/'species_animation_audit.json').write_text(json.dumps(report,indent=2)+'\n')
    (GAME/'species_animation_review_data.js').write_text('globalThis.SpeciesAnimationReview='+json.dumps(catalog,separators=(',',':'))+';\n')
    print(json.dumps({k:report[k] for k in ['technical_result','visual_result','species','sequences','frames','errors']}))
    return not errors

if __name__=='__main__':raise SystemExit(0 if audit() else 1)
