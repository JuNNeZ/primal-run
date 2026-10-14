"""Emit an authoring recipe, not artwork or an approved animation.

One native 6x5 sheet per direction matches the player_full frame plan.
Per-direction anchors must be supplied when the canonical species needs them.
"""
import argparse
import json
import re
from pathlib import Path

STATES = [('idle', 4, 4, True), ('walk', 6, 8, True),
          ('run', 6, 12, True), ('attack', 6, None, False),
          ('hurt', 2, 8, False), ('death', 6, 8, False)]

def make_plan(species, size=(144, 144), origin=(72, 72), anchors=None):
    if not re.fullmatch(r'[a-z][a-z0-9_]*', species):
        raise ValueError('Use a lowercase species identifier')
    if len(size) != 2 or any(type(n) is not int or n <= 0 or n > 2046 for n in size):
        raise ValueError('Invalid native frame size')
    anchors = anchors or {}
    sheets = []
    for direction in ('S', 'E', 'N', 'W'):
        anchor = anchors.get(direction, origin)
        if len(anchor) != 2 or any(type(n) is not int or n < 0 or n >= size[i] for i,n in enumerate(anchor)):
            raise ValueError('Invalid native anchor for ' + direction)
        frames = []
        for state,count,fps,loop in STATES:
            row = {'idle':0,'hurt':0,'walk':1,'run':2,'attack':3,'death':4}[state]
            for frame in range(count):
                col = frame + (4 if state == 'hurt' else 0)
                frames.append(dict(species=species,state=state,direction=direction,frame=frame,
                    crop=[col*size[0],row*size[1],*size],size=list(size),origin=list(anchor),
                    file=f'assets/player_full/{species}_{state}_{direction}_{frame:03d}.png'))
        sheets.append(dict(direction=direction,file=f'{species}_{direction}.png',
            size=[6*size[0],5*size[1]],frames=frames))
    return dict(version=1,species=species,status='authoring_plan',
        production_approved=False,animation_ready=False,
        runtime_group='species_'+species,native_size=list(size),
        palette='PRIMAL_RUN_Prototype_Kit/palette.json',
        rules='PRIMAL_RUN_Sprites/SPRITE_RULES.md',
        states=[dict(state=s,frames=n,fps=f,loop=l,
                     **({'contact_frame':3,'timing':'species gameplay attack duration'} if s=='attack' else {}))
                for s,n,f,l in STATES],sheets=sheets)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--species',required=True)
    parser.add_argument('--size',type=int,nargs=2,default=[144,144],metavar=('W','H'))
    parser.add_argument('--origin',type=int,nargs=2,default=[72,72],metavar=('X','Y'))
    parser.add_argument('--anchors',type=Path,help='JSON object: direction -> native [x,y]')
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    plan=make_plan(args.species,args.size,args.origin,json.loads(args.anchors.read_text()) if args.anchors else None)
    content=json.dumps(plan,indent=2)+'\n'
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(content)
    else: print(content,end='')

if __name__=='__main__': main()
