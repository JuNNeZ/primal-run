"""D-I native HUD prototypes; hand-plotted at the exported pixel dimensions."""
import argparse
import hashlib
import json
from PIL import Image
from draw_hud_icons_ac import *

GROUPS={
 'rarity':(['common','uncommon','rare','epic','legendary','evolution','trophy'],16),
 'tags':(['attack','defense','speed','ability','food','crit'],16),
 'mutations':(['bleed','crit_claw','tail','horn','frill','fish_hook','plant','iron_stomach','pack_call','roar','pounce','stealth','carrion','ability_spark'],32),
 'ui':(['sneak','ability_stamina','dna_lab','species_book','title_book','records','challenges','settings','achievement','rival','toxic','ash','locked'],24),
 'difficulty':(['normal','extinction'],24),
 'future':(['amber_chip','fossil_chip','iridium_chip','tar_totem','rotten_meat','bounty_target','daily_hunt','extinction_pressure'],24)}


def gem(name):
    c=Canvas(16)
    if name=='evolution':
        c.p([(4,3),(10,2),(13,5),(13,10),(10,13),(5,13),(2,10),(2,6)],BROWN1,INK)
        c.l([(4,6),(5,4),(10,4),(11,6),(11,10),(9,11),(5,11),(4,9),(4,7),(8,6),(9,8),(8,9),(7,9)],GOLD)
        c.r((5,4,6,4),WHITE)
    elif name=='trophy':
        c.p([(4,2),(6,2),(6,4),(9,4),(9,2),(11,2),(11,6),(10,7),(10,11),(12,12),(12,13),(3,13),(3,12),(5,11),(5,7),(4,6)],ORANGE,INK)
        c.r((6,6,8,10),HONEY)
        c.r((6,7,7,9),BROWN0)
        c.l([(5,3),(5,5)],BONE)
        c.l([(4,12),(10,12)],TAN)
    else:
        k=['common','uncommon','rare','epic','legendary'].index(name)
        color=[WHITE,GREEN,TEAL,LILAC,GOLD][k]
        shadow=[GREY,GREEN1,BLUE,PURPLE0,BROWN][k]
        c.p([(5,2),(10,2),(13,6),(12,10),(8,13),(3,10),(2,6)],shadow,INK)
        c.p([(5,3),(9,3),(11,6),(8,11),(4,9),(3,6)],color)
        if k>=1: c.l([(3,6),(7,5),(10,3)],shadow)
        if k>=2: c.l([(7,5),(9,8),(8,12)],shadow)
        if k>=3: c.l([(9,8),(12,7)],shadow); c.l([(4,9),(7,8),(7,5)],shadow)
        if k>=4: c.l([(5,3),(7,5),(8,3)],WHITE); c.l([(9,8),(10,10)],HONEY)
        c.r((5,3,6,3),WHITE)
    return c.im


def tag(name):
    c=Canvas(16)
    if name=='attack':
        c.p([(3,3),(7,2),(12,4),(10,8),(5,13),(5,9),(3,7)],STONE,INK)
        c.p([(4,4),(7,3),(9,4),(7,8),(6,10),(5,7)],BONE)
        c.l([(4,4),(6,3)],WHITE)
    elif name=='defense': shield(c,True)
    elif name=='speed':
        c.p([(8,7),(9,5),(11,6),(13,10),(11,13),(8,12),(6,10)],GREEN,INK)
        for b in [(6,4,7,5),(9,2,10,4),(12,3,13,5)]: c.e(b,BONE,INK)
        c.l([(2,8),(5,8)],TEAL); c.l([(3,11),(5,11)],STONE)
        c.r((9,8,10,9),LIME)
    elif name=='ability': star(c,8,7,TEAL); c.l([(3,3),(4,4)],MINT); c.l([(11,11),(12,12)],BLUE)
    elif name=='food':
        c.p([(3,6),(5,3),(9,3),(12,6),(12,10),(8,12),(4,11),(2,9)],RED0,INK)
        c.p([(4,6),(6,4),(9,4),(10,6),(9,9),(5,10),(3,9)],RED)
        c.l([(6,5),(8,5),(9,7)],RUST)
        c.e((9,8,12,11),BONE,INK)
    elif name=='crit':
        c.p([(3,12),(4,7),(7,4),(10,4),(11,6),(8,6),(5,9)],STONE,INK)
        c.l([(4,9),(6,6),(8,5)],BONE)
        star(c,10,9)
    return c.im


