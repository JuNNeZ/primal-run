"""Native, hand-plotted HUD icon prototypes. No asset is resized or sampled.

Jonas requested native PNGs after reviewing the A-C concept sheet (21 Oct 2026).
Each 16px chip has its own small drawing; 4x scaling is used only for previews.
"""
from pathlib import Path
import hashlib
import json
import zipfile
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
OUT = GAME / 'assets/hud_icons'
COLORS = json.loads((GAME / 'palette.json').read_text())['colors']
INK, GREEN0, GREEN1, GREEN2, GREEN, LIME, SAND, BROWN0, BROWN1, BROWN, TAN, HONEY, BONE, COAL, STEEL, GREY, STONE, RED0, RED, RUST, ORANGE, BLUE, TEAL, MINT, PURPLE0, PURPLE, LILAC, INDIGO, WHITE, GOLD, BLOOD, AZURE = COLORS


class Canvas:
    def __init__(self, size):
        self.im = Image.new('RGBA', (size, size))
        self.d = ImageDraw.Draw(self.im)

    def p(self, points, color, outline=None):
        self.d.polygon(points, fill=color, outline=outline)

    def l(self, points, color, width=1):
        self.d.line(points, fill=color, width=width)

    def r(self, box, color, outline=None):
        self.d.rectangle(box, fill=color, outline=outline)

    def e(self, box, color, outline=None):
        self.d.ellipse(box, fill=color, outline=outline)


def star(c, x, y, color=GOLD):
    c.p([(x,y-3),(x+1,y-1),(x+3,y),(x+1,y+1),(x,y+3),(x-1,y+1),(x-3,y),(x-1,y-1)], color, INK)
    c.l([(x,y-1),(x,y+1)], WHITE)


def corners(c, color):
    for x,y,dx,dy in [(3,3,1,1),(28,3,-1,1),(3,28,1,-1),(28,28,-1,-1)]:
        c.l([(x,y+4*dy),(x,y),(x+4*dx,y)], INK, 3)
        c.l([(x,y+3*dy),(x,y),(x+3*dx,y)], color)


def plate(c, x, y):
    c.p([(x+4,y),(x+9,y+1),(x+12,y+6),(x+11,y+12),(x+6,y+15),(x,y+10),(x,y+4)], BROWN1, INK)
    c.p([(x+4,y+1),(x+8,y+2),(x+10,y+6),(x+8,y+11),(x+5,y+12),(x+1,y+8),(x+1,y+4)], STONE)
    c.p([(x+4,y+2),(x+7,y+2),(x+8,y+5),(x+5,y+9),(x+2,y+7)], BONE)
    c.p([(x+5,y+4),(x+8,y+6),(x+6,y+9),(x+3,y+7)], BROWN, INK)
    c.l([(x+4,y+5),(x+5,y+4),(x+6,y+5)], WHITE)


def shield(c, small=False, x=0):
    if small:
        c.p([(x+3,4),(x+7,3),(x+11,5),(x+10,10),(x+7,13),(x+3,10)], BROWN, INK)
        c.p([(x+4,5),(x+7,4),(x+9,6),(x+8,10),(x+7,11),(x+4,9)], BONE)
        c.l([(x+7,5),(x+7,10)], STONE)
        return
    c.p([(x+4,6),(x+9,7),(x+13,5),(x+17,7),(x+19,6),(x+18,17),(x+13,23),(x+7,20),(x+4,14)], BROWN1, INK)
    c.p([(x+5,8),(x+9,9),(x+13,7),(x+16,9),(x+17,8),(x+16,16),(x+12,21),(x+8,18),(x+6,13)], STONE)
    c.p([(x+6,9),(x+9,10),(x+12,8),(x+12,18),(x+8,17)], BONE)
    c.l([(x+13,9),(x+14,15),(x+12,20)], TAN)
    c.l([(x+6,9),(x+7,14)], WHITE)


