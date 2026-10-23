'use strict';
// Rig animator for Codex: the guide frames must move their legs (and wings), keep one camera,
// and the validator must pass the rig itself but reject frames whose legs stay still.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const PY = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const run = (args) => spawnSync(PY, args, {cwd: ROOT, encoding: 'utf8', timeout: 240000});
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'primal-rig-'));
test.after(() => fs.rmSync(tmp, {recursive: true, force: true}));

const rendered = new Map();
function render(species, states) {
  const key = species + ':' + states;
  if (!rendered.has(key)) {
    const out = path.join(tmp, species);
    const r = run(['tools/rig_animate.py', '--species', species, '--states', states, '--out', out]);
    assert.equal(r.status, 0, r.stderr || r.stdout);
    rendered.set(key, {out, rig: JSON.parse(fs.readFileSync(path.join(out, `${species}_rig.json`), 'utf8'))});
  }
  return rendered.get(key);
}

test('biped rig: feet step, contacts alternate, every direction rendered', () => {
  const {out, rig} = render('leaellynasaura', 'walk,attack');
  assert.deepEqual(rig.canvas, [144, 144]);
  assert.deepEqual(rig.origin, [72, 72]);
  assert.equal(rig.states.walk.frames, 6);
  assert.equal(rig.states.attack.contact_frame, 3);
  assert.ok(rig.skeleton.chains.includes('hind_L') && rig.skeleton.chains.includes('hind_R'));
  for (const dir of ['S', 'N', 'E', 'W']) {
    const frames = [0, 1, 2, 3, 4, 5].map((f) => rig.frames[`leaellynasaura_walk_${dir}_${String(f).padStart(3, '0')}`]);
    frames.forEach((fr) => assert.ok(fs.existsSync(path.join(out, fr.file)), fr.file));
    for (const leg of ['hind_L', 'hind_R']) {
      const feet = frames.map((fr) => fr.joints[leg].at(-1));
      const span = Math.max(...feet.map((p) => Math.hypot(p[0] - feet[0][0], p[1] - feet[0][1])));
      assert.ok(span >= 2, `${dir} ${leg} foot moves only ${span.toFixed(1)} px`);
      if (dir === 'E') {
        const contact = frames.map((fr) => fr.foot_contact[leg]);
        assert.ok(contact.includes(true) && contact.includes(false), `${leg} never lifts or never plants`);
      }
    }
  }
});

test('flyer rig: wing tips beat', () => {
  const {rig} = render('pteranodon', 'walk');
  assert.equal(rig.skeleton.locomotion, 'flap');
  const tips = [0, 1, 2, 3, 4, 5].map((f) => rig.frames[`pteranodon_walk_S_00${f}`].joints.wing_L[1]);
  const xs = tips.map((p) => p[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 4, `wing tip span changes only ${Math.max(...xs) - Math.min(...xs)} px`);
});

test('validator passes the rig and rejects static legs', () => {
  const {out} = render('leaellynasaura', 'walk,attack');
  const ok = run(['tools/validate_rig_frames.py', '--species', 'leaellynasaura', '--frames', out, '--rig', out]);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /PASS/);
  const bad = path.join(tmp, 'static');
  fs.cpSync(out, bad, {recursive: true});
  for (const dir of ['S', 'N', 'E', 'W']) {
    for (let f = 1; f < 6; f++) {
      fs.copyFileSync(path.join(bad, `leaellynasaura_walk_${dir}_000.png`), path.join(bad, `leaellynasaura_walk_${dir}_00${f}.png`));
    }
  }
  const r = run(['tools/validate_rig_frames.py', '--species', 'leaellynasaura', '--frames', bad, '--rig', out]);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /better than their own frame/);
  assert.match(r.stdout, /legs and tail look frozen/);
});

