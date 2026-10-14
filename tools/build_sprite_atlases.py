"""Native runtime bundles, deterministic rectangle packing and exact-pixel aliases."""
from pathlib import Path
import hashlib
import json
import re
import shutil
from PIL import Image

GAME = Path(__file__).resolve().parents[1] / 'PRIMAL_RUN_Game'
CONFIG = Path(__file__).with_name('atlas_config.json')
ANIMALS = {'behavior','behavior_native','behavior_injured','species_attacks','avatars',
           'player_full','enemy_full','enemy_animations','enemies','player_combat','corpses',
           'player','player_actions','enemy','new_species'}

def group_for(entry, config):
    family = entry['file'].split('/')[1]
    if entry.get('atlas_group'):
        group = entry['atlas_group']
    elif entry.get('species') or family in ANIMALS:
        species = entry.get('species') or Path(entry['file']).stem.split('_')[0]
        group = 'species_' + species
    else:
        group = config['world_bundles'].get(family, 'world_' + family)
    if not isinstance(group, str) or not re.fullmatch(r'[a-z][a-z0-9_]*', group):
        raise ValueError('Invalid atlas group: ' + str(group))
    return group

def split_free(free, used):
    """MaxRects splitting: no rotation or changes to native image pixels."""
    ux,uy,uw,uh = used
    result = []
    for x,y,w,h in free:
        if ux >= x+w or ux+uw <= x or uy >= y+h or uy+uh <= y:
            result.append((x,y,w,h)); continue
        if uy > y: result.append((x,y,w,uy-y))
        if uy+uh < y+h: result.append((x,uy+uh,w,y+h-uy-uh))
        if ux > x: result.append((x,y,ux-x,h))
        if ux+uw < x+w: result.append((ux+uw,y,x+w-ux-uw,h))
    result = sorted(set(result))
    return [r for r in result if not any(r != q and q[0] <= r[0] and q[1] <= r[1]
            and q[0]+q[2] >= r[0]+r[2] and q[1]+q[3] >= r[1]+r[3] for q in result)]

def layout(entries, width, limit, padding):
    pages = []
    for entry in entries:
        w,h = (n+2*padding for n in entry['size'])
        chosen = None
        for page in pages:
            fits = [(min(r[2]-w,r[3]-h),max(r[2]-w,r[3]-h),r[1],r[0],r)
                    for r in page['free'] if r[2] >= w and r[3] >= h]
            if fits:
                chosen = (page,min(fits)[-1]); break
        if chosen is None:
            page = {'free':[(0,0,width,limit)],'placements':[],'width':0,'height':0}
            pages.append(page); chosen = (page,page['free'][0])
        page,r = chosen; x,y = r[:2]
        page['free'] = split_free(page['free'],(x,y,w,h))
        page['placements'].append((entry,x+padding,y+padding))
        page['width'] = max(page['width'],x+w); page['height'] = max(page['height'],y+h)
    return pages

def build_atlases(manifest, game=GAME, config=None):
    config = config or json.loads(CONFIG.read_text())
    if config.get('version') != 1 or config.get('padding') != 1:
        raise ValueError('Atlas config must use version1 and one native pixel of padding')
    limit,padding = config['max_dimension'],config['padding']
    if not isinstance(limit,int) or limit < 256 or limit > 2048:
        raise ValueError('Atlas dimension must be between256 and2048')
    groups = {}
    for entry in manifest:
        if entry.get('runtime_enabled') is False: continue
        if any(not isinstance(n,int) or n <= 0 or n+2*padding > limit for n in entry['size']):
            raise ValueError('Native frame exceeds atlas bounds: '+entry['file'])
        groups.setdefault(group_for(entry,config),[]).append(entry)
    prepared = {}
    for group,entries in sorted(groups.items()):
        canonical,aliases = {},{}
        for entry in sorted(entries,key=lambda e:e['file']):
            with Image.open(game/entry['file']) as original:
                image = original.convert('RGBA')
                if list(image.size) != entry['size']: raise ValueError(entry['file']+' size')
                key = (tuple(image.size),hashlib.sha256(image.tobytes()).digest())
            master = canonical.setdefault(key,entry)
            aliases.setdefault(master['file'],[]).append(entry)
        unique = sorted(canonical.values(),key=lambda e:(-max(e['size']),-e['size'][0]*e['size'][1],e['file']))
        widths = sorted({min(limit,n) for n in [256,512,1024,2048] if min(limit,n) >= max(e['size'][0]+2*padding for e in unique)})
        candidates = [layout(unique,width,limit,padding) for width in widths]
        pages = min(candidates,key=lambda ps:(len(ps),sum(p['width']*p['height'] for p in ps),tuple((p['width'],p['height']) for p in ps)))
        prepared[group] = (pages,aliases)
    out = game/'assets/atlases'
    if out.exists(): shutil.rmtree(out)
    out.mkdir(parents=True)
    frames,sheets = {},[]
    for group,(pages,aliases) in prepared.items():
        for number,page in enumerate(pages):
            path = f'assets/atlases/{group}_{number}.png'
            sheet = Image.new('RGBA',(page['width'],page['height'])); index = {}
            for master,x,y in page['placements']:
                with Image.open(game/master['file']) as original: sheet.paste(original.convert('RGBA'),(x,y))
                for entry in aliases[master['file']]:
                    w,h = entry['size']
                    frame = dict(x=x,y=y,w=w,h=h,anchor=entry['origin'])
                    if entry['file'] != master['file']: frame['alias_of'] = master['file']
                    index[entry['file']] = frame; frames[entry['file']] = dict(file=path,**frame)
            sheet.save(game/path,optimize=True)
            (game/path).with_suffix('.json').write_text(json.dumps(index,sort_keys=True,indent=2)+'\n')
            sheets.append(dict(file=path,group=group,size=list(sheet.size),frames=len(index),
                unique_frames=len(page['placements']),sha256=hashlib.sha256((game/path).read_bytes()).hexdigest()))
    report = dict(version=2,padding=padding,max_dimension=limit,
        pixels='unaltered RGBA; no scaling or palette conversion; exact duplicate aliases only',
        unique_frames=sum(s['unique_frames'] for s in sheets),
        alias_frames=sum('alias_of' in f for f in frames.values()),
        decoded_bytes=sum(s['size'][0]*s['size'][1]*4 for s in sheets),
        png_bytes=sum((game/s['file']).stat().st_size for s in sheets),sheets=sheets,frames=frames)
    (game/'sprite_atlas_manifest.json').write_text(json.dumps(report,sort_keys=True,indent=2)+'\n')
    return report

if __name__ == '__main__':
    result = build_atlases(json.loads((GAME/'manifest.json').read_text()))
    print(f"Packed {len(result['frames'])} frames into {len(result['sheets'])} sheets; {result['alias_frames']} exact aliases")
