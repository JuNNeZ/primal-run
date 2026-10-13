"""Lossless integer-grid extraction of imagegen art; NEVER draws rig anatomy.

Requires fresh generated sources. Inputs are144x144 enlarged7x at8,8. Actual
imagegen output is1254-square: use declared9-pixel sampling and21-pixel
transparent padding (1296-square extraction canvas), fixed origin72,72. No crop
search, fit-to-rig, masking to guide, mirroring, interpolation or body drawing.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026-10-12'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def extract(path,batch_crop=None):
    im=Image.open(path).convert('RGBA')
    plans={(1024,1024):([8,8,1016,1016],7,3,[512,512]),
           (1254,1254):([-21,-21,1275,1275],9,4,[627,627])}
    if batch_crop is not None:
        if im.size!=(1536,1024):
            raise ValueError(f'{path.name}: undeclared sheet dimensions {im.size}')
        crop,stride,offset,anchor=batch_crop,3,1,[batch_crop[0]+216,batch_crop[1]+216]
    elif im.size not in plans:
        raise ValueError(f'{path.name}: undeclared dimensions {im.size}; needs new authoring plan')
    else:
        crop,stride,offset,anchor=plans[im.size]
    # PIL pads only outside the raw image with transparency; no pixels are painted.
    a=np.array(im.crop(crop))[offset::stride,offset::stride].copy()
    assert a.shape==(144,144,4)
    pal=np.array([list(bytes.fromhex(c[1:])) for c in json.loads((REVIEW/'palette.json').read_text())['colors']],np.int32)
    ix=np.argmin(((a[:,:,:3].astype(np.int32)[:,:,None,:]-pal[None,None,:,:])**2).sum(3),axis=2)
    mask=a[:,:,3]>=192
    a[:,:,:3]=pal[ix]
    a[:,:,3]=np.where(mask,255,0)
    a[~mask]=0
    return Image.fromarray(a),{'source_size':list(im.size),'source_crop':crop,'stride':stride,
                               'sampling_offset':offset,'source_landmark':anchor}

def previews():
    for bg,color in [('light','#e8ece1'),('dark','#151b19')]:
        grid=Image.new('RGBA',(864,624),color)
        draw=ImageDraw.Draw(grid)
        for row,d in enumerate('SNEW'):
            gif=[]
            for i in range(6):
                file=REVIEW/f'iguanodon_walk_{d}_{i:03}.png'
                if not file.exists():continue
                actor=Image.open(file).convert('RGBA')
                grid.alpha_composite(actor,(i*144,row*156+12))
                draw.text((i*144+3,row*156),f'{d}{i}',fill='#69a4a0')
                canvas=Image.new('RGBA',(144,144),color)
                canvas.alpha_composite(actor)
                gif.append(canvas.resize((432,432),Image.Resampling.NEAREST).convert('RGB'))
            if gif:
                gif[0].save(REVIEW/f'walk_{d}_{bg}.gif',save_all=True,append_images=gif[1:],duration=125,loop=0,disposal=2)
        grid.save(REVIEW/f'preview_{bg}_1x.png')
        grid.resize((1728,1248),Image.Resampling.NEAREST).save(REVIEW/f'preview_{bg}_2x.png')

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--revision',type=int,default=1)
    ap.add_argument('--names',default='')
    args=ap.parse_args()
    generation=json.loads((REVIEW/'generation_log.json').read_text())
    old=REVIEW/'export_provenance.json'
    entries=json.loads(old.read_text()) if old.exists() else {}
    counts={'idle':4,'walk':6,'run':6,'attack':6,'hurt':2,'death':6}
    names=args.names.split(',') if args.names else [f'iguanodon_{s}_{d}_{i:03}' for s,n in counts.items() for d in 'SNEW' for i in range(n)]
    for name in names:
        source=REVIEW/'raw'/f'{name}_revision{args.revision}.png'
        batch_crop=None
        if not source.exists():
            found=[(g,c) for g in generation if g['revision']==args.revision for c in g.get('cells',[]) if c['name']==name]
            if not found:continue
            g,c=found[-1];source=REVIEW/g['raw'];batch_crop=c['source_crop']
        if not source.exists():continue
        out=REVIEW/f'{name}.png'
        if out.exists():
            previous=entries[name]['revision']
            if previous>args.revision:continue
            archive=REVIEW/f'revisions/revision{previous}'
            archive.mkdir(parents=True,exist_ok=True)
            shutil.copy2(out,archive/out.name)
        image,plan=extract(source,batch_crop)
        image.save(out)
        guide=ROOT/'PRIMAL_RUN_Rig/iguanodon'/out.name
        assert source.read_bytes()!=guide.read_bytes(), 'raw source must be newly generated art, never a rig copy'
        entries[name]={'file':out.name,'raw':str(source.relative_to(REVIEW)), 'revision':args.revision,
                       'raw_sha256':sha(source),'export_sha256':sha(out),'rig_sha256':sha(guide),
                       **plan,'alpha_threshold':192,
                       'origin':[72,72],'registration_offset':[0,0],
                       'production_approved':False,'status':'prototype_static'}
    old.write_text(json.dumps(entries,indent=2)+'\n')
    previews()
    print(f'{len(entries)} generated-art exports. No rig pixels are used in extraction.')

if __name__=='__main__':main()