def relic(name, n):
    c = Canvas(n)
    if n == 16:
        if name == 'osteoderm_plates':
            for x,y in [(7,2),(3,4),(6,7)]:
                c.p([(x+2,y),(x+5,y+2),(x+4,y+6),(x+1,y+6),(x,y+3)], STONE, INK)
                c.l([(x+1,y+2),(x+2,y+1),(x+3,y+3)], BONE)
        elif name == 'horn_shield':
            c.p([(4,3),(6,2),(6,6),(10,7),(12,4),(13,8),(10,13),(5,12),(2,8)], TAN, INK)
            c.p([(4,4),(5,4),(5,7),(9,9),(6,11),(3,8)], BONE)
            c.l([(9,10),(11,8)], BROWN)
        elif name == 'club_knob':
            c.p([(2,9),(7,7),(8,3),(11,2),(13,5),(13,10),(10,12),(7,10),(3,11)], BROWN, INK)
            c.p([(8,5),(10,3),(11,4),(10,7),(7,8),(3,10),(3,9)], STONE)
            c.l([(11,8),(11,10)], TAN)
        elif name == 'feathered_arms':
            c.p([(3,4),(7,3),(11,6),(10,8),(12,11),(10,12),(7,9),(5,11),(4,9),(2,9)], BROWN, INK)
            c.l([(4,4),(8,5),(9,6)], RUST, 2)
            c.l([(6,7),(7,10)], BONE)
            c.l([(10,8),(12,10),(12,12)], STONE)
        elif name == 'keen_eye':
            c.p([(2,8),(5,4),(10,3),(13,6),(13,9),(9,12),(5,11)], GREEN2, INK)
            c.p([(3,8),(6,5),(10,5),(12,7),(10,10),(6,10)], GOLD)
            c.l([(8,5),(8,10)], INK, 2)
            c.r((5,6,6,7), WHITE)
        elif name == 'sickle_claw':
            c.p([(3,12),(3,7),(6,3),(10,2),(13,4),(13,7),(10,5),(7,6),(4,10)], BROWN, INK)
            c.l([(3,9),(5,5),(8,3),(11,3)], BONE)
            c.l([(6,6),(9,4),(11,5)], STONE)
        elif name == 'gizzard_stones':
            for box in [(6,3,12,9),(2,7,8,12),(7,8,13,13)]:
                c.e(box, STEEL, INK)
                x,y,_,_=box
                c.r((x+2,y+1,x+3,y+2), STONE)
                c.r((x+2,y+1,x+2,y+1), WHITE)
        elif name == 'fat_hump':
            c.p([(2,11),(4,7),(6,3),(9,3),(11,6),(13,11),(11,13),(4,13)], BROWN, INK)
            c.p([(4,10),(6,5),(8,4),(10,7),(10,11),(6,12)], HONEY)
            c.l([(6,7),(7,5),(8,5)], BONE)
        elif name == 'display_crest':
            c.p([(2,10),(4,6),(9,2),(12,2),(13,4),(13,8),(11,6),(10,5),(7,7),(6,11),(8,13),(5,13)], PURPLE0, INK)
            c.l([(3,9),(5,6),(10,3),(12,3)], RUST, 2)
            c.l([(5,7),(10,4)], LILAC)
            c.l([(5,10),(6,12)], ORANGE)
        elif name == 'meteor_shard':
            c.p([(3,6),(8,2),(12,4),(13,9),(9,13),(4,12),(2,9)], COAL, INK)
            c.p([(4,6),(8,3),(7,7),(4,10)], STEEL)
            c.l([(9,4),(8,7),(10,8),(8,11),(8,12)], GOLD)
            c.l([(5,8),(8,7)], HONEY)
        return c.im
    if name == 'osteoderm_plates':
        plate(c,15,5); plate(c,5,8); plate(c,11,14)
    elif name == 'horn_shield':
        c.p([(8,5),(11,4),(10,12),(14,16),(20,15),(24,10),(26,7),(27,15),(24,22),(17,27),(10,24),(5,18),(5,11)], BROWN1, INK)
        c.p([(8,7),(9,6),(8,13),(12,18),(18,20),(23,17),(24,13),(25,12),(24,20),(17,25),(11,22),(7,17),(6,12)], TAN)
        c.p([(8,8),(8,14),(12,19),(15,21),(12,22),(8,18),(7,13)], BONE)
        c.l([(18,23),(21,21),(23,18)], STONE)
        c.l([(7,10),(7,14)], WHITE)
    elif name == 'club_knob':
        c.p([(5,20),(14,16),(15,10),(19,7),(24,8),(27,12),(27,19),(23,23),(18,23),(14,20),(6,23)], BROWN1, INK)
        c.p([(6,20),(16,17),(19,13),(21,15),(18,19),(7,22)], TAN)
        c.p([(16,11),(19,8),(23,9),(24,13),(20,17),(16,16)], STONE, INK)
        c.p([(20,17),(24,14),(26,15),(26,19),(22,22),(19,21)], BROWN, INK)
        c.l([(17,12),(20,10),(22,10)], BONE)
        c.l([(21,18),(23,17),(24,17)], HONEY)
        c.r((18,12,19,13), WHITE)
    elif name == 'feathered_arms':
        c.p([(6,10),(11,7),(16,9),(21,13),(22,16),(26,20),(26,24),(24,23),(22,19),(20,18),(20,24),(17,23),(16,18),(14,23),(11,21),(10,17),(6,19),(5,16),(7,14)], BROWN1, INK)
        c.p([(7,11),(11,8),(15,10),(20,14),(18,17),(12,15)], RUST)
        for a,b in [((8,12),(7,17)),((11,13),(12,20)),((14,14),(15,20)),((17,15),(18,21))]:
            c.l([a,b], BONE, 2)
        c.l([(10,10),(13,10),(18,14)], ORANGE)
        c.l([(21,15),(24,19),(25,22)], STONE)
        c.l([(20,17),(21,21)], BONE)
    elif name == 'keen_eye':
        c.p([(5,17),(9,11),(15,7),(23,8),(27,13),(26,20),(20,25),(11,24),(6,21)], GREEN1, INK)
        c.p([(6,17),(11,12),(17,10),(23,11),(26,15),(23,19),(17,22),(11,21)], BROWN1, INK)
        c.p([(8,17),(12,13),(17,11),(22,12),(24,15),(22,18),(17,20),(12,20)], GOLD)
        c.p([(18,11),(19,14),(18,20),(16,20),(16,12)], INK)
        c.r((12,13,14,15), WHITE)
        c.l([(8,13),(12,9),(18,8),(23,9)], GREEN)
        c.l([(12,23),(18,24),(23,21)], GREEN2)
    elif name == 'sickle_claw':
        c.p([(5,26),(6,18),(9,11),(14,6),(20,5),(25,8),(27,13),(26,18),(22,13),(19,12),(15,14),(11,19),(8,24)], BROWN1, INK)
        c.p([(6,23),(8,16),(11,11),(16,7),(21,7),(24,10),(24,12),(20,10),(15,12),(11,16)], STONE)
        c.l([(8,18),(11,12),(16,8),(20,7)], BONE, 2)
        c.l([(9,16),(12,11),(16,9)], WHITE)
        c.l([(17,12),(21,11),(24,14)], TAN)
    elif name == 'gizzard_stones':
        for box in [(13,6,24,18),(5,14,17,25),(16,16,27,26)]:
            c.e(box, STEEL, INK)
            x,y,x1,y1=box
            c.e((x+2,y+1,x1-3,y1-4), GREY)
            c.l([(x+3,y+4),(x+4,y+2),(x+6,y+2)], STONE, 2)
            c.r((x+4,y+2,x+5,y+2), WHITE)
            c.l([(x+3,y1-2),(x1-3,y1-1)], COAL)
    elif name == 'fat_hump':
        c.p([(5,22),(8,16),(10,10),(14,6),(18,6),(22,11),(24,17),(27,23),(24,26),(17,27),(9,26)], BROWN1, INK)
        c.p([(7,22),(10,16),(12,10),(15,7),(18,8),(21,13),(22,22),(18,25),(11,25)], RUST)
        c.p([(10,20),(12,12),(15,9),(18,10),(20,15),(19,22),(14,24)], HONEY)
        c.l([(12,15),(14,11),(17,10),(18,12)], BONE, 2)
        c.r((14,11,15,12), WHITE)
    elif name == 'display_crest':
        c.p([(5,20),(7,14),(12,9),(20,5),(25,6),(27,10),(27,17),(24,15),(23,11),(20,10),(15,13),(12,17),(12,22),(16,26),(11,27),(8,23)], PURPLE0, INK)
        c.p([(6,19),(8,14),(13,10),(21,6),(24,7),(25,10),(23,9),(20,8),(14,12),(10,17),(10,23),(12,25),(10,25),(8,22)], RUST)
        c.l([(8,16),(13,11),(21,7),(24,8)], ORANGE)
        c.l([(11,18),(14,14),(21,10),(23,11)], LILAC)
        c.l([(13,15),(19,12)], PURPLE)
        c.l([(10,21),(12,24),(14,25)], HONEY)
    elif name == 'meteor_shard':
        c.p([(6,13),(15,5),(23,7),(27,16),(23,24),(15,27),(7,23),(5,18)], COAL, INK)
        c.p([(7,13),(15,6),(19,8),(14,14),(9,21),(6,18)], STEEL)
        c.p([(18,12),(23,9),(25,16),(21,21),(16,24),(12,23)], INK)
        c.l([(20,8),(18,13),(21,16),(17,20),(16,25)], GOLD)
        c.l([(9,17),(14,16),(18,13)], HONEY)
        c.l([(18,14),(20,16),(18,18)], WHITE)
        c.l([(10,11),(14,8)], GREY)
    corners(c, GOLD if name=='meteor_shard' else LILAC if name in ('club_knob','sickle_claw','display_crest') else TEAL)
    return c.im