test('rigSprites: every RIG_SPECIES has its 120 rig frames in the game, byte-identical to a fresh render', () => {
  const C = require('../PRIMAL_RUN_Game/src/core.js');
  const game = path.join(ROOT, 'PRIMAL_RUN_Game');
  const manifest = JSON.parse(fs.readFileSync(path.join(game, 'rig_full_manifest.json'), 'utf8'));
  const assets = fs.readFileSync(path.join(game, 'src/assets.js'), 'utf8');
  for (const id of C.RIG_SPECIES) {
    assert.ok(C.STATIC_SPECIES.has(id), id + ' keeps its WIP badge until the art is approved');
    const files = manifest.filter((e) => e.species === id);
    assert.equal(files.length, 120, id);
    for (const e of files) {
      if (e.approval) {  // Jonas approved this cutout's animation (approval.json next to its parts)
        assert.equal(e.status, 'approved_animation');
        assert.equal(e.production_approved, true);
      } else {
        assert.equal(e.status, 'prototype_static');
        assert.equal(e.production_approved, false);
      }
      assert.ok(fs.existsSync(path.join(game, e.file)), e.file);
      assert.ok(assets.includes('"' + e.file + '"'), 'not built into src/assets.js: ' + e.file);
    }
    assert.equal(C.playerFrame(id, 'walk', 'E', 3), `assets/rig_full/${id}_walk_E_003.png`);
  }
  // rexCutout: T-rex is an original species, so it gets the cutout frames by its own flag, not the WIP badge
  const rex = manifest.filter((e) => e.species === 'tyrannosaurus');
  assert.equal(rex.length, 120);
  assert.ok(rex.every((e) => e.status === 'approved_animation' && e.production_approved === true && assets.includes('"' + e.file + '"'))); // Jonas 2026-10-22
  assert.ok(!C.STATIC_SPECIES.has('tyrannosaurus'));
  if (C.FEATURES.rexCutout) assert.equal(C.playerFrame('tyrannosaurus', 'death', 'W', 5), 'assets/rig_full/tyrannosaurus_death_W_005.png');
  else assert.ok(C.playerFrame('tyrannosaurus', 'death', 'W', 5).includes('enemy_full/tyrannosaurus'));
  const {out} = render('leaellynasaura', 'walk,attack');
  for (const name of ['leaellynasaura_walk_E_003.png', 'leaellynasaura_attack_N_003.png'])
    assert.deepEqual(fs.readFileSync(path.join(out, name)), fs.readFileSync(path.join(game, 'assets/rig_full', name)), name);
});

