"""Mechanical export and honest comparison of a 3D guide and imagegen trial."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_species_pilot import sample

ROOT = Path(__file__).resolve().parents[1]
P = ROOT/'PRIMAL_RUN_Species_Pilot'
R = P/'Reference_Rig'
D = P/'review/iguanodon_rig'
D.mkdir(parents=True, exist_ok=True)
entries = []
atlas = Image.new('RGBA',(432,288))
for i in range(6):
    col, row = i % 3, i // 3
    e = {'file': f'review/iguanodon_rig/iguanodon_walk_E_{i:03}.png',
         'species': 'iguanodon', 'state': 'walk', 'direction': 'E', 'frame': i,
         'source': 'Source_Generated/iguanodon_rig_walk_E_revision10.png',
         'source_crop': [col*512,row*512,(col+1)*512,(row+1)*512],
         'source_sample_stride': 4, 'sampling_offset': 2, 'alpha_threshold': 192,
         'source_landmark': [233,256 if row == 0 else 250],
         'origin': [68,72], 'size': [144,144], 'status': 'prototype_static',
         'production_approved': False, 'animation_ready': False,
         'review': 'camera_candidate; generated motion does not reliably follow guide; review only'}
    image, delta = sample(e)
    image.save(P/e['file'])
    atlas.alpha_composite(image,(col*144,row*144))
    e['atlas'] = 'review/iguanodon_rig/iguanodon_walk_E_atlas.png'
    e['atlas_crop'] = [col*144,row*144,144,144]
    e['registration_offset'] = delta
    for key, path in [('source_sha256', P/e['source']), ('export_sha256', P/e['file'])]:
        e[key] = hashlib.sha256(path.read_bytes()).hexdigest()
    entries.append(e)
atlas.save(D/'iguanodon_walk_E_atlas.png')
guide_atlas = Image.new('RGBA',(1296,1728))
for i in range(12):
    guide_atlas.alpha_composite(Image.open(R/f'guide_E_{i:03}.png').convert('RGBA'),((i%3)*432,(i//3)*432))
guide_atlas.save(R/'reference_E_atlas.png')
(D/'manifest.json').write_text(json.dumps(entries, indent=2)+'\n')

for bg, color in [('light','#e8ece1'),('dark','#151b19')]:
    frames = []
    grid = Image.new('RGBA', (432,312), color)
    draw = ImageDraw.Draw(grid)
    for i,e in enumerate(entries):
        actor = Image.open(P/e['file']).convert('RGBA')
        grid.alpha_composite(actor, ((i%3)*144,(i//3)*156+12))
        draw.text(((i%3)*144+5,(i//3)*156), str(i), fill='#69a4a0')
        canvas = Image.new('RGBA',(144,144),color)
        canvas.alpha_composite(actor)
        frames.append(canvas.resize((432,432),Image.Resampling.NEAREST).convert('RGB'))
    grid.save(D/f'sprites_{bg}_1x.png')
    grid.resize((1296,936),Image.Resampling.NEAREST).save(D/f'sprites_{bg}_3x.png')
    frames[0].save(D/f'sprites_{bg}.gif',save_all=True,append_images=frames[1:],duration=125,loop=0,disposal=2)
    reference = []
    for i in range(12):
        canvas=Image.new('RGBA',(432,432),color)
        canvas.alpha_composite(Image.open(R/f'guide_E_{i:03}.png').convert('RGBA'))
        reference.append(canvas.convert('RGB'))
    reference[0].save(D/f'reference_{bg}.gif',save_all=True,append_images=reference[1:],duration=60,loop=0,disposal=2)

rig = json.loads((R/'reference_manifest.json').read_text())
report = {'rig_geometry': 'pending independent validation', 'sprite_export_count': len(entries),
          'sprite_production_approved': False, 'runtime_scope': 'standalone reference reviewer only; no game or GDJS integration',
          'visual_review': {'revision8':'REJECTED: prior identity overrides reference; sprawling far-side feet',
                            'revision9':'REJECTED: side profile overrides game camera',
                            'revision10':'camera improved; motion fidelity and marking stability insufficient for finished animation'},
          'skill_ready': False,
          'next_step': 'A pose-constrained renderer or locked rig textures is needed before mass production; prompting alone did not lock motion.'}
(D/'validation_report.json').write_text(json.dumps(report,indent=2)+'\n')
print('Exported six REVIEW-ONLY sprites and twelve reference poses; no production approval.')