def badge(name):
    c=Canvas(24)
    shape=[(5,2),(18,2),(21,5),(21,18),(18,21),(5,21),(2,18),(2,5)]
    c.p(shape,BROWN1,INK)
    c.l([(3,7),(3,5),(5,3),(18,3),(20,5)], HONEY)
    c.l([(20,6),(20,18),(18,20),(6,20)], BROWN)
    c.p([(6,5),(17,5),(18,6),(18,17),(17,18),(6,18),(5,17),(5,6)],GREEN0,INK)
    for x,y in [(4,4),(19,4),(4,19),(19,19)]: c.r((x,y,x,y),BONE)
    if name=='set_armor':
        c.p([(7,8),(10,9),(12,6),(15,9),(17,8),(16,14),(12,18),(8,15)],BROWN,INK)
        c.p([(8,10),(10,11),(12,8),(12,16),(9,14)],BONE)
        c.p([(13,10),(15,11),(14,14),(13,15)],STONE)
        c.l([(9,10),(9,13)],WHITE)
    elif name=='set_hunter':
        c.p([(6,16),(6,12),(9,7),(13,6),(15,8),(12,8),(9,11),(8,15)], BONE,INK)
        c.p([(10,14),(12,11),(15,10),(18,13),(16,16),(12,16)],GOLD,INK)
        c.l([(14,11),(14,15)],INK)
        c.r((12,12,12,12),WHITE)
    elif name=='set_survivor':
        c.p([(6,7),(8,6),(10,8),(9,10),(8,10),(8,14),(10,15),(9,17),(7,17),(6,15),(6,10),(5,9)],BONE,INK)
        c.p([(11,10),(13,9),(15,11),(17,9),(19,10),(19,13),(15,17),(11,13)],RED,INK)
        c.l([(12,11),(13,10)],ORANGE)
        c.l([(16,14),(15,15)],BLOOD)
    else:
        c.p([(12,6),(14,10),(18,10),(15,13),(16,18),(12,15),(8,18),(9,13),(6,10),(10,10)], COAL,INK)
        c.l([(12,7),(12,11),(8,11),(11,13),(9,16)],GOLD)
        c.l([(12,11),(14,12),(14,15)],HONEY)
        c.r((11,10,11,10),WHITE)
    return c.im


