(function (root) {
  'use strict';
  const C = root.PrimalCore;
  const htmlEscape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const timeLabel = seconds => Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
  function mount({ host = document.body, resolve = path => path, stylesheet = '', driven = false } = {}) {
    if (root.primalRun) root.primalRun.dispose();
    let storage = null; try { storage = window.localStorage; } catch (_) { /* In-memory play still works. */ }
    const game = new C.Game({ storage });
    const shell = document.createElement('div'); shell.className = 'primal-shell';
    shell.innerHTML = `<style>${stylesheet}</style><header class="masthead"><a class="wordmark" href="#" data-action="home">PRIMAL<span>RUN</span></a><span class="edition">UTAH­RAPTOR · ROGUELITE</span><button class="quiet" data-action="pause" id="pause-button" hidden>Pause · Esc</button></header>
      <main class="arena"><canvas width="960" height="640" tabindex="0" aria-label="Spilområde. WASD eller piletaster flytter, Space bider, Shift springer, Escape pauser."></canvas>
      <div class="hud" hidden><div><small>LIV</small><div class="meter health"><i></i></div><b id="health-label"></b></div><div><small>STAMINA</small><div class="meter stamina"><i></i></div></div><div class="hunt-counter"><small id="biome-label"></small><b id="meat-label"></b></div></div>
      <div class="boss-hud" hidden><b></b><div class="meter"><i></i></div></div><div class="run-info" hidden><span id="level-label"></span><span id="dna-label"></span><span id="time-label"></span></div>
      <div class="screen" aria-live="polite"></div><div class="toast" role="status"></div></main>
      <div class="touch-controls" hidden><div class="dpad"><button data-key="ArrowUp" aria-label="Op">↑</button><button data-key="ArrowLeft" aria-label="Venstre">←</button><button data-key="ArrowDown" aria-label="Ned">↓</button><button data-key="ArrowRight" aria-label="Højre">→</button></div><div><button data-key="Space">BID</button><button data-key="ShiftLeft">POUNCE</button></div></div>
      <footer><span><kbd>WASD</kbd> Bevæg · <kbd>SPACE</kbd> Bid · <kbd>SHIFT</kbd> Pounce · <kbd>ESC</kbd> Pause</span><span class="save-status"></span></footer>`;
    host.appendChild(shell);
    const canvas = shell.querySelector('canvas'), ctx = canvas.getContext('2d');
    const screen = shell.querySelector('.screen'), images = {}, flashes = {}, keys = new Set(), cleanups = [], backgrounds = new Map();
    const audio = new root.PrimalAudio(resolve, game.save.settings);
    let ready = false, disposed = false, previousPhase = '', returnPhase = 'menu', last = 0, accumulator = 0, animationId = 0, toastUntil = 0;
    const catalog = root.PrimalAssets;
    function listen(target, name, callback, options) { target.addEventListener(name, callback, options); cleanups.push(() => target.removeEventListener(name, callback, options)); }
    function toast(text) { shell.querySelector('.toast').textContent = text; toastUntil = performance.now() + 2600; }
    function imageTag(path, className = '') { return `<img class="${className}" src="${htmlEscape(resolve(path))}" alt="">`; }
    function button(action, text, className = '') { return `<button class="${className}" data-action="${action}">${text}</button>`; }
    function heading(kicker, title, text = '') { return `<small class="eyebrow">${kicker}</small><h1>${title}</h1>${text ? `<p class="intro">${text}</p>` : ''}`; }
    function renderScreen(force = false) {
      const phase = game.phase, r = game.run;
      if (phase === previousPhase && !force) return;
      previousPhase = phase; keys.clear();
      const running = ['playing', 'paused', 'mutation', 'cleared'].includes(phase);
      shell.querySelector('.hud').hidden = !running; shell.querySelector('.run-info').hidden = !running;
      shell.querySelector('#pause-button').hidden = !['playing', 'paused'].includes(phase);
      shell.querySelector('.touch-controls').hidden = phase !== 'playing';
      screen.hidden = phase === 'playing'; screen.classList.toggle('wide', ['shop', 'scores'].includes(phase));
      if (phase === 'playing') { screen.innerHTML = ''; canvas.focus({ preventScroll: true }); return; }
      if (phase === 'menu') {
        screen.innerHTML = `<section class="panel menu-panel">${heading('JAGT · MUTÉR · OVERLEV', 'PRIMAL <em>RUN</em>', 'En Utahraptor. Fire biomer. Ét liv. Hvor langt når din jagt?')}
          <label class="name-label">DIT NAVN<input id="player-name" maxlength="20" autocomplete="nickname" value="${htmlEscape(game.save.name)}"></label>
          ${button('start', ready ? 'START JAGTEN <span>→</span>' : 'INDLÆSER…', 'primary')}
          <div class="menu-grid">${button('shop', 'DNA-laboratorium <b>' + game.save.dna + '</b>')}${button('scores', 'Highscores')}${button('settings', 'Indstillinger')}${button('help', 'Sådan spiller du')}</div>
          <p class="fine">Kød giver levels. Bosser åbner næste biome. DNA beholdes, når du dør.</p></section>`;
        screen.querySelector('[data-action="start"]').disabled = !ready;
      } else if (phase === 'intro') {
        screen.innerHTML = `<section class="panel hunt-intro">${heading('KLAR PÅ 20 SEKUNDER', 'Sådan overlever du')}
          <dl class="control-guide"><div><dt><kbd>WASD</kbd> / <kbd>↑ ↓ ← →</kbd></dt><dd>Bevæg dig og vend mod dit bytte.</dd></div><div><dt><kbd>SPACE</kbd></dt><dd>Hold for at bide. Du rammer kun foran dig — gå tæt på!</dd></div><div><dt><kbd>SHIFT</kbd> + bevægelse</dt><dd>Spring frem og undvig. Bruger stamina, som fyldes igen.</dd></div><div><dt><kbd>ESC</kbd></dt><dd>Pause og indstillinger.</dd></div></dl>
          <p class="hunt-goal"><strong>Jagt → saml kød → vælg mutationer.</strong><br>Nå kødmålet, besejr bossen, og fortsæt til næste biome. Undvig de røde angrebsvarsler.</p>
          <p class="hunt-goal"><strong>DNA beholdes, når du dør.</strong> Saml DNA fra byttet — bosser giver det altid. Køb permanente upgrades i DNA-laboratoriet før næste jagt.</p>
          <p class="fine">På mobil: brug pileknapperne, BID og POUNCE under spillet.</p>
          <div class="actions">${button('menu', '← Tilbage')}${button('begin', 'FORSTÅET — START JAGTEN →', 'primary')}</div></section>`;
      } else if (phase === 'shop') {
        screen.innerHTML = `<section class="panel">${heading('PERMANENT EVOLUTION', 'DNA-laboratoriet', 'Små forbedringer til dit næste run. Mutationerne finder du stadig på jagten.')}<div class="bank">${imageTag('assets/ui/dna.png')}<b>${game.save.dna} DNA</b></div><div class="upgrade-grid">${C.UPGRADES.map(u => {
          const rank = game.save.upgrades[u.id], cost = C.upgradeCost(rank);
          return `<article><h2>${u.name}</h2><p>${u.text}</p><div class="ranks">${'●'.repeat(rank)}${'○'.repeat(u.max - rank)}</div><button data-buy="${u.id}" ${rank >= u.max || game.save.dna < cost ? 'disabled' : ''}>${rank >= u.max ? 'Fuldt udviklet' : cost + ' DNA · Køb rang ' + (rank + 1)}</button></article>`;
        }).join('')}</div>${button('menu', '← Tilbage')}</section>`;
      } else if (phase === 'settings') {
        screen.innerHTML = `<section class="panel">${heading('FIND DIN BALANCE', 'Indstillinger')}<div class="settings">${[['master', 'Samlet lyd'], ['music', 'Musik'], ['sfx', 'Lydeffekter']].map(([id, label]) => `<label>${label}<output id="volume-${id}">${Math.round(game.save.settings[id] * 100)} %</output><input aria-label="${label}" data-setting="${id}" type="range" min="0" max="100" value="${Math.round(game.save.settings[id] * 100)}"></label>`).join('')}<label class="check"><input data-setting="shake" type="checkbox" ${game.save.settings.shake ? 'checked' : ''}> Kamerarystelse</label></div><div class="actions">${button('mute', 'Slå al lyd fra')}${button('fullscreen', 'Fuldskærm')}${button('back', '← Tilbage', 'primary')}</div><p class="fine">Lyd starter efter et klik. Musikken er et originalt, proceduralt jagttema.</p></section>`;
      } else if (phase === 'scores') {
        screen.innerHTML = `<section class="panel">${heading('DE STØRSTE JÆGERE', 'Highscores', 'Din lokale top 10 i denne browser.')}<div class="table-scroll"><table><thead><tr><th>#</th><th>Jæger</th><th>Score</th><th>Bane</th><th>Bosser</th><th>Tid</th></tr></thead><tbody>${game.save.scores.map((s, i) => `<tr><td>${i + 1}</td><td>${htmlEscape(s.name)}${s.victory ? ' ♛' : ''}</td><td>${s.score}</td><td>${s.stage}</td><td>${s.bosses}</td><td>${timeLabel(s.seconds)}</td></tr>`).join('') || '<tr><td colspan="6">Din første jagt venter.</td></tr>'}</tbody></table></div>${button('menu', '← Tilbage')}</section>`;
      } else if (phase === 'help') {
        screen.innerHTML = `<section class="panel">${heading('LÆR AT JAGE', 'Din første jagt')}<ol class="instructions"><li>Bevæg dig med WASD eller piletaster. Hold Space for at bide <strong>foran</strong> dig.</li><li>Hold Shift under bevægelse for at pounce. Springet bruger stamina og beskytter kort mod skade.</li><li>Saml kødet fra dit bytte. Ved level-up vælger du én af tre mutationer.</li><li>Nå kødmålet for at lokke bossen frem. De røde varsler viser dens næste angreb. Angrib, når den hviler.</li><li>DNA har 5 / 15 / 30 % dropchance fra små / mellemstore / store dyr. Bosser giver altid DNA.</li><li>DNA beholdes ved død. Køb små start-upgrades i laboratoriet, og prøv igen.</li></ol><p class="fine">Fire bosser giver en sejr. Escape pauser. Spillet pauser også, når du skifter fane.</p>${button('menu', '← Klar til jagt', 'primary')}</section>`;
      } else if (phase === 'paused') {
        screen.innerHTML = `<section class="panel compact">${heading('TAG EN PAUSE', 'Jagten venter')}${button('resume', 'FORTSÆT · Esc', 'primary')}<div class="actions">${button('settings', 'Indstillinger')}${button('abandon', 'Afslut run')}</div><p class="fine">Opsamlet DNA er allerede gemt. Afslut run registrerer din score.</p></section>`;
      } else if (phase === 'mutation') {
        screen.innerHTML = `<section class="panel">${heading('RAPTOR-LEVEL ' + r.level, 'Vælg din mutation', 'SPILLET ER PAUSET — du er sikker, mens du vælger. Klik eller tryk 1, 2, 3. Efter valget er du beskyttet i ét sekund.')}<div class="mutation-grid">${r.choices.map((id, i) => {
          const m = C.MUTATIONS.find(m => m.id === id);
          return `<button data-mutation="${id}">${imageTag('assets/ui/' + m.icon + '.png')}<small>VALG ${i + 1} · RANG ${r.mutations[id] + 1}/${m.max}</small><h2>${m.name}</h2><p>${m.text}</p></button>`;
        }).join('')}</div></section>`;
      } else if (phase === 'cleared') {
        const stage = C.STAGES[r.stage];
        screen.innerHTML = `<section class="panel compact">${heading('BOSS BESEJRET', stage.bossName + ' er faldet', '+' + stage.dna + ' DNA er gemt. Din Utahraptor bliver stærkere.')}<div class="bank">${imageTag('assets/ui/dna.png')}<b>${game.save.dna} DNA</b></div>${button('next', r.stage === 3 ? 'AFSLUT JAGTEN →' : 'NÆSTE BIOME →', 'primary')}<p class="fine">${r.stage === 3 ? 'Alle fire biomer er erobret.' : 'Du beholder mutationerne og genvinder 30 % af dit maksimale liv.'}</p></section>`;
      } else if (phase === 'result') {
        const result = r.result;
        screen.innerHTML = `<section class="panel compact">${heading(result.victory ? 'DALENS NYE KONGE' : 'EVOLUTIONEN FORTSÆTTER', result.victory ? 'Jagten er vundet' : 'Jagten er slut', htmlEscape(result.name) + ' · Bane ' + result.stage + ' · ' + result.bosses + ' bosser')}<div class="result-stats"><div><small>SCORE</small><b>${result.score}</b></div><div><small>DNA I RUN</small><b>+${r.dna}</b></div><div><small>TID</small><b>${timeLabel(result.seconds)}</b></div></div>${button('start', 'NY JAGT →', 'primary')}<div class="actions">${button('shop', 'DNA-laboratorium')}${button('scores', 'Highscores')}${button('menu', 'Hovedmenu')}</div></section>`;
      } else if (phase === 'error') {
        screen.innerHTML = `<section class="panel">${heading('INDLÆSNING FEJLEDE', 'Assets mangler')}<p>Kontrollér, at assets-mappen følger med spillet. Genindlæs siden efter rettelsen.</p><p class="load-error"></p></section>`;
      }
      const focus = screen.querySelector(phase === 'intro' ? '[data-action="begin"]' : 'button:not(:disabled)'); if (focus) focus.focus({ preventScroll: true });
      shell.querySelector('.save-status').textContent = game.storageAvailable ? 'DNA og indstillinger gemmes lokalt' : 'Lagring utilgængelig · fremgang gemmes kun i denne session';
    }
    function sprite(path, x, y, alpha = 1, flash = false) {
      const image = flash ? flashes[path] : images[path], meta = catalog[path]; if (!image || !meta) return;
      ctx.globalAlpha = alpha; ctx.drawImage(image, Math.round(x) - meta.origin[0], Math.round(y) - meta.origin[1]); ctx.globalAlpha = 1;
    }
    function background(stage) {
      if (backgrounds.has(stage)) return backgrounds.get(stage);
      const offscreen = document.createElement('canvas'); offscreen.width = C.WIDTH; offscreen.height = C.HEIGHT;
      const c = offscreen.getContext('2d'); c.imageSmoothingEnabled = false;
      const tile = images['assets/tiles/' + C.STAGES[stage].tile + '.png'];
      for (let y = 0; y < C.HEIGHT; y += 32) for (let x = 0; x < C.WIDTH; x += 32) c.drawImage(tile, x, y);
      c.fillStyle = '#151b1966'; c.fillRect(0, 0, 960, 76); c.fillRect(0, 598, 960, 42); c.fillRect(0, 76, 42, 522); c.fillRect(918, 76, 42, 522);
      backgrounds.set(stage, offscreen); return offscreen;
    }
    function draw() {
      if (!ready) { ctx.fillStyle = '#151b19'; ctx.fillRect(0, 0, 960, 640); return; }
      const r = game.run, stage = r ? r.stage : 0;
      ctx.imageSmoothingEnabled = false; ctx.save();
      if (r && r.shake > 0 && game.save.settings.shake) ctx.translate(Math.round(Math.sin(r.seconds * 110) * 3), Math.round(Math.cos(r.seconds * 90) * 3));
      ctx.drawImage(background(stage), 0, 0);
      if (r) {
        for (const e of r.enemies) if (e.mode === 'windup') {
          ctx.strokeStyle = '#ed7869'; ctx.fillStyle = '#913b3277'; ctx.lineWidth = 3;
          ctx.beginPath();
          if (e.pattern === 2 || e.kind === 'compy') ctx.arc(Math.round(e.x), Math.round(e.y), e.attackRadius, 0, Math.PI * 2);
          else {
            const x = Math.round(e.x), y = Math.round(e.y), nx = -e.chargeY * 28, ny = e.chargeX * 28, length = e.boss ? 200 : 130;
            ctx.moveTo(x + nx, y + ny); ctx.lineTo(x + e.chargeX * length + nx, y + e.chargeY * length + ny); ctx.lineTo(x + e.chargeX * length - nx, y + e.chargeY * length - ny); ctx.lineTo(x - nx, y - ny); ctx.closePath();
          }
          ctx.fill(); ctx.stroke();
          ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#151b19';
          const warning = e.kind === 'compy' ? 'BID' : e.kind === 'ankylosaurus' ? 'HALESLAG' : 'STORMLØB';
          ctx.strokeText(warning, Math.round(e.x), Math.round(e.y) - 66); ctx.fillStyle = '#ed7869'; ctx.fillText(warning, Math.round(e.x), Math.round(e.y) - 66);
        }
        for (const p of r.pickups) sprite(p.kind === 'meat' ? 'assets/pickups/meat.png' : p.kind === 'dna' ? 'assets/pickups/dna_pickup.png' : 'assets/ui/health.png', p.x, p.y);
      }
      const objects = C.ROCKS.map(p => ({ ...p, path: 'assets/environment/rock.png' }));
      for (const [x, y] of [[100, 130], [130, 490], [855, 125], [835, 540], [390, 180], [600, 510], [87, 565], [860, 350]]) objects.push({ x, y, path: 'assets/environment/fern.png' });
      if (r) {
        for (const e of r.enemies) {
          let state = 'idle';
          if (['charge', 'bite', 'slam'].includes(e.mode) || (e.mode === 'windup' && e.timer < e.windupDuration * .5)) state = 'action';
          else if (e.moving) state = (e.mode === 'flee' ? ['step_left', 'action', 'step_right', 'action'] : ['idle', 'step_left', 'idle', 'step_right'])[Math.min(3, Math.floor(e.walk * 8))];
          const candidate = 'assets/enemy_animations/' + e.kind + '_' + state + '_' + e.direction + '_000.png';
          const path = catalog[candidate] ? candidate : 'assets/enemies/' + e.kind + '_idle_S_000.png';
          objects.push({ ...e, enemy: e, path });
        }
        const p = r.player, frame = String(Math.min(5, Math.floor(p.walk * 8))).padStart(3, '0');
        let playerPath = 'assets/player/utahraptor_' + (p.moving ? 'walk_' : 'idle_') + p.facing + '_' + (p.moving ? frame : '000') + '.png';
        if (r.attack) {
          const attackFrame = Math.min(C.BITE_ANIMATION.frames - 1, Math.floor(r.attack.elapsed / r.attack.duration * C.BITE_ANIMATION.frames));
          const attackPath = 'assets/player_combat/utahraptor_bite_' + r.attack.facing + '_' + String(attackFrame).padStart(3, '0') + '.png';
          if (catalog[attackPath]) playerPath = attackPath;
        }
        canvas.dataset.playerSprite = playerPath;
        canvas.dataset.playerState = r.attack ? 'Bite_' + r.attack.facing : (p.moving ? 'Walk_' : 'Idle_') + p.facing;
        objects.push({ ...p, player: true, path: playerPath });
      } else objects.push({ x: 780, y: 390, path: 'assets/player/utahraptor_idle_S_000.png' });
      objects.sort((a, b) => a.y - b.y);
      for (const o of objects) {
        if (o.enemy && o.enemy.boss) { ctx.strokeStyle = '#e9b75a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(Math.round(o.x), Math.round(o.y), 35, 17, 0, 0, Math.PI * 2); ctx.stroke(); }
        const alpha = o.player && r.invulnerable > 0 && Math.floor(r.invulnerable * 20) % 2 ? .45 : 1;
        sprite(o.path, o.x, o.y, alpha);
        if (o.enemy && o.enemy.hit > 0) sprite(o.path, o.x, o.y, .7 * o.enemy.hit / .15, true);
        if (o.enemy && o.enemy.hp < o.enemy.maxHP && !o.enemy.boss) { ctx.fillStyle = '#151b19'; ctx.fillRect(Math.round(o.x) - 20, Math.round(o.y) - 40, 40, 4); ctx.fillStyle = '#c45f45'; ctx.fillRect(Math.round(o.x) - 20, Math.round(o.y) - 40, Math.round(40 * o.enemy.hp / o.enemy.maxHP), 4); }
      }
      if (r) {
        if (r.bite > 0) {
          const [dx, dy] = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[r.biteFacing];
          sprite('assets/effects/bite_slash_001.png', r.player.x + dx * 36, r.player.y + dy * 36);
        }
        ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
        for (const e of r.effects) {
          const x = Math.round(e.x), y = Math.round(e.y - 55 - (1 - e.life / .55) * 20);
          ctx.lineWidth = 3; ctx.strokeStyle = '#101713'; ctx.strokeText(e.text, x, y);
          ctx.fillStyle = '#ffe0a0'; ctx.fillText(e.text, x, y);
        }
      }
      ctx.restore();
      if (!r) return;
      shell.querySelector('.health i').style.width = Math.max(0, 100 * r.health / r.maxHealth) + '%';
      shell.querySelector('#health-label').textContent = Math.ceil(r.health) + '/' + Math.ceil(r.maxHealth);
      shell.querySelector('.stamina i').style.width = r.stamina + '%';
      shell.querySelector('#biome-label').textContent = 'BANE ' + (r.stage + 1) + ' · ' + C.STAGES[r.stage].name;
      shell.querySelector('#meat-label').textContent = r.bossSpawned ? 'BOSSEN ER HER' : r.meat + ' / ' + C.STAGES[r.stage].target + ' KØD';
      shell.querySelector('#level-label').textContent = 'LEVEL ' + r.level + ' · ' + r.xp + '/' + r.nextXP + ' XP';
      shell.querySelector('#dna-label').textContent = '+' + r.dna + ' DNA · ' + r.kills + ' JAGTER';
      shell.querySelector('#time-label').textContent = timeLabel(r.seconds);
      const boss = r.enemies.find(e => e.boss), bossHUD = shell.querySelector('.boss-hud');
      bossHUD.hidden = !boss || !['playing', 'paused', 'mutation'].includes(game.phase);
      if (boss) { bossHUD.querySelector('b').textContent = C.STAGES[r.stage].bossName; bossHUD.querySelector('i').style.width = Math.max(0, boss.hp / boss.maxHP * 100) + '%'; }
    }
    function update(now) {
      if (disposed) return;
      const dt = last ? Math.min(.1, Math.max(0, (now - last) / 1000)) : 0; last = now;
      const phaseBefore = game.phase; accumulator += dt;
      if (ready && game.phase === 'playing') {
        while (accumulator >= 1 / 60 && game.phase === 'playing') {
          game.step(1 / 60, { x: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), y: (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0), attack: keys.has('Space'), pounce: keys.has('ShiftLeft') || keys.has('ShiftRight') });
          accumulator -= 1 / 60;
        }
      } else accumulator = 0;
      if (game.phase !== phaseBefore) accumulator = 0;
      for (const event of game.drainEvents()) { audio.play(event.type); if (event.type === 'boss') toast('BOSSEN ER HER · Undvig de røde varsler!'); if (event.type === 'dna') toast('+' + event.amount + ' DNA · gemt'); }
      audio.intensity = game.phase === 'playing' ? (game.run.bossSpawned ? 'boss' : 'hunt') : game.phase === 'paused' ? 'paused' : 'menu'; audio.sync();
      renderScreen(); draw();
      shell.querySelector('.toast').hidden = now > toastUntil;
      shell.querySelector('.save-status').textContent = game.storageAvailable ? 'DNA og indstillinger gemmes lokalt' : 'Lagring utilgængelig · kun denne session';
    }
    function frame(now) { update(now); if (!disposed) animationId = requestAnimationFrame(frame); }
    listen(shell, 'click', async e => {
      await audio.unlock();
      const target = e.target.closest('button,[data-action]'); if (!target) return;
      if (target.dataset.buy) { game.purchase(target.dataset.buy); renderScreen(true); return; }
      if (target.dataset.mutation) { game.choose(target.dataset.mutation); keys.clear(); accumulator = 0; last = 0; renderScreen(); return; }
      const action = target.dataset.action;
      if (action) e.preventDefault();
      if (action === 'start' && ready) { const name = shell.querySelector('#player-name'); if (name) game.setName(name.value); game.phase = 'intro'; }
      else if (action === 'begin' && ready && game.phase === 'intro') game.start();
      else if (['shop', 'scores', 'help'].includes(action)) { if (game.phase === 'menu') { const name = shell.querySelector('#player-name'); if (name) game.setName(name.value); } game.phase = action; }
      else if (action === 'settings') { returnPhase = game.phase === 'paused' ? 'paused' : 'menu'; const name = shell.querySelector('#player-name'); if (name) game.setName(name.value); game.phase = 'settings'; }
      else if (action === 'back') game.phase = returnPhase;
      else if (action === 'menu') game.phase = 'menu';
      else if (action === 'home') { if (game.phase === 'playing') game.pause(); else if (!['paused', 'mutation', 'cleared'].includes(game.phase) && !(game.phase === 'settings' && returnPhase === 'paused')) game.phase = 'menu'; }
      else if (action === 'pause') { if (game.phase === 'playing') game.pause(); else game.resume(); }
      else if (action === 'resume') game.resume();
      else if (action === 'abandon') { game.finish(false); }
      else if (action === 'next') game.nextStage();
      else if (action === 'mute') { game.setSetting('master', 0); audio.sync(); renderScreen(true); }
      else if (action === 'fullscreen') { try { if (document.fullscreenElement) await document.exitFullscreen(); else await shell.requestFullscreen(); } catch (_) { toast('Fuldskærm understøttes ikke her.'); } }
      if (action !== 'pause' && action !== 'start') audio.play('ui');
      accumulator = 0; renderScreen();
    });
    listen(shell, 'input', e => {
      const key = e.target.dataset.setting; if (!key) return;
      game.setSetting(key, key === 'shake' ? e.target.checked : Number(e.target.value) / 100); audio.sync();
      const output = shell.querySelector('#volume-' + key); if (output) output.textContent = Math.round(game.save.settings[key] * 100) + ' %';
    });
    listen(window, 'keydown', e => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      audio.unlock();
      if (e.code === 'Escape' && !e.repeat) {
        if (game.phase === 'playing') game.pause(); else if (game.phase === 'paused') game.resume(); else if (game.phase === 'settings') game.phase = returnPhase; else if (['intro', 'help', 'shop', 'scores'].includes(game.phase)) game.phase = 'menu';
        renderScreen(); return;
      }
      if (game.phase === 'mutation' && /^Digit[123]$/.test(e.code) && !e.repeat) { game.choose(game.run.choices[Number(e.code.slice(-1)) - 1]); keys.clear(); accumulator = 0; last = 0; renderScreen(); return; }
      if (game.phase !== 'playing') return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      keys.add(e.code);
    });
    listen(window, 'keyup', e => keys.delete(e.code));
    const unfocus = () => { keys.clear(); accumulator = 0; last = 0; game.pause(); renderScreen(); };
    listen(window, 'blur', unfocus); listen(document, 'visibilitychange', () => { if (document.hidden) unfocus(); });
    listen(shell, 'pointerdown', e => { audio.unlock(); const target = e.target.closest('[data-key]'); if (!target || game.phase !== 'playing') return; e.preventDefault(); target.setPointerCapture(e.pointerId); keys.add(target.dataset.key); });
    const releasePointer = e => { const target = e.target.closest('[data-key]'); if (target) keys.delete(target.dataset.key); };
    listen(shell, 'pointerup', releasePointer); listen(shell, 'pointercancel', releasePointer); listen(shell, 'lostpointercapture', releasePointer);
    const load = Promise.all(Object.keys(catalog).map(path => new Promise((resolveLoad, reject) => {
      const image = new Image(); image.onload = () => { images[path] = image;
        if ((path.startsWith('assets/enemies/') || path.startsWith('assets/enemy_animations/'))) {
          const tint = document.createElement('canvas'); tint.width = image.width; tint.height = image.height;
          const tintCtx = tint.getContext('2d'); tintCtx.drawImage(image, 0, 0); tintCtx.globalCompositeOperation = 'source-in';
          tintCtx.fillStyle = '#fff1c9'; tintCtx.fillRect(0, 0, tint.width, tint.height); flashes[path] = tint;
        }
        resolveLoad(); }; image.onerror = () => reject(Error(path)); image.src = resolve(path);
    }))).then(() => { ready = true; renderScreen(true); return true; }).catch(e => { game.phase = 'error'; renderScreen(true); screen.querySelector('.load-error').textContent = e.message; return false; });
    const api = { game, audio, keys, ready: load, update, dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(animationId); cleanups.forEach(f => f()); audio.dispose(); shell.remove(); if (root.primalRun === api) delete root.primalRun; } };
    root.primalRun = api; renderScreen(true); if (!driven) animationId = requestAnimationFrame(frame);
    return api;
  }
  root.PrimalApp = { mount };
})(globalThis);
