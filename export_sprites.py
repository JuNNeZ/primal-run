from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import json, zipfile, hashlib

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'Source_Original/concept.png'
OUT = ROOT / 'PRIMAL_RUN_Sprites'
im = Image.open(SOURCE).convert('RGB')
items=[]

def add(folder,name,box,canvas=None,opaque=False,note=''):
    items.append(dict(folder=folder,name=name,box=box,canvas=canvas,opaque=opaque,note=note))

# Each source pose is kept independent: column numbers do not imply animation frames.
rows=[('idle',36,125),('walk',127,216),('run',217,309),('attack',316,405),('hurt',411,502)]
cols=[(71,121),(130,188),(192,271),(272,340),(350,405),(409,527),(533,603)]
for state,y1,y2 in rows:
    for i,(x1,x2) in enumerate(cols,1):
        add('01_Player_Utahraptor/'+state,f'utahraptor_{state}_pose_{i:02}',(x1,y1,x2,y2),(128,128),note='Independent source pose; not a confirmed animation frame.')
for i,box in enumerate([(71,513,179,573),(188,514,276,575),(280,513,378,575),(382,515,481,576),(488,510,608,577)],1):
    add('01_Player_Utahraptor/death',f'utahraptor_death_pose_{i:02}',box,(128,128),note='Independent death illustration; no verified temporal order.')

enemy_sets=[
 ('compy',[(646,70,672,139),(699,69,726,140),(747,70,784,139),(800,67,838,137),(854,65,883,140),(912,67,941,139),(956,72,988,139),(1013,67,1046,140)],(64,96)),
 ('parasaurolophus_young',[(643,168,679,268),(692,167,731,270),(750,167,797,269),(797,166,851,274),(858,168,901,274),(911,168,959,269),(960,162,1005,269),(1007,171,1051,279)],(96,128)),
 ('carnotaurus_young',[(637,301,681,413),(688,300,738,414),(746,299,797,414),(803,300,854,414),(861,300,910,419),(914,300,964,418),(988,300,1041,420)],(96,128)),
 ('trex',[(638,439,690,565),(703,439,763,575),(774,443,826,567),(834,433,895,579),(901,450,937,542),(946,450,995,579),(1000,438,1052,586)],(96,160))]
for species,boxes,canvas in enemy_sets:
    for i,box in enumerate(boxes,1):
        add('02_Enemies/'+species,f'{species}_pose_{i:02}',box,canvas,note='Independent sample pose; size and direction vary in source.')

tiles=[('grass',(1077,66,1174,154)),('dirt',(1183,66,1267,154)),('rocky',(1277,66,1358,154)),('sand',(1368,66,1443,154)),('water',(1454,66,1523,154)),('dense_grass',(1077,185,1161,278)),('forest_floor',(1173,185,1257,277)),('rock',(1267,185,1343,279)),('cliff_edge',(1352,185,1435,278)),('shallow_water',(1447,203,1523,282)),('cliff_01',(1449,308,1520,414)),('cliff_02',(1450,421,1519,485)),('cliff_03',(1450,493,1519,557)),('cliff_04',(1450,562,1519,580))]
for name,box in tiles:
    add('03_Environment/Source_Crops',name,box,opaque=True,note='Original rectangular illustration crop; seamless tiling is not verified.')
add('03_Environment','biome_scene_sample',(1078,288,1442,580),opaque=True,note='Single illustration, not a tileset.')

