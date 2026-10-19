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
      assert.equal(e.status, 'prototype_static');
      assert.equal(e.production_approved, false);
      assert.ok(fs.existsSync(path.join(game, e.file)), e.file);
      assert.ok(assets.includes('"' + e.file + '"'), 'not built into src/assets.js: ' + e.file);
    }
    assert.equal(C.playerFrame(id, 'walk', 'E', 3), `assets/rig_full/${id}_walk_E_003.png`);
  }
  const {out} = render('leaellynasaura', 'walk,attack');
  for (const name of ['leaellynasaura_walk_E_003.png', 'leaellynasaura_attack_N_003.png'])
    assert.deepEqual(fs.readFileSync(path.join(out, name)), fs.readFileSync(path.join(game, 'assets/rig_full', name)), name);
});
