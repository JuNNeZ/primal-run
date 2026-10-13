"""Arrange named rig references into fixed guide cells; never creates final art."""
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
R=ROOT/'PRIMAL_RUN_Rig/iguanodon'
P=ROOT/'PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026-10-12'
rig=json.loads((R/'iguanodon_rig.json').read_text())
requests=[]
for state in ['run','idle','attack','hurt','death']:
    for d in 'SNEW':
        count=rig['states'][state]['frames']
        sheet=Image.new('RGBA',(1536,1024))
        cells=[]
        for i in range(count):
            name=f'iguanodon_{state}_{d}_{i:03}'
            x,y=(i%3)*512,(i//3)*512
            sheet.alpha_composite(Image.open(R/(name+'.png')).convert('RGBA').resize((432,432),Image.Resampling.NEAREST),(x+40,y+40))
            cells.append({'name':name,'source_crop':[x+40,y+40,x+472,y+472],
                          'joints':rig['frames'][name].get('joints',{}),'foot_contact':rig['frames'][name].get('foot_contact',{})})
        guide=f'inputs/iguanodon_{state}_{d}_guide_sheet.png'
        sheet.save(P/guide)
        requests.append({'state':state,'direction':d,'guide':guide,'identity':f'inputs/iguanodon_{d}.png','cells':cells})
(P/'batch_plan.json').write_text(json.dumps(requests,indent=2)+'\n')
print('Prepared20 guide sheets with96 named poses, same unmodified rig.')