def bolt(c,large=False):
    if large:
        c.p([(17,5),(10,17),(15,17),(12,27),(23,13),(18,13),(21,5)],GOLD,INK)
        c.l([(16,8),(13,14),(17,14)],WHITE)
    else:
        c.p([(12,3),(6,13),(10,13),(8,21),(18,10),(14,10),(16,3)],GOLD,INK)
        c.l([(12,5),(9,11),(12,11)],WHITE)


def eye(c,closed=False):
    c.p([(5,16),(10,10),(17,8),(24,10),(27,15),(23,21),(16,24),(9,21)],GREEN1,INK)
    c.p([(7,16),(12,12),(18,11),(23,13),(25,15),(21,19),(16,21),(11,19)],GOLD)
    c.l([(17,12),(17,20)],INK,2)
    c.r((12,13,13,14),WHITE)
    if closed:
        c.p([(6,15),(10,10),(17,8),(24,10),(26,14),(21,15),(16,16),(11,16)],GREEN2,INK)
        c.l([(10,11),(16,10),(22,11)],GREEN)


def head(c,x,y):
    c.p([(x+1,y+9),(x+2,y+4),(x+5,y+1),(x+9,y+1),(x+12,y+4),(x+12,y+6),(x+7,y+7),(x+6,y+11),(x+2,y+13)],GREEN1,INK)
    c.p([(x+3,y+5),(x+5,y+2),(x+9,y+2),(x+10,y+4),(x+7,y+5),(x+5,y+9),(x+3,y+10)],GREEN)
    c.r((x+7,y+3,x+8,y+3),GOLD)
    c.l([(x+8,y+6),(x+11,y+5)],BONE)