props=[
 ('tree_large',(16,631,181,816)),('tree_small',(184,633,278,753)),('bush_01',(280,635,343,692)),('bush_02',(283,706,346,754)),('tree_dead',(348,632,416,750)),
 ('rock_moss',(432,626,515,713)),('rock_small_01',(525,651,553,687)),('rock_cluster_01',(557,625,644,703)),('plant_01',(514,699,558,750)),('stump',(575,712,635,763)),
 ('bush_03',(148,749,225,818)),('flowers_red_01',(240,756,288,805)),('stones_small',(327,762,376,795)),('plant_02',(371,734,432,787)),('plant_03',(458,736,509,784)),('flowers_red_02',(515,771,560,824)),('plant_04',(577,772,638,811)),
 ('flowers_white',(396,792,441,842)),('flowers_red_03',(456,792,507,842)),('plant_05',(337,799,377,839)),
 ('rock_cluster_02',(16,816,121,902)),('tree_trunk',(123,832,169,924)),('log_large',(175,805,327,884)),('fern_large',(262,858,365,937)),('branch_pile',(364,845,443,903)),
 ('plant_06',(18,902,65,942)),('twig_01',(78,925,105,949)),('twig_02',(109,909,133,936)),('log_small',(169,890,252,954)),('rock_flowers',(17,943,67,1004)),('twig_03',(77,950,107,993)),
 ('rock_cluster_03',(108,935,193,1008)),('rock_small_02',(198,974,238,1005)),('fern_02',(238,944,291,997)),('plant_07',(297,960,323,995)),('plant_08',(327,959,350,995)),('fern_03',(354,924,408,970)),
 ('skeleton_large',(451,814,643,948)),('bone_01',(402,903,458,938)),('bone_02',(559,921,611,955)),('bone_03',(615,899,642,919)),('bone_04',(615,939,640,960)),('bone_05',(584,953,640,1006)),
 ('bone_06',(547,960,598,979)),('bone_07',(549,980,577,1004)),('bone_08',(491,961,538,1003)),('bone_09',(455,971,485,993)),('bone_10',(472,949,495,969)),('bone_11',(386,973,431,1004)),('skull_small',(385,949,450,985))]
for name,box in props: add('04_Props',name,box)

for i,(name,y) in enumerate([('health',638),('hunger',670),('thirst',703),('stamina',735),('xp',767)]):
    if name!='xp': add('05_UI/Icons',name,(684,y-2,718,y+29),(40,40))
    add('05_UI/Bars',f'{name}_bar_sample',(726,y-1,873,y+29),note='Baked partial fill from source; not a functional meter.')
add('05_UI/Icons','xp_label',(684,767,717,795),(40,40))
for i,(name,x1,x2) in enumerate([('claws',681,739),('footprint',746,804),('feather',813,870),('heal',876,933),('dna',938,998)]):
    add('05_UI/Buttons',f'mutation_{name}',(x1,802,x2,859),(64,64),opaque=True)
    add('05_UI/Slots',f'empty_slot_{i+1:02}',(x1,864,x2,906),(64,64),opaque=True)
for name,box in [('meat',(677,946,747,1007)),('water',(766,946,807,1008)),('dna',(825,944,882,1009)),('bone',(885,949,948,1007)),('leaves',(958,944,1023,1009))]:
    add('06_Pickups',name,box,(80,80))

effects=[('blood_splash',(1046,629,1194,728)),('claw_slash',(1198,626,1308,728)),('sparkles',(1313,630,1433,726)),('smoke',(1435,630,1517,729)),('dust',(1052,731,1150,814)),('impact',(1161,731,1262,814)),('water_splash',(1264,728,1400,817)),('bubble_01',(1394,730,1418,754)),('bubble_02',(1390,775,1413,798)),('bubble_03',(1422,760,1452,791)),('bubble_04',(1451,781,1478,807)),('bubble_05',(1433,795,1454,815))]
for name,box in effects:add('07_Effects',name,box,note='Single static effect; animation is not supplied.')
for name,box in [('egg',(1055,884,1108,952)),('nest_eggs',(1113,877,1263,997)),('hatching_dinosaur',(1264,875,1366,984)),('nest_empty',(1368,873,1524,990))]:
    add('08_Eggs_Nests',name,box)

def transparent_crop(box):
    a=np.array(im.crop(box)); h,w=a.shape[:2]
    # Remove only near-black pixels connected to the outside. Enclosed dark
    # markings remain, and no generated pixels or resampling are used.
    candidate=np.max(a,axis=2)<=42
    bg=np.zeros((h,w),bool); q=deque()
    for x in range(w):
        for y in (0,h-1):
            if candidate[y,x] and not bg[y,x]: bg[y,x]=True;q.append((y,x))
    for y in range(h):
        for x in (0,w-1):
            if candidate[y,x] and not bg[y,x]: bg[y,x]=True;q.append((y,x))
    while q:
        y,x=q.popleft()
        for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0<=yy<h and 0<=xx<w and candidate[yy,xx] and not bg[yy,xx]:
                bg[yy,xx]=True;q.append((yy,xx))
    rgba=np.dstack((a,np.where(bg,0,255).astype(np.uint8)))
    rgba[bg,:3]=0
    return Image.fromarray(rgba,'RGBA')

