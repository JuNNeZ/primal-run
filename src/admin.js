// Hidden admin panel for Jonas (2026-10-14): tap the PRIMAL RUN title on the main menu 7 times within 4 seconds and
// enter the code. Only a SHA-256 hash of the code is stored here. While admin is on, the game never writes the save
// (game.persist is a no-op), so unlocks, DNA, records and achievements from test runs vanish on reload.
// Browser only: not part of the GDevelop build. Texts are Danish on purpose (developer tool, not translated).
(function (root) {
  'use strict';
  const CODE_HASH = '7246cbb5261e4a31358bf7a2f6a566a7cc3a3b7c687d7b63240e596b75d439f6';
  const SESSION_KEY = 'primalAdmin', TAPS = 7, TAP_WINDOW = 4000;
  const doc = root.document; if (!doc) return;
  let session = null; try { session = root.sessionStorage; } catch (_) { /* admin then lasts until reload */ }
  let taps = [], on = false, panel = null, fab = null, pausedHere = false;

  async function sha256(text) {
    if (!(root.crypto && root.crypto.subtle && root.TextEncoder)) return '';
    const bytes = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const api = () => root.primalRun, game = () => api() && api().game, C = () => root.PrimalCore;
  const refresh = () => { const g = game(); if (g) g.emit('ui'); };
  const say = text => { const n = panel && panel.querySelector('.admin-log'); if (n) n.textContent = text; };

  function enable() {
    const g = game(); if (!g || on) return;
    on = true; g.persist = () => {}; try { session && session.setItem(SESSION_KEY, '1'); } catch (_) { /* ignore */ }
    fab = doc.createElement('button'); fab.className = 'admin-fab'; fab.type = 'button'; fab.textContent = 'ADMIN';
    fab.title = 'Adminpanel (gemmer ikke)'; fab.addEventListener('click', () => toggle()); doc.body.appendChild(fab);
    toggle(true);
  }
  function disable() { try { session && session.removeItem(SESSION_KEY); } catch (_) { /* ignore */ } root.location.reload(); }

  const ACTIONS = {
    god() { const r = game().run; if (!r) return 'Start et run først'; r.adminGod = !r.adminGod; r.invulnerable = r.adminGod ? 1e9 : 0; return r.adminGod ? 'Gud-tilstand TIL' : 'Gud-tilstand FRA'; },
    heal() { const r = game().run; if (!r) return 'Start et run først'; r.health = r.maxHealth; r.stamina = 100; return 'Fuldt liv og stamina'; },
    levelup() { const r = game().run; if (!r) return 'Start et run først'; r.xp = Math.max(r.xp, r.nextXP); return 'Mutationsvalg kommer'; },
    boss() { const g = game(), r = g.run; if (!r) return 'Start et run først'; r.meat = Math.max(r.meat, g.currentLevel().target); return 'Bossen kommer'; },
    skip() {
      const g = game(), r = g.run; if (!r) return 'Start et run først';
      if (r.levelIndex >= r.campaign.length - 1) return 'Sidste bane';
      g.phase = 'cleared'; r.bossDefeated = true; g.nextStage(); return 'Bane ' + (g.run.levelIndex + 1);
    },
    start() {
      const g = game(), species = panel.querySelector('[name=species]').value, level = Number(panel.querySelector('[name=level]').value) || 1;
      if (!g.save.unlockedSpecies.includes(species)) g.save.unlockedSpecies.push(species);
      g.phase = 'menu'; g.selectSpecies(species); g.start({});
      for (let i = 1; i < level && g.run.levelIndex < g.run.campaign.length - 1; i++) { g.phase = 'cleared'; g.run.bossDefeated = true; g.nextStage(); }
      g.phase = 'playing'; pausedHere = false; toggle(false); return 'Run startet på bane ' + (g.run.levelIndex + 1);
    },
    powerup() {
      const g = game(), r = g.run, type = panel.querySelector('[name=powerup]').value; if (!r) return 'Start et run først';
      C().dropPowerup(g, r.player.x + 60, r.player.y, type); return 'Powerup lagt til højre for dig';
    },
    elite() {
      const g = game(), r = g.run, kind = panel.querySelector('[name=elite]').value; if (!r) return 'Start et run først';
      const e = g.spawn(kind, { x: r.player.x + 220, y: r.player.y }); if (!e) return 'Kunne ikke spawne';
      e.elite = true; return 'Elite ' + kind + ' spawnet';
    },
    twist() {
      const r = game().run; if (!r) return 'Start et run først'; const t = C().TWISTS[r.species];
      if (!t) return 'Denne art har ingen evne-twist'; r.mutations[t.id] = 1; return 'Twist: ' + t.name;
    },
    streak() { const r = game().run; if (!r || !r.extras) return 'Start et run først'; const S = C().STREAK; r.extras.streak = S.max; r.extras.lastKillAt = r.seconds + 60; return 'Jagtrus ×' + S.max; },
    amber() { const r = game().run; if (!r) return 'Start et run først'; r.amberPiece = { x: r.player.x + 50, y: r.player.y + 20, level: r.levelIndex }; return 'Rav lagt ved dig (tryk E)'; },
    time(phase) {
      const r = game().run; if (!r) return 'Start et run først'; const D = C().DAYNIGHT, at = { day: 10, dusk: D.dusk + 2, night: D.night + 5, dawn: D.dawn + 2 }[phase];
      const now = ((r.seconds % D.period) + D.period) % D.period; r.seconds += ((at - now) + D.period) % D.period; return 'Tid: ' + phase;
    },
    unlock() { const g = game(); g.save.unlockedSpecies = Object.keys(C().PLAYER_SPECIES); refresh(); return 'Alle arter låst op (kun indtil genindlæsning)'; },
    dna() { const g = game(); g.save.dna += 1000; refresh(); return '+1000 DNA (kun indtil genindlæsning)'; },
    baby() { const g = game(), v = !g.save.settings?.babyHard; g.setSetting('babyHard', v); return 'Hård baby-start ' + (v ? 'TIL' : 'FRA'); },
    off() { disable(); return ''; },
  };

  function build() {
    const c = C(), opt = (list, label = x => x) => list.map(x => `<option value="${x}">${label(x)}</option>`).join('');
    const species = Object.keys(c.PLAYER_SPECIES), name = id => c.PLAYER_SPECIES[id].name || id;
    const elites = ['carnotaurus', 'tyrannosaurus', 'triceratops', 'utahraptor', 'deinosuchus', 'allosaurus'].filter(k => c.SPECIES[k]);
    panel = doc.createElement('div'); panel.className = 'admin-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Adminpanel');
    panel.innerHTML = `<header><b>ADMIN</b><span>Gemmer intet; genindlæs for dit rigtige gem</span><button type="button" data-admin="close" aria-label="Luk">×</button></header>
      <section><h3>Nyt run</h3><label>Art <select name="species">${opt(species, name)}</select></label>
        <label>Bane <select name="level">${opt([1, 2, 3, 4, 5, 6, 7, 8])}</select></label><button type="button" data-admin="start">Start</button></section>
      <section><h3>Dette run</h3><button type="button" data-admin="god">Gud-tilstand</button><button type="button" data-admin="heal">Fuldt liv</button>
        <button type="button" data-admin="levelup">Mutationsvalg</button><button type="button" data-admin="boss">Kald boss</button><button type="button" data-admin="skip">Spring bane over</button></section>
      <section><h3>Nye ting</h3><label>Powerup <select name="powerup">${opt(Object.keys(c.POWERUPS), k => c.POWERUPS[k].name)}</select></label><button type="button" data-admin="powerup">Læg</button>
        <label>Elite <select name="elite">${opt(elites)}</select></label><button type="button" data-admin="elite">Spawn</button>
        <button type="button" data-admin="twist">Giv evne-twist</button><button type="button" data-admin="streak">Jagtrus ×5</button><button type="button" data-admin="amber">Rav ved mig</button><button type="button" data-admin="baby">Baby-start til/fra</button></section>
      <section><h3>Døgn</h3><button type="button" data-admin="time" data-arg="day">Dag</button><button type="button" data-admin="time" data-arg="dusk">Skumring</button><button type="button" data-admin="time" data-arg="night">Nat</button><button type="button" data-admin="time" data-arg="dawn">Daggry</button></section>
      <section><h3>Gem (midlertidigt)</h3><button type="button" data-admin="unlock">Lås alle arter op</button><button type="button" data-admin="dna">+1000 DNA</button><button type="button" data-admin="off">Slå admin fra</button></section>
      <p class="admin-log" aria-live="polite"></p>`;
    panel.addEventListener('click', ev => {
      const b = ev.target.closest('[data-admin]'); if (!b) return; ev.stopPropagation();
      if (b.dataset.admin === 'close') return toggle(false);
      try { say(ACTIONS[b.dataset.admin](b.dataset.arg)); } catch (err) { say('Fejl: ' + err.message); }
    });
    // keep game keys (WASD, Space, E) away from the game while choosing in the panel
    for (const type of ['keydown', 'keyup']) panel.addEventListener(type, ev => ev.stopPropagation());
    doc.body.appendChild(panel);
  }
  function toggle(show) {
    if (!panel) build(); show = show === undefined ? panel.hidden : show; panel.hidden = !show;
    const g = game(); if (!g) return;
    if (show && g.phase === 'playing') { g.pause(); pausedHere = true; }
    else if (!show && pausedHere && g.phase === 'paused') { g.resume(); pausedHere = false; refresh(); }
  }

  doc.addEventListener('click', async ev => {
    if (on || !ev.target.closest || !ev.target.closest('.menu-panel h1')) return;
    const now = Date.now(); taps = taps.filter(t => now - t < TAP_WINDOW); taps.push(now);
    if (taps.length < TAPS) return; taps = [];
    const code = root.prompt('Kode'); if (!code) return;
    if (await sha256(code.trim().toLowerCase()) === CODE_HASH) enable();
  });
  // Stays on for the rest of the browser tab (reload keeps admin, but never the test changes to the save).
  const resume = () => { if (game()) { if (session && session.getItem(SESSION_KEY) === '1') { enable(); toggle(false); } } else setTimeout(resume, 200); };
  try { resume(); } catch (_) { /* no session storage */ }
  root.PrimalAdmin = { enable: code => sha256(String(code).trim().toLowerCase()).then(h => { if (h === CODE_HASH) enable(); return on; }), get on() { return on; }, actions: ACTIONS, toggle };
})(typeof window !== 'undefined' ? window : globalThis);