def mutation(name):
    c=Canvas(32)
    if name=='bleed':
        c.p([(16,5),(20,12),(24,18),(24,23),(20,27),(12,27),(8,23),(8,18),(12,12)],RED0,INK)
        c.p([(15,9),(18,14),(21,19),(20,24),(15,25),(11,22),(11,18)],BLOOD)
        c.l([(12,17),(14,13),(15,12)],RUST,2)
        for x,y in [(19,14),(23,17),(20,20)]: c.p([(x,y),(x+2,y),(x+1,y+3)],BONE,INK)
    elif name=='crit_claw':
        for x,y in [(6,6),(14,5),(22,7)]:
            c.p([(x+3,y),(x+5,y+1),(x+2,y+10),(x-3,y+18),(x-1,y+8)],RED0,INK)
            c.l([(x+3,y+2),(x+1,y+9),(x-2,y+15)],BONE)
        star(c,24,23)
    elif name=='tail':
        c.p([(6,8),(12,6),(17,10),(21,17),(25,19),(28,16),(27,22),(23,26),(17,24),(13,17),(11,13),(7,14)],GREEN1,INK)
        c.p([(7,9),(11,8),(15,11),(18,18),(21,22),(24,22),(22,24),(18,22),(14,16),(11,11),(8,12)],GREEN)
        c.l([(8,9),(11,9),(14,12)],LIME)
        c.l([(4,17),(5,22),(9,25),(12,26)],TEAL)
        c.l([(4,21),(3,23),(7,24)],TEAL)
    elif name=='horn':
        c.p([(6,25),(9,17),(13,10),(17,5),(22,3),(21,9),(19,14),(20,20),(26,24),(25,27),(13,28)],BROWN1,INK)
        c.p([(8,24),(12,16),(17,9),(20,6),(18,13),(16,19),(18,24)],STONE)
        c.l([(11,20),(14,14),(18,9)],BONE,2)
        c.l([(8,26),(15,26),(20,24)],TAN)
    elif name=='frill':
        c.p([(6,19),(3,14),(5,8),(9,9),(11,4),(16,6),(20,4),(22,9),(27,9),(29,15),(25,21),(20,26),(12,26)],GREEN1,INK)
        c.p([(7,16),(6,11),(11,12),(13,8),(16,10),(20,8),(21,13),(25,12),(25,17),(20,23),(12,23)],GREEN)
        for x,y in [(7,10),(12,6),(21,7),(26,11)]: c.p([(x-1,y+2),(x,y-2),(x+2,y+2)],BONE,INK)
        c.p([(12,19),(16,13),(20,19),(18,25),(14,25)],BROWN,INK)
        c.l([(15,17),(15,22)],HONEY)
    elif name=='fish_hook':
        c.e((14,4,20,10),BONE,INK); c.e((16,6,18,8),(0,0,0,0))
        c.p([(16,9),(20,9),(20,20),(17,26),(11,28),(6,25),(4,20),(5,15),(9,17),(7,18),(8,22),(11,24),(14,23),(16,19)],STONE,INK)
        c.l([(17,10),(17,20),(15,24),(11,26),(7,23),(6,20)],BONE)
        c.l([(17,10),(17,16)],WHITE)
    elif name=='plant':
        c.l([(15,28),(17,6)],GREEN0,3)
        for y,w in [(24,8),(20,9),(16,8),(12,6),(8,3)]:
            c.p([(16,y+2),(16-w,y-2),(16-w,y-5),(16,y-1)],GREEN1,INK)
            c.p([(17,y+1),(17+w,y-3),(17+w,y-6),(17,y-2)],GREEN2,INK)
            c.l([(16-w+1,y-3),(16,y)],GREEN)
            c.l([(18,y-1),(16+w,y-4)],LIME)
        c.l([(16,26),(17,6)],GREEN)
    elif name=='iron_stomach':
        c.p([(16,4),(20,4),(20,10),(26,12),(28,17),(27,23),(22,27),(12,27),(6,23),(5,17),(8,13),(12,14),(15,17),(17,15)],RUST,INK)
        c.p([(17,6),(18,6),(18,12),(23,14),(25,18),(23,23),(18,25),(12,24),(9,21),(8,17),(11,16),(14,20),(18,19),(20,16),(17,13)],TAN)
        for y in (13,22):
            c.p([(7,y),(25,y),(26,y+3),(8,y+3)],STEEL,INK)
            c.l([(9,y+1),(23,y+1)],GREY)
            for x in (10,22): c.r((x,y+1,x,y+1),WHITE)
    elif name=='pack_call':
        head(c,3,11); head(c,14,4)
        c.l([(24,18),(26,20),(26,23)],TEAL)
        c.l([(27,16),(29,20),(29,24)],MINT)
    elif name=='roar':
        c.p([(5,12),(8,7),(15,6),(21,10),(21,13),(13,14),(21,19),(20,24),(14,26),(8,22),(5,17)],GREEN1,INK)
        c.p([(8,13),(19,12),(13,15),(18,20),(15,22),(10,19)],RED0,INK)
        for x,y in [(11,12),(16,12),(12,19),(17,21)]: c.p([(x,y),(x+2,y),(x+1,y+3 if y<15 else y-3)],BONE,INK)
        c.l([(8,10),(12,8),(16,9)],GREEN)
        c.l([(23,12),(25,15),(25,20)],TEAL)
        c.l([(26,9),(29,15),(29,22)],MINT)
        c.r((16,9,17,9),GOLD)
    elif name=='pounce':
        c.l([(4,23),(7,15),(12,9),(18,7),(23,9),(27,14)],INK,3)
        c.l([(4,23),(7,15),(12,9),(18,7),(23,9),(27,14)],TEAL)
        c.p([(23,13),(29,13),(27,19)],TEAL,INK)
        for x,y in [(9,21),(18,24)]:
            c.e((x,y,x+5,y+4),BROWN,INK)
            for dx in (0,2,4): c.r((x+dx,y-2,x+dx,y-1),BONE)
        c.l([(3,27),(8,27)],STONE)
    elif name=='stealth': eye(c,True)
    elif name=='carrion':
        c.l([(16,5),(15,25)],BROWN1,3); c.l([(15,6),(15,25)],BONE)
        for y in (8,13,18):
            c.l([(14,y),(9,y-1),(6,y+2),(6,y+5),(9,y+7),(12,y+6)],INK,3)
            c.l([(14,y),(9,y-1),(6,y+2),(6,y+5),(9,y+7)],STONE)
            c.l([(17,y),(22,y-1),(25,y+2),(25,y+5),(22,y+7)],INK,3)
            c.l([(17,y),(22,y-1),(25,y+2),(25,y+5),(22,y+7)],BONE)
        c.r((15,5,16,6),WHITE)
    elif name=='ability_spark':
        c.e((4,4,27,27),GREEN0,INK); c.e((6,6,25,25),(0,0,0,0),TEAL)
        bolt(c,True)
    return c.im


