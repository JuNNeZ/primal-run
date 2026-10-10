"""Deterministic native-pixel atlases. Originals and approval status stay intact."""
from pathlib import Path
import hashlib
import json
import math
import shutil
from PIL import Image

GAME = Path(__file__).resolve().parents[1] / 'PRIMAL_RUN_Game'
ANIMALS = {'behavior','behavior_native','behavior_injured','species_attacks','avatars','player_full','enemy_full','enemy_animations','enemies','player_combat','corpses'}

def build_atlases(manifest, game=GAME):
    out = game / 'assets/atlases'
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    groups = {}
    for entry in manifest:
        if entry.get('runtime_enabled') is False:
            continue
        path = entry['file']
        family = path.split('/')[1]
        species = entry.get('species') or Path(path).stem.split('_')[0]
        group = 'species_' + species if family in ANIMALS else 'world_' + family
        groups.setdefault(group, []).append(entry)
    frames, sheets = {}, []
    for group, entries in sorted(groups.items()):
        entries.sort(key=lambda e: (-e['size'][1], -e['size'][0], e['file']))
        area = sum((e['size'][0]+2)*(e['size'][1]+2) for e in entries)
        width = min(2048, max(256, 2**math.ceil(math.log2(max(math.sqrt(area), max(e['size'][0]+2 for e in entries))))))
        pages, page, x, y, row = [], [], 0, 0, 0
        for entry in entries:
            w,h = entry['size']
            if x+w+2 > width:
                x,y,row = 0,y+row,0
            if y+h+2 > 2048:
                pages.append((page,y+row));page,x,y,row = [],0,0,0
            page.append((entry,x+1,y+1));x += w+2;row=max(row,h+2)
        if page:
            pages.append((page,y+row))
        for number,(placements,height) in enumerate(pages):
            path = f'assets/atlases/{group}_{number}.png'
            sheet = Image.new('RGBA',(width,height))
            index = {}
            for entry,x,y in placements:
                source = Image.open(game / entry['file']).convert('RGBA')
                assert list(source.size) == entry['size'], entry['file']
                sheet.paste(source,(x,y))  # no mask: preserve every RGBA byte
                w,h=source.size
                index[entry['file']] = dict(x=x,y=y,w=w,h=h,anchor=entry['origin'])
                frames[entry['file']] = dict(file=path,**index[entry['file']])
            sheet.save(game / path, optimize=True)
            (game / path).with_suffix('.json').write_text(json.dumps(index,sort_keys=True,indent=2)+'\n')
            sheets.append(dict(file=path,size=list(sheet.size),frames=len(index),sha256=hashlib.sha256((game/path).read_bytes()).hexdigest()))
    report = dict(version=1,padding=1,pixels='unaltered RGBA; no scaling or palette conversion',sheets=sheets,frames=frames)
    (game/'sprite_atlas_manifest.json').write_text(json.dumps(report,sort_keys=True,indent=2)+'\n')
    return report

if __name__ == '__main__':
    result=build_atlases(json.loads((GAME/'manifest.json').read_text()))
    print(f"Packed {len(result['frames'])} native frames into {len(result['sheets'])} sheets")