test('paint transfer: four painted poses colour every frame and still pass the rig check', () => {
  const {out} = render('leaellynasaura', 'walk,attack');
  const tpl = path.join(tmp, 'tpl'), painted = path.join(tmp, 'painted');
  let r = run(['tools/rig_paint_transfer.py', '--species', 'leaellynasaura', '--templates', tpl]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  // repaint: every body pixel becomes palette red #913b32, the outline stays
  r = run(['-c', `import sys,numpy as np;from PIL import Image;from pathlib import Path
src,dst=Path(sys.argv[1]),Path(sys.argv[2]);dst.mkdir(exist_ok=True)
for f in src.glob('*.png'):
    a=np.array(Image.open(f));b=(a[...,3]>0)&~np.all(a[...,:3]==(21,27,25),axis=-1);a[b,:3]=(145,59,50);Image.fromarray(a).save(dst/f.name)`, tpl, painted]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const frames = path.join(tmp, 'painted_out');
  r = run(['tools/rig_paint_transfer.py', '--species', 'leaellynasaura', '--paint', painted, '--states', 'walk', '--out', frames]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /24 frames/);
  r = run(['tools/validate_rig_frames.py', '--species', 'leaellynasaura', '--frames', frames, '--rig', out, '--states', 'walk']);
  assert.equal(r.status, 0, r.stdout);
  r = run(['-c', `import sys,numpy as np;from PIL import Image
a=np.array(Image.open(sys.argv[1]));b=(a[...,3]>0)&~np.all(a[...,:3]==(21,27,25),axis=-1);print(round(float(np.all(a[b][:,:3]==(145,59,50),axis=-1).mean()),3))`,
    path.join(frames, 'leaellynasaura_walk_E_003.png')]);
  assert.ok(Number(r.stdout) > 0.95, 'painted share ' + r.stdout);
});

test('cutout rig: parts cut from the model move with the rig and pass the rig check outside death', () => {
  const {out} = render('oviraptor', 'walk,attack');
  const parts = path.join(tmp, 'cutout_parts'), frames = path.join(tmp, 'cutout_frames');
  let r = run(['tools/cutout_rig.py', '--species', 'oviraptor', '--template', parts]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  r = run(['tools/cutout_rig.py', '--species', 'oviraptor', '--parts', parts, '--out', frames, '--states', 'walk,attack']);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /48 frames/);
  r = run(['tools/validate_rig_frames.py', '--species', 'oviraptor', '--frames', frames, '--rig', out, '--states', 'walk,attack']);
  assert.equal(r.status, 0, r.stdout);
  // a part off the palette is refused
  r = run(['-c', `import sys,numpy as np;from PIL import Image
p=sys.argv[1];a=np.array(Image.open(p));a[a[...,3]>0,:3]=(1,2,3);Image.fromarray(a).save(p)`,
    path.join(parts, 'oviraptor_E_head.png')]);
  assert.equal(r.status, 0, r.stderr);
  r = run(['tools/cutout_rig.py', '--species', 'oviraptor', '--parts', parts, '--out', frames, '--states', 'idle']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr + r.stdout, /outside Primal Earth 32/);
});

test('cutout rig: four legs, wings and a borrowed motion get their own parts', () => {
  const parts = (sid) => JSON.parse(fs.readFileSync(path.join(tmp, 'cut_' + sid, sid + '_parts.json'), 'utf8')).directions.E.parts;
  for (const sid of ['stegosaurus', 'pteranodon', 'allosaurus']) {
    const r = run(['tools/cutout_rig.py', '--species', sid, '--template', path.join(tmp, 'cut_' + sid)]);
    assert.equal(r.status, 0, r.stderr || r.stdout);
  }
  assert.ok(['thigh_L', 'shin_L', 'upperarm_L', 'forearm_R'].every((n) => n in parts('stegosaurus')), Object.keys(parts('stegosaurus')).join());
  assert.ok('wing_L' in parts('pteranodon') && !('thigh_L' in parts('pteranodon')));
  // T-rex has no 3D model: its drawn parts move with the Allosaurus motion
  const src = path.join(tmp, 'cut_allosaurus'), rex = path.join(tmp, 'cut_rex');
  fs.mkdirSync(rex);
  for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(rex, f.replace('allosaurus', 'tyrannosaurus')));
  let r = run(['tools/cutout_rig.py', '--species', 'tyrannosaurus', '--parts', rex, '--out', path.join(tmp, 'rex_frames'), '--states', 'walk']);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /24 frames/);
  const rig = JSON.parse(fs.readFileSync(path.join(tmp, 'rex_frames', 'tyrannosaurus_cutout.json'), 'utf8'));
  assert.equal(rig.motion, 'allosaurus');
  assert.ok(Math.abs(rig.motion_gain - 1) < 0.15, 'same legs, same stride: ' + rig.motion_gain);
  r = run(['tools/cutout_rig.py', '--species', 'tyrannosaurus', '--template', path.join(tmp, 'rex_tpl')]);
  assert.notEqual(r.status, 0);
});

test('cutout approval only holds for the exact parts Jonas saw', () => {
  const game = path.join(ROOT, 'PRIMAL_RUN_Game');
  const manifest = JSON.parse(fs.readFileSync(path.join(game, 'rig_full_manifest.json'), 'utf8'));
  const approved = manifest.filter((e) => e.status === 'approved_animation');
  assert.deepEqual([...new Set(approved.map((e) => e.species))].sort(), ['allosaurus', 'iguanodon', 'tyrannosaurus']);
  const r = run(['-c', "import sys; sys.path.insert(0, 'tools'); from pathlib import Path; import rig_to_game as R; "
    + "f = Path('PRIMAL_RUN_Game/Source_Generated/cutout/iguanodon'); print(R.approval(f, 'iguanodon') is not None)"]);
  assert.equal(r.stdout.trim(), 'True', r.stdout + r.stderr);
});