def meteor(c,x=0,y=0):
    c.p([(x+4,y+10),(x+15,y+2),(x+13,y+8),(x+20,y+4),(x+16,y+13),(x+10,y+18),(x+4,y+16)],RUST,INK)
    c.p([(x+7,y+10),(x+15,y+5),(x+12,y+11),(x+16,y+8),(x+13,y+14),(x+8,y+16)],GOLD)
    c.p([(x+5,y+11),(x+9,y+9),(x+13,y+12),(x+12,y+16),(x+8,y+18),(x+4,y+15)],COAL,INK)
    c.l([(x+6,y+12),(x+8,y+11),(x+10,y+12)],GREY)
    c.l([(x+9,y+13),(x+8,y+16)],ORANGE)


def skull(c):
    c.p([(6,5),(12,3),(18,6),(20,10),(18,13),(16,14),(16,20),(13,21),(8,20),(6,16),(3,12),(3,9)],STONE,INK)
    c.p([(7,6),(12,4),(16,6),(18,10),(15,13),(15,18),(12,19),(8,18),(7,14),(5,12),(5,9)],BONE)
    c.p([(6,9),(10,8),(10,12),(7,13)],INK)
    c.p([(14,8),(17,10),(15,13),(13,12)],INK)
    c.r((9,16,9,17),BROWN1); c.r((13,16,13,17),BROWN1)
    c.l([(8,19),(14,19)],INK)
    for x in (9,12,15): c.r((x,20,x,20),BONE)
    c.r((8,5,10,5),WHITE)


def book(c,titles=False):
    c.p([(3,6),(8,5),(12,7),(16,5),(20,6),(20,19),(15,18),(12,20),(8,18),(3,19)],BROWN,INK)
    c.p([(4,7),(8,6),(11,8),(11,18),(8,17),(4,18)],BONE)
    c.p([(13,8),(16,6),(19,7),(19,18),(16,17),(13,18)],STONE)
    c.l([(12,8),(12,19)],BROWN0)
    if titles:
        c.p([(6,9),(7,11),(9,9),(9,14),(6,14)],GOLD,INK)
        c.l([(15,10),(17,10)],BROWN); c.l([(15,13),(17,13)],BROWN)
    else:
        c.l([(7,15),(8,9)],GREEN1)
        c.l([(5,10),(8,12),(9,9)],GREEN)
        c.l([(15,10),(17,10)],BROWN); c.l([(15,13),(17,13)],BROWN)