manifest=[]; previews=[]
for item in items:
    pic=im.crop(item['box']).convert('RGBA') if item['opaque'] else transparent_crop(item['box'])
    # Exclude unrelated neighboring objects which intersect rectangular cuts.
    exclusions={
        'tree_large':[(155,743,181,816)],
        'plant_02':[(371,734,397,748)],
        'fern_large':[(262,858,286,872)],
        'log_large':[(175,805,243,823),(263,861,327,884)],
        'log_small':[(169,936,187,954)],
        'skull_small':[(385,949,400,971)],
        'bone_05':[(584,953,613,975)],
        'bone_11':[(386,973,409,984)],
        'skeleton_large':[(451,814,564,839),(451,927,643,948),(557,908,643,927),(613,897,643,927)],
        'claw_slash':[(1302,626,1308,728)],
    }
    for x1,y1,x2,y2 in exclusions.get(item['name'],[]):
        x0,y0,_,_=item['box']
        pic.paste((0,0,0,0),(max(0,x1-x0),max(0,y1-y0),min(pic.width,x2-x0),min(pic.height,y2-y0)))
    content_box=pic.getbbox()
    if content_box is None: raise ValueError(item['name']+' empty')
    pic=pic.crop(content_box)
    canvas=item['canvas']
    if canvas:
        if pic.width>canvas[0] or pic.height>canvas[1]: raise ValueError((item['name'],pic.size,canvas))
        result=Image.new('RGBA',canvas)
        result.alpha_composite(pic,((canvas[0]-pic.width)//2,(canvas[1]-pic.height)//2))
        pic=result
    else:
        result=Image.new('RGBA',(pic.width+4,pic.height+4)) if not item['opaque'] else pic
        if not item['opaque']: result.alpha_composite(pic,(2,2))
        pic=result
    path=OUT/item['folder']/(item['name']+'.png');path.parent.mkdir(parents=True,exist_ok=True);pic.save(path)
    manifest.append(dict(file=path.relative_to(OUT).as_posix(),width=pic.width,height=pic.height,source_box=item['box'],suggested_origin=[pic.width//2,pic.height//2],status='prototype_static',animation_ready=False,note=item['note']))
    previews.append((path.relative_to(OUT).as_posix(),pic))

(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
# Contact sheets show actual exported PNGs on a checkerboard, at native resolution.
for folder in sorted(set(name.split('/')[0] for name,pic in previews)):
    subset=[(name,pic) for name,pic in previews if name.startswith(folder+'/')]
    cw,ch=220,222;columns=6;rows=(len(subset)+columns-1)//columns
    sheet=Image.new('RGB',(cw*columns,ch*rows),(27,31,35));d=ImageDraw.Draw(sheet)
    for i,(name,pic) in enumerate(subset):
        ox=(i%columns)*cw;oy=(i//columns)*ch
        for yy in range(oy+4,oy+188,8):
            for xx in range(ox+4,ox+cw-4,8):
                d.rectangle((xx,yy,xx+7,yy+7),fill=(62,66,70) if ((xx-ox)//8+(yy-oy)//8)%2 else (48,52,56))
        view=pic.copy();view.thumbnail((cw-12,176),Image.Resampling.NEAREST)
        sheet.paste(view,(ox+(cw-view.width)//2,oy+8+(176-view.height)//2),view)
        d.text((ox+6,oy+191),Path(name).stem,fill='white')
        d.text((ox+6,oy+206),f'{pic.width} x {pic.height}',fill=(180,190,200))
    p=OUT/'Previews'/f'{folder}.jpg';p.parent.mkdir(exist_ok=True);sheet.save(p,quality=95)
    # A second native-resolution preview makes dark outlines and extraction errors visible.
    light=Image.new('RGB',(cw*columns,ch*rows),(235,235,235));ld=ImageDraw.Draw(light)
    for i,(name,pic) in enumerate(subset):
        ox=(i%columns)*cw;oy=(i//columns)*ch
        view=pic.copy();view.thumbnail((cw-12,176),Image.Resampling.NEAREST)
        light.paste(view,(ox+(cw-view.width)//2,oy+8+(176-view.height)//2),view)
        ld.text((ox+6,oy+191),Path(name).stem,fill='black')
        ld.text((ox+6,oy+206),f'{pic.width} x {pic.height}',fill=(60,60,60))
    light.save(OUT/'Previews'/f'{folder}_light.jpg',quality=95)

print(f'Exported {len(manifest)} PNG files to {OUT}')
