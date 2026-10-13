"""Build review-only atlases, previews and a portable, self-contained viewer."""
import base64
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / 'PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026-10-12'
RIG = ROOT / 'PRIMAL_RUN_Rig/iguanodon'


def main():
    rig = json.loads((RIG / 'iguanodon_rig.json').read_text())
    names = list(rig['frames'])
    meta = {'states': rig['states'], 'frames': {}, 'origin': rig['origin'],
            'production_approved': False, 'status': 'review_only'}
    atlas = Image.new('RGBA', (1728, 1440))
    guides = Image.new('RGBA', atlas.size)
    for i, name in enumerate(names):
        x, y = i % 12 * 144, i // 12 * 144
        atlas.paste(Image.open(P / (name + '.png')), (x, y))
        guides.paste(Image.open(RIG / (name + '.png')), (x, y))
        meta['frames'][name] = {'x': x, 'y': y, **rig['frames'][name],
                               'rig_sha256': rig['frames'][name]['sha256'],
                               'rig_bbox': rig['frames'][name]['bbox'],
                               'sha256': hashlib.sha256((P / (name + '.png')).read_bytes()).hexdigest(),
                               'bbox': Image.open(P / (name + '.png')).getbbox()}
    atlas.save(P / 'review_atlas.png')
    guides.save(P / 'guide_reference_atlas.png')
    (P / 'review_metadata.json').write_text(json.dumps(meta, indent=2) + '\n')
    for state, config in rig['states'].items():
        for bg, color in [('light', '#e8ece1'), ('dark', '#151b19')]:
            count = config['frames']
            grid = Image.new('RGBA', (144 * count, 624), color)
            draw = ImageDraw.Draw(grid)
            animation = []
            for i in range(count):
                board = Image.new('RGBA', (576, 168), color)
                text = ImageDraw.Draw(board)
                for j, d in enumerate('SNEW'):
                    actor = Image.open(P / f'iguanodon_{state}_{d}_{i:03}.png')
                    grid.alpha_composite(actor, (144 * i, 156 * j + 12))
                    draw.text((144 * i + 3, 156 * j), f'{d} {i:03}', fill='#64928b')
                    board.alpha_composite(actor, (144 * j, 18))
                    text.text((144 * j + 4, 3), f'{state} {d} {i:03}', fill='#64928b')
                animation.append(board.resize((1152, 336), Image.Resampling.NEAREST).convert('RGB'))
            grid.save(P / f'{state}_{bg}_1x.png')
            grid.resize((grid.width * 2, grid.height * 2), Image.Resampling.NEAREST).save(P / f'{state}_{bg}_2x.png')
            # Review GIFs repeat all states; the HTML respects non-looping states.
            animation[0].save(P / f'{state}_{bg}_preview.gif', save_all=True,
                              append_images=animation[1:], duration=round(1000 / config['fps']),
                              loop=0, disposal=2)
    data = {**meta, 'atlas': uri(P / 'review_atlas.png'),
            'guides': uri(P / 'guide_reference_atlas.png'),
            'overlay': uri(P / 'overlay.png'),
            'errors': json.loads((P / 'report.json').read_text())['errors'],
            'strictFailures': len(json.loads((P / 'strict_contour_diagnostic.json').read_text())['failures'])}
    html = '''<!doctype html><html lang="da"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Iguanodon · animationsreview</title><style>
body{background:#202925;color:#e5e9d7;font:16px system-ui;margin:24px}
button,select,input{font:inherit;margin:5px;padding:6px}canvas{image-rendering:pixelated;max-width:100%;height:auto}
.panels{display:flex;gap:20px;flex-wrap:wrap}figure{margin:12px 0}img{max-width:100%;image-rendering:pixelated}
#error{background:#75383a;padding:10px;display:none}summary{cursor:pointer}
</style><h1>Iguanodon · animationsreview</h1>
<p>120 frames · separat prototype. Venstre: genereret sprite. Højre: rig-reference.</p>
<p id="result"></p><p id="strict"></p><div id="error"></div>
<label>Animation <select id="state"></select></label>
<label>Retning <select id="direction"><option>S</option><option>N</option><option>E</option><option>W</option></select></label>
<button id="play">Pause</button><button id="step">Næste frame</button>
<button id="restart">Start forfra</button><button id="background">Lys baggrund</button>
<label>Zoom <select id="zoom"><option>1</option><option>2</option><option selected>4</option></select>×</label>
<p id="position"></p><div class="panels"><figure><figcaption>Sprite</figcaption><canvas id="art"></canvas></figure>
<figure><figcaption>Rig-guide</figcaption><canvas id="guide"></canvas></figure></div>
<details><summary>Validator-overlay: rød rigkontur og cyan benområde</summary><img id="overlay" alt="Validator-overlay"></details>
<p>Angreb, hurt og death stopper efter sidste frame. GIF-preview gentager dem til review.
Teknisk validering er ikke en kunstnerisk godkendelse. Hovedform og markeringer skal stadig vurderes af Jonas.</p>
<script id="review-data" type="application/json">''' + json.dumps(data, separators=(',', ':')) + '''</script>
<script>
'use strict';
const byId=id=>document.getElementById(id), data=JSON.parse(byId('review-data').textContent);
const state=byId('state'),direction=byId('direction'),zoom=byId('zoom');
Object.keys(data.states).forEach(s=>state.add(new Option(s,s)));state.value='walk';
let frame=0,playing=true,dark=true,last=0,ready=false;
const atlas=new Image(),guides=new Image();
function loadImage(img,src){return new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Indbygget PNG kunne ikke indlæses'));img.src=src})}
function config(){return data.states[state.value]}
function paint(){if(!ready)return;const name=`iguanodon_${state.value}_${direction.value}_${String(frame).padStart(3,'0')}`;
 const cell=data.frames[name];for(const [id,source] of [['art',atlas],['guide',guides]]){
 const c=byId(id),scale=Number(zoom.value);c.width=c.height=144*scale;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
 ctx.fillStyle=dark?'#151b19':'#e8ece1';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(source,cell.x,cell.y,144,144,0,0,c.width,c.height)}
 byId('position').textContent=`${name} · ${frame+1}/${config().frames} · ${config().fps} fps · anker 72,72`;
 byId('play').textContent=playing?'Pause':'Afspil';window.reviewStatus={ready,frame,name,playing};}
function advance(){if(frame+1<config().frames)frame++;else if(config().loop)frame=0;else playing=false;paint()}
function tick(t){if(ready&&playing&&t-last>=1000/config().fps){last=t;advance()}requestAnimationFrame(tick)}
state.onchange=direction.onchange=()=>{frame=0;last=performance.now();playing=true;paint()};zoom.onchange=paint;
byId('play').onclick=()=>{if(!playing&&!config().loop&&frame===config().frames-1)frame=0;playing=!playing;last=performance.now();paint()};
byId('step').onclick=()=>{playing=false;advance()};byId('restart').onclick=()=>{frame=0;playing=true;last=performance.now();paint()};
byId('background').onclick=()=>{dark=!dark;byId('background').textContent=dark?'Lys baggrund':'Mørk baggrund';paint()};
byId('overlay').src=data.overlay;
Promise.all([loadImage(atlas,data.atlas),loadImage(guides,data.guides)]).then(()=>{ready=true;
byId('result').textContent=data.errors.length?`${data.errors.length} validatorfejl · se overlay`:'Validator: 120/120 frames består · 0 fejl';
byId('strict').textContent=`Strengt 2-pixelkrav: ${data.strictFailures} frames fejler. Den samlede leverance er ikke godkendt.`;
paint();requestAnimationFrame(tick)}).catch(e=>{byId('error').style.display='block';byId('error').textContent=e.message});
</script></html>'''
    (P / 'iguanodon_animation_review_standalone.html').write_text(html)
    inventory = {str(p.relative_to(P)): hashlib.sha256(p.read_bytes()).hexdigest()
                 for folder in ['raw', 'inputs'] for p in sorted((P / folder).glob('*.png'))}
    (P / 'source_inventory.json').write_text(json.dumps(inventory, indent=2) + '\n')
    print('Built portable review viewer, 120-cell atlas and light/dark previews for all six states.')


def uri(path):
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()


if __name__ == '__main__':
    main()