def trophy(c):
    c.p([(7,4),(16,4),(16,12),(14,15),(13,15),(13,18),(17,19),(17,21),(6,21),(6,19),(10,18),(10,15),(7,12)],BROWN,INK)
    c.p([(8,5),(15,5),(14,11),(12,13),(10,12),(8,10)],GOLD)
    c.l([(9,6),(9,9)],WHITE)
    c.l([(6,6),(3,6),(3,10),(7,12)],GOLD)
    c.l([(17,6),(20,6),(20,10),(16,12)],HONEY)
    c.l([(8,19),(14,19)],GOLD)


def ui(name):
    c=Canvas(24)
    if name=='sneak':
        c.e((4,4,19,19),GREEN2,INK)
        c.p([(12,5),(16,6),(18,9),(18,14),(15,17),(12,18)],INK)
        c.l([(7,7),(6,10)],GREEN)
        c.l([(6,15),(10,18)],STONE)
    elif name=='ability_stamina': bolt(c)
    elif name=='dna_lab':
        c.p([(7,3),(16,3),(21,11),(17,20),(7,20),(2,12)],GREEN0,INK)
        c.l([(7,4),(16,4),(20,11)],TEAL)
        c.l([(8,6),(14,9),(9,14),(15,18)],BONE)
        c.l([(15,6),(9,9),(14,14),(8,18)],TEAL)
        for y in (7,11,15): c.l([(10,y),(13,y)],STONE)
    elif name in ('species_book','title_book'): book(c,name=='title_book')
    elif name=='records':
        c.p([(3,6),(7,10),(11,4),(15,10),(20,6),(18,17),(5,17)],BROWN,INK)
        c.p([(5,9),(8,12),(11,7),(14,12),(18,9),(16,15),(6,15)],GOLD)
        c.r((6,18,17,20),BROWN1,INK)
        c.l([(7,18),(15,18)],HONEY)
        c.r((10,12,12,14),TEAL)
    elif name=='challenges':
        c.p([(4,4),(8,5),(18,18),(16,20),(5,8)],STONE,INK)
        c.l([(5,5),(16,17)],BONE)
        c.p([(18,4),(20,6),(7,19),(4,17),(16,5)],STONE,INK)
        c.l([(18,5),(6,17)],WHITE)
        c.l([(4,14),(9,19)],BROWN,2); c.l([(14,19),(19,14)],BROWN,2)
    elif name=='settings':
        c.p([(9,3),(14,3),(15,6),(18,6),(20,9),(18,12),(20,15),(17,18),(14,18),(13,21),(9,21),(8,18),(5,18),(3,15),(5,12),(3,9),(6,6),(8,6)],STEEL,INK)
        c.e((6,6,17,17),GREY,INK); c.e((9,9,14,14),GREEN0,INK)
        c.l([(8,8),(11,7),(14,8)],STONE)
    elif name=='achievement': trophy(c)
    elif name=='rival': skull(c)
    elif name=='toxic':
        c.p([(10,12),(14,12),(15,20),(9,20)],STONE,INK)
        c.p([(3,12),(5,7),(9,4),(14,4),(18,7),(20,12),(17,14),(7,14)],GREEN1,INK)
        c.p([(5,11),(8,6),(13,5),(17,8),(18,11)],GREEN)
        c.r((8,8,9,9),LIME); c.r((14,7,15,8),BONE)
        c.p([(17,14),(21,20),(13,20)],GOLD,INK)
        c.r((17,16,17,17),INK); c.r((17,19,17,19),INK)
    elif name=='ash': meteor(c)
    elif name=='locked':
        c.p([(6,12),(6,7),(8,3),(14,3),(17,7),(17,12),(14,12),(14,7),(13,6),(10,6),(9,8),(9,12)],STONE,INK)
        c.l([(7,10),(7,7),(9,4),(13,4)],BONE)
        c.r((4,11,19,20),BROWN,INK); c.r((5,12,17,18),BONE)
        c.e((10,13,13,16),INK); c.r((11,15,12,18),INK)
        c.l([(5,12),(16,12)],WHITE)
    return c.im


