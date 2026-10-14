"""Lossless native/integer previews of the active render choices.

Preview composition and GIF playback never modify exported asset pixels.
"""
import io
import json
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1];GAME=ROOT/'PRIMAL_RUN_Game'
OUT=GAME/'previews/animation_polish';OUT.mkdir(parents=True,exist_ok=True)
script="""const C=require('./PRIMAL_RUN_Game/src/core.js');
const species=[...new Set([...Object.keys(C.PLAYER_SPECIES),...Object.keys(C.SPECIES)])];
console.log(JSON.stringify({species,colors:C.SPECIES_COLORS,frames:Object.fromEntries(species.map(s=>[s,Object.fromEntries(['S','E','N','W'].map(d=>[d,Object.fromEntries(Object.entries({idle:4,walk:6,run:6,attack:6,hurt:2,death:6}).map(([st,n])=>[st,Array.from({length:n},(_,i)=>C.playerFrame(s,st,d,i))]))]))]))}));"""
catalog=json.loads(subprocess.check_output(['node','-e',script],cwd=ROOT,text=True))

def sprite(species,state,direction,frame,before=False):
    file='PRIMAL_RUN_Game/'+catalog['frames'][species][direction][state][frame]
    im=Image.open(io.BytesIO(subprocess.check_output(['git','show','3152fa1:'+file],cwd=ROOT))) if before else Image.open(ROOT/file)
    rgba=np.array(im.convert('RGBA'));original=rgba.copy()
    for key,value in catalog['colors'][species].items():
        mask=(original[:,:,3]>0)&np.all(original[:,:,:3]==tuple(bytes.fromhex(key)),axis=2)
        rgba[mask,:3]=tuple(bytes.fromhex(value))
    return Image.fromarray(rgba)

for background,color in [('light','#e8ece1'),('dark','#151b19')]:
    grid=Image.new('RGBA',(5*144,len(catalog['species'])*164),color);draw=ImageDraw.Draw(grid)
    for row,species in enumerate(catalog['species']):
        draw.text((3,row*164+30),species,fill='#28372a' if background=='light' else '#e8ece1')
        for col,direction in enumerate(['S','E','N','W'],1):
            grid.alpha_composite(sprite(species,'idle',direction,0),(col*144,row*164+20));draw.text((col*144+3,row*164),direction,fill='#65998e')
    grid.save(OUT/f'identity_{background}_1x.png')

for direction in ['S','E','N','W']:
    frames=[]
    for tick in range(48):
        t=tick/24;frame=int(t*8)%6;image=Image.new('RGBA',(7*144,2*164),'#151b19');draw=ImageDraw.Draw(image)
        for i,species in enumerate(catalog['species']):
            x,y=i%7*144,i//7*164;draw.text((x+3,y+3),species,fill='#e8ece1');image.alpha_composite(sprite(species,'walk',direction,frame),(x,y+20))
        frames.append(image.convert('RGB'))
    frames[0].save(OUT/f'all_species_walk_{direction}_1x.gif',save_all=True,append_images=frames[1:],duration=[40,40,50]*16,loop=0,disposal=2)

subjects=[('carnotaurus','S'),('tyrannosaurus','N'),('deinonychus','S'),('triceratops','N')]
frames=[]
for tick in range(48):
    t=tick/24;state='walk' if t<.75 else 'hurt' if t<1 else 'attack' if t<1.5 else 'walk'
    frame=int(t*8)%6 if state=='walk' else min(1,int((t-.75)*8)) if state=='hurt' else min(5,int((t-1)*12))
    image=Image.new('RGBA',(4*144,2*164),'#151b19');draw=ImageDraw.Draw(image)
    for col,(species,direction) in enumerate(subjects):
        for row,before in enumerate([True,False]):
            x,y=col*144,row*164;draw.text((x+3,y+3),f'{"before" if before else "after"} {species} {direction}',fill='#e8ece1');image.alpha_composite(sprite(species,state,direction,frame,before),(x,y+20))
    frames.append(image.resize((image.width*2,image.height*2),Image.Resampling.NEAREST).convert('RGB'))
frames[0].save(OUT/'before_after_2x.gif',save_all=True,append_images=frames[1:],duration=[40,40,50]*16,loop=0,disposal=2)

for background,color in [('light','#e8ece1'),('dark','#151b19')]:
    grid=Image.new('RGBA',(8*144,4*164),color);draw=ImageDraw.Draw(grid)
    for row,direction in enumerate(['S','E','N','W']):
        poses=[('idle',0),('walk',0)]+[('attack',i) for i in range(6)]
        for col,(state,frame) in enumerate(poses):
            x,y=col*144,row*164;draw.text((x+3,y+3),f'{direction} {state}{frame}',fill='#65998e');grid.alpha_composite(sprite('parasaurolophus',state,direction,frame),(x,y+20))
    grid.save(OUT/f'parasaurolophus_transitions_{background}_1x.png')
print('Generated active13-species native identity/walk previews, before/after playback, and Parasaurolophus transitions on both backgrounds.')
