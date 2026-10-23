"""Register only E/W from separately drawn overhead source pieces.

No painting, mirroring, rotation or interpolated resizing. All scale changes
are explicit integer-stride source sampling; registration uses named joints.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from extract import joint_caps
ROOT = Path(__file__).resolve().parent

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    config=json.loads((ROOT/'topdown_registration.json').read_text())
    sid=config['species']
    palette=np.array([tuple(bytes.fromhex(c[1:])) for c in json.loads((ROOT.parents[2]/'palette.json').read_text())['colors']],dtype=np.int32)
    metadata=json.loads((ROOT/f'{sid}_parts.json').read_text())
    sampling=json.loads((ROOT/'source_sampling.json').read_text())
    for d,view in config['directions'].items():
        assert d in 'EW'
        parts={};images={}
        for name,item in view['parts'].items():
            source=ROOT/item['source'];raw=np.array(Image.open(source).convert('RGBA'))
            x0,y0,x1,y1=item['crop'];step=item['integer_sample']
            tile=raw[y0:y1:step,x0:x1:step].copy()
            rgb=tile[:,:,:3].astype(np.int32)
            ix=((rgb[:,:,None,:]-palette[None,None,:,:])**2).sum(-1).argmin(-1)
            tile[:,:,:3]=palette[ix];tile[:,:,3]=np.where(tile[:,:,3]>=192,255,0);tile[tile[:,:,3]==0]=0
            joint_caps(tile, item.get("cap_edges", []))
            # Discard one exterior ink ring; preserve enclosed markings.
            # No source pixel is repainted to create anatomy.
            for _ in range(1):
                on=tile[:,:,3]>0;p=np.pad(on,1)
                interior=p[:-2,1:-1]&p[2:,1:-1]&p[1:-1,:-2]&p[1:-1,2:]
                ink=(tile[:,:,:3]==palette[0]).all(-1)|(tile[:,:,:3]==palette[1]).all(-1)
                remove=on&~interior&ink
                if not remove.any():break
                tile[remove]=0
            # Explicit sampled landmarks are reviewed in the source-parts contact.
            pivot=np.array(item['sampled_pivot']);tip=np.array(item['sampled_tip'])
            assert tile[pivot[1],pivot[0],3] and tile[tip[1],tip[0],3],(d,name,'source landmark',pivot,tip)
            target=item['target_pivot']
            if isinstance(target,dict):target=parts[target['part']][target['point']]
            delta=np.array(target)-pivot
            ys,xs=np.nonzero(tile[:,:,3]);dx=xs+delta[0];dy=ys+delta[1]
            assert (dx>=2).all() and (dx<142).all() and (dy>=2).all() and (dy<142).all(),(d,name,'margin')
            canvas=np.zeros((144,144,4),np.uint8);canvas[dy,dx]=tile[ys,xs]
            im=Image.fromarray(canvas);im.save(ROOT/f'{sid}_{d}_{name}.png');images[name]=im
            parts[name]={'parent':item['parent'],'pivot':list(map(int,target)),'tip':(tip+delta).astype(int).tolist()}
            sampling[f'{d}/{name}']=dict(item,source_sha256=digest(source),translation=delta.tolist(),camera='oblique overhead, independently drawn')
        metadata['directions'][d]={'order':view['order'],'parts':parts}
        full=Image.new('RGBA',(144,144))
        for name in view['order']:full.alpha_composite(images[name])
        full.save(ROOT/f'{sid}_{d}_full.png')
    (ROOT/f'{sid}_parts.json').write_text(json.dumps(metadata,indent=2)+'\n')
    (ROOT/'source_sampling.json').write_text(json.dumps(sampling,indent=2)+'\n')
    previews=ROOT/'previews';previews.mkdir(exist_ok=True)
    for bg,color,fg in [('light','#ddd7c6','#151b19'),('dark','#202725','#edd0a0')]:
        for scale in [1,3]:
            out=Image.new('RGB',(4*144*scale,160*scale),color);draw=ImageDraw.Draw(out)
            for i,d in enumerate('SEWN'):
                im=Image.open(ROOT/f'{sid}_{d}_full.png').resize((144*scale,144*scale),Image.Resampling.NEAREST)
                out.paste(im,(i*144*scale,16*scale),im);draw.text((i*144*scale+5,4),f'{sid} {d}',fill=fg)
            out.save(previews/f'topdown_{bg}_{scale}x.png')
        for d in 'EW':
            out=Image.new('RGB',(5*288,3*312),color);draw=ImageDraw.Draw(out)
            for i,name in enumerate(metadata['directions'][d]['parts']):
                im=Image.open(ROOT/f'{sid}_{d}_{name}.png').resize((288,288),Image.Resampling.NEAREST)
                x=i%5*288;y=i//5*312;out.paste(im,(x,y+24),im);draw.text((x+4,y+4),f'{d} {name}',fill=fg)
            out.save(previews/f'topdown_parts_{d}_{bg}_2x.png')
    print(sid,{d:Image.open(ROOT/f'{sid}_{d}_full.png').getbbox() for d in 'EW'})
if __name__=='__main__':main()