def volcanoes(c):
    c.p([(2,21),(6,13),(9,13),(13,21),(16,14),(19,14),(21,21)],COAL,INK)
    c.l([(5,16),(6,14),(8,14),(9,16)],RUST)
    c.l([(16,16),(17,15),(18,15),(19,17)],ORANGE)
    c.l([(3,21),(20,21)],BROWN1)


def difficulty(name):
    c=Canvas(24)
    if name=='normal':
        c.p([(4,17),(5,10),(10,5),(19,3),(20,10),(17,17),(10,20)],GREEN1,INK)
        c.p([(5,15),(7,10),(12,6),(18,4),(15,10),(10,15)],GREEN)
        c.l([(4,20),(17,6)],GREEN0)
        c.l([(9,14),(9,9)],LIME); c.l([(12,11),(16,11)],GREEN2)
        c.l([(8,10),(12,7)],LIME)
    else:
        meteor(c,0,0); volcanoes(c)
        c.r((17,3,17,3),WHITE)
    return c.im


def foot(c):
    c.p([(9,11),(12,8),(15,11),(17,16),(14,19),(9,18),(7,15)],BROWN,INK)
    for b in [(6,7,8,10),(10,4,12,8),(15,6,17,10)]: c.e(b,BONE,INK)
    c.r((10,12,12,14),TAN)


def future(name):
    c=Canvas(24)
    if name in ('amber_chip','fossil_chip','iridium_chip'):
        fill={'amber_chip':ORANGE,'fossil_chip':STONE,'iridium_chip':COAL}[name]
        c.p([(7,3),(15,3),(20,8),(19,16),(14,21),(6,19),(3,13),(4,7)],fill,INK)
        c.l([(5,8),(8,4),(14,4)],HONEY if name=='amber_chip' else WHITE if name=='fossil_chip' else GREY)
        c.l([(18,9),(17,15),(13,19),(7,17)],BROWN if name!='iridium_chip' else PURPLE0)
        if name=='amber_chip':
            c.l([(9,8),(13,13),(12,16)],BROWN0)
            c.l([(10,11),(8,13)],BROWN0); c.l([(11,10),(14,8)],BROWN0)
            c.r((8,6,9,7),BONE)
        elif name=='fossil_chip':
            c.l([(9,7),(14,7),(16,10),(15,14),(12,16),(8,14),(7,11),(9,9),(12,9),(13,11),(11,13),(10,11)],BROWN1)
        else:
            c.p([(7,7),(13,5),(15,9),(10,14),(5,12)],STEEL)
            c.l([(8,7),(12,6),(13,7)],TEAL)
            c.l([(13,14),(16,11)],LILAC)
    elif name=='tar_totem':
        c.e((2,16,21,21),COAL,INK)
        c.p([(8,3),(16,4),(18,8),(16,12),(17,19),(7,19),(8,12),(6,8)],BROWN1,INK)
        c.l([(9,4),(14,5),(15,7)],TAN)
        c.p([(8,8),(11,9),(10,12),(8,11)],INK)
        c.p([(14,8),(16,8),(15,12),(13,11)],INK)
        c.l([(11,14),(14,14)],BONE)
        c.l([(5,18),(9,18)],STEEL)
    elif name=='rotten_meat':
        c.p([(4,11),(8,7),(14,7),(19,11),(19,17),(14,20),(7,19),(3,16)],RED0,INK)
        c.p([(5,12),(8,9),(13,9),(16,12),(15,16),(8,17),(5,15)],BROWN)
        for b in [(7,10,9,12),(12,13,15,15),(6,15,8,16)]: c.e(b,GREEN1)
        for x,y in [(5,4),(17,5),(20,10)]:
            c.l([(x-1,y-1),(x+1,y+1)],MINT)
            c.r((x,y,x+1,y+1),GREEN,INK)
        c.e((16,15,20,19),BONE,INK)
    elif name=='bounty_target':
        foot(c)
        c.e((4,4,20,20),None,TEAL)
        for pts in [[(2,12),(7,12)],[(17,12),(21,12)],[(12,2),(12,7)],[(12,17),(12,21)]]: c.l(pts,MINT)
    elif name=='daily_hunt':
        c.r((3,5,20,20),BROWN,INK); c.r((4,9,19,19),BONE)
        c.r((4,6,19,8),GREEN1)
        for x in (7,16): c.r((x,3,x+1,6),STONE,INK)
        for x,y in [(8,11),(12,10),(16,11)]: c.l([(x,y),(x-3,y+7)],RED0)
        c.l([(6,10),(7,10)],WHITE)
    elif name=='extinction_pressure':
        c.p([(5,4),(7,3),(9,5),(9,14),(11,17),(10,21),(5,21),(3,18),(5,14)],STONE,INK)
        c.e((5,16,9,20),RED0,INK)
        c.l([(7,7),(7,17)],RUST)
        for y in (6,9,12): c.r((10,y,11,y),STONE)
        c.p([(14,8),(20,3),(18,9),(20,8),(19,14),(15,16),(12,13)],ORANGE,INK)
        c.p([(13,11),(16,9),(19,12),(16,15),(13,14)],COAL,INK)
        c.r((15,11,16,11),GOLD)
    return c.im