def fern(c, x,y,dx,dy,length):
    # Native integer strokes, not a rotated/resized source sprite.
    if dx==0:
        c.p([(x,y),(x-3,y+dy*2),(x-3,y+dy*(length-3)),(x,y+dy*length),(x+3,y+dy*(length-3)),(x+3,y+dy*2)],GREEN2,INK)
    else:
        c.p([(x,y),(x+dx*2,y-3),(x+dx*(length-3),y-3),(x+dx*length,y),(x+dx*(length-3),y+3),(x+dx*2,y+3)],GREEN2,INK)
    c.l([(x,y),(x+dx*length,y+dy*length)], GREEN)
    for t in range(2,length-1,2):
        px,py=x+dx*t,y+dy*t
        if dx==0:
            c.l([(px-2,py-dy),(px,py)],LIME)
            c.l([(px,py),(px+2,py-dy)],GREEN)
        else:
            c.l([(px,py),(px-dx,py-2)],LIME)
            c.l([(px-dx,py+2),(px,py)],GREEN)


def loot(name,n):
    c=Canvas(n)
    if name in ('luck','luck_card'):
        if n==24:
            fern(c,11,12,0,-1,7); fern(c,10,13,-1,0,6); fern(c,11,14,0,1,5)
            c.l([(11,13),(15,18),(15,20)],BROWN,2)
            star(c,18,11)
        else:
            fern(c,14,15,0,-1,10); fern(c,13,16,-1,0,8); fern(c,14,17,0,1,9)
            c.l([(14,16),(19,23),(20,27)],BROWN,2)
            star(c,24,14)
            c.r((23,9,23,9),WHITE)
    elif name=='armor_points':
        # x=0..15 occupied; x=16..23 is reserved for the renderer's number.
        c.p([(3,6),(6,7),(9,4),(12,7),(14,6),(13,15),(9,20),(4,17),(2,12)],BROWN1,INK)
        c.p([(4,8),(6,9),(9,6),(9,17),(5,15)],BONE)
        c.p([(10,9),(12,9),(11,14),(10,16)],STONE)
        c.l([(4,9),(4,12)],WHITE)
    elif name=='nest_cache':
        c.e((4,15,27,27),BROWN0,INK)
        c.e((6,16,25,24),BROWN1,INK)
        for box in [(8,13,14,22),(13,8,20,19),(19,14,25,23)]:
            c.e(box,STONE,INK)
            x,y,x1,y1=box
            c.e((x+1,y+1,x1-2,y1-3),BONE)
            c.r((x+2,y+2,x+2,y+3),WHITE)
        for pts,color in [([(4,18),(8,24),(22,26),(27,21)],BROWN), ([(5,22),(13,27),(23,25)],TAN), ([(3,16),(7,20),(14,24),(25,22),(28,17)],BROWN1), ([(5,18),(10,22),(21,23),(26,19)],HONEY), ([(7,25),(12,26),(23,24),(27,20)],BROWN), ([(4,23),(8,25)],BONE)]: c.l(pts,color)
        star(c,25,7)
    elif name=='relic_drop':
        c.p([(7,9),(13,5),(17,8),(18,14),(13,19),(8,17),(6,13)],STEEL,INK)
        c.p([(8,10),(13,6),(14,10),(11,14),(8,15)],WHITE)
        c.p([(12,14),(16,10),(16,14),(13,17),(10,17)],STONE)
        for x,y in [(4,8),(19,7),(19,17),(5,18)]: c.r((x,y,x,y),WHITE)
        c.l([(19,10),(19,12)],STONE)
    elif name=='reel_frame':
        # 24px nine-slice: exact 8/8/8 divisions; center [8:16,8:16] empty.
        c.r((0,0,23,23),INK)
        c.r((1,1,22,22),BROWN)
        c.r((3,3,20,20),HONEY)
        c.r((5,5,18,18),INK)
        c.r((6,6,17,17),(0,0,0,0))
        for x,y in [(0,0),(16,0),(0,16),(16,16)]:
            c.r((x,y,x+7,y+7),INK)
            c.r((x+1,y+1,x+6,y+6),BROWN)
            c.l([(x+1,y+6),(x+1,y+1),(x+6,y+1)],BONE)
            c.r((x+3,y+3,x+4,y+4),BROWN0)
        c.l([(8,1),(15,1)],BONE)
        c.l([(1,8),(1,15)],BONE)
        c.l([(8,22),(15,22)],BROWN1)
        c.l([(22,8),(22,15)],BROWN1)
    return c.im


