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
    shell.innerHTML = `<style>${stylesheet}</style><header class="masthead"><a class="wordmark" href="#" data-action="home">PRIMAL<span>RUN</span></a><span class="edition">DINOSAURER · ROGUELITE</span><button class="quiet" data-action="pause" id="pause-button" hidden>Pause · Esc</button></header>
      <main class="arena"><canvas width="960" height="640" tabindex="0" aria-label="Spilområde. WASD eller piletaster flytter, Space bider, Shift springer, Escape pauser."></canvas>
      <div class="hud" hidden><div><small>LIV</small><div class="meter health"><i></i></div><b id="health-label"></b></div><div><small>STAMINA</small><div class="meter stamina"><i></i></div></div><div class="hunt-counter"><small id="biome-label"></small><b id="meat-label"></b></div></div>
      <div class="boss-hud" hidden><b></b><div class="meter"><i></i></div><small class="boss-tip"></small></div><div class="run-info" hidden><span id="level-label"></span><span id="dna-label"></span><span id="time-label"></span><span id="skill-label"></span></div>
      <div class="meat-progress" hidden><div><b>LEVEL-UP · KØD / XP</b><span></span></div><div class="meter"><i></i></div><small></small></div><div class="screen" aria-live="polite"></div><div class="toast" role="status"></div></main>
      <div class="touch-controls" hidden><div class="dpad"><button data-key="ArrowUp" aria-label="Op">↑</button><button data-key="ArrowLeft" aria-label="Venstre">←</button><button data-key="ArrowDown" aria-label="Ned">↓</button><button data-key="ArrowRight" aria-label="Højre">→</button></div><div><button data-key="Space">ANGREB</button><button data-key="ShiftLeft">EVNE</button><button data-key="KeyE">UNDERSØG</button></div></div>
      <footer><span><kbd>WASD</kbd> Bevæg · <kbd>SPACE</kbd> Angreb · <kbd>SHIFT</kbd> Evne · <kbd>E</kbd> Undersøg · <kbd>ESC</kbd> Pause</span><span class="save-status"></span></footer>`;
    host.appendChild(shell);
    const canvas = shell.querySelector('canvas'), ctx = canvas.getContext('2d');
    const screen = shell.querySelector('.screen'), images = {}, flashes = {}, keys = new Set(), cleanups = [], backgrounds = new Map();
    const audio = new root.PrimalAudio(resolve, game.save.settings);
    let ready = false, disposed = false, previousPhase = '', returnPhase = 'menu', last = 0, accumulator = 0, animationId = 0, toastUntil = 0;
    const catalog = root.PrimalAssets, previewMap = C.createMap(0);
    function listen(target, name, callback, options) { target.addEventListener(name, callback, options); cleanups.push(() => target.removeEventListener(name, callback, options)); }
    function toast(text) { shell.querySelector('.toast').textContent = text; toastUntil = performance.now() + 2600; }
    function imageTag(path, className = '') { return `<img class="${className}" src="${htmlEscape(resolve(path))}" alt="">`; }
    function button(action, text, className = '') { return `<button class="${className}" data-action="${action}">${text}</button>`; }
    function heading(kicker, title, text = '') { return `<small class="eyebrow">${kicker}</small><h1>${title}</h1>${text ? `<p class="intro">${text}</p>` : ''}`; }
    function renderScreen(force = false) {
      const phase = game.phase, r = game.run;
      if (phase === previousPhase && !force) return;
      previousPhase = phase; screen.dataset.phase = phase; keys.clear();
      const running = ['playing', 'paused', 'mutation', 'exploration', 'cleared'].includes(phase);
      shell.querySelector('.meat-progress').hidden = !running; shell.querySelector('.hud').hidden = !running; shell.querySelector('.run-info').hidden = !running;
      shell.querySelector('#pause-button').hidden = !['playing', 'paused'].includes(phase);
      shell.querySelector('.touch-controls').hidden = phase !== 'playing';
      screen.hidden = phase === 'playing'; screen.classList.toggle('wide', ['shop', 'scores', 'species'].includes(phase));
      if (phase === 'playing') { screen.innerHTML = ''; canvas.focus({ preventScroll: true }); return; }
      if (phase === 'menu') {
        screen.innerHTML = `<section class="panel menu-panel">${heading('JAGT · MUTÉR · OVERLEV', 'PRIMAL <em>RUN</em>', 'Start som Compy. Lås nye arter op. Fire tilfældige naturkort og ét liv.')}
          <label class="name-label">DIT NAVN<input id="player-name" maxlength="20" autocomplete="nickname" value="${htmlEscape(game.save.name)}"></label>
          <p class="selected-dino">${C.PLAYER_SPECIES[game.save.selectedSpecies].name} · ${C.PLAYER_SPECIES[game.save.selectedSpecies].skill}</p>
          ${button('start', ready ? 'START JAGTEN <span>→</span>' : 'INDLÆSER…', 'primary')}
          <div class="menu-grid">${button('species', 'Vælg dinosaur')}${button('shop', 'DNA-laboratorium <b>' + game.save.dna + '</b>')}${button('scores', 'Highscores')}${button('settings', 'Indstillinger')}${button('help', 'Sådan spiller du')}</div>
          <p class="fine">Kød giver levels. Bosser åbner næste biome. DNA beholdes, når du dør.</p></section>`;
        screen.querySelector('[data-action="start"]').disabled = !ready;
      } else if (phase === 'intro') {
        screen.innerHTML = `<section class="panel hunt-intro">${heading('KLAR PÅ 20 SEKUNDER', 'Sådan overlever du')}
          <dl class="control-guide"><div><dt><kbd>WASD</kbd> / <kbd>↑ ↓ ← →</kbd></dt><dd>Bevæg dig og vend mod dit bytte.</dd></div><div><dt><kbd>SPACE</kbd></dt><dd>Hold for at bide. Du rammer kun foran dig — gå tæt på!</dd></div><div><dt><kbd>SHIFT</kbd> + bevægelse</dt><dd>${C.PLAYER_SPECIES[game.save.selectedSpecies].text}</dd></div><div><dt><kbd>E</kbd></dt><dd>Undersøg fossiler og reder tæt på dig.</dd></div><div><dt><kbd>ESC</kbd></dt><dd>Pause og indstillinger.</dd></div></dl>
          <p class="hunt-goal"><strong>Udforsk kortet → saml kød → vælg mutationer.</strong><br>Du er markeret med ▼ DIG. Farlige dyr har deres artsnavn i rødt, og fredeligt bytte har grønt artsnavn. Kød findes som almindeligt, nærende, sjældent og episk — bedre kvalitet giver mere XP og tæller mere mod kødmålet. Nå kødmålet, besejr bossen, og fortsæt til næste biome. Undvig de røde angrebsvarsler.</p>
          <p class="hunt-goal"><strong>DNA beholdes, når du dør.</strong> Saml DNA fra byttet — bosser giver det altid. Køb permanente upgrades i DNA-laboratoriet før næste jagt.</p>
          <p class="fine">På mobil: brug pileknapperne, ANGREB, EVNE og UNDERSØG under spillet.</p>
          <div class="actions">${button('menu', '← Tilbage')}${button('begin', 'FORSTÅET — START JAGTEN →', 'primary')}</div></section>`;
      } else if (phase === 'species') {
        screen.innerHTML = `<section class="panel">${heading('PERMANENT ARTSARKIV', 'Vælg dinosaur', 'DNA-unlocks beholdes ved død. Valget gælder næste jagt. ' + game.save.dna + ' DNA i banken.')}<div class="upgrade-grid species-grid">${Object.entries(C.PLAYER_SPECIES).map(([id, d]) => {
          const unlocked = game.save.unlockedSpecies.includes(id), selected = game.save.selectedSpecies === id;
          const path = 'assets/player_full/' + id + '_idle_S_000.png';
          return `<article class="${selected ? 'selected-species' : ''}">${imageTag(path)}<h2>${d.name}</h2><p>${d.text}</p><small>${d.hp} LIV · ${d.damage} SKADE · ${d.speed} FART</small><button data-species="${id}" ${selected || !unlocked && game.save.dna < d.cost ? 'disabled' : ''}>${selected ? 'VALGT' : unlocked ? 'VÆLG' : 'LÅS OP · ' + d.cost + ' DNA'}</button></article>`;
        }).join('')}</div><p class="fine">Et fantasiunivers: arterne kommer fra forskellige perioder. Compy: sen Jura. Utahraptor: tidlig Kridt. De øvrige arter: sen Kridt. Deinosuchus er en krokodilleslægt.</p>${button('menu', '← Tilbage')}</section>`;
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
        screen.innerHTML = `<section class="panel">${heading('LÆR AT JAGE', 'Din første jagt')}<ol class="instructions"><li>Bevæg dig med WASD eller piletaster. Hold Space for at angribe. Ankylosaurus slår med halen omkring sig; andre arter bider foran sig.</li><li>Shift bruger din arts evne og stamina. Compy undviger, Utahraptor springer, Carnotaurus stormer og Ankylosaurus går i panserstilling.</li><li>Saml kødet fra dit bytte. Ved level-up vælger du én af tre mutationer.</li><li>Nå kødmålet for at lokke bossen frem. De røde varsler viser dens næste angreb. Angrib, når den hviler.</li><li>DNA har 5 / 15 / 30 % dropchance fra små / mellemstore / store dyr. Bosser giver altid DNA.</li><li>DNA beholdes ved død. Lås nye arter op under Vælg dinosaur, eller køb start-upgrades i laboratoriet. Tryk E ved fossiler og reder; elitevogtere er valgfrie.</li></ol><p class="fine">Fire bosser giver en sejr. Escape pauser. Spillet pauser også, når du skifter fane.</p>${button('menu', '← Klar til jagt', 'primary')}</section>`;
      } else if (phase === 'paused') {
        screen.innerHTML = `<section class="panel compact">${heading('TAG EN PAUSE', 'Jagten venter', 'Kort-seed: ' + r.seed)}${button('resume', 'FORTSÆT · Esc', 'primary')}<div class="actions">${button('settings', 'Indstillinger')}${button('abandon', 'Afslut run')}</div><p class="fine">Opsamlet DNA er allerede gemt. Afslut run registrerer din score.</p></section>`;
      } else if (phase === 'mutation') {
        screen.innerHTML = `<section class="panel">${heading('DINO-LEVEL ' + r.level, 'Vælg din mutation', 'SPILLET ER PAUSET — du er sikker, mens du vælger. Klik eller tryk 1, 2, 3. Efter valget er du beskyttet i ét sekund.')}<div class="mutation-grid">${r.choices.map((id, i) => {
          const m = C.MUTATIONS.find(m => m.id === id);
          const rarity = C.MUTATION_RARITIES[m.rarity];
          return `<button data-mutation="${id}" style="--rarity:${rarity.color}" class="rarity-card"><strong class="rarity-name">${rarity.name.toUpperCase()}</strong>${imageTag('assets/ui/' + m.icon + '.png')}<small>VALG ${i + 1} · RANG ${r.mutations[id]} → ${r.mutations[id] + 1} / ${m.max}</small><h2>${m.name}</h2><small>${m.species ? C.PLAYER_SPECIES[m.species].name.toUpperCase() : "FÆLLES MUTATION"}</small><p>${m.text}</p></button>`;
        }).join('')}</div></section>`;
      } else if (phase === 'exploration') {
        screen.innerHTML = `<section class="panel compact">${heading('VALGFRI RISIKO · SPILLET ER PAUSET', 'En bevogtet rede', 'Tag sjældent kød og væk den nærliggende elitevogter, eller lad reden være.')}<div class="actions"><button data-explore="leave">LAD DEN VÆRE</button><button class="primary" data-explore="take">TAG KØDET · +${8 + r.stage * 2}</button></div></section>`;
      } else if (phase === 'cleared') {
        const stage = C.STAGES[r.stage];
        screen.innerHTML = `<section class="panel compact">${heading('BOSS BESEJRET', stage.bossName + ' er faldet', '+' + stage.dna + ' DNA er gemt. Din dinosaur bliver stærkere.')}<div class="bank">${imageTag('assets/ui/dna.png')}<b>${game.save.dna} DNA</b></div>${button('next', r.stage === 3 ? 'AFSLUT JAGTEN →' : 'NÆSTE BIOME →', 'primary')}<p class="fine">${r.stage === 3 ? 'Alle fire biomer er erobret.' : 'Du beholder mutationerne og genvinder 30 % af dit maksimale liv.'}</p></section>`;
      } else if (phase === 'result') {
        const result = r.result;
        screen.innerHTML = `<section class="panel compact">${heading(result.victory ? 'DALENS NYE KONGE' : 'EVOLUTIONEN FORTSÆTTER', result.victory ? 'Jagten er vundet' : 'Jagten er slut', htmlEscape(result.name) + ' · Bane ' + result.stage + ' · ' + result.bosses + ' bosser')}${result.victory ? "" : "<img class=\"death-preview\" alt=\"Din dinosaur efter jagten\">"}<div class="result-stats"><div><small>SCORE</small><b>${result.score}</b></div><div><small>DNA I RUN</small><b>+${r.dna}</b></div><div><small>TID</small><b>${timeLabel(result.seconds)}</b></div></div>${button('start', 'NY JAGT →', 'primary')}<div class="actions">${button('shop', 'DNA-laboratorium')}${button('scores', 'Highscores')}${button('menu', 'Hovedmenu')}</div></section>`;
      } else if (phase === 'error') {
        screen.innerHTML = `<section class="panel">${heading('INDLÆSNING FEJLEDE', 'Assets mangler')}<p>Kontrollér, at assets-mappen følger med spillet. Genindlæs siden efter rettelsen.</p><p class="load-error"></p></section>`;
      }
      const focus = screen.querySelector(phase === 'intro' ? '[data-action="begin"]' : 'button:not(:disabled)'); if (focus) focus.focus({ preventScroll: true });
      shell.querySelector('.save-status').textContent = game.storageAvailable ? 'DNA og indstillinger gemmes lokalt' : 'Lagring utilgængelig · fremgang gemmes kun i denne session';
    }
    function sprite(path, x, y, alpha = 1, flash = false, rotation = 0) {
      const image = flash ? flashes[path] : images[path], meta = catalog[path]; if (!image || !meta) return;
      ctx.globalAlpha = alpha;
      if (rotation) { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(rotation); ctx.drawImage(image, -meta.origin[0], -meta.origin[1]); ctx.restore(); }
      else ctx.drawImage(image, Math.round(x) - meta.origin[0], Math.round(y) - meta.origin[1]);
      ctx.globalAlpha = 1;
    }
    function resize() {
      const box = shell.querySelector('.arena').getBoundingClientRect();
      const scale = Math.max(1, Math.ceil(Math.max(box.width / 1600, box.height / 1000)));
      const width = Math.max(1, Math.floor(box.width / scale)), height = Math.max(1, Math.floor(box.height / scale));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      if (game.run) game.setView(width, height);
    }
    const observer = new ResizeObserver(resize); observer.observe(shell.querySelector('.arena')); cleanups.push(() => observer.disconnect());
    function trace(points) {
      ctx.beginPath(); ctx.moveTo(Math.round(points[0].x), Math.round(points[0].y));
      for (let i = 1; i < points.length - 1; i++) ctx.quadraticCurveTo(Math.round(points[i].x), Math.round(points[i].y), Math.round((points[i].x + points[i + 1].x) / 2), Math.round((points[i].y + points[i + 1].y) / 2));
      const last = points[points.length - 1]; ctx.lineTo(Math.round(last.x), Math.round(last.y));
    }
    function blob(x, y, rx, ry, seed = 0) {
      const points = Array.from({ length: 16 }, (_, i) => {
        const angle = i * Math.PI / 8, variation = 1 + .13 * Math.sin(i * 2.7 + seed);
        return { x: Math.round((x + Math.cos(angle) * rx * variation) / 4) * 4, y: Math.round((y + Math.sin(angle) * ry * variation) / 4) * 4 };
      });
      ctx.beginPath(); ctx.moveTo(Math.round((points[15].x + points[0].x) / 2), Math.round((points[15].y + points[0].y) / 2));
      points.forEach((p, i) => { const next = points[(i + 1) % 16]; ctx.quadraticCurveTo(p.x, p.y, Math.round((p.x + next.x) / 2), Math.round((p.y + next.y) / 2)); }); ctx.closePath();
    }
    function texturedFill(tile, color, alpha = .18) {
      ctx.fillStyle = color; ctx.fill();
      if (!backgrounds.has(tile)) backgrounds.set(tile, ctx.createPattern(images['assets/tiles/' + tile + '.png'], 'repeat'));
      ctx.fillStyle = backgrounds.get(tile); ctx.globalAlpha = alpha; ctx.fill(); ctx.globalAlpha = 1;
    }
    function background(stage, map, view) {
      ctx.beginPath(); ctx.rect(view.x, view.y, canvas.width, canvas.height);
      texturedFill(C.STAGES[stage].tile, ['#28372a', '#d4a36c', '#626861', '#3b4144'][stage], .17);
      for (const region of map.regions) {
        if (Math.abs(region.x - view.x - canvas.width / 2) > canvas.width / 2 + region.radius || Math.abs(region.y - view.y - canvas.height / 2) > canvas.height / 2 + region.radius) continue;
        blob(region.x, region.y, region.radius, region.radius * .7, region.seed); ctx.save(); ctx.globalAlpha = .32; ctx.fillStyle = ['#3f5030', '#586d38', '#674333', '#54282d'][stage]; ctx.fill(); ctx.restore(); /* subtle natural ground patches */

      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (stage === 1) {
        trace(map.river); ctx.strokeStyle = '#edd0a0'; ctx.lineWidth = 156; ctx.stroke();
        ctx.strokeStyle = '#69a4a0'; ctx.lineWidth = 116; ctx.stroke(); ctx.strokeStyle = '#3c7180'; ctx.lineWidth = 64; ctx.stroke();
      }
      if (stage === 3) {
        trace(map.river); ctx.strokeStyle = '#54282d'; ctx.lineWidth = 42; ctx.stroke(); ctx.strokeStyle = '#c6663c'; ctx.lineWidth = 14; ctx.stroke(); ctx.strokeStyle = '#de954a'; ctx.lineWidth = 4; ctx.stroke();
      }
      ctx.fillStyle = '#151b1966'; ctx.fillRect(0, 0, map.width, 76); ctx.fillRect(0, map.height - 42, map.width, 42); ctx.fillRect(0, 0, 42, map.height); ctx.fillRect(map.width - 42, 0, 42, map.height);
    }
    function label(text, x, y, color) {
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#101713';
      ctx.strokeText(text, Math.round(x), Math.round(y)); ctx.fillStyle = color; ctx.fillText(text, Math.round(x), Math.round(y));
    }
    function minimap(r) {
      const width = Math.min(120, canvas.width * .25), height = width * r.map.height / r.map.width;
      const x = canvas.width - width - 12, y = canvas.height - height - 38;
      ctx.fillStyle = '#101713dc'; ctx.fillRect(x, y, width, height); ctx.strokeStyle = '#b6c0a9'; ctx.strokeRect(x, y, width, height);
      for (const site of r.map.sites) if (site.discovered && !site.claimed) { ctx.fillStyle = site.type === 'fossil' ? '#bb80d9' : '#e9b75a'; ctx.fillRect(Math.round(x+site.x/r.map.width*width)-1,Math.round(y+site.y/r.map.height*height)-1,3,3); }
      if (r.stage === 1 || r.stage === 3) { trace(r.map.river.map(p => ({ x: x + p.x / r.map.width * width, y: y + p.y / r.map.height * height }))); ctx.strokeStyle = r.stage === 1 ? '#69a4a0' : '#de954a'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.strokeStyle = '#69a4a0'; ctx.strokeRect(x + r.view.x / r.map.width * width, y + r.view.y / r.map.height * height, Math.min(width, r.view.width / r.map.width * width), Math.min(height, r.view.height / r.map.height * height));
      for (const e of r.enemies) if (e.boss || Math.hypot(e.x - r.player.x, e.y - r.player.y) < 550) {
        ctx.fillStyle = e.boss ? '#e9b75a' : e.damage ? '#ed7869' : '#8eaa60';
        ctx.fillRect(Math.round(x + e.x / r.map.width * width) - 2, Math.round(y + e.y / r.map.height * height) - 2, 4, 4);
      }
      ctx.fillStyle = '#69a4a0'; ctx.beginPath(); ctx.arc(Math.round(x + r.player.x / r.map.width * width), Math.round(y + r.player.y / r.map.height * height), 3, 0, Math.PI * 2); ctx.fill();
      label('DIG • / BOSS ◆', x + width / 2, y - 6, '#efdfb8');
    }
    function draw() {
      resize();
      if (!ready) { ctx.fillStyle = '#151b19'; ctx.fillRect(0, 0, canvas.width, canvas.height); return; }
      const r = game.run, stage = r ? r.stage : 0;
      ctx.imageSmoothingEnabled = false; ctx.save();
      if (r && r.shake > 0 && game.save.settings.shake) ctx.translate(Math.round(Math.sin(r.seconds * 110) * 3), Math.round(Math.cos(r.seconds * 90) * 3));
      const map = r ? r.map : previewMap, view = r ? r.view : { x: 0, y: 0 };
      ctx.translate(-view.x, -view.y);
      canvas.dataset.cameraX = view.x; canvas.dataset.cameraY = view.y;
      background(stage, map, view);
      if (r) {
        for (const p of r.decals) { ctx.fillStyle = '#913b32'; ctx.globalAlpha = Math.min(.6, p.life * .25); ctx.fillRect(Math.round(p.x) - 5, Math.round(p.y) - 3, 10, 6); ctx.fillRect(Math.round(p.x) + 6, Math.round(p.y) + 4, 3, 2); } ctx.globalAlpha = 1;
        for (const e of r.enemies) if (e.mode === 'windup') {
          ctx.strokeStyle = '#ed7869'; ctx.fillStyle = '#913b3277'; ctx.lineWidth = 3;
          ctx.beginPath();
          if (e.pattern === 1 && e.boss) {
            const angle = Math.atan2(e.facingY, e.facingX), cone = Math.acos(.35); ctx.moveTo(Math.round(e.x), Math.round(e.y)); ctx.arc(Math.round(e.x), Math.round(e.y), e.attackRadius, angle - cone, angle + cone); ctx.closePath();
          } else if (e.pattern >= 2 || e.kind === 'compy') ctx.arc(Math.round(e.x), Math.round(e.y), e.attackRadius, 0, Math.PI * 2);
          else if (e.boss) {
            const x = Math.round(e.x), y = Math.round(e.y), radius = e.radius + r.player.radius + 3, length = e.kind === 'carnotaurus' ? (e.bossPhase === 2 ? 370 : 320) * .58 : (e.kind === 'deinosuchus' ? (e.bossPhase === 2 ? 390 : 300) : 370) * .65;
            const endX = Math.round(x + e.chargeX * length), endY = Math.round(y + e.chargeY * length), angle = Math.atan2(e.chargeY, e.chargeX), nx = -e.chargeY * radius, ny = e.chargeX * radius;
            ctx.moveTo(x - nx, y - ny); ctx.lineTo(endX - nx, endY - ny); ctx.arc(endX, endY, radius, angle - Math.PI / 2, angle + Math.PI / 2); ctx.lineTo(x + nx, y + ny); ctx.arc(x, y, radius, angle + Math.PI / 2, angle + Math.PI * 1.5); ctx.closePath();
          } else {
            const x = Math.round(e.x), y = Math.round(e.y), nx = -e.chargeY * 28, ny = e.chargeX * 28, length = e.boss && e.kind === 'carnotaurus' && r.stage === 0 ? (e.bossPhase === 2 ? 215 : 186) : e.boss ? 200 : 130;
            ctx.moveTo(x + nx, y + ny); ctx.lineTo(x + e.chargeX * length + nx, y + e.chargeY * length + ny); ctx.lineTo(x + e.chargeX * length - nx, y + e.chargeY * length - ny); ctx.lineTo(x - nx, y - ny); ctx.closePath();
          }
          ctx.fill(); ctx.stroke();
          ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#151b19';
          const warning = e.attackName || (e.kind === 'compy' ? 'BID' : e.kind === 'ankylosaurus' ? 'HALESLAG' : 'STORMLØB');
          ctx.strokeText(warning, Math.round(e.x), Math.round(e.y) - 66); ctx.fillStyle = '#ed7869'; ctx.fillText(warning, Math.round(e.x), Math.round(e.y) - 66);
        }
        for (const p of r.pickups) {
          if (p.kind === 'meat') {
            const rarity = C.MEAT_RARITIES[p.rarity || 0];
            ctx.strokeStyle = rarity.color; ctx.lineWidth = 2 + (p.rarity || 0); ctx.beginPath(); ctx.ellipse(Math.round(p.x), Math.round(p.y), 18, 10, 0, 0, Math.PI * 2); ctx.stroke();
            label(rarity.symbol + ' ' + rarity.name + ' +' + p.value, p.x, p.y - 24, rarity.color);
          }
          sprite(p.kind === 'meat' ? 'assets/pickups/meat.png' : p.kind === 'dna' ? 'assets/pickups/dna_pickup.png' : 'assets/ui/health.png', p.x, p.y);
        }
      }
      const objects = map.rocks.map(p => ({ ...p, path: 'assets/environment/rock.png' }));
      objects.push(...map.decorations);
      if (r) for (const site of map.sites) if (!site.claimed && site.type !== 'rare') {
        objects.push({ ...site, path: 'assets/props/' + (site.type === 'fossil' ? 'skull' : 'nest_eggs') + '.png' });
        if (Math.hypot(site.x-r.player.x,site.y-r.player.y)<160) label((site.type === 'fossil' ? 'FOSSIL' : 'BEVOGTET REDE')+' · E',site.x,site.y-42,'#e9b75a');
      }
      if (r) {
        for (const e of r.enemies) {
          let state = 'idle';
          if (['charge', 'bite', 'slam'].includes(e.mode) || (e.mode === 'windup' && e.timer < e.windupDuration * .5)) state = 'action';
          else if (e.moving) state = (e.mode === 'flee' ? ['step_left', 'action', 'step_right', 'action'] : ['idle', 'step_left', 'idle', 'step_right'])[Math.min(3, Math.floor(e.walk * 8))];
          const candidate = 'assets/enemy_animations/' + e.kind + '_' + state + '_' + e.direction + '_000.png';
          const path = catalog[candidate] ? candidate : 'assets/enemies/' + e.kind + '_idle_S_000.png';
          objects.push({ ...e, enemy: e, path, rotation: catalog[candidate] ? 0 : { S: 0, W: Math.PI / 2, N: Math.PI, E: -Math.PI / 2 }[e.direction] });
        }
        const p = r.player, frame = String(Math.min(5, Math.floor(p.walk * 8))).padStart(3, '0');
        let playerPath = 'assets/player/utahraptor_' + (p.moving ? 'walk_' : 'idle_') + p.facing + '_' + (p.moving ? frame : '000') + '.png';
        if (r.attack) {
          const attackFrame = Math.min(C.BITE_ANIMATION.frames - 1, Math.floor(r.attack.elapsed / r.attack.duration * C.BITE_ANIMATION.frames));
          const attackPath = 'assets/player_combat/utahraptor_bite_' + r.attack.facing + '_' + String(attackFrame).padStart(3, '0') + '.png';
          if (catalog[attackPath]) playerPath = attackPath;
        }
        const animationState = r.deathTime >= 0 ? 'death' : r.hurt > 0 ? 'hurt' : r.attack ? 'attack' : p.moving ? (r.pounce > 0 ? 'run' : 'walk') : 'idle';
        const animationDirection = r.attack && animationState === 'attack' ? r.attack.facing : p.facing;
        const animationFrame = animationState === 'death' ? Math.min(5, Math.floor(r.deathTime * 8)) : animationState === 'hurt' ? Math.min(1, Math.floor((.25 - r.hurt) * 8)) : animationState === 'attack' ? Math.min(5, Math.floor(r.attack.elapsed / r.attack.duration * 6)) : animationState === 'idle' ? Math.floor(r.seconds * 4) % 4 : Math.floor(p.walk * (animationState === 'run' ? 12 : 8)) % 6;
        const fullPath = 'assets/player_full/' + r.species + '_' + animationState + '_' + animationDirection + '_' + String(animationFrame).padStart(3, '0') + '.png';
        if (catalog[fullPath]) playerPath = fullPath;
        else if (r.species !== 'utahraptor') {
          const state = r.attack ? 'action' : p.moving ? ['idle', 'step_left', 'idle', 'step_right'][Math.floor(p.walk * 8) % 4] : 'idle';
          playerPath = 'assets/enemy_animations/' + r.species + '_' + state + '_' + p.facing + '_000.png';
        }
        canvas.dataset.playerAnimation = animationState + ':' + animationFrame;
        const resultPreview = shell.querySelector('.death-preview'); if (resultPreview && catalog[fullPath]) resultPreview.src = resolve(fullPath);
        canvas.dataset.playerSpecies = r.species;
        canvas.dataset.playerSprite = playerPath;
        canvas.dataset.playerState = r.attack ? 'Bite_' + r.attack.facing : (p.moving ? 'Walk_' : 'Idle_') + p.facing;
        objects.push({ ...p, player: true, path: playerPath });
      } else objects.push({ x: 780, y: 390, path: 'assets/player/utahraptor_idle_S_000.png' });
      objects.sort((a, b) => a.y - b.y);
      for (const o of objects) {
        if (o.x < view.x - 160 || o.y < view.y - 160 || o.x > view.x + canvas.width + 160 || o.y > view.y + canvas.height + 160) continue;
        if (o.player || o.enemy) { ctx.strokeStyle = o.player ? '#69a4a0' : o.enemy.boss ? '#e9b75a' : o.enemy.damage ? '#ed7869' : '#8eaa60'; ctx.lineWidth = o.player ? 4 : 2; ctx.beginPath(); ctx.ellipse(Math.round(o.x), Math.round(o.y), o.player ? 24 : o.enemy.boss ? o.radius + 14 : o.radius + 6, 10, 0, 0, Math.PI * 2); ctx.stroke(); }
        if (o.enemy && o.enemy.boss) { ctx.strokeStyle = '#e9b75a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(Math.round(o.x), Math.round(o.y), 35, 17, 0, 0, Math.PI * 2); ctx.stroke(); }
        const alpha = o.foliage && r && Math.hypot(o.x - r.player.x, o.y - r.player.y) < 110 ? .25 : o.player && r.invulnerable > 0 && Math.floor(r.invulnerable * 20) % 2 ? .45 : 1;
        sprite(o.path, o.x, o.y, alpha, false, o.rotation);
        if (o.player && r.jonas) { ctx.fillStyle = '#e9b75a'; const x = Math.round(o.x), y = Math.round(o.y) - 46; ctx.fillRect(x - 9, y, 18, 5); ctx.fillRect(x - 9, y - 5, 4, 5); ctx.fillRect(x - 2, y - 7, 4, 7); ctx.fillRect(x + 5, y - 5, 4, 5); }
        if (o.enemy) label((o.enemy.mode === 'return' ? '↩ ' : o.enemy.boss ? '◆ ' : o.enemy.elite ? '★ ' : o.enemy.rare ? '✦ ' : '') + C.SPECIES_LABELS[o.enemy.kind], o.x, o.y - 53, o.enemy.damage ? '#ed7869' : '#8eaa60');
        if (o.enemy && o.enemy.boss) {
          if (o.enemy.mode === 'recover') {
            const e = o.enemy; ctx.strokeStyle = '#a2d4c1'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(Math.round(e.x - e.facingX * 24), Math.round(e.y - e.facingY * 24), 18, 0, Math.PI * 2); ctx.stroke(); label('ÅBEN FLANKE · +50 %', e.x, e.y - 82, '#a2d4c1');
          } else if (o.enemy.mode === 'enrage') label('RASERI · FASE 2', o.x, o.y - 82, '#de954a');
        }
        if (o.enemy && o.enemy.hit > 0) sprite(o.path, o.x, o.y, .7 * o.enemy.hit / .15, true, o.rotation);
        if (o.enemy && o.enemy.hp < o.enemy.maxHP && !o.enemy.boss) { ctx.fillStyle = '#151b19'; ctx.fillRect(Math.round(o.x) - 20, Math.round(o.y) - 40, 40, 4); ctx.fillStyle = '#c45f45'; ctx.fillRect(Math.round(o.x) - 20, Math.round(o.y) - 40, Math.round(40 * o.enemy.hp / o.enemy.maxHP), 4); }
      }
      if (r) {
        if (r.species === 'ankylosaurus' && r.pounce > 0) { ctx.strokeStyle='#a2d4c1'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(Math.round(r.player.x),Math.round(r.player.y),38,0,Math.PI*2); ctx.stroke(); }
        if (r.species === 'ankylosaurus' && r.bite > 0) { ctx.strokeStyle='#efdfb8'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(Math.round(r.player.x),Math.round(r.player.y),C.PLAYER_SPECIES.ankylosaurus.range+10*r.mutations.reach+12*r.mutations.sweep,0,Math.PI*2); ctx.stroke(); }
        ctx.fillStyle='#69a4a0'; ctx.strokeStyle='#101713'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(Math.round(r.player.x)-7,Math.round(r.player.y)-42); ctx.lineTo(Math.round(r.player.x)+7,Math.round(r.player.y)-42); ctx.lineTo(Math.round(r.player.x),Math.round(r.player.y)-31); ctx.closePath(); ctx.fill(); ctx.stroke();
        label(r.jonas ? 'DIG · JONAS' : 'DIG · ' + C.PLAYER_SPECIES[r.species].name, r.player.x, r.player.y - 48, '#69a4a0');
        if (r.bite > 0) {
          const [dx, dy] = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[r.biteFacing];
          sprite('assets/effects/bite_slash_001.png', r.player.x + dx * 36, r.player.y + dy * 36);
        }
        for (const p of r.particles) { ctx.fillStyle = p.kind === 'dust' ? '#ded392' : '#c6663c'; ctx.globalAlpha = Math.min(1, p.life / p.maxLife * 1.5); ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); } ctx.globalAlpha = 1;
        canvas.dataset.hitStop = r.hitStop > 0 ? 'true' : 'false'; canvas.dataset.particles = r.particles.length;
        ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
        for (const e of r.effects) {
          const x = Math.round(e.x), y = Math.round(e.y - 55 - (1 - e.life / .55) * 20);
          ctx.lineWidth = 3; ctx.strokeStyle = '#101713'; ctx.strokeText(e.text, x, y);
          ctx.fillStyle = e.color || '#ffe0a0'; ctx.fillText(e.text, x, y);
        }
      }
      ctx.restore();
      if (r) minimap(r);
      if (!r) return;
      shell.querySelector('.health i').style.width = Math.max(0, 100 * r.health / r.maxHealth) + '%';
      shell.querySelector('#health-label').textContent = Math.ceil(r.health) + '/' + Math.ceil(r.maxHealth);
      shell.querySelector('.stamina i').style.width = r.stamina + '%';
      shell.querySelector('#biome-label').textContent = 'BANE ' + (r.stage + 1) + ' · ' + C.STAGES[r.stage].name;
      shell.querySelector('#meat-label').textContent = r.bossSpawned ? 'BOSSEN ER HER' : r.meat + ' / ' + C.STAGES[r.stage].target + ' KØD';
      const progress = shell.querySelector('.meat-progress'), percent = Math.min(100, Math.floor(r.xp / r.nextXP * 100));
      progress.querySelector('span').textContent = percent + ' % · ' + r.xp + ' / ' + r.nextXP + ' stk';
      progress.querySelector('i').style.width = percent + '%';
      progress.querySelector('small').textContent = Math.max(0, r.nextXP - r.xp) + ' kødværdi til level ' + (r.level + 1);
      shell.querySelector('#level-label').textContent = 'LEVEL ' + r.level + ' · ' + r.xp + '/' + r.nextXP + ' XP';
      shell.querySelector('#dna-label').textContent = '+' + r.dna + ' DNA · ' + r.kills + ' JAGTER';
      shell.querySelector('#time-label').textContent = timeLabel(r.seconds);
      const boss = r.enemies.find(e => e.boss), bossHUD = shell.querySelector('.boss-hud');
      shell.querySelector('#skill-label').textContent = C.PLAYER_SPECIES[r.species].skill + ' · ' + (r.pounceCooldown > 0 ? r.pounceCooldown.toFixed(1) + ' s' : 'SHIFT KLAR');
      bossHUD.hidden = !boss || !['playing', 'paused', 'mutation'].includes(game.phase);
      if (boss) { bossHUD.querySelector('b').textContent = C.STAGES[r.stage].bossName + (' · FASE ' + boss.bossPhase) + ' · ' + Math.round(Math.hypot(boss.x - r.player.x, boss.y - r.player.y) / 32) + ' m · find ◆ på kortet'; bossHUD.dataset.bossPhase = boss.bossPhase; const tip = bossHUD.querySelector('.boss-tip'); tip.hidden = false; tip.textContent = boss.mode === 'recover' ? 'ÅBEN FLANKE · +50 % SKADE BAGFRA' : boss.mode === 'enrage' ? ['FASE 2 · DOBBELT STORMLØB OG TRAMP', 'FASE 2 · HURTIGT BAGHOLD OG STØRRE HALEBØLGE', 'FASE 2 · DOBBELT HORNSTORM', 'FASE 2 · DOBBELTBID OG BRØL'][r.stage] : boss.mode === 'windup' ? boss.attackName : 'UNDVIG SIDEVÆRT · BID, NÅR DEN HVILER'; bossHUD.querySelector('i').style.width = Math.max(0, boss.hp / boss.maxHP * 100) + '%'; }
    }
    function update(now) {
      if (disposed) return;
      const dt = last ? Math.min(.1, Math.max(0, (now - last) / 1000)) : 0; last = now;
      const phaseBefore = game.phase; accumulator += dt;
      if (game.phase === 'result' && game.run.deathTime >= 0) game.run.deathTime = Math.min(.75, game.run.deathTime + dt);
      if (ready && game.phase === 'playing') {
        while (accumulator >= 1 / 60 && game.phase === 'playing') {
          game.step(1 / 60, { x: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), y: (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0), attack: keys.has('Space'), interact: keys.has('KeyE'), pounce: keys.has('ShiftLeft') || keys.has('ShiftRight') });
          accumulator -= 1 / 60;
        }
      } else accumulator = 0;
      if (game.phase !== phaseBefore) accumulator = 0;
      for (const event of game.drainEvents()) { audio.play(event.type, event); if (event.type === 'boss') toast(game.run.stage === 0 ? 'SKOVENS JÆGER · Undvig sidelæns; bid bagfra, når den hviler!' : 'BOSSEN ER HER · Undvig de røde varsler!'); if (event.type === 'boss_enrage') toast(['FASE 2 · Dobbelt stormløb og tramp!', 'FASE 2 · Hurtigere baghold og stor halebølge!', 'FASE 2 · Dobbelt hornstorm!', 'FASE 2 · Dobbeltbid og brøl!'][game.run.stage]); if (event.type === 'jonas') toast('HEMMELIG JÆGER FUNDET · Jonas, kødens konge! ♛'); if (event.type === 'dna') toast('+' + event.amount + ' DNA · gemt'); }
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
      if (target.dataset.species) { const id = target.dataset.species; if (!game.save.unlockedSpecies.includes(id)) game.unlockSpecies(id); game.selectSpecies(id); renderScreen(true); return; }
      if (target.dataset.explore) { game.explore(target.dataset.explore === 'take'); keys.clear(); accumulator = 0; renderScreen(); return; }
      if (target.dataset.mutation) { game.choose(target.dataset.mutation); keys.clear(); accumulator = 0; last = 0; renderScreen(); return; }
      const action = target.dataset.action;
      if (action) e.preventDefault();
      if (action === 'start' && ready) { const name = shell.querySelector('#player-name'); if (name) game.setName(name.value); game.phase = 'intro'; }
      else if (action === 'begin' && ready && game.phase === 'intro') game.start();
      else if (['shop', 'scores', 'help', 'species'].includes(action)) { if (game.phase === 'menu') { const name = shell.querySelector('#player-name'); if (name) game.setName(name.value); } game.phase = action; }
      else if (action === 'settings') { returnPhase = game.phase === 'paused' ? 'paused' : 'menu'; const name = shell.querySelector('#player-name'); if (name) game.setName(name.value); game.phase = 'settings'; }
      else if (action === 'back') game.phase = returnPhase;
      else if (action === 'menu') game.phase = 'menu';
      else if (action === 'home') { if (game.phase === 'playing') game.pause(); else if (!['paused', 'mutation', 'exploration', 'cleared'].includes(game.phase) && !(game.phase === 'settings' && returnPhase === 'paused')) game.phase = 'menu'; }
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
        if (game.phase === 'playing') game.pause(); else if (game.phase === 'paused') game.resume(); else if (game.phase === 'settings') game.phase = returnPhase; else if (['intro', 'help', 'shop', 'scores', 'species'].includes(game.phase)) game.phase = 'menu';
        renderScreen(); return;
      }
      if (game.phase === 'mutation' && /^Digit[123]$/.test(e.code) && !e.repeat) { game.choose(game.run.choices[Number(e.code.slice(-1)) - 1]); keys.clear(); accumulator = 0; last = 0; renderScreen(); return; }
      if (game.phase !== 'playing') return;
      if (e.code === 'KeyE' && !e.repeat) { e.preventDefault(); game.interact(); accumulator = 0; renderScreen(); return; }
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