def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--batch',choices=['def','ghi','all'],default='all'); args=ap.parse_args()
    selected=list(GROUPS)[:3] if args.batch=='def' else list(GROUPS)[3:] if args.batch=='ghi' else list(GROUPS)
    entries=json.loads((GAME/'hud_icons_manifest.json').read_text())
    entries=[e for e in entries if e['group'] not in selected]
    new=[]; pixels={}; symbols='0123456789ABCDEFGHIJKLMNOPQRSTUV'
    index={tuple(bytes.fromhex(v[1:])):symbols[i] for i,v in enumerate(COLORS)}
    for group in selected:
        names,n=GROUPS[group]; (OUT/group).mkdir(parents=True,exist_ok=True)
        for name in names:
            fn={'rarity':gem,'tags':tag,'mutations':mutation,'ui':ui,'difficulty':difficulty,'future':future}[group]
            im=fn(name); file=f'assets/hud_icons/{group}/{name}.png'; im.save(GAME/file)
            data=list(im.getdata())
            pixels[name]=[''.join(index[p[:3]] if p[3] else '.' for p in data[y*n:(y+1)*n]) for y in range(n)]
            new.append(dict(file=file,size=[n,n],group=group,id=name,palette='Primal Earth 32',status='prototype_static',production_approved=False,animation_ready=False,origin=[n//2,n//2],source='tools/draw_hud_icons_remaining.py: native integer pixel geometry; no resizing',sha256=hashlib.sha256((GAME/file).read_bytes()).hexdigest()))
    source=GAME/f'Source_Generated/hud_icons/native_pixels_{args.batch}.json'
    source.write_text(json.dumps(dict(palette=COLORS,symbols=symbols,transparent='.',icons=pixels),indent=2)+'\n',encoding='utf-8')
    for e in new: e.update(source_pixels=source.relative_to(GAME).as_posix(),source_sha256=hashlib.sha256(source.read_bytes()).hexdigest())
    entries+=new
    (GAME/'hud_icons_manifest.json').write_text(json.dumps(entries,indent=2)+'\n',encoding='utf-8')
    preview(entries)
    print(f'Wrote {len(new)} native icons ({args.batch}); manifest total {len(entries)}.')


if __name__=='__main__': main()