RELICS=['osteoderm_plates','horn_shield','club_knob','feathered_arms','keen_eye','sickle_claw','gizzard_stones','fat_hump','display_crest','meteor_shard']
SETS=['set_armor','set_hunter','set_survivor','set_joker']
LOOT={'luck':24,'luck_card':32,'armor_points':24,'nest_cache':32,'relic_drop':24,'reel_frame':24}


def main():
    manifest_file=GAME/'hud_icons_manifest.json'
    remaining=[e for e in json.loads(manifest_file.read_text()) if e['group'] not in ('relics','sets','loot')] if manifest_file.exists() else []
    entries=[]
    for group,items in [('relics',[(name,n) for name in RELICS for n in (32,16)]),('sets',[(name,24) for name in SETS]),('loot',list(LOOT.items()))]:
        (OUT/group).mkdir(parents=True,exist_ok=True)
        for name,n in items:
            im=relic(name,n) if group=='relics' else badge(name) if group=='sets' else loot(name,n)
            id_=name+('_16' if group=='relics' and n==16 else '')
            file=f'assets/hud_icons/{group}/{id_}.png'
            im.save(GAME/file)
            entries.append(dict(file=file,size=[n,n],group=group,id=id_,palette='Primal Earth 32',status='prototype_static',production_approved=False,animation_ready=False,origin=[n//2,n//2],source='tools/draw_hud_icons_ac.py: hand-plotted native integer pixels; independent small-chip drawings; no resizing',sha256=hashlib.sha256((GAME/file).read_bytes()).hexdigest()))
    source_dir=GAME/'Source_Generated/hud_icons'
    source_dir.mkdir(parents=True,exist_ok=True)
    symbols='0123456789ABCDEFGHIJKLMNOPQRSTUV'
    color_index={tuple(bytes.fromhex(v[1:])):symbols[i] for i,v in enumerate(COLORS)}
    pixels={e['id']:[''.join(color_index[p[:3]] if p[3] else '.' for p in list(Image.open(GAME/e['file']).getdata())[y*e['size'][0]:(y+1)*e['size'][0]]) for y in range(e['size'][1])] for e in entries}
    source_file=source_dir/'native_pixels_ac.json'
    source_file.write_text(json.dumps(dict(palette=COLORS,symbols=symbols,transparent='.',icons=pixels),indent=2)+'\n',encoding='utf-8')
    source_hash=hashlib.sha256(source_file.read_bytes()).hexdigest()
    for e in entries:
        e.update(source_pixels='Source_Generated/hud_icons/native_pixels_ac.json',source_sha256=source_hash)
    (GAME/'hud_icons_manifest.json').write_text(json.dumps(entries+remaining,indent=2)+'\n',encoding='utf-8')
    preview(entries+remaining)
    print(f'Wrote {len(entries)} native PNGs. All prototype_static.')


def preview(entries):
    # Every file appears at 1x and 4x, on both specified backgrounds.
    font=ImageFont.load_default()
    w,h=280,205
    sheet=Image.new('RGB',(w*5,60+h*((len(entries)+4)//5)),'#101713')
    d=ImageDraw.Draw(sheet)
    d.text((12,10),'PRIMAL RUN / NATIVE PNG REVIEW / PROTOTYPE_STATIC',font=font,fill=WHITE)
    d.text((12,30),'Each file: 1x + 4x on dark and light. No runtime integration. Awaiting Jonas review.',font=font,fill=STONE)
    for i,e in enumerate(entries):
        x=(i%5)*w; y=60+(i//5)*h
        im=Image.open(GAME/e['file'])
        for j,bg in enumerate(('#101713','#e8ece1')):
            xx=x+j*140
            d.rectangle((xx,y,xx+139,y+169),fill=bg)
            sheet.paste(im,(xx+8,y+8),im)
            big=im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST)
            sheet.paste(big,(xx+(140-big.width)//2,y+40),big)
        d.text((x+5,y+174),e['id'],font=font,fill=WHITE)
        d.text((x+5,y+189),f"{e['group']} / {im.width}x{im.height}",font=font,fill=STONE)
    (GAME/'previews').mkdir(exist_ok=True)
    sheet.save(GAME/'previews/hud_icons_review.png')


if __name__=='__main__': main()
