(function (root) {
  'use strict';
  const C = root.PrimalCore;
  const htmlEscape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const timeLabel = seconds => Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
  function mount({ host = document.body, resolve = path => path, stylesheet = '', driven = false } = {}) {
    if (root.primalRun) root.primalRun.dispose();
    let storage = null; try { storage = window.localStorage; } catch (_) { /* In-memory play still works. */ }
    const game = new C.Game({ storage });
    const I18N=root.PrimalI18n||{t:x=>x,translateNode(){},setLanguage(){},lang:'da',LANGUAGES:[{id:'da',name:'Dansk'}]};I18N.setLanguage(game.save.settings.language||'da');const tr=text=>I18N.t(text);const listSep=()=>({ja:'、',zh:'、',yue:'、',ar:'، ',ur:'، '})[I18N.lang]||', '; // field-guide lists: each item is translated on its own
    const keyLabel=action=>game.save.bindings[action].replace('Key','').replace(/Shift(Left|Right)/,'SHIFT').replace('Space','SPACE');
    const shell = document.createElement('div'); shell.className = 'primal-shell';
    shell.innerHTML = `<style>${stylesheet}</style><header class="masthead"><a class="wordmark" href="#" data-action="home">PRIMAL<span>RUN</span></a><span class="edition">DINOSAURER · ROGUELITE</span><button class="quiet" data-action="pause" id="pause-button" hidden>Pause · Esc</button></header>
      <main class="arena"><canvas width="960" height="640" tabindex="0" aria-label="Spilområde. WASD eller piletaster flytter, Space angriber, Shift bruger evne, F spiser, Escape pauser."></canvas>
      <div class="hud" hidden><div class="hud-card"><canvas class="hud-portrait" width="64" height="64" aria-hidden="true"></canvas><div class="hud-bars"><div class="meter health" title="Liv"><i></i><span class="segments"></span><b id="health-label"></b></div><div class="meter stamina" title="Stamina"><i></i><em class="cost-mark"></em></div><div class="hud-chips"><span id="food-chip"></span><span id="dna-chip"></span><span id="zone-chip"></span></div></div></div><div class="hunt-counter"><small id="biome-label"></small><b id="meat-label"></b></div></div>
      <div class="boss-hud" hidden><b></b><div class="meter"><i></i></div><small class="boss-tip"></small></div><div class="run-info" hidden><span id="level-label"></span><span id="dna-label"></span><span id="time-label"></span><span id="skill-label"></span><span id="terrain-label"></span><div class="action-cooldowns"><div><b id="attack-ready"></b><div class="meter"><i id="attack-fill"></i></div></div><div><b id="ability-ready"></b><div class="meter"><i id="ability-fill"></i></div></div></div></div>
      <div class="meat-progress" hidden><div><b>LEVEL-UP · FØDE / XP</b><span></span></div><div class="meter"><i></i></div><small></small></div><div class="screen" aria-live="polite"></div><div class="toast" role="status"></div></main>
      <div class="touch-controls" hidden><div class="joystick" role="group" aria-label="Flytbar joystick"><i></i></div><div class="dpad"><button data-key="ArrowUp" aria-label="Op">↑</button><button data-key="ArrowLeft" aria-label="Venstre">←</button><button data-key="ArrowDown" aria-label="Ned">↓</button><button data-key="ArrowRight" aria-label="Højre">→</button></div><div><button data-key="Space">ANGREB</button><button data-key="ShiftLeft">EVNE</button><button data-key="KeyE">UNDERSØG</button><button data-key="KeyF">SPIS</button></div></div>
      <footer><span><kbd>${['up','left','down','right'].map(keyLabel).join('')}</kbd> Bevæg · <kbd>${keyLabel('attack')}</kbd> Angreb · <kbd>${keyLabel('ability')}</kbd> Evne · <kbd>${keyLabel('sneak')}</kbd> Snig / skjul · <kbd>${keyLabel('eat')}</kbd> Hold for at spise · <kbd>${keyLabel('interact')}</kbd> Undersøg · <kbd>ESC</kbd> Pause</span><span class="save-status"></span></footer>`;
    host.appendChild(shell); I18N.translateNode(shell);
    const canvas = shell.querySelector('canvas'), ctx = canvas.getContext('2d');
    const screen = shell.querySelector('.screen'), images = {}, flashes = {}, skins = {}, displayURLs = {}, decomposition = {}, keys = new Set(), cleanups = [], backgrounds = new Map();
    const audio = new root.PrimalAudio(resolve, game.save.settings);
    let ready = false, disposed = false, previousPhase = '', returnPhase = 'menu', last = 0, accumulator = 0, animationId = 0, toastUntil = 0;
    const catalog = root.PrimalAssets, previewMap = C.createMap(0);
    let bindingAction=null,seedInput='',joystick={x:0,y:0},joyPointer=null,joyOrigin={x:0,y:0},padPrevious=[];
    let menuClock=0;const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const menuScene=()=>['menu','species','shop','scores','help','guide','achievements','daily','challenges'].includes(game.phase) || game.phase==='settings' && returnPhase==='menu';
    function listen(target, name, callback, options) { target.addEventListener(name, callback, options); cleanups.push(() => target.removeEventListener(name, callback, options)); }
    function toast(text) { shell.querySelector('.toast').textContent = tr(text); toastUntil = performance.now() + 2600; }
    function displayImageURL(path) { prepareImage(path); return skins[path] ? (displayURLs[path] || (displayURLs[path] = skins[path].toDataURL())) : resolve(path); }
    // Sprite frames have lots of empty margin; thumbnails crop to the visible pixels.
    function croppedURL(path){
      const key=path+'#crop';if(displayURLs[key])return displayURLs[key];prepareImage(path);const im=skins[path]||images[path];if(!im)return null;
      const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const cc=c.getContext('2d');cc.drawImage(im,0,0);if(images[path]&&skins[path]){cc.clearRect(0,0,c.width,c.height);cc.drawImage(images[path],0,0);cc.drawImage(skins[path],0,0);}
      const d=cc.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>8){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}
      if(x1<x0)return null;const pad=3,w=x1-x0+1+pad*2,h=y1-y0+1+pad*2,side=Math.max(w,h),o=document.createElement('canvas');o.width=o.height=side;o.getContext('2d').drawImage(c,x0-pad,y0-pad,w,h,Math.round((side-w)/2),Math.round((side-h)/2),w,h);
      return displayURLs[key]=o.toDataURL();
    }
    function imageTag(path, className = '', crop = false) {
      if (!images[path] && catalog[path]) loadImage(path).then(() => {
        for (const image of shell.querySelectorAll('img[data-sprite-path]')) if (image.dataset.spritePath === path) image.src = image.dataset.crop ? (croppedURL(path) || displayImageURL(path)) : displayImageURL(path);
      }).catch(() => { if (!disposed) toast('Et billede kunne ikke indlæses. Genindlæs spillet.'); });
      return `<img class="${className}" data-sprite-path="${htmlEscape(path)}"${crop ? ' data-crop="1"' : ''} src="${htmlEscape(crop ? (croppedURL(path) || displayImageURL(path)) : displayImageURL(path))}" alt="">`;
    }
    function button(action, text, className = '') { return `<button class="${className}" data-action="${action}">${text}</button>`; }
    function heading(kicker, title, text = '') { return `<small class="eyebrow">${kicker}</small><h1>${title}</h1>${text ? `<p class="intro">${text}</p>` : ''}`; }
    function renderScreen(force = false) {
      screen.dir = I18N.rtl ? 'rtl' : 'ltr'; if (root.document) root.document.documentElement.lang = I18N.lang || 'da'; // RTL menus for Arabic/Urdu
      const phase = game.phase, r = game.run;
      if (phase === previousPhase && !force) return;
      const codes=[['up','left','down','right'].map(keyLabel).join(''),keyLabel('attack'),keyLabel('ability'),keyLabel('sneak'),keyLabel('eat'),keyLabel('interact'),'ESC'];shell.querySelectorAll('footer kbd').forEach((el,i)=>el.textContent=codes[i]);
      previousPhase = phase; screen.dataset.phase = phase; keys.clear();
      const running = ['build','playing', 'paused', 'mutation', 'exploration', 'cleared'].includes(phase);
      shell.querySelector('.meat-progress').hidden = !running; shell.querySelector('.hud').hidden = !running; shell.querySelector('.run-info').hidden = !running;
      shell.querySelector('#pause-button').hidden = !['playing', 'paused'].includes(phase);
      shell.querySelector('.touch-controls').hidden = phase !== 'playing';
      screen.classList.toggle('menu-screen',phase==='menu');shell.classList.toggle('cinematic-menu',phase==='menu');
      screen.hidden = phase === 'playing'; screen.classList.toggle('wide', ['shop', 'scores', 'species'].includes(phase));
      if (phase === 'playing') { screen.innerHTML = ''; canvas.focus({ preventScroll: true }); return; }
      if (phase === 'menu'&&!game.save.settings.languageChosen) {screen.innerHTML=`<section class="panel compact"><h2 translate="no">Sprog / Language</h2><div class="menu-grid">${I18N.LANGUAGES.filter(l=>!l.fun).map(l=>`<button data-first-language="${l.id}" translate="no" lang="${l.id}">${l.name}</button>`).join('')}</div></section>`;
      } else if (phase === 'menu') {
        const chosen = C.PLAYER_SPECIES[game.save.selectedSpecies], done = C.ACHIEVEMENTS.filter(a => game.save.achievements[a.id]).length;
        screen.innerHTML = `<section class="panel menu-panel"><small class="eyebrow">JAGT · MUTÉR · OVERLEV</small><h1>PRIMAL <em>RUN</em></h1>
          <div class="chosen-dino">${imageTag(C.playerFrame(game.save.selectedSpecies, 'idle', 'S', 0), 'thumb', true)}<div><b>${chosen.name}</b><small>${chosen.skill}</small></div>${button('species', 'Skift art')}</div>
          ${button('start', ready ? 'START JAGTEN <span>→</span>' : 'INDLÆSER…', 'primary')}
          <div class="menu-grid">${button('shop', '⬡ DNA-lab <b>' + game.save.dna + '</b>')}${button('achievements', '★ Bedrifter <b>' + done + '/' + C.ACHIEVEMENTS.length + '</b>')}${button('guide', '❧ Artsbog')}${button('scores', '♛ Rekorder')}${C.FEATURES.dailyHunt ? button('daily', '☀ Dagens jagt <b>' + speciesName(game.dailyHunt().species) + '</b>') : ''}${C.FEATURES.challenges ? button('challenges', '⚔ Udfordringer') : ''}${button('settings', '⚙ Indstillinger')}${button('help', '? Sådan spiller du')}</div>
          <div class="menu-fields"><label class="name-label">DIT NAVN<input id="player-name" maxlength="20" autocomplete="nickname" value="${htmlEscape(game.save.name)}"></label><label class="name-label">KORT-SEED<input id="map-seed" inputmode="numeric" maxlength="10" placeholder="tilfældigt" value="${htmlEscape(seedInput)}"></label></div>
          <a class="patch-link" href="PATCH_NOTES.html?lang=${I18N.lang}" target="_blank" rel="noopener">✦ Nyt i oktober-opdateringen →</a>
          </section>`;
        screen.querySelector('[data-action="start"]').disabled = !ready;
      } else if (phase === 'intro') {
        const sp = game.save.selectedSpecies, diet = C.PLAYER_SPECIES[sp].diet, foodText = diet === 'herbivore' ? 'Hold ' + keyLabel('eat') + ' ved planter med en lysende ring' : diet === 'omnivore' ? 'Hold ' + keyLabel('eat') + ' ved planter eller lig' : sp === 'baryonyx' ? 'Hold ' + keyLabel('eat') + ' ved fisk eller lig' : 'Nedlæg dyr og hold ' + keyLabel('eat') + ' ved liget';
        screen.innerHTML = `<section class="panel hunt-intro">${heading(Number(seedInput)===C.SECRET_SEED?'HEMMELIGT SEED FUNDET':'KLAR PÅ 10 SEKUNDER', Number(seedInput)===C.SECRET_SEED?'Compy-tyvenes banket':'Sådan overlever du')}${Number(seedInput)===C.SECRET_SEED?'<p>Én hemmelig bane med ekstra kødtyve.</p>':''}
          <div class="intro-cards">
            <article>${imageTag(C.playerFrame(sp, 'attack', 'E', 3), 'thumb', true)}<b>Bevæg og angrib</b><p><kbd>${['up','left','down','right'].map(keyLabel).join('')}</kbd> bevæg · <kbd>${keyLabel('attack')}</kbd> angrib · <kbd>${keyLabel('ability')}</kbd> ${C.PLAYER_SPECIES[sp].skill}</p></article>
            <article>${imageTag(diet === 'herbivore' ? 'assets/ecology/herb.png' : 'assets/pickups/meat.png', 'thumb', true)}<b>Spis din føde</b><p>${foodText}. Føde giver mutationer og kalder bossen.</p></article>
            <article><span class="intro-warning" aria-hidden="true">▼</span><b>Undvig de røde varsler</b><p>Feltet fyldes op, før angrebet rammer. Gå ud af det i tide.</p></article>
          </div>
          ${(game.pendingChallenges || []).length ? `<div class="intro-challenges"><b>Udfordringer</b> · <b>+${Math.round(100 * C.CHALLENGE_DNA * game.pendingChallenges.length)} % DNA</b><ul>${game.pendingChallenges.map(id => C.CHALLENGES.find(c => c.id === id)).map(c => `<li><b>${c.name}</b> · ${c.text}</li>`).join('')}</ul></div>` : ''}
          <p class="fine">DNA beholdes, når du dør. Mere hjælp under "Sådan spiller du".</p>
          <label class="check skip-intro"><input type="checkbox" id="skip-intro" ${game.save.settings.skipIntro ? 'checked' : ''}> Spring introen over næste gang</label>
          <div class="actions">${button('menu', '← Tilbage')}${button('begin', 'START JAGTEN →', 'primary')}</div></section>`;
      } else if (phase === 'species') {
        screen.innerHTML = `<section class="panel">${heading('PERMANENT ARTSARKIV', 'Vælg dinosaur', 'DNA-unlocks beholdes ved død. Valget gælder næste jagt. ' + game.save.dna + ' DNA i banken.')}<div class="upgrade-grid species-grid">${Object.entries(C.PLAYER_SPECIES).sort(([a],[b])=>a==='deinonychus'?-1:b==='deinonychus'?1:0).map(([id, d]) => {
          const unlocked = game.save.unlockedSpecies.includes(id), selected = game.save.selectedSpecies === id;
          const path = C.playerFrame(id,'idle','S',0);
          const lock = C.SPECIES_UNLOCKS[id], achievement = lock.achievement && C.ACHIEVEMENTS.find(a => a.id === lock.achievement);
          const buttonText = selected ? 'VALGT' : unlocked ? 'VÆLG' : achievement ? '🔒 ' + achievement.name.toUpperCase() : 'LÅS OP · ' + d.cost + ' DNA';
          return `<article class="${selected ? 'selected-species' : ''}${unlocked ? '' : ' locked-species'}">${imageTag(path)}<h2>${d.name}</h2><p>${d.text}</p><small>${d.hp} LIV · ${d.damage} SKADE · ${d.speed} FART</small>${!unlocked && achievement ? `<p class="unlock-hint">${achievement.text}</p>` : ''}<button data-species="${id}" ${selected || !unlocked && (achievement || game.save.dna < d.cost) ? 'disabled' : ''}>${buttonText}</button></article>`;
        }).join('')}</div><div class="skin-picker"><h2>Farvedragt</h2><div>${Object.entries(C.SKINS).map(([id, skin]) => { const owned = game.save.skins.includes(id), req = skin.achievement && C.ACHIEVEMENTS.find(a => a.id === skin.achievement); return `<button data-skin="${id}" class="${game.save.skin === id ? 'selected' : ''}" ${owned ? '' : 'disabled'} title="${owned ? skin.name : 'Låses op af: ' + (req ? req.name : '')}">${owned ? '' : '🔒 '}${skin.name}${skin.species ? ' <small>' + (owned ? 'kun ' + speciesName(skin.species) : req.text) + '</small>' : ''}</button>`; }).join('')}</div>${C.FEATURES.fishKing && !game.save.skins.includes('fishKing') ? `<p class="fine fish-king-progress">${I18N.tf('Fiskekonge: {0}/{1} fisk som Baryonyx', Math.min(C.FISH_KING, game.save.baryonyxFish || 0), C.FISH_KING)}</p>` : ''}</div><p class="fine">Et fantasiunivers: arterne kommer fra forskellige perioder. Compy: sen Jura. Utahraptor: tidlig Kridt. Baryonyx: tidlig Kridt. De øvrige arter: sen Kridt. Deinosuchus er en krokodilleslægt.</p>${button('menu', '← Tilbage')}</section>`;
      } else if (phase === 'achievements') {
        const done = C.ACHIEVEMENTS.filter(a => game.save.achievements[a.id]).length, life = game.save.lifetime;
        screen.innerHTML = `<section class="panel">${heading('BEDRIFTER', 'Achievements', done + ' af ' + C.ACHIEVEMENTS.length + ' opnået')}<div class="achievement-grid">${C.ACHIEVEMENTS.map(a => { const got = !!game.save.achievements[a.id], reward = a.species ? I18N.tf('Låser {0} op', C.PLAYER_SPECIES[a.species].name) : a.skin ? 'Farvedragt: ' + tr(C.SKINS[a.skin].name) : '+' + a.dna + ' DNA'; return `<article class="achievement ${got ? 'done' : ''}"><b>${got ? '★' : '☆'} ${a.name}</b><p>${a.text}</p><small>${reward}</small></article>`; }).join('')}</div><div class="lifetime"><span>Runs <b>${life.runs}</b></span><span>Drab <b>${life.kills}</b></span><span>Bosser <b>${life.bosses}</b></span><span>Rivaler <b>${life.rivals}</b></span><span>Områder <b>${life.zones}</b></span><span>Løbet <b>${C.formatDistance(life.distance,I18N.lang)}</b></span></div>${button('menu', '← Tilbage')}</section>`;
      } else if (phase === 'guide') {
        screen.innerHTML=`<section class="panel">${heading('DALENS ARTSBOG','Observerede dinosaurer','Nye arter og angreb registreres, når du ser dem tæt på. Gemmes mellem runs.')}<div class="upgrade-grid">${Object.keys(C.SPECIES).map(id=>{const entry=game.save.fieldGuide[id];return `<article><h2>${entry?C.SPECIES_LABELS[id]:'Ukendt art'}</h2>${entry?`${C.FEATURES.guideModels?`<canvas class="guide-model" data-kind="${id}" width="240" height="120" aria-hidden="true"></canvas>`:''}<p>Observeret i: ${entry.biomes.map(i=>tr(C.STAGES[i].name)).join(listSep())}</p><p>Føde: ${['parasaurolophus','ankylosaurus','triceratops','pachycephalosaurus'].includes(id)?'Planter':id==='gallimimus'?'Planter og smådyr':id==='baryonyx'?'Fisk og kød':'Kød'}</p><p>Observerede angreb: ${entry.attacks.map(a=>tr(({bite:'Bid',charge:'Stormløb',slam:'Slag/tramp',roar:'Brøl'})[a])).join(listSep())||'Ingen endnu'}</p>`:'<p>Udforsk dalen for at lære arten at kende.</p>'}</article>`;}).join('')}</div>${button('menu','← Tilbage')}</section>`;
      } else if (phase === 'shop') {
        screen.innerHTML = `<section class="panel">${heading('PERMANENT EVOLUTION', 'DNA-laboratoriet', 'Permanente forbedringer til alle arter.')}<div class="bank">${imageTag('assets/ui/dna.png')}<b>${game.save.dna} DNA</b></div><div class="lab-summary"><h2>${C.PLAYER_SPECIES[game.save.selectedSpecies].name}</h2><p>${C.PLAYER_SPECIES[game.save.selectedSpecies].text}</p><p>Startliv: ${Math.round(C.PLAYER_SPECIES[game.save.selectedSpecies].hp*(1+.02*game.save.upgrades.health))} · Angreb: ${(C.PLAYER_SPECIES[game.save.selectedSpecies].damage*(1+.02*game.save.upgrades.damage)).toFixed(1)} · Evne: ${C.PLAYER_SPECIES[game.save.selectedSpecies].abilityCost} stamina</p>${button('species','Artsarkiv · '+game.save.unlockedSpecies.length+' / '+Object.keys(C.PLAYER_SPECIES).length+' arter')}</div><div class="upgrade-grid">${C.UPGRADES.map(u => {
          const rank = game.save.upgrades[u.id], cost = C.upgradeCost(rank);
          return `<article><h2>${u.name}</h2><p>${u.text}</p><p>Rang ${rank} → ${Math.min(u.max,rank+1)} / ${u.max} · ${rank>=u.max?'Maksimum':game.save.dna>=cost?'Klar til udvikling':'Mangler '+(cost-game.save.dna)+' DNA'}</p><div class="ranks">${'●'.repeat(rank)}${'○'.repeat(u.max - rank)}</div><button data-buy="${u.id}" ${rank >= u.max || game.save.dna < cost ? 'disabled' : ''}>${rank >= u.max ? 'Fuldt udviklet' : cost + ' DNA · Køb rang ' + (rank + 1)}</button></article>`;
        }).join('')}</div>${button('menu', '← Tilbage')}</section>`;
      } else if (phase === 'settings') {
        screen.innerHTML = `<section class="panel">${heading('FIND DIN BALANCE', 'Indstillinger')}<div class="settings"><label>Sprog / Language<select id="language-select" data-language aria-label="Sprog / Language">${I18N.LANGUAGES.map(l=>`<option value="${l.id}" ${l.id===(game.save.settings.language||'da')?'selected':''} translate="no">${l.name}${l.fun ? ' (' + I18N.t('for sjov') + ')' : ''}</option>`).join('')}</select></label>${[['master', 'Samlet lyd'], ['music', 'Musik'], ['sfx', 'Lydeffekter'], ['ambient', 'Naturlyde']].map(([id, label]) => `<label>${label}<output id="volume-${id}">${Math.round(game.save.settings[id] * 100)} %</output><input aria-label="${label}" data-setting="${id}" type="range" min="0" max="100" value="${Math.round(game.save.settings[id] * 100)}"></label>`).join('')}<label class="check"><input data-setting="shake" type="checkbox" ${game.save.settings.shake ? 'checked' : ''}> Kamerarystelse</label>${['autoAttack','reducedMotion'].map(id=>`<label class="check"><input data-setting="${id}" type="checkbox" ${game.save.settings[id]?'checked':''}>${id==='autoAttack'?'Automatisk angreb':'Reduceret bevægelse'}</label>`).join('')}${['hudScale','textScale'].map(id=>`<label>${id==='hudScale'?'HUD-størrelse':'Tekststørrelse'}<input data-setting="${id}" type="range" min="85" max="140" value="${game.save.settings[id]*100}"></label>`).join('')}<div class="bindings">${Object.entries(game.save.bindings).map(([action,code])=>`<button data-binding="${action}">${({up:'Op',down:'Ned',left:'Venstre',right:'Højre',attack:'Angreb',ability:'Evne',sneak:'Snig',eat:'Spis',interact:'Undersøg'})[action]}: ${code.replace('Key','')}</button>`).join('')}</div><p>Gamepad: venstre pind bevæger · A angriber · B evne · X spiser · Y undersøger · RB sniger · Start pauser.</p></div><div class="actions">${button('mute', 'Slå al lyd fra')}${button('fullscreen', 'Fuldskærm')}${button('back', '← Tilbage', 'primary')}</div><p class="fine">Lyd starter efter et klik. Musikken er et originalt, proceduralt jagttema.</p></section>`;
      } else if (phase === 'challenges') { // B6 Udfordringer
        const chosen = game.pendingChallenges || [], bonus = Math.round(100 * C.CHALLENGE_DNA * chosen.length);
        screen.innerHTML = `<section class="panel compact challenge-panel">${heading('UDFORDRINGER', 'Gør jagten sværere', I18N.tf('Vælg op til {0}. Hver udfordring giver +{1} % DNA, når du har besejret mindst én boss.', C.MAX_CHALLENGES, Math.round(100 * C.CHALLENGE_DNA)))}
          <div class="challenge-list">${C.CHALLENGES.map(c => `<label class="check challenge"><input type="checkbox" data-challenge="${c.id}" ${chosen.includes(c.id) ? 'checked' : ''} ${!chosen.includes(c.id) && chosen.length >= C.MAX_CHALLENGES ? 'disabled' : ''}><span><b>${c.name}</b><small>${c.text}</small></span></label>`).join('')}</div>
          <p class="challenge-bonus">${I18N.tf('DNA-bonus: +{0} %', bonus)}</p>
          ${button('challenge-start', chosen.length ? 'START MED UDFORDRINGER <span>→</span>' : 'VÆLG MINDST ÉN', 'primary')}<div class="actions">${button('menu', 'Hovedmenu')}</div></section>`;
        screen.querySelector('[data-action="challenge-start"]').disabled = !ready || !chosen.length;
        for (const box of screen.querySelectorAll('[data-challenge]')) box.addEventListener('change', () => { const ids = [...screen.querySelectorAll('[data-challenge]:checked')].map(b => b.dataset.challenge); game.setChallenges(ids); renderScreen(true); });
      } else if (phase === 'daily') { // B7 Dagens jagt
        const d = game.dailyHunt(), key = d.key, date = key.slice(6, 8) + '.' + key.slice(4, 6) + '.' + key.slice(0, 4);
        const rows = d.entries.map((e, i) => `<tr><td>${i + 1}</td><td>${htmlEscape(e.name)}</td><td>${speciesName(e.species)}</td><td>${e.level}</td><td>${e.score}</td></tr>`).join('');
        screen.innerHTML = `<section class="panel compact daily-panel">${heading('DAGENS JAGT · ' + date, 'Samme kort for alle i dag', 'Seed ' + d.seed + ' · arten skifter hver dag blandt dine ulåste arter.')}
          <div class="chosen-dino">${imageTag(C.playerFrame(d.species, 'idle', 'S', 0), 'thumb', true)}<div><b>${speciesName(d.species)}</b><small>${C.PLAYER_SPECIES[d.species].skill}</small></div></div>
          ${rows ? `<table class="daily-list"><thead><tr><th>#</th><th>Navn</th><th>Art</th><th>Bane</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="fine">Ingen forsøg i dag endnu. Dine 5 bedste forsøg gemmes lokalt i denne browser.</p>'}
          ${button('daily-start', 'START DAGENS JAGT <span>→</span>', 'primary')}<div class="actions">${button('menu', 'Hovedmenu')}</div></section>`;
      } else if (phase === 'scores') {
        screen.innerHTML = `<section class="panel">${heading('LOKALE REKORDER', 'Rekorder', 'Hall of Fame og Hall of Shame i denne browser. Ingen globale ranglister.')}${recordsHTML()}${recordsTab==='top'?`<div class="table-scroll"><table><thead><tr><th>#</th><th>Jæger</th><th>Score</th><th>Bane</th><th>Bosser</th><th>Tid</th></tr></thead><tbody>${game.save.scores.map((s, i) => `<tr><td>${i + 1}</td><td>${htmlEscape(s.name)}${s.victory ? ' ♛' : ''}</td><td>${s.score}</td><td>${s.stage}</td><td>${s.bosses}</td><td>${timeLabel(s.seconds)}</td></tr>`).join('') || '<tr><td colspan="6">Din første jagt venter.</td></tr>'}</tbody></table></div>`:''}${button('menu', '← Tilbage')}</section>`;
      } else if (phase === 'help') {
        screen.innerHTML = `<section class="panel">${heading('LÆR AT JAGE', 'Sådan spiller du')}<ol class="instructions">
          <li><b>Bevæg og angrib.</b> Gå tæt på og tryk ${keyLabel('attack')}. Kritiske træf giver ekstra skade og stagger.</li>
          <li><b>Brug din evne.</b> ${keyLabel('ability')} bruger artens evne. Den koster stamina – løber du tør, bliver du forpustet.</li>
          <li><b>Spis din føde.</b> Hold ${keyLabel('eat')} ved føde. Føde giver mutationer og kalder bossen frem.</li>
          <li><b>Undvig de røde felter.</b> De fyldes op før angrebet. Bosser drejer efter dig i starten, så undvig sent.</li>
          <li><b>Udforsk.</b> Hver bane har områder med egne dyr, skjulte belønninger og en valgfri rival (☠).</li>
          <li><b>Skjul dig.</b> Stå stille eller hold ${keyLabel('sneak')} i buske. Dybt vand kan kun krydses ved vadesteder.</li>
          <li><b>DNA beholdes.</b> Køb arter og opgraderinger. Nogle arter låses op med bedrifter.</li></ol>
          <p class="fine">Kød rådner efter et stykke tid. Escape pauser spillet.</p>${button('menu', '← Klar til jagt', 'primary')}</section>`;
      } else if (phase === 'paused') {
        screen.innerHTML = `<section class="panel compact">${heading('TAG EN PAUSE', 'Jagten venter', 'Kort-seed: ' + r.seed)}${button('resume', 'FORTSÆT · Esc', 'primary')}${button('build', 'DIT BUILD')}${button('share', 'DEL KORT-SEED')}<label>Seed-link<input class="seed-link" readonly value="${htmlEscape((()=>{const url=new URL(location.href);url.searchParams.set('seed',r.seed);return url.href;})())}"></label><div class="actions">${button('settings', 'Indstillinger')}${button('abandon', 'Afslut run')}</div><p class="fine">Opsamlet DNA er allerede gemt. Afslut run registrerer din score.</p></section>`;
      } else if (phase === 'build') {
        screen.innerHTML=`<section class="panel">${heading(C.PLAYER_SPECIES[r.species].name,'Dit build','Spillet er pauset.')}<p>${tr('Liv')}: ${Math.ceil(r.health)} / ${r.maxHealth} · Stamina: ${Math.round(r.stamina)} / 100 · ${tr('Evne')}: ${C.abilityCost(r)} stamina</p><div class="mutation-grid">${C.MUTATIONS.filter(m=>r.mutations[m.id]>0).map(m=>`<article class="rarity-card" style="--rarity:${C.MUTATION_RARITIES[m.rarity].color}"><strong>${tr(m.name)}</strong><p>${tr('Rang')} ${r.mutations[m.id]} / ${m.max} · ${tr(C.MUTATION_RARITIES[m.rarity].name)}</p><p>${tr(m.text)}</p></article>`).join('')||`<p>${tr('Ingen mutationer endnu.')}</p>`}</div>${button('build-back','← Tilbage til pause')}</section>`;
      } else if (phase === 'mutation') {
        screen.innerHTML = `<section class="panel">${heading(r.rareSelection?(r.rewardSource==='elite'?'ELITE NEDLAGT · EPISK GENOM':'SJÆLDEN ALBINO NEDLAGT · EPISK GENOM'):'DINO-LEVEL ' + r.level, 'Vælg din mutation', 'Spillet er pauset. Tryk 1, 2 eller 3.')}<div class="mutation-grid">${r.choices.map((id, i) => {
          const m = C.MUTATIONS.find(m => m.id === id);
          const rarity = C.MUTATION_RARITIES[m.rarity];
          return `<button data-mutation="${id}" style="--rarity:${rarity.color}" class="rarity-card"><strong class="rarity-name">${({common:'•',uncommon:'◆',rare:'✦',epic:'★',legendary:'♛'})[m.rarity]} ${rarity.name.toUpperCase()}</strong>${imageTag('assets/ui/' + m.icon + '.png')}<small>VALG ${i + 1} · RANG ${r.mutations[id]} → ${r.mutations[id] + 1} / ${m.max}</small><h2>${m.name}</h2><small>${m.species ? C.PLAYER_SPECIES[m.species].name.toUpperCase() : "FÆLLES MUTATION"}</small><p>${m.text}</p>${r.mutations[id]>0?'<small>BYG VIDERE · '+Math.round(Math.min(.4,.2*r.mutations[id])*100)+' % VALGVÆGT</small>':''}</button>`;
        }).join('')}</div></section>`;
      } else if (phase === 'exploration') {
        screen.innerHTML = `<section class="panel compact">${heading('VALGFRI RISIKO · SPILLET ER PAUSET', 'En bevogtet rede', 'Tag sjælden føde og væk den nærliggende elitevogter, eller lad reden være.')}<div class="actions"><button data-explore="leave">LAD DEN VÆRE</button><button class="primary" data-explore="take">TAG FØDEN · +${8 + r.stage * 2}</button></div></section>`;
      } else if (phase === 'cleared') {
        const stage = game.currentLevel();
        screen.innerHTML = `<section class="panel compact">${heading('BOSS BESEJRET', I18N.tf('{0} er faldet', tr(stage.bossName)), '+' + stage.dna + ' DNA er gemt.')}${statisticsHTML(true)}<div class="bank">${imageTag('assets/ui/dna.png')}<b>${game.save.dna} DNA</b></div>${button('next', r.levelIndex === r.campaign.length-1 ? 'AFSLUT JAGTEN →' : 'NÆSTE BANE →', 'primary')}<p class="fine">${r.levelIndex === r.campaign.length-1 ? 'Jagten er fuldført.' : 'Du beholder mutationerne og genvinder 30 % af dit maksimale liv.'}</p></section>`;
      } else if (phase === 'result') {
        const result = r.result;
        screen.innerHTML = `<section class="panel compact">${heading(result.victory ? 'DALENS NYE KONGE' : 'EVOLUTIONEN FORTSÆTTER', result.victory ? 'Jagten er vundet' : 'Jagten er slut', htmlEscape(result.name) + ' · Bane ' + result.stage + ' · ' + result.bosses + ' bosser')}${result.victory ? "" : "<img class=\"death-preview\" alt=\"Din dinosaur efter jagten\">"}<div class="result-stats"><div><small>SCORE</small><b>${result.score}</b></div><div><small>DNA I RUN</small><b>+${r.dna}</b></div><div><small>TID</small><b>${timeLabel(result.seconds)}</b></div></div>${(r.challenges || []).length ? `<p class="daily-result challenge-result"><span>Udfordringer</span> · ${r.challenges.map(id => `<b>${C.CHALLENGES.find(c => c.id === id).name}</b>`).join(' · ')} · <span>+${r.challengeBonus || 0} DNA</span></p>` : ''}${r.daily ? `<p class="daily-result">${tr('Dagens jagt')} · ${r.daily.key.slice(6, 8)}.${r.daily.key.slice(4, 6)}.${r.daily.key.slice(0, 4)} · ${I18N.tf('plads {0} af {1}', r.daily.rank || '–', r.daily.entries || 1)}</p>` : ''}${runCardHTML(r)}<canvas class="end-scene" width="480" height="180" aria-label="Afslutningsscene"></canvas>${causeHTML(r)}${statisticsHTML(false)}${button('start', 'NY JAGT →', 'primary')}<div class="actions">${r.daily ? button('daily', 'Dagens jagt') : ''}${button('shop', 'DNA-laboratorium')}${button('scores', 'Rekorder')}${button('menu', 'Hovedmenu')}</div></section>`;
      } else if (phase === 'error') {
        screen.innerHTML = `<section class="panel">${heading('INDLÆSNING FEJLEDE', 'Assets mangler')}<p>Kontrollér, at assets-mappen følger med spillet. Genindlæs siden efter rettelsen.</p><p class="load-error"></p></section>`;
      }
      I18N.translateNode(screen);
      const focus = screen.querySelector(phase === 'intro' ? '[data-action="begin"]' : 'button:not(:disabled)'); if (focus) focus.focus({ preventScroll: true });
      shell.querySelector('.save-status').textContent = tr(game.storageAvailable ? 'DNA og indstillinger gemmes lokalt' : 'Lagring utilgængelig · fremgang gemmes kun i denne session');
    }
    function statisticsHTML(stageOnly){const st=game.statistics(stageOnly),fields={kills:'Dinosaurer nedlagt',fishCaught:'Fisk fanget',plantsEaten:'Planteportioner spist',meatEaten:'Kødportioner spist',staminaSpent:'Stamina brugt',attacks:'Angreb',landedAttacks:'Angreb med træffer',abilities:'Evner / undvigelser',avoidedHits:'Undgåede kontakttræffere',damageDealt:'Effektiv skade',damageTaken:'Modtaget skade',healing:'Healing',food:'Føde spist',dna:'DNA',distance:'Distance',secretsMissed:'Hemmeligheder overset'};return `<details class="run-details"><summary>${stageOnly?'Denne banes':'Hele jagtens'} statistik</summary><div class="stat-grid">${Object.entries(fields).map(([key,label])=>`<div><small>${label}</small><b>${key==='distance'?C.formatDistance(st.distance,I18N.lang):Math.round(st[key]||0)}</b></div>`).join('')}<div><small>Træfprocent</small><b>${st.attackAccuracy.toFixed(1)} %</b></div><div><small>Faktisk DNA-dropandel</small><b>${st.actualDNADropRate.toFixed(1)} % (${st.drops}/${st.dropRolls})</b></div></div><p>Mutationer: ${Object.entries(st.mutations).map(([id,rank])=>C.MUTATIONS.find(m=>m.id===id).name+' '+rank).join(' · ')||'Ingen'}</p><p class="fine">Distance regnes som 20 pixels pr. meter for alle arter. DNA-andelen er observerede drops, ikke en ekstra luck-bonus.</p></details>`;}
    // ---- R-RECORDS / R-REPORT: local records screen and the end-of-run card (logic lives in records.js).
    let recordsTab='fame',recordsScope='allTime';
    const R=C.RECORDS,CAUSES={compy:'Ædt af en compy',sub_minute:'Død inden for et minut',herbivore_on_herbivore:'Planteæder mod planteæder',lava:'Lava',level1_boss:'Palle på første bane',fleeing_prey:'Byttedyr på flugt',boss_other:'En anden boss',enemy_other:'Et andet dyr'};
    const speciesName=id=>C.PLAYER_SPECIES[id]?.name||C.SPECIES_LABELS[id]||id;
    function bossName(id){const m=/^(\w+)@(\d)$/.exec(id||'');return m&&C.LEVELS[+m[2]-1]?C.LEVELS[+m[2]-1].bossName:C.SPECIES_LABELS[String(id).split(':').pop()]||id;}
    function recordValue(def,x){
      if(!x)return '—';
      if(def.type==='species')return speciesName(x.value)+' · ø '+String(x.mean).replace('.',',');
      if(def.type==='mode'||def.type==='weighted')return (def.id==='embarrassing_cause'?CAUSES[x.value]||x.value:def.id==='nemesis'?C.SPECIES_LABELS[x.value]||x.value:speciesName(x.value))+' · '+x.count+'×';
      if(def.unit==='time')return timeLabel(x.value);
      if(def.unit==='m')return C.formatDistance(x.value*C.PX_PER_METER,I18N.lang);
      if(def.unit==='%')return x.value+' %';
      return String(Math.round(x.value));
    }
    function recordsHTML(){
      const save=game.save,records=save.records||R.emptyRecords(),stats=R.scopeStats(records,recordsScope,Date.now());
      const tabs=[['fame','Hall of Fame'],['shame','Hall of Shame'],['top','Top 10']].map(([id,label])=>`<button class="${recordsTab===id?'selected':''}" data-records-tab="${id}" aria-pressed="${recordsTab===id}">${label}</button>`).join('');
      if(recordsTab==='top')return `<div class="records-tabs">${tabs}</div>`;
      const scopes=[['day','I dag'],['week','Uge'],['month','Måned'],['allTime','Altid']].map(([id,label])=>`<button class="${recordsScope===id?'selected':''}" data-records-scope="${id}" aria-pressed="${recordsScope===id}">${label}</button>`).join('');
      const rows=R.STATS.filter(def=>def.board===recordsTab&&(def.type!=='current'||recordsScope==='allTime')).map(def=>{const x=R.statValue(def,stats[def.id],save),ref=x&&x.ref?speciesName(x.ref.species)+' · '+x.ref.date:x&&x.seeded?'fra tidligere runs':'';
        return `<div class="record-row"><span>${def.label}</span><b${x?'':' title="Registreres fra version 3"'}>${htmlEscape(recordValue(def,x))}</b>${ref?`<small>${htmlEscape(ref)}</small>`:''}</div>`;}).join('');
      return `<div class="records-tabs">${tabs}</div><div class="records-tabs scopes">${scopes}</div><div class="records-list">${rows}</div><p class="fine">Rekorder gemmes kun i denne browser. — betyder endnu ikke registreret.</p>`;
    }
    const titleOf=id=>R.TITLES.find(t=>t.id===id);
    function causeHTML(r){
      const s=r.summary;if(r.result.victory)return '<p class="run-cause">Jagten er fuldført</p>';
      if(!s)return `<p>${r.lastHit?'Dræbt af '+C.SPECIES_LABELS[r.lastHit.kind]:'Ingen registreret dræber'}</p>`;
      const what=s.abandoned?'Opgivet':s.deathCauseType==='lava'?'Lava':s.deathBossId?bossName(s.deathBossId):s.deathCauseKind?C.SPECIES_LABELS[s.deathCauseKind]||speciesName(s.deathCauseKind):'Ingen registreret dræber';
      return `<p class="run-cause"><small>Dødsårsag</small> <b>${htmlEscape(what)}</b>${s.deathRival?' <small>Rival</small>':''} <small>Bane ${s.levelReached}</small></p>`;
    }
    function runCardHTML(r){
      const s=r.summary,picked=r.titles;if(!s||!picked)return `<p class="run-title">${htmlEscape(game.runSummary())}</p>`;
      const primary=titleOf(picked.primary),secondary=picked.secondary.map(titleOf).filter(Boolean);
      const cell=(label,value)=>`<div><small>${label}</small><b>${value}</b></div>`,cells=[cell('Nedlæggelser',s.kills),cell('Bosser',s.bosses)];
      if(s.minibossKills)cells.push(cell('Mini-bosser',s.minibossKills));
      cells.push(cell('Skade',s.damageDealt+' / '+s.damageTaken));
      if(s.maxHitDamage)cells.push(cell('Største slag',s.maxHitDamage));
      cells.push(cell('Distance',C.formatDistance(s.distancePx,I18N.lang)),cell('Områder',s.zonesFound+' ('+s.explorationPct+' %)'),cell('Føde',s.food),cell('DNA','+'+s.dna));
      if(s.fishCaught||s.diet==='piscivore')cells.push(cell('Fisk',s.fishCaught));
      if(s.attacks>=10)cells.push(cell('Træfprocent',Math.round(100*s.accuracy)+' %'));
      if(s.longestNoHitSeconds>=30)cells.push(cell('Længste skadefri periode',timeLabel(s.longestNoHitSeconds)));
      const bosses=s.bossKills.map(b=>`<span class="chip">${htmlEscape(b.name||bossName(b.id||b.kind))} ${timeLabel(b.seconds)} ✓</span>`).join('');
      const fresh=picked.fresh.map(titleOf).filter(Boolean).map(t=>`<span class="chip new">✦ ${t.name.da}</span>`).join('');
      return `<div class="run-card"><p class="run-header"><b>${speciesName(s.species)}</b> · Bane ${s.levelReached}/${r.campaign.length} · ${timeLabel(s.seconds)}</p><p class="run-title rarity-${primary.rarity}">★ ${primary.name.da}</p><p class="run-title-text">${primary.description.da}</p>${secondary.length?`<p class="run-secondary">${secondary.map(t=>t.name.da).join(' · ')}</p>`:''}<div class="stat-grid run-card-grid">${cells.join('')}</div>${bosses?`<p class="chips">${bosses}</p>`:''}${fresh?`<p class="chips"><small>Ny titel</small> ${fresh}</p>`:''}<div class="actions">${button('share-card','Del resultat')}</div></div>`;
    }
    // Plain-text result card for sharing (clipboard only, no network); numbers come from the RunSummary.
    function shareText(r){
      const s=r.summary,t=r.titles&&titleOf(r.titles.primary);if(!s||!t)return '';
      const cause=s.victory?tr('Jagten er fuldført'):s.abandoned?tr('Opgivet'):tr('Dødsårsag')+': '+tr(s.deathCauseType==='lava'?'Lava':s.deathBossId?bossName(s.deathBossId):C.SPECIES_LABELS[s.deathCauseKind]||'Ingen registreret dræber');
      return ['PRIMAL RUN · ★ '+tr(t.name.da),tr(speciesName(s.species))+' · '+tr('Bane '+s.levelReached+'/'+r.campaign.length)+' · '+timeLabel(s.seconds),
        tr('Nedlæggelser')+' '+s.kills+' · '+tr('Bosser')+' '+s.bosses+' · '+tr('Distance')+' '+C.formatDistance(s.distancePx,I18N.lang),cause,'Seed '+r.seed].join(String.fromCharCode(10));
    }
    // Field guide models (FEATURES.guideModels): each seen species walks in place facing east and attacks every ~5 s.
    // Only the frames of discovered species are fetched, on demand (GitHub Pages request budget).
    const guideFrames={},guideBoxes={};
    function opaqueBox(kind,im){if(guideBoxes[kind])return guideBoxes[kind];const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,im.width,im.height).data;let x0=im.width,y0=im.height,x1=-1,y1=-1;for(let y=0;y<im.height;y++)for(let i=0;i<im.width;i++)if(d[(y*im.width+i)*4+3]>16){if(i<x0)x0=i;if(i>x1)x1=i;if(y<y0)y0=y;if(y>y1)y1=y;}return guideBoxes[kind]=x1<0?{x:0,y:0,w:im.width,h:im.height}:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};}
    function guideFrameCount(kind,state){const key=kind+':'+state;if(guideFrames[key]===undefined){let n=0;while(n<16&&catalog[enemyFrame(kind,state,'E',n)])n++;guideFrames[key]=n;}return guideFrames[key];}
    function drawGuideModels(now){if(game.phase!=='guide')return;const reduced=reducedMotion.matches||game.save.settings.reducedMotion;
      screen.querySelectorAll('canvas.guide-model').forEach((cv,i)=>{const kind=cv.dataset.kind,dc=cv.getContext('2d'),W=cv.width,H=cv.height;dc.imageSmoothingEnabled=false;dc.clearRect(0,0,W,H);
        const walk=guideFrameCount(kind,'walk')||guideFrameCount(kind,'idle'),attack=guideFrameCount(kind,'attack'),t=now/1000+i*1.7,cycle=t%5.2,attacking=!reduced&&attack&&cycle>4.4;
        const state=attacking?'attack':guideFrameCount(kind,'walk')?'walk':'idle',frame=reduced?0:attacking?Math.min(attack-1,Math.floor((cycle-4.4)*attack/.8)):Math.floor(t*8)%Math.max(1,walk);
        const base=enemyFrame(kind,state==='attack'?(guideFrameCount(kind,'walk')?'walk':'idle'):state,'E',0),path=enemyFrame(kind,state,'E',frame);cv.dataset.state=state;
        if(!cv.dataset.loading){cv.dataset.loading='1';for(const st of ['walk','idle','attack'])for(let f=0;f<guideFrameCount(kind,st);f++){const q=enemyFrame(kind,st,'E',f);if(!images[q])loadImage(q).catch(()=>{});}}
        prepareImage(base);prepareImage(path);const ready=images[path]?path:base,ref=images[base],im=skins[ready]||images[ready],meta=catalog[ready];if(!ref||!im||!meta)return; // attack frame not loaded yet: keep walking
        // Scale and place by the visible body of the first walk frame (frames carry wide transparent padding), so every frame shares one anchor.
        const box=opaqueBox(kind,ref),bm=catalog[base],fit=Math.min((H*.7)/box.h,(W*.62)/box.w),scale=fit>=1?Math.min(4,Math.floor(fit)):fit,gy=H*.88,ox=W/2-(box.x+box.w/2-bm.origin[0])*scale,oy=gy-(box.y+box.h-bm.origin[1])*scale;
        dc.fillStyle='#0004';dc.beginPath();dc.ellipse(W/2,gy-2,box.w*scale*.36,5,0,0,Math.PI*2);dc.fill();
        dc.drawImage(im,Math.round(ox-meta.origin[0]*scale),Math.round(oy-meta.origin[1]*scale),Math.round(im.width*scale),Math.round(im.height*scale));});
    }
    let endSceneStarted=0,endSceneRun=null;
    function drawEndScene(now){const scene=screen.querySelector('.end-scene');if(!scene)return;const r=game.run;if(endSceneRun!==r){endSceneRun=r;endSceneStarted=now;}const t=(now-endSceneStarted)/1000,dc=scene.getContext('2d');dc.imageSmoothingEnabled=false;dc.fillStyle='#151b19';dc.fillRect(0,0,480,180);dc.fillStyle='#28372a';dc.fillRect(0,130,480,50);
      const reduced=reducedMotion.matches||game.save.settings.reducedMotion,phase=reduced?2:Math.min(3,t),killer=r.result.victory?null:r.lastHit,charge=killer?.mode==='charge',slam=killer?.mode==='slam',style=charge?'stormløb':slam?'slag':'bid';scene.dataset.scene=style;scene.dataset.species=r.species;
      const paint=(path,x,y,scale=1)=>{prepareImage(path);const im=skins[path]||images[path],meta=catalog[path];if(!im){if(meta)loadImage(path).catch(()=>{});return;}dc.drawImage(im,Math.round(x-meta.origin[0]*scale),Math.round(y-meta.origin[1]*scale),im.width*scale,im.height*scale);};
      const state=r.result.victory?'idle':phase<1?'hurt':'death',frame=state==='death'?Math.min(5,Math.floor((phase-1)*8)):state==='hurt'?0:Math.floor(phase*4)%4;paint(C.playerFrame(r.species,state,'W',Math.max(0,frame)),310,100,['tyrannosaurus','deinosuchus'].includes(r.species)?2:1);
      if(killer){const state=phase<1?'run':phase<1.5?'attack':'idle',frame=state==='idle'?0:Math.min(5,Math.floor((phase%1)*6));paint(enemyFrame(killer.kind,state,'E',frame),phase<1?70+phase*(charge?170:140):charge?240:210,slam?110:100,['tyrannosaurus','deinosuchus'].includes(killer.kind)?2:1);}
    }
    const prepared=new Set();
    function prepareImage(path){if(prepared.has(path)||!images[path])return;prepared.add(path);const image=images[path];
        const species=Object.keys(C.SPECIES_COLORS).find(id=>path.includes('/'+id+'_'));
        if(species&&!path.startsWith('assets/corpses/')) {
          const layer=document.createElement('canvas');layer.width=image.width;layer.height=image.height;const lc=layer.getContext('2d');lc.drawImage(image,0,0);const pixels=lc.getImageData(0,0,image.width,image.height),mapping=C.SPECIES_COLORS[species];
          for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3]){const key=[pixels.data[i],pixels.data[i+1],pixels.data[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');const color=mapping[key];if(color){pixels.data[i]=parseInt(color.slice(0,2),16);pixels.data[i+1]=parseInt(color.slice(2,4),16);pixels.data[i+2]=parseInt(color.slice(4,6),16);}}
          lc.putImageData(pixels,0,0);skins[path]=layer;
        }
        if ((path.startsWith('assets/enemies/') || path.startsWith('assets/enemy_animations/') || path.startsWith('assets/enemy_full/') || path.startsWith('assets/player_full/') || path.startsWith('assets/species_attacks/') || path.startsWith('assets/behavior/') || path.startsWith('assets/behavior_native/') || path.startsWith('assets/behavior_injured/'))) {
          const tint = document.createElement('canvas'); tint.width = image.width; tint.height = image.height;
          const tintCtx = tint.getContext('2d'); tintCtx.drawImage(image, 0, 0); tintCtx.globalCompositeOperation = 'source-in';
          tintCtx.fillStyle = '#fff1c9'; tintCtx.fillRect(0, 0, tint.width, tint.height); flashes[path] = tint;
        }

    }
    const npcVariants=new Map();
    function npcVariant(path,variant){const key=path+':'+variant;if(npcVariants.has(key))return npcVariants.get(key);const source=skins[path]||images[path];if(!source)return null;const layer=document.createElement('canvas');layer.width=source.width;layer.height=source.height;const lc=layer.getContext('2d');lc.drawImage(source,0,0);const pixels=lc.getImageData(0,0,layer.width,layer.height),swaps={male:{'799447':'a8b15b','69a4a0':'3c7180','b98252':'d4a36c','929387':'626861'},elite:{'799447':'de954a','69a4a0':'e9b75a','929387':'de954a','b98252':'e9b75a'},fishKing:{'799447':'3c7180','69a4a0':'a2d4c1','929387':'2466a0','b98252':'69a4a0'}};
      for(let i=0;i<pixels.data.length;i+=4){if(!pixels.data[i+3])continue;const rgb=[...pixels.data.slice(i,i+3)],key=rgb.map(v=>v.toString(16).padStart(2,'0')).join('');let value=swaps[variant]?.[key];if(variant==='albino'&&Math.max(...rgb)>55)value=Math.max(...rgb)>145?'e8ece1':'bab8a2';if(value)for(let j=0;j<3;j++)pixels.data[i+j]=parseInt(value.slice(j*2,j*2+2),16);}
      lc.putImageData(pixels,0,0);npcVariants.set(key,layer);if(npcVariants.size>128)npcVariants.delete(npcVariants.keys().next().value);return layer;
    }
    function sprite(path, x, y, alpha = 1, flash = false, rotation = 0, scale = 1, variant=null) {
      prepareImage(path);const image = flash ? flashes[path] : images[path], meta = catalog[path]; if(!image&&meta){loadImage(path).catch(()=>{});return;}if(!meta)return;
      ctx.globalAlpha = alpha;
      const paint=(img,dx,dy)=>{if(scale===1)ctx.drawImage(img,dx,dy);else ctx.drawImage(img,dx,dy,img.width*scale,img.height*scale);};
      if(rotation){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(rotation);paint(image,-meta.origin[0]*scale,-meta.origin[1]*scale);if(!flash&&(variant?npcVariant(path,variant):skins[path]))paint(variant?npcVariant(path,variant):skins[path],-meta.origin[0]*scale,-meta.origin[1]*scale);ctx.restore();}
      else {paint(image,Math.round(x)-meta.origin[0]*scale,Math.round(y)-meta.origin[1]*scale);if(!flash&&(variant?npcVariant(path,variant):skins[path]))paint(variant?npcVariant(path,variant):skins[path],Math.round(x)-meta.origin[0]*scale,Math.round(y)-meta.origin[1]*scale);}
      ctx.globalAlpha = 1;
    }
    function insect(p,time) {
      if(game.save.settings.reducedMotion||reducedMotion.matches)return;
      const flying=p.kind!=='beetle',phase=time*2+p.phase;
      const x=p.x+(flying?Math.sin(phase)*18:Math.sin(phase*.35)*5),y=p.y+(flying?Math.cos(phase*.7)*8:0);
      sprite('assets/ecology/'+p.kind+'_'+(Math.floor(time*8+p.phase)%2)+'.png',x,y);
    }
    // M2: the real game world lives behind the menu; CSS tilts the canvas into a diorama.
    let renderOverride=null,menuWorld=null;
    function createMenuWorld(){
      try{
        const day=Math.floor(Date.now()/86400000),local=(seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;})(day*7919+13);
        const g=new C.Game({random:local});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies(game.save.selectedSpecies||'velociraptor');g.persist=()=>{};g.checkAchievements=()=>[];g.start({seed:(day*2654435761)>>>0});
        if(day%2){for(let i=0;i<2;i++){g.phase='cleared';g.run.bossDefeated=true;g.nextStage();}}
        const r=g.run;r.invulnerable=1e9;r.spawnTimer=1e9;r.rareRewards=0;g.offerRareReward=()=>false;g.maybeLevelUp=()=>{};
        return{game:g,clock:menuClock,target:0,species:g.save.selectedSpecies};
      }catch(error){console.error(error);return null;}
    }
    function stepMenuWorld(dt){
      const g=menuWorld.game,r=g.run;if(g.phase!=='playing'){g.phase='playing';}
      g.setView(canvas.width,canvas.height);
      const zones=r.map.zones||[{x:r.map.width/2,y:r.map.height/2}],goal=zones[menuWorld.target%zones.length],dx=goal.x-r.player.x,dy=goal.y-r.player.y,d=Math.hypot(dx,dy);
      if(d<90||(menuWorld.stuck||0)>3){menuWorld.target++;menuWorld.stuck=0;}
      const before=r.player.x+r.player.y,pilot=C.menuPilot?C.menuPilot(r,goal):{x:d?dx/d:0,y:d?dy/d:0,sneak:true};menuWorld.mode=pilot.mode;g.step(dt,pilot);menuWorld.stuck=Math.abs(r.player.x+r.player.y-before)<.01?(menuWorld.stuck||0)+dt:0;
      r.invulnerable=1e9;r.health=r.maxHealth;g.drainEvents();
    }
    function drawMenu() {
      if(ready&&(!menuWorld||menuWorld.species!==game.save.selectedSpecies))menuWorld=createMenuWorld();
      if(menuWorld){
        const dtm=Math.min(.05,Math.max(0,menuClock-menuWorld.clock));menuWorld.clock=menuClock;if(dtm>0)stepMenuWorld(dtm);
        renderOverride=menuWorld.game.run;try{draw();}finally{renderOverride=null;}
        const r=menuWorld.game.run,shown=[...new Set(r.enemies.filter(e=>Math.abs(e.x-r.player.x)<canvas.width/2&&Math.abs(e.y-r.player.y)<canvas.height/2).map(e=>e.kind))];
        canvas.dataset.menuTime=menuClock.toFixed(2);canvas.dataset.menuActors=[r.species,...shown].join(',');canvas.dataset.scene='jungle';return;
      }
      drawJungleMenu();
    }
    function drawJungleMenu() {
      const w=canvas.width,h=canvas.height,t=menuClock;
      ctx.fillStyle='#101713';ctx.fillRect(0,0,w,h);
      const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#28372a');gradient.addColorStop(.55,'#3f5030');gradient.addColorStop(1,'#151b19');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
      for(let i=0;i<14;i++){const x=((i*160-t*3)%(w+240)+(w+240))%(w+240)-120;sprite('assets/props/tree_canopy.png',x,30+(i%3)*65,.65,false,0,2);}
      // Three foliage layers have different horizontal speeds. No gameplay state advances here.
      for(let layer=0;layer<3;layer++)for(let i=0;i<22;i++){
        const spacing=110,period=spacing*22;const x=((i*spacing-t*(layer+1)*6)%period+period)%period-100;
        const y=layer===0?h*.25+(i%3)*16:layer===1?h*.68+(i%4)*17:h-15+(i%2)*22;
        const plant=['cycad','conifer','broad_fern','seed_fern','shrub'][(i+layer)%5];
        sprite('assets/ecology/'+plant+'.png',x,y,layer===0?.5:1,false,0,layer===2?2:1);
      }
      ctx.fillStyle='#ded392';ctx.globalAlpha=.06;for(let i=0;i<4;i++){ctx.beginPath();const x=w*(.12+i*.23);ctx.moveTo(x,0);ctx.lineTo(x+100,h);ctx.lineTo(x+180,h);ctx.lineTo(x+45,0);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;
      const actors=[{kind:'compy',speed:115,delay:0,y:.82},{kind:'compy',speed:115,delay:1.4,y:.86},{kind:'compy',speed:115,delay:2.6,y:.80},{kind:'velociraptor',speed:125,delay:3.8,y:.74},{kind:'utahraptor',speed:92,delay:5,y:.65},{kind:'carnotaurus',speed:-70,delay:7,y:.53},{kind:'ankylosaurus',speed:36,delay:12,y:.9}];
      const shown=[];
      for(const [i,a]of actors.entries()){
        const distance=w+360,progress=((t-Math.max(0,a.delay))*Math.abs(a.speed)%distance+distance)%distance;
        const x=a.speed>0?progress-180:w+180-progress,dir=a.speed>0?'E':'W';
        const frame=Math.floor(t*12+i)%6,path=C.playerFrame(a.kind,'run',dir,frame);
        sprite(path,x,Math.round(h*a.y));if(x>-100&&x<w+100)shown.push(a.kind);
      }
      for(let i=0;i<12;i++)insect({x:(i*137+65)%w,y:h*(.25+(i%5)*.12),kind:i%3?'firefly':'dragonfly',phase:i*1.7},t);
      // Foreground frames the scene while leaving all menu controls readable.
      for(let i=0;i<Math.ceil(w/100);i++)sprite('assets/ecology/broad_fern.png',i*100,h+8,1,false,0,2);
      canvas.dataset.menuTime=t.toFixed(2);canvas.dataset.menuActors=shown.join(',');canvas.dataset.scene='jungle';
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
      if (!backgrounds.has(tile)){const tileImage=images['assets/tiles/' + tile + '.png'];if(!tileImage){loadImage('assets/tiles/' + tile + '.png');}else backgrounds.set(tile, ctx.createPattern(tileImage, 'repeat'));}
      if(backgrounds.has(tile)){ctx.fillStyle = backgrounds.get(tile); ctx.globalAlpha = alpha; ctx.fill(); ctx.globalAlpha = 1;}
    }
    const groundCache=new Map();
    function groundDetails(stage,map,view){
      for(let gx=Math.floor(view.x/128);gx<=Math.floor((view.x+canvas.width)/128);gx++)for(let gy=Math.floor(view.y/128);gy<=Math.floor((view.y+canvas.height)/128);gy++){
        const key=map.seed+':'+stage+':'+gx+':'+gy;let layer=groundCache.get(key);
        if(!layer){layer=document.createElement('canvas');layer.width=layer.height=128;const lc=layer.getContext('2d');let seed=(map.seed^Math.imul(gx+11,73856093)^Math.imul(gy+19,19349663))>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
          const colors=[['#3f5030','#586d38','#674333','#8d6042'],['#bab8a2','#d4a36c','#929387','#674333'],['#3b4144','#929387','#bab8a2','#443027'],['#151b19','#626861','#674333','#54282d']][stage];
          for(let i=0;i<65;i++){const x=Math.floor(random()*124),y=Math.floor(random()*124),wx=gx*128+x,wy=gy*128+y;if((stage===1&&C.riverDistance(map,{x:wx,y:wy})<58)||(stage===3&&C.riverDistance(map,{x:wx,y:wy})<22))continue;lc.fillStyle=colors[Math.floor(random()*colors.length)];const size=1+Math.floor(random()*3);lc.fillRect(x,y,size,1);if(i%7===0){lc.fillRect(x+size,y+1,size,1);lc.fillRect(x+size*2,y+2,size,1);}if(i%11===0){lc.fillStyle=colors[1];lc.fillRect(x,y,3,2);lc.fillStyle=colors[0];lc.fillRect(x+1,y+2,3,1);}}
          groundCache.set(key,layer);if(groundCache.size>128)groundCache.delete(groundCache.keys().next().value);
        }ctx.drawImage(layer,gx*128,gy*128);
      }
    }
    // Soft per-zone ground tint, built once per map at 1/24 scale and drawn smoothed.
    const ZONE_TINT={clearing:'#799447',thicket:'#3f5030',oldgrowth:'#28372a',bog:'#674333',meadow:'#a8b15b',reeds:'#586d38',bank:'#edd0a0',gallery:'#3f5030',drygrass:'#d4a36c',canyon:'#626861',plateau:'#929387',thorn:'#8d6042',ash:'#3b4144',deadwood:'#443027',steam:'#69a4a0',lavarim:'#913b32'};
    const zoneTintCache=new WeakMap();
    function zoneTint(stage,map,view){
      if(!map.zones||!map.zones.length)return;
      let layer=zoneTintCache.get(map);
      if(!layer){const scale=24,w=Math.ceil(map.width/scale),h=Math.ceil(map.height/scale);layer=document.createElement('canvas');layer.width=w;layer.height=h;const lc=layer.getContext('2d'),img=lc.createImageData(w,h),rgb=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){const px=x*scale,py=y*scale;let wsum=0,acc=[0,0,0];for(const z of map.zones){const d=Math.hypot(px-z.x,py-z.y),wt=1/Math.pow(d+60,4);wsum+=wt;const c=rgb(ZONE_TINT[z.id]||'#586d38');acc[0]+=c[0]*wt;acc[1]+=c[1]*wt;acc[2]+=c[2]*wt;}const i=(y*w+x)*4;img.data[i]=acc[0]/wsum;img.data[i+1]=acc[1]/wsum;img.data[i+2]=acc[2]/wsum;img.data[i+3]=255;}
        lc.putImageData(img,0,0);zoneTintCache.set(map,layer);}
      ctx.save();ctx.globalAlpha=.32;ctx.imageSmoothingEnabled=true;const scale=map.width/layer.width;
      const sx=Math.max(0,Math.floor(view.x/scale)),sy=Math.max(0,Math.floor(view.y/scale)),sw=Math.min(layer.width-sx,Math.ceil(canvas.width/scale)+2),sh=Math.min(layer.height-sy,Math.ceil(canvas.height/scale)+2);
      if(sw>0&&sh>0)ctx.drawImage(layer,sx,sy,sw,sh,sx*scale,sy*scale,sw*scale,sh*scale);ctx.restore();
    }
    function background(stage, map, view) {
      ctx.beginPath(); ctx.rect(view.x, view.y, canvas.width, canvas.height);
      texturedFill(C.STAGES[stage].tile, ['#28372a', '#d4a36c', '#626861', '#3b4144'][stage], .28);
      zoneTint(stage,map,view);
      groundDetails(stage,map,view);
      for (const region of map.regions) {
        if (Math.abs(region.x - view.x - canvas.width / 2) > canvas.width / 2 + region.radius || Math.abs(region.y - view.y - canvas.height / 2) > canvas.height / 2 + region.radius) continue;
        blob(region.x, region.y, region.radius, region.radius * .7, region.seed); ctx.save(); ctx.globalAlpha = .32; ctx.fillStyle = ['#3f5030', '#586d38', '#674333', '#54282d'][stage]; ctx.fill(); ctx.restore(); /* subtle natural ground patches */

      }
      const waterTime=game.run?game.run.seconds:menuClock;const tiledWater=C.FEATURES.waterTiles&&catalog['assets/water_transitions/shore_soil_15.png'];canvas.dataset.waterTiles=tiledWater?'true':'false';if(tiledWater)drawWaterTiles(stage,map,view);for(const pond of map.ponds||[])drawPond(pond,waterTime,tiledWater);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (stage === 1) {
        drawRiver(map,waterTime,tiledWater);
      }
      if (stage === 3) {
        trace(map.river); ctx.strokeStyle = '#3b4144'; ctx.lineWidth = 58; ctx.stroke(); ctx.strokeStyle = '#54282d'; ctx.lineWidth = 42; ctx.stroke(); ctx.strokeStyle = '#c6663c'; ctx.lineWidth = 26; ctx.stroke();
        ctx.save(); ctx.globalAlpha = calm() ? .8 : .55 + .35 * Math.sin(waterTime * 3); ctx.strokeStyle = '#de954a'; ctx.lineWidth = 10; ctx.stroke(); ctx.globalAlpha = .9; ctx.strokeStyle = '#ded392'; ctx.lineWidth = 3; ctx.setLineDash([12, 18]); ctx.lineDashOffset = calm() ? 0 : -waterTime * 20; ctx.stroke(); ctx.restore();
        // B1b basalt crossings: procedural placeholder (no sprite yet, see MISSING_SPRITES.md), 70 px safe radius as in core.
        for (const c of map.lavaCrossings || []) {
          ctx.save(); ctx.translate(c.x, c.y); ctx.beginPath(); ctx.ellipse(0, 0, 70, 52, 0, 0, Math.PI * 2); ctx.fillStyle = '#3b4144'; ctx.fill(); ctx.strokeStyle = '#151b19'; ctx.lineWidth = 3; ctx.stroke();
          let seed = (c.x * 31 + c.y * 17) >>> 0; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
          for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 50, k = 7 + rnd() * 6; ctx.beginPath(); for (let j = 0; j < 6; j++) { const t = j / 6 * Math.PI * 2 + a; ctx.lineTo(Math.cos(a) * d + Math.cos(t) * k, Math.sin(a) * d * .72 + Math.sin(t) * k * .7); } ctx.closePath(); ctx.fillStyle = i % 3 ? '#626861' : '#929387'; ctx.fill(); ctx.strokeStyle = '#151b19'; ctx.lineWidth = 1; ctx.stroke(); }
          ctx.restore();
        }
      }
      for(const p of map.mud||[]){ctx.beginPath();ctx.ellipse(p.x,p.y,p.rx,p.ry,0,0,Math.PI*2);texturedFill('dirt','#674333',.18);ctx.strokeStyle='#913b3266';ctx.lineWidth=2;ctx.stroke();}
      ctx.fillStyle = '#151b1966'; ctx.fillRect(0, 0, map.width, 76); ctx.fillRect(0, map.height - 42, map.width, 42); ctx.fillRect(0, 0, 42, map.height); ctx.fillRect(map.width - 42, 0, 42, map.height);
    }
    function enemyLabelOffset(e){return (e.kind==='compy'?20:72)*(e.visualScale||1)+12;}
    function authoredBehaviorPath(species,state,direction,frame,health,maxHealth,mode='',time=0){
      const legacy=C.behaviorFrame(species,state,direction,frame,health,maxHealth,mode,time);if(!legacy)return null;
      const family=['walk','run'].includes(state)?'behavior_injured':'behavior_native';
      const revised='assets/'+family+'/'+legacy.split('/').pop();
      for(const path of [revised,legacy])if(catalog[path]&&catalog[path].runtime_enabled!==false)return path;
      return null;
    }
    function enemyFrame(kind,state,direction,frame){const attack=C.playerFrame(kind,state,direction,frame);if(state==='attack'&&attack.startsWith('assets/species_attacks/')&&catalog[attack])return attack;return 'assets/'+(['compy','carnotaurus','ankylosaurus','pachycephalosaurus','gallimimus','baryonyx','utahraptor','velociraptor','deinonychus'].includes(kind)?'player_full/':'enemy_full/')+kind+'_'+state+'_'+direction+'_'+String(frame).padStart(3,'0')+'.png';}
    function label(text, x, y, color) {
      text = tr(text);
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#101713';
      ctx.strokeText(text, Math.round(x), Math.round(y)); ctx.fillStyle = color; ctx.fillText(text, Math.round(x), Math.round(y));
    }
    function drawPortrait(r){
      const pc=shell.querySelector('.hud-portrait'),p=pc.getContext('2d'),state=r.hurt>0?'hurt':r.eating?'eat':r.attack||r.pounce>0?'fight':r.hidden||r.concealTime>0?'sneak':'idle',frame=game.save.settings.reducedMotion||reducedMotion.matches?0:Math.floor(r.seconds*4)%4,path='assets/avatars/'+r.species+'_'+state+'_'+String(frame).padStart(3,'0')+'.png';prepareImage(path);const im=skins[path]||images[path],meta=catalog[path];pc.dataset.species=r.species;pc.dataset.state=state;pc.dataset.sprite=path;if(!im&&meta)loadImage(path).catch(()=>{});
      p.clearRect(0,0,64,64);p.fillStyle='#101b16';p.beginPath();p.arc(32,32,30,0,Math.PI*2);p.fill();
      if(im&&meta){prepareImage(path);p.save();p.beginPath();p.arc(32,32,27,0,Math.PI*2);p.clip();p.imageSmoothingEnabled=false;p.drawImage(im,0,0);p.restore();}
      p.lineWidth=4;p.strokeStyle='#28372a';p.beginPath();p.arc(32,32,29,0,Math.PI*2);p.stroke();
      p.strokeStyle='#c3a35c';p.beginPath();p.arc(32,32,29,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,r.xp/r.nextXP));p.stroke();
      p.fillStyle='#c3a35c';p.beginPath();p.arc(52,52,10,0,Math.PI*2);p.fill();p.fillStyle='#15221a';p.font='bold 11px monospace';p.textAlign='center';p.textBaseline='middle';p.fillText(String(r.level),52,53);
    }
    function minimap(r) {
      const width = Math.min(120, canvas.width * .25), height = width * r.map.height / r.map.width;
      const x = canvas.width - width - 12, y = canvas.height - height - shell.querySelector('.run-info').offsetHeight - 24;
      ctx.fillStyle = '#101713dc'; ctx.fillRect(x, y, width, height); ctx.strokeStyle = '#b6c0a9'; ctx.strokeRect(x, y, width, height);
      const seen=p=>r.explored[Math.floor(p.x/192)+','+Math.floor(p.y/192)];
      if(r.map.rival&&r.enemies.some(e=>e.id===r.map.rival.id)&&seen(r.map.rival)){const rx=Math.round(x+r.map.rival.x/r.map.width*width),ry=Math.round(y+r.map.rival.y/r.map.height*height);ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillStyle='#e9b75a';ctx.fillText('☠',rx,ry+3);}
      for(const ev of r.map.events)if(!ev.claimed&&seen(ev)){ctx.fillStyle=ev.type==='spring'?'#a2d4c1':ev.type==='cache'?'#bb80d9':'#e8ece1';ctx.fillRect(Math.round(x+ev.x/r.map.width*width)-1,Math.round(y+ev.y/r.map.height*height)-1,3,3);}
      for (const site of r.map.sites) if (site.discovered && !site.claimed) { ctx.fillStyle = site.type === 'fossil' ? '#bb80d9' : '#e9b75a'; ctx.fillRect(Math.round(x+site.x/r.map.width*width)-1,Math.round(y+site.y/r.map.height*height)-1,3,3); }
      if (r.stage === 1 || r.stage === 3) { trace(r.map.river.map(p => ({ x: x + p.x / r.map.width * width, y: y + p.y / r.map.height * height }))); ctx.strokeStyle = r.stage === 1 ? '#69a4a0' : '#de954a'; ctx.lineWidth = 2; ctx.stroke(); } for (const c of r.map.lavaCrossings || []) { ctx.fillStyle = '#929387'; ctx.fillRect(Math.round(x + c.x / r.map.width * width) - 2, Math.round(y + c.y / r.map.height * height) - 2, 4, 4); }
      ctx.strokeStyle = '#69a4a0'; ctx.strokeRect(x + r.view.x / r.map.width * width, y + r.view.y / r.map.height * height, Math.min(width, r.view.width / r.map.width * width), Math.min(height, r.view.height / r.map.height * height));
      for (const e of r.enemies) if (e.boss || Math.hypot(e.x - r.player.x, e.y - r.player.y) < 550) {
        ctx.fillStyle = e.boss ? '#e9b75a' : e.damage ? '#ed7869' : '#8eaa60';
        ctx.fillRect(Math.round(x + e.x / r.map.width * width) - 2, Math.round(y + e.y / r.map.height * height) - 2, 4, 4);
      }
      ctx.fillStyle = '#69a4a0'; ctx.beginPath(); ctx.arc(Math.round(x + r.player.x / r.map.width * width), Math.round(y + r.player.y / r.map.height * height), 3, 0, Math.PI * 2); ctx.fill();
      for(let gx=0;gx<Math.ceil(r.map.width/192);gx++)for(let gy=0;gy<Math.ceil(r.map.height/192);gy++)if(!r.explored[gx+','+gy]){ctx.fillStyle='#040906e8';ctx.fillRect(x+gx*192/r.map.width*width,y+gy*192/r.map.height*height,192/r.map.width*width+.5,192/r.map.height*height+.5);}
      for(const boss of r.enemies.filter(e=>e.boss)){const bx=Math.round(x+boss.x/r.map.width*width),by=Math.round(y+boss.y/r.map.height*height);ctx.beginPath();ctx.moveTo(bx,by-5);ctx.lineTo(bx+5,by);ctx.lineTo(bx,by+5);ctx.lineTo(bx-5,by);ctx.closePath();ctx.fillStyle='#e9b75a';ctx.fill();ctx.strokeStyle='#101713';ctx.lineWidth=1;ctx.stroke();}canvas.dataset.bossMarker='diamond';
      ctx.fillStyle='#fff1c9';ctx.fillRect(x+r.player.x/r.map.width*width-1,y+r.player.y/r.map.height*height-1,3,3);
      label('DIG • / BOSS ◆', x + width / 2, y - 6, '#efdfb8');
    }
    // Telegraph 2.0: each attack type has its own shape and symbol; the inside fills as the
    // windup charges, and the outline flashes white in the last 0.25 s.
    function telegraphShape(r,e){
      if(e.boss&&(e.pattern===4||e.pattern===5))return{type:'circle',radius:e.attackRadius,at:{x:e.targetX,y:e.targetY},icon:e.pattern===4?'◌':'✺'}; // B1c dive / ASKEKAST at the target
      if(e.pattern===1||e.kind==='compy'&&!e.speciesSkill&&e.pattern!==2)return{type:'cone',angle:Math.atan2(e.facingY,e.facingX),cone:Math.acos(e.boss?.35:.2),radius:e.attackRadius,icon:'▼'};
      if(e.pattern>=2||e.kind==='compy')return{type:'circle',radius:e.attackRadius,icon:e.spin?'↻':e.pattern===3?'≋':'◎'};
      const lane=e.boss||e.speciesSkill,length=e.speciesSkill?C.PLAYER_SPECIES[e.kind].speed*3*C.PLAYER_SPECIES[e.kind].abilityTime:e.boss?(e.kind==='carnotaurus'?(e.bossPhase===2?370:320)*.58:(e.kind==='deinosuchus'?(e.bossPhase===2?390:300):370)*.65):130;
      return{type:'lane',capsule:!!lane,length,half:lane?e.radius+r.player.radius+(e.speciesSkill?5:3):28,icon:'»'};
    }
    function telegraphPath(e,shape,scale){
      const x=Math.round(shape.at?shape.at.x:e.x),y=Math.round(shape.at?shape.at.y:e.y);ctx.beginPath();
      if(shape.type==='cone'){ctx.moveTo(x,y);ctx.arc(x,y,shape.radius*scale,shape.angle-shape.cone,shape.angle+shape.cone);ctx.closePath();}
      else if(shape.type==='circle')ctx.arc(x,y,shape.radius*scale,0,Math.PI*2);
      else if(scale>=1&&shape.capsule){const len=shape.length,ex=Math.round(x+e.chargeX*len),ey=Math.round(y+e.chargeY*len),angle=Math.atan2(e.chargeY,e.chargeX),nx=-e.chargeY*shape.half,ny=e.chargeX*shape.half;ctx.moveTo(x-nx,y-ny);ctx.lineTo(ex-nx,ey-ny);ctx.arc(ex,ey,shape.half,angle-Math.PI/2,angle+Math.PI/2);ctx.lineTo(x+nx,y+ny);ctx.arc(x,y,shape.half,angle+Math.PI/2,angle+Math.PI*1.5);ctx.closePath();}
      else{const len=shape.length*scale,nx=-e.chargeY*shape.half,ny=e.chargeX*shape.half,ex=x+e.chargeX*len,ey=y+e.chargeY*len;ctx.moveTo(x+nx,y+ny);ctx.lineTo(ex+nx,ey+ny);ctx.lineTo(ex-nx,ey-ny);ctx.lineTo(x-nx,y-ny);ctx.closePath();}
    }
    function drawTelegraphs(r){
      for(const e of r.enemies)if(e.mode==='windup'){
        const shape=telegraphShape(r,e),total=e.windupDuration||.8,progress=Math.max(0,Math.min(1,1-e.timer/total)),late=e.timer<.25,base=e.boss||e.miniboss?'#de954a':'#ed7869';
        ctx.save();
        telegraphPath(e,shape,1);ctx.fillStyle=base+'33';ctx.fill();ctx.lineWidth=e.boss?3:2;ctx.strokeStyle=late&&Math.floor(e.timer*20)%2===0?'#fff1c9':base;ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([]);
        telegraphPath(e,shape,shape.type==='circle'?Math.sqrt(progress):progress);ctx.fillStyle=base+(late?'aa':'77');ctx.fill();
        // Symbol in the danger zone works without colour.
        const cx=shape.type==='lane'?e.x+e.chargeX*shape.length*.55:shape.type==='cone'?e.x+Math.cos(shape.angle)*shape.radius*.6:shape.at?shape.at.x:e.x,cy=shape.type==='lane'?e.y+e.chargeY*shape.length*.55:shape.type==='cone'?e.y+Math.sin(shape.angle)*shape.radius*.6:(shape.at?shape.at.y:e.y)+shape.radius*.55;
        ctx.font='bold '+(e.boss?22:16)+'px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle='#151b19';ctx.strokeText(shape.icon,Math.round(cx),Math.round(cy));ctx.fillStyle='#fff1c9';ctx.fillText(shape.icon,Math.round(cx),Math.round(cy));ctx.textBaseline='alphabetic';
        if(e.boss||e.miniboss||e.speciesSkill){const warning=tr(e.attackName||'ANGREB');ctx.font='bold 11px monospace';ctx.lineWidth=3;ctx.strokeStyle='#151b19';ctx.strokeText(warning,Math.round(e.x),Math.round(e.y)-enemyLabelOffset(e)-20);ctx.fillStyle=base;ctx.fillText(warning,Math.round(e.x),Math.round(e.y)-enemyLabelOffset(e)-20);}
        ctx.restore();
      }
    }
    // ===== Overhaul phase 5: water, shadows, ambience, telegraphs, attack effects =====
    const calm=()=>game.save.settings.reducedMotion||reducedMotion.matches;
    function tilePattern(tile){if(!backgrounds.has(tile)){const im=images['assets/tiles/'+tile+'.png'];if(!im){loadImage('assets/tiles/'+tile+'.png');return null;}backgrounds.set(tile,ctx.createPattern(im,'repeat'));}return backgrounds.get(tile);}
    // Shared world-grid corners classify the same water/deep-water geometry as movement.
    // Cache vertices per map; render only viewport tiles, not the whole map each frame.
    const waterVertexCache=new WeakMap();
    function waterCorner(stage,map,x,y){
      let cache=waterVertexCache.get(map);if(!cache){cache=new Map();waterVertexCache.set(map,cache);}
      const key=stage+':'+x+':'+y;if(cache.has(key))return cache.get(key);
      const p={x,y},v=C.isDeepWater(stage,map,p)?2:C.isWater(stage,map,p)?1:0;cache.set(key,v);return v;
    }
    function drawWaterTiles(stage,map,view){
      const signature=JSON.stringify([stage,map.ponds,map.fords,map.riverCurve||map.river]);if(waterVertexCache.get(map)?.signature!==signature){const vertices=new Map();vertices.signature=signature;waterVertexCache.set(map,vertices);}
      const step=32;let count=0,deepCount=0;
      for(let y=Math.floor(view.y/step)*step;y<view.y+canvas.height;y+=step)for(let x=Math.floor(view.x/step)*step;x<view.x+canvas.width;x+=step){
        const corners=[[x,y],[x+step,y],[x+step,y+step],[x,y+step]].map(p=>waterCorner(stage,map,p[0],p[1]));
        const wet=corners.reduce((m,v,i)=>m|(v>0?1<<i:0),0);if(!wet)continue;
        const deep=corners.reduce((m,v,i)=>m|(v===2?1<<i:0),0),family=wet===15&&deep?'water_depth':stage===1?'shore_sand':'shore_soil',mask=family==='water_depth'?deep:wet;
        const path='assets/water_transitions/'+family+'_'+String(mask).padStart(2,'0')+'.png';
        sprite(path,x,y);count++;if(deep)deepCount++;
      }
      canvas.dataset.waterTileCount=count;canvas.dataset.deepWaterTileCount=deepCount;
    }
    function drawRiver(map,time,tiled=false){
      if(!tiled){
      trace(map.river);ctx.strokeStyle='#b98252';ctx.lineWidth=176;ctx.stroke();
      ctx.strokeStyle='#edd0a0';ctx.lineWidth=156;ctx.stroke();
      ctx.strokeStyle='#69a4a0';ctx.lineWidth=116;ctx.stroke();
      const deep=tilePattern('deep_water');ctx.strokeStyle='#2c5a6e';ctx.lineWidth=56;ctx.stroke();
      if(deep){ctx.save();ctx.globalAlpha=.45;ctx.strokeStyle=deep;ctx.stroke();ctx.restore();}
      }
      trace(map.river);
      ctx.save();ctx.setLineDash([3,11]);ctx.lineDashOffset=calm()?0:-time*14;ctx.strokeStyle='#e8ece1';ctx.globalAlpha=.35;ctx.lineWidth=118;ctx.stroke();
      ctx.setLineDash([14,30]);ctx.lineDashOffset=calm()?0:-time*26;ctx.globalAlpha=.25;ctx.lineWidth=30;ctx.strokeStyle='#a2d4c1';ctx.stroke();ctx.restore();
      for(const f of map.fords||[]){
        ctx.save();ctx.translate(f.x,f.y);if(!tiled){ctx.fillStyle='#69a4a0';ctx.beginPath();ctx.ellipse(0,0,78,44,0,0,Math.PI*2);ctx.fill();}
        let seed=(f.x*31+f.y*17)>>>0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
        for(let i=0;i<14;i++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*52;ctx.fillStyle=i%3?'#929387':'#bab8a2';ctx.beginPath();ctx.ellipse(Math.cos(a)*d,Math.sin(a)*d*.6,6+rnd()*6,4+rnd()*3,0,0,Math.PI*2);ctx.fill();}
        ctx.restore();
      }
    }
    function drawPond(pond,time,tiled=false){
      if(pond.baseRadius&&pond.baseRadius>pond.radius+1){ // B4 drought: cracked dry mud where the water was (procedural)
        ctx.beginPath();ctx.ellipse(pond.x,pond.y,pond.baseRadius+10,pond.baseRadius*.7+8,0,0,Math.PI*2);ctx.fillStyle='#8d6042';ctx.fill();
        ctx.save();ctx.strokeStyle='#674333';ctx.lineWidth=1.5;let seed=(pond.x*13+pond.y*7)>>>0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
        ctx.beginPath();for(let i=0;i<14;i++){const a=rnd()*Math.PI*2,r0=pond.radius*(.9+rnd()*.1),r1=pond.baseRadius*(.85+rnd()*.2);ctx.moveTo(pond.x+Math.cos(a)*r0,pond.y+Math.sin(a)*r0*.7);ctx.lineTo(pond.x+Math.cos(a+.15)*r1,pond.y+Math.sin(a+.15)*r1*.7);}ctx.stroke();ctx.restore();
      }
      if(!tiled){
      ctx.beginPath();ctx.ellipse(pond.x,pond.y,pond.radius+10,pond.radius*.7+8,0,0,Math.PI*2);ctx.fillStyle='#b98252';ctx.fill();
      ctx.beginPath();ctx.ellipse(pond.x,pond.y,pond.radius,pond.radius*.7,0,0,Math.PI*2);ctx.fillStyle='#69a4a0';ctx.fill();
      ctx.beginPath();ctx.ellipse(pond.x,pond.y,pond.radius*.45,pond.radius*.7*.45,0,0,Math.PI*2);ctx.fillStyle='#2c5a6e';ctx.fill();const deep=tilePattern('deep_water');if(deep){ctx.save();ctx.globalAlpha=.4;ctx.fillStyle=deep;ctx.fill();ctx.restore();}
      }
      if(!calm()){const k=(time*.6+pond.x*.001)%1;ctx.save();ctx.globalAlpha=.4*(1-k);ctx.strokeStyle='#e8ece1';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(pond.x,pond.y,pond.radius*(.3+.6*k),pond.radius*.7*(.3+.6*k),0,0,Math.PI*2);ctx.stroke();ctx.restore();}
    }
    function shadowUnder(o){
      const scale=o.visualScale||1;let rx,ry,ox=0,oy=3,alpha=.28;
      if(o.player||o.enemy){rx=Math.max(9,(o.radius||14))*1.15*scale;ry=rx*.38;}
      else if(o.canopy){rx=50;ry=20;ox=14;oy=8;alpha=.22;}
      else if(o.path&&/rock|boulder/.test(o.path)){rx=20;ry=8;}
      else return;
      ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#0a0f0c';ctx.beginPath();ctx.ellipse(Math.round(o.x+ox),Math.round(o.y+oy),rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    // Time of day and weather are fixed per level so screenshots and replays look the same.
    const LEVEL_LIGHT=[['#000000',0],['#000000',0],['#a2d4c1',.06],['#ffe8b0',.05],['#ffd28a',.08],['#de954a',.10],['#913b32',.14],['#3b2a4a',.22]];
    function weather(r){return r.map.weather||(r.map.weather=(r.map.seed%5===0&&r.stage<3)?'rain':r.stage===3?'ash':r.stage===2?'dust':'pollen');}
    function worldAmbience(r,view,time){
      if(calm())return;
      // Cloud shadows drifting over the ground.
      ctx.save();ctx.fillStyle='#0a0f0c';ctx.globalAlpha=.08;
      for(let i=0;i<6;i++){const span=r.map.width+800,x=((i*977+time*(10+i*2))%span+span)%span-400,y=(i*613)%r.map.height;if(x<view.x-400||x>view.x+canvas.width+400||y<view.y-300||y>view.y+canvas.height+300)continue;ctx.beginPath();ctx.ellipse(x,y,260+i*30,120+i*12,.3,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
    function screenAmbience(r,time){
      const w=canvas.width,h=canvas.height,[tint,alpha]=LEVEL_LIGHT[Math.min(LEVEL_LIGHT.length-1,r.levelIndex||0)],kind=weather(r);
      if(alpha){ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation='multiply';ctx.fillStyle=tint;ctx.fillRect(0,0,w,h);ctx.restore();}
      if(C.FEATURES.dayNight&&r.darkness>0){ // B2 night: procedural darkening with a soft light around the player (night palette = A6 asset)
        const px=r.player.x-r.view.x,py=r.player.y-r.view.y,inner=110,outer=Math.max(w,h)*.55,g=ctx.createRadialGradient(px,py,inner,px,py,outer);
        g.addColorStop(0,'rgba(21,27,25,0)');g.addColorStop(1,'rgba(21,27,25,'+(.62*r.darkness).toFixed(3)+')');
        ctx.save();ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalAlpha=.18*r.darkness;ctx.globalCompositeOperation='multiply';ctx.fillStyle='#3c7180';ctx.fillRect(0,0,w,h);ctx.restore();
      }
      if(!calm()){
        ctx.save();
        const count=kind==='rain'?90:kind==='ash'?60:36;
        for(let i=0;i<count;i++){
          const sx=(i*7919)%w,sy=(i*104729)%h,speed=kind==='rain'?520:kind==='ash'?22:14;
          let x=(sx+time*(kind==='rain'?-120:kind==='ash'?-8:10+Math.sin(i)*6))%w,y=(sy+time*speed)%h;if(x<0)x+=w;if(y<0)y+=h;
          if(kind==='rain'){ctx.strokeStyle='#a2d4c1';ctx.globalAlpha=.35;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+12);ctx.stroke();}
          else{ctx.fillStyle=kind==='ash'?'#929387':kind==='dust'?'#d4a36c':'#ded392';ctx.globalAlpha=kind==='ash'?.55:.4;const size=kind==='ash'?2:1+(i%2);ctx.fillRect(Math.round(x+Math.sin(time+i)*6),Math.round(y),size,size);}
        }
        if(r.stage===0&&kind!=='rain')for(let i=0;i<10;i++){const x=((i*271+time*18)%w+w)%w,y=((i*157+time*30)%h+h)%h,a=time*2+i;ctx.save();ctx.translate(x+Math.sin(a)*10,y);ctx.rotate(a);ctx.fillStyle=i%2?'#799447':'#b98252';ctx.globalAlpha=.7;ctx.fillRect(-2,-1,4,2);ctx.restore();}
        ctx.restore();
      }
      const v=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,Math.max(w,h)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(5,8,6,.5)');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
    }
    const ATTACK_STYLE={compy:'bite',velociraptor:'claws',utahraptor:'claws',carnotaurus:'bite',baryonyx:'bite',tyrannosaurus:'bite',triceratops:'horns',pachycephalosaurus:'dome',gallimimus:'peck',ankylosaurus:'tail',deinosuchus:'bite',parasaurolophus:'kick'};
    function attackFX(kind,x,y,dx,dy,progress,size=1){
      const style=ATTACK_STYLE[kind]||'bite',a=Math.atan2(dy,dx);
      if(style==='bite'){sprite('assets/effects/bite_slash_00'+Math.min(3,Math.floor(progress*4))+'.png',x+dx*36*size,y+dy*36*size,1,false,0,size);return;}
      ctx.save();ctx.translate(Math.round(x+dx*34*size),Math.round(y+dy*34*size));ctx.rotate(a);ctx.globalAlpha=1-progress*.6;ctx.lineCap='round';
      if(style==='claws'){ctx.strokeStyle='#fff1c9';ctx.lineWidth=2.5;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-12*size,(i*7-8)*size);ctx.lineTo((10+progress*8)*size,(i*7+8)*size);ctx.stroke();}}
      else if(style==='horns'){ctx.fillStyle='#fff1c9';for(const off of [-8,8]){ctx.beginPath();ctx.moveTo(-6*size,(off-4)*size);ctx.lineTo((18+progress*14)*size,off*size);ctx.lineTo(-6*size,(off+4)*size);ctx.closePath();ctx.fill();}ctx.strokeStyle='#de954a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(10*size,0,22*size,-.9,.9);ctx.stroke();}
      else if(style==='dome'){ctx.strokeStyle='#fff1c9';ctx.lineWidth=3;for(let i=0;i<8;i++){const b=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(b)*6*size,Math.sin(b)*6*size);ctx.lineTo(Math.cos(b)*(14+progress*10)*size,Math.sin(b)*(14+progress*10)*size);ctx.stroke();}}
      else if(style==='peck'){ctx.strokeStyle='#fff1c9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8*size,-8*size);ctx.lineTo(8*size,0);ctx.lineTo(-8*size,8*size);ctx.stroke();}
      else if(style==='tail'){ctx.strokeStyle='#efdfb8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(-34*size,0,40*size,-1.2-progress*2,-1.2);ctx.stroke();}
      else{ctx.strokeStyle='#fff1c9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,10*size,-1,1);ctx.stroke();}
      ctx.restore();
    }
    const MODE_ICON={sleep:['z','#a2d4c1'],track:['∴','#ed7869'],rally:['♪','#e9b75a'],drink:['≈','#a2d4c1'],graze:['❀','#b6c0a9'],rest:['z','#b6c0a9'],warning:['!','#e9b75a'],wary:['?','#e9b75a'],flee:['»','#bbd899'],steal:['$','#de954a'],hunt:['♨','#ed7869'],scavenge:['☠','#b6c0a9'],watch:['…','#b6c0a9'],return:['↩','#b6c0a9']};
    function draw() {
      resize();shell.querySelector('.meat-progress').style.bottom=(shell.querySelector('.run-info').offsetHeight+24)+'px';
      if (!ready) { ctx.fillStyle = '#151b19'; ctx.fillRect(0, 0, canvas.width, canvas.height); return; }
      if(menuScene()&&!renderOverride){ctx.imageSmoothingEnabled=false;drawMenu();return;}
      canvas.dataset.scene='game';
      const r = renderOverride || game.run, stage = r ? r.stage : 0;
      ctx.imageSmoothingEnabled = false; ctx.save();
      if (r && r.shake > 0 && game.save.settings.shake && !game.save.settings.reducedMotion && !reducedMotion.matches) ctx.translate(Math.round(Math.sin(r.seconds * 110) * 3), Math.round(Math.cos(r.seconds * 90) * 3));
      const map = r ? r.map : previewMap, view = r ? r.view : { x: 0, y: 0 };
      ctx.translate(-view.x, -view.y);
      canvas.dataset.cameraX = view.x; canvas.dataset.cameraY = view.y;
      background(stage, map, view);
      if(r)worldAmbience(r,view,r.seconds);
      if (r) {
        if (C.FEATURES.scentTrails && r.tracks && r.tracks.length) { // B3 tracks: procedural paired prints, fading; blood scent in red
          const fade = C.isRaining(r) ? C.TRACKS.rainFade : C.TRACKS.fade, x0 = view.x - 20, y0 = view.y - 20, x1 = view.x + canvas.width + 20, y1 = view.y + canvas.height + 20;
          // Batched into ≤ 8 paths (4 fade steps × 2 colours) so a full trail is a handful of draw calls on mobile.
          const buckets = new Map();
          for (const p of r.tracks) { if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue; const k = Math.ceil(4 * Math.max(0, 1 - (r.seconds - p.t) / fade)); if (k <= 0) continue;
            const key = (p.w ? 'b' : 'd') + k; if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(p); }
          for (const [key, list] of buckets) { ctx.globalAlpha = .55 * (+key.slice(1)) / 4; ctx.fillStyle = key[0] === 'b' ? '#913b32' : '#151b19'; ctx.beginPath(); for (const p of list) { ctx.rect(p.x - 6, p.y - 2, 4, 3); ctx.rect(p.x + 2, p.y + 1, 4, 3); } ctx.fill(); }
          ctx.globalAlpha = 1;
        }
        for (const p of r.decals) { ctx.fillStyle = '#913b32'; ctx.globalAlpha = Math.min(.6, p.life * .25); ctx.fillRect(Math.round(p.x) - 5, Math.round(p.y) - 3, 10, 6); ctx.fillRect(Math.round(p.x) + 6, Math.round(p.y) + 4, 3, 2); } ctx.globalAlpha = 1;
        for (const p of r.pickups) {
          if (p.kind === 'meat') {
            const rarity = C.MEAT_RARITIES[p.rarity || 0];
            ctx.strokeStyle = rarity.color; ctx.lineWidth = 2 + (p.rarity || 0); ctx.beginPath(); ctx.ellipse(Math.round(p.x), Math.round(p.y), 18, 10, 0, 0, Math.PI * 2); ctx.stroke();
            label(rarity.symbol + ' ' + rarity.name + ' +' + p.value, p.x, p.y - 24, rarity.color);
          }
          if(p.kind==='fish'||p.corpseId!==undefined)continue;
          sprite(p.kind === 'meat' ? 'assets/pickups/meat.png' : p.kind === 'dna' ? 'assets/pickups/dna_pickup.png' : 'assets/ui/health.png', p.x, p.y);
        }
      }
      if(r)for(const school of map.fishSchools||[])if(school.stock>0&&C.isWater(stage,map,school,14)){sprite('assets/fishing/fish_'+String(Math.floor(r.seconds*4)%4).padStart(3,'0')+'.png',school.x,school.y);if(r.species==='baryonyx'&&Math.hypot(school.x-r.player.x,school.y-r.player.y)<200)label('FISK · '+school.stock+' · '+keyLabel('eat')+' FISK / '+keyLabel('ability')+' STØD',school.x,school.y-42,'#a2d4c1');}
      const objects = map.rocks.map(p => ({ ...p, path: 'assets/environment/rock.png' }));
      objects.push(...map.decorations.filter(o=>o.x>=view.x-200&&o.x<=view.x+canvas.width+200&&o.y>=view.y-200&&o.y<=view.y+canvas.height+200));
      if(r)for(const event of map.events)if(!event.claimed&&Math.hypot(event.x-r.player.x,event.y-r.player.y)<400){objects.push({...event,path:event.type==='spring'?'assets/props/flower_bush.png':'assets/props/skull.png'});label(event.type==='spring'?'✚ HELENDE KILDE':'✦ SJÆLDENT FOSSIL',event.x,event.y-30,'#bbd899');}
      if (r) for (const site of map.sites) if (!site.claimed && site.type !== 'rare') {
        objects.push({ ...site, path: 'assets/props/' + (site.type === 'fossil' ? 'skull' : 'nest_eggs') + '.png' });
        if (Math.hypot(site.x-r.player.x,site.y-r.player.y)<160) label((site.type === 'fossil' ? 'FOSSIL' : site.guardDefeated?'FORLADT REDE':'BEVOGTET REDE')+' · E',site.x,site.y-42,'#e9b75a');
      }
      if(r&&['herbivore','omnivore'].includes(C.PLAYER_SPECIES[r.species].diet))for(const plant of map.forage)if(!plant.depleted){objects.push({...plant,edible:true,path:plant.foodType&&plant.foodType!=='herb'?'assets/forage/'+(plant.toxic?'toxic_mushrooms':plant.foodType)+'_'+((String(plant.id).length+Math.floor(plant.x))%2)+'.png':'assets/ecology/herb.png'});if(Math.hypot(plant.x-r.player.x,plant.y-r.player.y)<180)label((plant.toxic?'⚠ GIFTIGE SVAMPE ':({fruit:'FRUGT ',roots:'RØDDER ',mushrooms:'SVAMPE '}[plant.foodType]||'❧ '))+plant.value+' · '+keyLabel('eat')+' SPIS',plant.x,plant.y-42,C.MEAT_RARITIES[plant.rarity].color);}
      if (r) {
        for (const e of r.enemies) {
          const attacking=['charge','bite','slam'].includes(e.mode), winding=e.mode==='windup';
          const state=attacking||winding?'attack':e.hit>0?'hurt':e.moving?(e.mode==='flee'||e.mode==='burst'?'run':'walk'):'idle';
          const frame=state==='attack'?(winding?Math.min(2,Math.floor((1-e.timer/(e.windupDuration||.6))*3)):(e.mode==='charge'?Math.min(5,3+Math.max(0,Math.floor((1-e.timer/(e.speciesSkill?C.PLAYER_SPECIES[e.kind].abilityTime:e.boss?(e.kind==='carnotaurus'?.58:.65):.55))*3))):e.timer>(e.boss?.12:.1)?2:Math.min(5,3+Math.floor((1-e.timer/(e.boss?.12:.1))*3)))):state==='hurt'?Math.min(1,Math.floor((.15-e.hit)*8)):state==='idle'?(C.FEATURES.stableIdle?0:Math.floor(e.poseTime*4)%4):C.locomotionFrame(e.gaitPhase??e.walk*(state==='run'?12:8)/6,e.hp,e.maxHP);
          const behavior=authoredBehaviorPath(e.kind,state,e.direction,frame,e.hp,e.maxHP,e.mode==='rest'&&(e.naturalTime||0)%22<8&&C.isWater(r.stage,map,e,-70)?'drink':e.mode,e.naturalTime||0);
          const path=behavior&&catalog[behavior]&&catalog[behavior].runtime_enabled!==false?behavior:enemyFrame(e.kind,state,e.direction,frame);
          objects.push({...e,enemy:e,path,rotation:0});
        }
        for(const corpse of r.corpses||[]){const stage=corpse.age>=(corpse.foodLifetime||18)?'skeleton':corpse.age>=7?'decayed':null,prop=stage?'assets/corpses/'+corpse.kind+'_'+stage+'_'+corpse.direction+'_'+(corpse.poseVariant||0)+'.png':null;objects.push({...corpse,corpse:true,path:prop&&catalog[prop]?prop:enemyFrame(corpse.kind,'death',corpse.direction,Math.min(5,Math.floor(corpse.age*8)))});}
        const p = r.player;
        const animationState = r.deathTime >= 0 ? 'death' : r.attack ? 'attack' : r.hurt > 0 ? 'hurt' : p.moving ? (r.pounce > 0 ? 'run' : 'walk') : 'idle';
        const animationDirection = r.attack && animationState === 'attack' ? r.attack.facing : p.facing;
        const animationFrame = animationState === 'death' ? Math.min(5, Math.floor(r.deathTime * 8)) : animationState === 'hurt' ? Math.min(1, Math.floor((.25 - r.hurt) * 8)) : animationState === 'attack' ? Math.min(5, Math.floor(r.attack.elapsed / r.attack.duration * 6)) : animationState === 'idle' ? (C.FEATURES.stableIdle?0:Math.floor(r.seconds * 4) % 4) : C.locomotionFrame(p.gaitPhase??p.walk*(animationState==='run'?12:8)/6,r.health,r.maxHealth);
        const behavior=authoredBehaviorPath(r.species,animationState,animationDirection,animationFrame,r.health,r.maxHealth);
        const fullPath = behavior&&catalog[behavior]&&catalog[behavior].runtime_enabled!==false?behavior:C.playerFrame(r.species,animationState,animationDirection,animationFrame);
        const playerPath = catalog[fullPath]&&(images[fullPath]||!fullPath.startsWith('assets/species_attacks/'))?fullPath:C.legacyPlayerFrame(r.species,animationState,animationDirection,animationFrame);
        canvas.dataset.playerAnimation = animationState + ':' + animationFrame;
        const resultPreview = shell.querySelector('.death-preview'); if (resultPreview && catalog[fullPath]) resultPreview.src = displayImageURL(fullPath);
        canvas.dataset.playerSpecies = r.species;
        canvas.dataset.playerSprite = playerPath;
        canvas.dataset.playerState = r.attack ? 'Bite_' + r.attack.facing : (p.moving ? 'Walk_' : 'Idle_') + p.facing;
        if (C.FEATURES.raptorPack) for (const a of r.raptors || []) { // B5 raptors drawn with the existing Velociraptor frames
          const dir = Math.abs(a.facingX) > Math.abs(a.facingY) ? (a.facingX > 0 ? 'E' : 'W') : (a.facingY > 0 ? 'S' : 'N'), biting = a.mode === 'attack' && a.cooldown > C.PACK.cooldown - .3;
          const state = biting ? 'attack' : a.moving ? (a.mode === 'flee' ? 'run' : 'walk') : 'idle', frame = biting ? Math.min(5, Math.floor((C.PACK.cooldown - a.cooldown) / .05)) : a.moving ? Math.floor(a.walk * 6) % 6 : Math.floor(r.seconds * 4) % 4;
          objects.push({ x: a.x, y: a.y, radius: a.radius, raptor: a, path: C.playerFrame('velociraptor', state, dir, frame) });
        }
        objects.push({ ...p, visualScale:['tyrannosaurus','deinosuchus'].includes(r.species)?2:1, player: true, path: playerPath });
      } else objects.push({ x: 780, y: 390, path: C.playerFrame(game.save.selectedSpecies,'idle','S',0) });
      for(let i=objects.length-1;i>=0;i--)if(objects[i].x<view.x-200||objects[i].x>view.x+canvas.width+200||objects[i].y<view.y-200||objects[i].y>view.y+canvas.height+200)objects.splice(i,1);
      objects.sort((a, b) => a.y - b.y);
      for (const o of objects) {
        if (o.x < view.x - 160 || o.y < view.y - 160 || o.x > view.x + canvas.width + 160 || o.y > view.y + canvas.height + 160) continue;
        shadowUnder(o);
        if (o.player || o.enemy) { ctx.strokeStyle = o.player ? '#69a4a0' : o.enemy.boss ? '#e9b75a' : o.enemy.damage ? '#ed7869aa' : '#8eaa6088'; ctx.lineWidth = o.player ? 3 : 1.5; ctx.beginPath(); ctx.ellipse(Math.round(o.x), Math.round(o.y), o.player ? 24 : o.enemy.boss ? o.radius + 14 : o.radius + 6, 10, 0, 0, Math.PI * 2); ctx.stroke(); }
        if (o.enemy && o.enemy.boss) { ctx.strokeStyle = '#e9b75a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(Math.round(o.x), Math.round(o.y), 35, 17, 0, 0, Math.PI * 2); ctx.stroke(); }
        if (o.edible) { const t = (r ? r.seconds : 0) * 3 + o.x * .01, glow = .45 + .25 * Math.sin(t); ctx.save(); ctx.globalAlpha = glow; ctx.strokeStyle = C.MEAT_RARITIES[o.rarity || 0].color === '#e8ece1' ? '#bbd899' : C.MEAT_RARITIES[o.rarity || 0].color; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(Math.round(o.x), Math.round(o.y) + 2, 20, 8, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = '#bbd899'; ctx.font = '700 13px monospace'; ctx.textAlign = 'center'; ctx.fillText('❧', Math.round(o.x), Math.round(o.y) - 30 + Math.round(Math.sin(t) * 2)); ctx.restore(); }
        const alpha = o.corpse ? Math.max(0,Math.min(1,((o.lifetime||30)-o.age)/5)) : o.player && r.hidden ? .6 : o.foliage && r && Math.hypot(o.x - r.player.x, o.y - r.player.y) < 110 ? .25 : o.player && r.invulnerable > 0 && Math.floor(r.invulnerable * 20) % 2 ? .45 : 1;
        sprite(o.path, o.x, o.y, o.enemy && o.enemy.submerged && o.enemy.mode === 'windup' && o.enemy.pattern === 4 ? alpha * .3 : alpha, false, o.rotation, o.visualScale || 1,o.enemy?(o.enemy.rare?'albino':o.enemy.elite?'elite':o.enemy.sex==='male'?'male':null):o.corpse?(o.variant||null):o.player&&game.save.skin!=='classic'&&C.skinFits(game.save.skin,r?r.species:game.save.selectedSpecies)?game.save.skin:null);
        if (o.player && r.jonas) { ctx.fillStyle = '#e9b75a'; const x = Math.round(o.x), y = Math.round(o.y) - 46; ctx.fillRect(x - 9, y, 18, 5); ctx.fillRect(x - 9, y - 5, 4, 5); ctx.fillRect(x - 2, y - 7, 4, 7); ctx.fillRect(x + 5, y - 5, 4, 5); }
        // Less text: names only for special animals or nearby ones; behaviour as a small icon.
        if (o.raptor) { const a = o.raptor, d = r ? Math.hypot(a.x - r.player.x, a.y - r.player.y) : 1e9;
          if (a.ally) { ctx.save(); ctx.fillStyle = '#a2d4c1'; ctx.strokeStyle = '#151b19'; ctx.lineWidth = 2; const mx = Math.round(a.x), my = Math.round(a.y) - 46; ctx.beginPath(); ctx.moveTo(mx, my - 5); ctx.lineTo(mx + 5, my); ctx.lineTo(mx, my + 5); ctx.lineTo(mx - 5, my); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
            ctx.fillStyle = '#151b19'; ctx.fillRect(Math.round(a.x) - 14, Math.round(a.y) + 14, 28, 3); ctx.fillStyle = a.mode === 'flee' ? '#de954a' : '#a2d4c1'; ctx.fillRect(Math.round(a.x) - 14, Math.round(a.y) + 14, Math.round(28 * a.hp / a.maxHP), 3); }
          else if (d < 300) { const fed = r.pickups.some(p => p.corpseId !== undefined && p.value > 0 && Math.hypot(p.x - a.x, p.y - a.y) < C.PACK.meatReach); label(d < 160 && fed ? 'VILD RAPTOR · ' + keyLabel('interact') + ' FODR' : d < 160 ? 'VILD RAPTOR · LÆG KØD HER' : 'VILD RAPTOR', a.x, a.y - 44, '#a2d4c1'); } }
        if (o.enemy) { const e = o.enemy, near = r && Math.hypot(e.x - r.player.x, e.y - r.player.y) < 230, special = e.boss || e.elite || e.rare || e.miniboss;
          if ((special || near) && !menuScene()) label((e.boss ? '◆ ' : e.miniboss ? '☠ ' : e.elite ? '★ ' : e.rare ? '✦ ' : e.damage ? '⚠ ' : '') + (e.rivalName || C.SPECIES_LABELS[e.kind]), o.x, o.y - enemyLabelOffset(e), e.miniboss ? '#e9b75a' : e.damage ? '#ed7869' : '#8eaa60');
          const icon = MODE_ICON[e.mode]; if (icon && !e.boss && !(near && /^assets\/behavior(?:_native)?\//.test(o.path) && ['graze','drink','rest'].includes(e.mode))) { ctx.save(); ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#101713'; const iy = Math.round(o.y - enemyLabelOffset(e) - (special || near ? 16 : 0)); ctx.strokeText(icon[0], Math.round(o.x), iy); ctx.fillStyle = icon[1]; ctx.fillText(icon[0], Math.round(o.x), iy); ctx.restore(); } }
        if (o.enemy && o.enemy.boss) {
          if (o.enemy.mode === 'recover') {
            const e = o.enemy; ctx.strokeStyle = '#a2d4c1'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(Math.round(e.x - e.facingX * 24), Math.round(e.y - e.facingY * 24), 18, 0, Math.PI * 2); ctx.stroke(); label('ÅBEN FLANKE · +25 %', e.x, e.y - enemyLabelOffset(e) - 18, '#a2d4c1');
          } else if (o.enemy.mode === 'broken') label('BRUDT · ANGRIB NU', o.x, o.y - enemyLabelOffset(o.enemy) - 18, '#dfbc52');
          else if (o.enemy.mode === 'enrage') label('RASERI · FASE 2', o.x, o.y - enemyLabelOffset(o.enemy) - 18, '#de954a');
        }
        if(o.corpse&&o.age>7&&!o.path.startsWith('assets/corpses/')&&images[o.path]){if(!decomposition[o.path]){const layer=document.createElement('canvas'),im=images[o.path];layer.width=im.width;layer.height=im.height;const lc=layer.getContext('2d');lc.drawImage(im,0,0);lc.globalCompositeOperation='source-in';lc.fillStyle='#151b19';lc.fillRect(0,0,layer.width,layer.height);decomposition[o.path]=layer;}const im=decomposition[o.path],scale=o.visualScale||1,meta=catalog[o.path];ctx.globalAlpha=alpha*Math.min(.65,(o.age-7)/8);ctx.drawImage(im,Math.round(o.x)-meta.origin[0]*scale,Math.round(o.y)-meta.origin[1]*scale,im.width*scale,im.height*scale);ctx.globalAlpha=1;}
        if (o.enemy && o.enemy.hit > 0) sprite(o.path, o.x, o.y, .7 * o.enemy.hit / .15, true, o.rotation, o.visualScale || 1);
        if (o.enemy && o.enemy.hp < o.enemy.maxHP && !o.enemy.boss) { ctx.fillStyle = '#151b19'; ctx.fillRect(Math.round(o.x) - 20, Math.round(o.y) - enemyLabelOffset(o.enemy) + 7, 40, 4); ctx.fillStyle = '#c45f45'; ctx.fillRect(Math.round(o.x) - 20, Math.round(o.y) - enemyLabelOffset(o.enemy) + 7, Math.round(40 * o.enemy.hp / o.enemy.maxHP), 4); }
      }
      if(r)for(const c of r.ashClouds||[])if(c.until>r.seconds){const fade=Math.min(1,c.until-r.seconds);ctx.save();ctx.globalAlpha=.32*fade;ctx.fillStyle='#626861';for(let i=0;i<5;i++){const a=i*1.26+c.x*.01;ctx.beginPath();ctx.arc(c.x+Math.cos(a)*c.radius*.35,c.y+Math.sin(a)*c.radius*.25,c.radius*.55,0,Math.PI*2);ctx.fill();}ctx.restore();} // B1c ash clouds (procedural)
      if(r)drawTelegraphs(r);
      if(r&&C.PLAYER_SPECIES[r.species].diet!=='herbivore')for(const food of r.pickups.filter(p=>p.corpseId!==undefined)){const corpse=r.corpses.find(c=>c.id===food.corpseId);if(corpse)label(C.MEAT_RARITIES[food.rarity].symbol+' '+food.value+(corpse.age>=7?' · FORDÆRVER':' · FRISK')+' · '+keyLabel('eat')+' SPIS',food.x,food.y+enemyLabelOffset(corpse),C.MEAT_RARITIES[food.rarity].color);}
      for(const ambient of map.ambience || [])if(ambient.x>view.x-40&&ambient.x<view.x+canvas.width+40&&ambient.y>view.y-40&&ambient.y<view.y+canvas.height+40)insect(ambient,r?r.seconds:0);
      if (r) {
        if (r.species === 'ankylosaurus' && r.pounce > 0) { ctx.strokeStyle='#a2d4c1'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(Math.round(r.player.x),Math.round(r.player.y),38,0,Math.PI*2); ctx.stroke(); }
        if (r.species === 'ankylosaurus' && r.bite > 0) { ctx.strokeStyle='#efdfb8'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(Math.round(r.player.x),Math.round(r.player.y),C.PLAYER_SPECIES.ankylosaurus.range+10*r.mutations.reach+12*r.mutations.sweep,0,Math.PI*2); ctx.stroke(); }
        if(!renderOverride){ctx.fillStyle='#69a4a0'; ctx.strokeStyle='#101713'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(Math.round(r.player.x)-7,Math.round(r.player.y)-84); ctx.lineTo(Math.round(r.player.x)+7,Math.round(r.player.y)-84); ctx.lineTo(Math.round(r.player.x),Math.round(r.player.y)-73); ctx.closePath(); ctx.fill(); ctx.stroke();}
        if(!renderOverride)label(r.jonas ? 'DIG · JONAS' : 'DIG · ' + C.PLAYER_SPECIES[r.species].name, r.player.x, r.player.y - 100, '#69a4a0');
        if (r.bite > 0) {
          const [dx, dy] = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[r.biteFacing];
          attackFX(r.species, r.player.x, r.player.y, dx, dy, 1 - r.bite / .12, r.species === 'tyrannosaurus' ? 1.6 : r.species === 'compy' ? .6 : 1);
        }
        for (const e of r.enemies) if ((e.mode === 'bite' || e.mode === 'slam') && e.attackHit && e.timer > 0) attackFX(e.kind, e.x, e.y, e.facingX, e.facingY, Math.min(1, 1 - e.timer / .18), (e.visualScale || 1) * (e.kind === 'compy' ? .6 : 1));
        for (const p of (game.save.settings.reducedMotion||reducedMotion.matches?[]:r.particles)) { ctx.fillStyle = p.kind === 'dust' ? '#ded392' : p.kind === 'bubble' ? '#a2d4c1' : p.kind === 'ash' ? '#929387' : '#c6663c'; ctx.globalAlpha = Math.min(1, p.life / p.maxLife * 1.5); ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); } ctx.globalAlpha = 1;
        canvas.dataset.hitStop = r.hitStop > 0 ? 'true' : 'false'; canvas.dataset.particles = r.particles.length;
        ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
        for (const e of r.effects) {
          const total = e.crit ? .8 : .55, t = 1 - Math.max(0, e.life) / total, x = Math.round(e.x), y = Math.round(e.y - 55 - t * (e.crit ? 30 : 20));
          const size = e.crit ? Math.round(18 + 6 * Math.max(0, 1 - t * 4)) : 11; ctx.font = 'bold ' + size + 'px monospace';
          ctx.lineWidth = e.crit ? 4 : 3; ctx.strokeStyle = '#101713'; ctx.strokeText(tr(e.text), x, y);
          ctx.fillStyle = e.color || '#ffe0a0'; ctx.fillText(tr(e.text), x, y);
        }
        ctx.font = 'bold 12px monospace';
      }
      if(r&&!renderOverride){const px=Math.round(r.player.x),py=Math.round(r.player.y+78);ctx.fillStyle='#101713';ctx.fillRect(px-20,py,40,5);ctx.fillRect(px-20,py+7,40,5);ctx.fillStyle='#efdfb8';ctx.fillRect(px-19,py+1,38*Math.max(0,1-r.attackCooldown/(r.attackDuration||C.PLAYER_SPECIES[r.species].cooldown)),3);ctx.fillStyle=r.stamina<C.abilityCost(r)?'#de954a':'#69a4a0';ctx.fillRect(px-19,py+8,38*Math.max(0,1-r.pounceCooldown/(r.abilityCooldownDuration||C.PLAYER_SPECIES[r.species].abilityCooldown)),3);}
      ctx.restore();
      if (r) screenAmbience(r, r.seconds);
      if (renderOverride) return;
      if (r) minimap(r);
      if (!r) return;
      shell.querySelector('.health i').style.width = Math.max(0, 100 * r.health / r.maxHealth) + '%';
      shell.querySelector('#health-label').textContent = Math.ceil(r.health) + '/' + Math.ceil(r.maxHealth)+(r.shield>0?' +'+Math.ceil(r.shield)+' SKJOLD':'');
      shell.querySelector('.stamina i').style.width = r.stamina + '%';
      { const cost = C.abilityCost(r), staminaBar = shell.querySelector('.stamina'); shell.querySelector('.cost-mark').style.left = Math.min(100, cost) + '%'; staminaBar.dataset.low = String(r.stamina < cost); staminaBar.dataset.winded = String((r.winded || 0) > 0);
        shell.querySelector('.health .segments').style.backgroundSize = (100 * 20 / r.maxHealth) + '% 100%'; shell.querySelector('.health').dataset.low = String(r.health < r.maxHealth * .3);
        const diet = C.PLAYER_SPECIES[r.species].diet; shell.querySelector('#food-chip').textContent = (diet === 'herbivore' ? '❧ ' : diet === 'piscivore' ? '≈ ' : '◆ ') + r.meat + '/' + game.currentLevel().target;
        shell.querySelector('#dna-chip').textContent = '⬡ ' + r.dna; const zone = r.zone !== null && r.zone !== undefined && r.map.zones ? r.map.zones[r.zone] : null; shell.querySelector('#zone-chip').textContent = zone ? zone.name : '';
        drawPortrait(r); }
      canvas.dataset.surface=r.surface;canvas.dataset.hidden=String(r.hidden);shell.querySelector('#terrain-label').textContent=r.hidden?'SKJULT · angrib for at afsløre dig':({water:['baryonyx','deinosuchus'].includes(r.species)?'VAND · FLODJÆGER':'VAND · 60 % fart',mud:'MUDDER · 75 % fart',bush:'BUSKE · stå stille / hold C',ground:''})[r.surface];
      shell.querySelector('#biome-label').textContent = 'BANE ' + (r.levelIndex + 1) + '/' + r.campaign.length + ' · ' + game.currentLevel().name;
      shell.querySelector('#meat-label').textContent = r.bossSpawned ? 'BOSSEN ER HER' : r.meat + ' / ' + game.currentLevel().target + ({herbivore:' PLANTEFØDE',omnivore:' FØDE',piscivore:' FISK / KØD',carnivore:' KØD'})[C.PLAYER_SPECIES[r.species].diet];
      const progress = shell.querySelector('.meat-progress'), percent = Math.min(100, Math.floor(r.xp / r.nextXP * 100));
      progress.querySelector('span').textContent = percent + ' % · ' + r.xp + ' / ' + r.nextXP + ' stk';
      progress.querySelector('i').style.width = percent + '%';
      progress.querySelector('small').textContent = Math.max(0, r.nextXP - r.xp) + ' fødeværdi til level ' + (r.level + 1);
      shell.querySelector('#level-label').textContent = 'LEVEL ' + r.level + ' · ' + r.xp + '/' + r.nextXP + ' XP';
      shell.querySelector('#dna-label').textContent = '+' + r.dna + ' DNA · ' + r.kills + ' JAGTER';
      shell.querySelector('#time-label').textContent = (C.FEATURES.dayNight ? (r.night ? '☾ ' : '☀ ') : '') + timeLabel(r.seconds); // B2 sun/moon
      const boss = r.enemies.find(e => e.boss), bossHUD = shell.querySelector('.boss-hud');
      shell.querySelector('#skill-label').textContent = C.PLAYER_SPECIES[r.species].skill + ' · ' + (r.pounceCooldown > 0 ? r.pounceCooldown.toFixed(1) + ' s' : keyLabel('ability')+' KLAR');
      const config=C.PLAYER_SPECIES[r.species],cost=C.abilityCost(r),attackFraction=1-r.attackCooldown/(r.attackDuration||config.cooldown),abilityFraction=1-r.pounceCooldown/(r.abilityCooldownDuration||config.abilityCooldown);
      shell.querySelector('#attack-fill').style.width=Math.max(0,Math.min(100,attackFraction*100))+'%';shell.querySelector('#ability-fill').style.width=Math.max(0,Math.min(100,abilityFraction*100))+'%';
      shell.querySelector('#attack-ready').textContent=keyLabel('attack')+' · '+(r.attackCooldown>0?r.attackCooldown.toFixed(1)+' s':'KLAR');shell.querySelector('#ability-ready').textContent=keyLabel('ability')+' · '+(r.pounceCooldown>0?r.pounceCooldown.toFixed(1)+' s':r.stamina<cost?'MANGLER STAMINA':'KLAR')+' · '+cost+' ⚡';
      shell.querySelector('.action-cooldowns').dataset.ready=String(r.pounceCooldown===0&&r.stamina>=cost);
      bossHUD.hidden = !boss || !['playing', 'paused', 'mutation'].includes(game.phase);
      if (boss) { bossHUD.querySelector('b').textContent = (boss.bossName || game.currentLevel().bossName) + (' · FASE ' + boss.bossPhase) + ' · ' + Math.round(Math.hypot(boss.x - r.player.x, boss.y - r.player.y) / 32) + ' m · find ◆ på kortet' + (boss.mode === 'stalk' ? ' · LURER VED BREDDEN' : boss.mode === 'leash' ? ' · VENDER HJEM' : boss.mode === 'reposition' ? ' · SØGER EN VEJ' : ''); bossHUD.dataset.bossPhase = boss.bossPhase; const tip = bossHUD.querySelector('.boss-tip'); tip.hidden = false; tip.textContent = boss.mode === 'recover' ? 'ÅBEN FLANKE · +50 % SKADE BAGFRA' : boss.mode === 'enrage' ? ({carnotaurus:'FASE 2 · DOBBELT STORMLØB OG TRAMP',deinosuchus:'FASE 2 · HURTIGT BAGHOLD OG STØRRE HALEBØLGE',triceratops:'FASE 2 · DOBBELT HORNSTORM',tyrannosaurus:'FASE 2 · DOBBELTBID OG BRØL',pachycephalosaurus:'FASE 2 · HURTIGERE KUPPELSTØD',baryonyx:'FASE 2 · HURTIGERE KLØGAB',ankylosaurus:'FASE 2 · HURTIGERE HALESVING'})[boss.kind] : boss.mode === 'windup' ? boss.attackName : 'UNDVIG SIDEVÆRT · BID, NÅR DEN HVILER'; bossHUD.querySelector('i').style.width = Math.max(0, boss.hp / boss.maxHP * 100) + '%'; }
    }
    function update(now) {
      if (disposed) return;
      const dt = last ? Math.min(.1, Math.max(0, (now - last) / 1000)) : 0; last = now;
      const phaseBefore = game.phase; accumulator += dt;
      if(menuScene() && !document.hidden && !reducedMotion.matches && !game.save.settings.reducedMotion)menuClock+=dt;
      if (game.phase === 'result' && game.run.deathTime >= 0) game.run.deathTime = Math.min(.75, game.run.deathTime + dt);
      const pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean),buttons=pad?pad.buttons.map(b=>b.pressed):[];
      if(buttons[9]&&!padPrevious[9]){if(game.phase==='playing')game.pause();else if(game.phase==='paused')game.resume();}
      if(game.phase!=='playing'&&pad){const focusables=Array.from(screen.querySelectorAll('button:not(:disabled)'));if((buttons[12]&&!padPrevious[12])||(buttons[13]&&!padPrevious[13])){const index=focusables.indexOf(document.activeElement),delta=buttons[12]?-1:1;focusables[(index+delta+focusables.length)%focusables.length]?.focus();}if(buttons[0]&&!padPrevious[0]&&screen.contains(document.activeElement))document.activeElement.click();}
      padPrevious=buttons;
      const held=action=>keys.has(game.save.bindings[action]);
      const ax=pad&&Math.abs(pad.axes[0])>.18?pad.axes[0]:0,ay=pad&&Math.abs(pad.axes[1])>.18?pad.axes[1]:0;
      if (ready && game.phase === 'playing') {
        while (accumulator >= 1 / 60 && game.phase === 'playing') {
          const eat=held('eat')||buttons[2];
          game.step(1 / 60, { x:joystick.x+ax+(held('right')||keys.has('ArrowRight')||buttons[15]?1:0)-(held('left')||keys.has('ArrowLeft')||buttons[14]?1:0),y:joystick.y+ay+(held('down')||keys.has('ArrowDown')||buttons[13]?1:0)-(held('up')||keys.has('ArrowUp')||buttons[12]?1:0),eat,sneak:held('sneak')||buttons[5],attack:held('attack')||buttons[0]||game.save.settings.autoAttack&&!eat&&game.run.enemies.some(e=>Math.hypot(e.x-game.run.player.x,e.y-game.run.player.y)<65+e.radius),interact:held('interact')||buttons[3],pounce:held('ability')||buttons[1] });
          accumulator -= 1 / 60;
        }
      } else accumulator = 0;
      if (game.phase !== phaseBefore) accumulator = 0;
      for (const event of game.drainEvents()) { audio.play(event.type, event); if (event.type === 'boss') toast(game.run.stage === 0 ? 'SKOVENS JÆGER · Undvig sidelæns; bid bagfra, når den hviler!' : 'BOSSEN ER HER · Undvig de røde varsler!'); if (event.type === 'boss_enrage') toast(['FASE 2 · Dobbelt stormløb og tramp!', 'FASE 2 · Hurtigere baghold og stor halebølge!', 'FASE 2 · Dobbelt hornstorm!', 'FASE 2 · Dobbeltbid og brøl!'][game.run.stage]); if (event.type === 'jonas') toast('HEMMELIG JÆGER FUNDET · Jonas, kødens konge! ♛'); if(event.type==='discovery')toast(event.text); if (event.type === 'dna' && !event.quiet) toast('+' + event.amount + ' DNA · gemt'); if(event.type==='achievement')toast('★ ACHIEVEMENT · '+event.name.toUpperCase()+(event.species?' · '+I18N.tf('{0} låst op!',C.PLAYER_SPECIES[event.species].name):event.skin?' · ny farvedragt':' · +'+event.dna+' DNA'));if(event.type==='zone')toast(event.first?'NYT OMRÅDE · '+event.name.toUpperCase()+' · +1 DNA':event.name.toUpperCase()); if(event.type==='boss_break')toast('BRUDT! · Angrib nu'); if(event.type==='winded')toast('FORPUSTET · vent på stamina'); }
      const musicRun=game.run;audio.setScene({phase:game.phase==='build'?'paused':game.phase==='settings'&&returnPhase==='paused'?'paused':game.phase,stage:musicRun?musicRun.stage:0,boss:!!(musicRun&&musicRun.bossSpawned&&!musicRun.bossDefeated),health:musicRun?musicRun.health:1,maxHealth:musicRun?musicRun.maxHealth:1,victory:!!(musicRun&&musicRun.result&&musicRun.result.victory)});audio.sync();
      shell.style.setProperty('--hud-scale',game.save.settings.hudScale);shell.style.setProperty('--text-scale',game.save.settings.textScale);
      renderScreen(); draw();drawEndScene(now);drawGuideModels(now);
      const poisonVisible=game.run?.poisonTime>0&&['playing','paused','build','mutation','exploration'].includes(game.phase);canvas.style.filter=poisonVisible&&!game.save.settings.reducedMotion&&!reducedMotion.matches?'hue-rotate('+Math.round(18*Math.sin(game.run.seconds*1.2))+'deg) saturate(1.15)':'';
      if(poisonVisible){ctx.save();ctx.strokeStyle=game.save.settings.reducedMotion?'#a8b15b':'hsl('+Math.round(50+60*Math.sin(game.run.seconds*2))+',55%,60%)';ctx.lineWidth=game.save.settings.reducedMotion?6:12+4*Math.sin(game.run.seconds*3);ctx.strokeRect(4,4,canvas.width-8,canvas.height-8);ctx.restore();}
      if(I18N.lang!=='da'&&game.run)for(const sel of ['.hud','.run-info','.meat-progress','.boss-hud'])I18N.translateNode(shell.querySelector(sel));
      if(game.phase==='playing'&&game.run&&game.run.eating){const r=game.run,x=Math.round(r.player.x-r.view.x),y=Math.round(r.player.y-r.view.y+102);ctx.fillStyle='#101713';ctx.fillRect(x-42,y,84,8);ctx.fillStyle='#fff1c9';ctx.fillRect(x-40,y+2,80*r.eating.progress,4);}
      shell.querySelector('.toast').hidden = now > toastUntil;
      shell.querySelector('.save-status').textContent = tr(game.storageAvailable ? 'DNA og indstillinger gemmes lokalt' : 'Lagring utilgængelig · kun denne session');
    }
    // A single thrown error used to stop requestAnimationFrame for good, which froze the game.
    let frameErrors=0;
    function frame(now) { try { update(now); frameErrors=0; } catch (error) { frameErrors++; console.error('PRIMAL RUN frame error',error); if(frameErrors===1)toast('Der opstod en fejl – spillet forsøger at fortsætte.'); } finally { if (!disposed) animationId = requestAnimationFrame(frame); } }
    listen(shell, 'click', async e => {
      // Never let a pending AudioContext.resume() block menu/level buttons.
      Promise.race([audio.unlock(),new Promise(done=>setTimeout(done,250))]).catch(()=>{});
      const target = e.target.closest('button,[data-action]'); if (!target) return;
      if(target.dataset.firstLanguage){game.save.settings.languageChosen=true;game.setSetting('language',target.dataset.firstLanguage);I18N.setLanguage(target.dataset.firstLanguage);I18N.translateNode(shell);renderScreen(true);return;} // static header/footer/touch labels were built in Danish
      if (target.dataset.buy) { game.purchase(target.dataset.buy); renderScreen(true); return; }
      if (target.dataset.skin) { game.setSkin(target.dataset.skin); renderScreen(true); return; }
      if (target.dataset.species) { const id = target.dataset.species; if (!game.save.unlockedSpecies.includes(id)) game.unlockSpecies(id); game.selectSpecies(id); renderScreen(true); return; }
      if (target.dataset.explore) { game.explore(target.dataset.explore === 'take'); keys.clear(); accumulator = 0; renderScreen(); return; }
      if (target.dataset.mutation) { game.choose(target.dataset.mutation); keys.clear(); accumulator = 0; last = 0; renderScreen(true); return; }
      const binding=e.target.closest('[data-binding]');if(binding){bindingAction=binding.dataset.binding;binding.textContent='Tryk en ny tast · Esc annullerer';return;}
      if(target.dataset.binding){bindingAction=target.dataset.binding;target.textContent='Tryk en ny tast · Esc annullerer';return;}
      if(target.dataset.recordsTab){recordsTab=target.dataset.recordsTab;renderScreen(true);return;}
      if(target.dataset.recordsScope){recordsScope=target.dataset.recordsScope;renderScreen(true);return;}
      const action = target.dataset.action;
      if (action) e.preventDefault();
      if (action === 'challenge-start' && ready && game.phase === 'challenges' && (game.pendingChallenges || []).length) { seedInput = ''; game.phase = 'intro'; }
      else if (action === 'start' && ready) { game.setChallenges && game.setChallenges([]); const name = shell.querySelector('#player-name'); if (name) game.setName(name.value);const seed=shell.querySelector('#map-seed');if(seed)seedInput=seed.value.trim();if(seedInput&&!/^\d{1,10}$/.test(seedInput)){toast('Seed skal være et heltal fra 0 til 4294967295');return;}if(Number(seedInput)>4294967295){toast('Seed er for stort');return;}game.phase = 'intro'; if(game.save.settings.skipIntro){renderScreen(true);const begin=screen.querySelector('[data-action="begin"]');if(begin)begin.click();return;} }
      else if (action === 'begin' && ready && game.phase === 'intro'){const skip=shell.querySelector('#skip-intro');if(skip)game.setSetting('skipIntro',skip.checked);target.disabled=true;try{await preload({species:game.save.selectedSpecies,stage:0},(n,t)=>{target.textContent='Indlæser '+Math.round(100*n/t)+' %';});game.start(seedInput?{seed:Number(seedInput)}:{});}catch(error){console.error(error);toast('Banen kunne ikke starte – prøv igen.');target.disabled=false;target.textContent='Prøv igen';}}
      else if (action === 'daily-start' && ready && game.phase === 'daily') { target.disabled = true; try { await preload({ species: game.dailyHunt().species, stage: 0 }, (n, t) => { target.textContent = 'Indlæser ' + Math.round(100 * n / t) + ' %'; }); game.startDaily(); } catch (error) { console.error(error); toast('Banen kunne ikke starte – prøv igen.'); target.disabled = false; } }
      else if (['shop', 'scores', 'help', 'species','guide','achievements','daily','challenges'].includes(action)) { if (game.phase === 'menu') { const name = shell.querySelector('#player-name'); if (name) game.setName(name.value); } game.phase = action; }
      else if(action==='share-card'){const text=shareText(game.run);if(navigator.clipboard&&text)navigator.clipboard.writeText(text).then(()=>toast('Resultat kopieret')).catch(()=>toast('Resultatet kunne ikke kopieres'));else toast('Resultatet kunne ikke kopieres');}
      else if(action==='share'){const url=new URL(location.href);url.searchParams.set('seed',game.run.seed);navigator.clipboard?.writeText(url.href).then(()=>toast('Seed-link kopieret')).catch(()=>toast('Markér seed-linket og kopiér det'));if(!navigator.clipboard)toast('Markér seed-linket og kopiér det');}
      else if (action === 'settings') { returnPhase = game.phase === 'paused' ? 'paused' : 'menu'; const name = shell.querySelector('#player-name'); if (name) game.setName(name.value); game.phase = 'settings'; }
      else if(action==='build'&&game.phase==='paused')game.phase='build';
      else if(action==='build-back')game.phase='paused';
      else if (action === 'back') game.phase = returnPhase;
      else if (action === 'menu') game.phase = 'menu';
      else if (action === 'home') { if (game.phase === 'playing') game.pause(); else if (!['paused', 'mutation', 'exploration', 'cleared'].includes(game.phase) && !(game.phase === 'settings' && returnPhase === 'paused')) game.phase = 'menu'; }
      else if (action === 'pause') { if (game.phase === 'playing') game.pause(); else game.resume(); }
      else if (action === 'resume') game.resume();
      else if (action === 'abandon') { if (game.giveUp) game.giveUp(); else game.finish(false); }
      else if (action === 'next'){target.disabled=true;try{await preload({stage:game.run.campaign[Math.min(game.run.campaign.length-1,game.run.levelIndex+1)].biome},(n,t)=>{target.textContent='Indlæser '+Math.round(100*n/t)+' %';});game.nextStage();evictUnused(game.run.stage,game.run.species);}catch(error){console.error(error);toast('Næste bane kunne ikke starte – prøv igen.');target.disabled=false;target.textContent='Prøv igen';}}
      else if (action === 'mute') { game.setSetting('master', 0); audio.sync(); renderScreen(true); }
      else if (action === 'fullscreen') { try { if (document.fullscreenElement) await document.exitFullscreen(); else await shell.requestFullscreen(); } catch (_) { toast('Fuldskærm understøttes ikke her.'); } }
      if (action !== 'pause' && action !== 'start') audio.play('ui');
      accumulator = 0; renderScreen();
    });
    listen(shell, 'change', e => {
      if (!e.target.matches('[data-language]')) return;
      game.setSetting('language', e.target.value); I18N.setLanguage(e.target.value);
      // The page reloads so every static label is rebuilt in the new language.
      try { location.reload(); } catch (_) { renderScreen(true); }
    });
    listen(shell, 'input', e => {
      const key = e.target.dataset.setting; if (!key) return;
      game.setSetting(key, ['shake','autoAttack','reducedMotion'].includes(key) ? e.target.checked : Number(e.target.value) / 100); audio.sync();
      const output = shell.querySelector('#volume-' + key); if (output) output.textContent = Math.round(game.save.settings[key] * 100) + ' %';
    });
    listen(window, 'keydown', e => {
      if(bindingAction){e.preventDefault();if(e.code==='Escape'){bindingAction=null;renderScreen(true);return;}if(game.setBinding(bindingAction,e.code)){bindingAction=null;renderScreen(true);}else toast('Tasten er allerede i brug eller understøttes ikke');return;}
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      audio.unlock();
      if (e.code === 'Escape' && !e.repeat) {
        if (game.phase === 'playing') game.pause(); else if (game.phase === 'paused') game.resume(); else if (game.phase === 'build')game.phase='paused';else if (game.phase === 'settings') game.phase = returnPhase; else if (['intro', 'help', 'shop', 'scores', 'species','guide','daily','challenges'].includes(game.phase)) game.phase = 'menu';
        renderScreen(); return;
      }
      if (game.phase === 'mutation' && /^Digit[123]$/.test(e.code) && !e.repeat) { game.choose(game.run.choices[Number(e.code.slice(-1)) - 1]); keys.clear(); accumulator = 0; last = 0; renderScreen(true); return; }
      if(e.code==='Space'){e.preventDefault();if(game.phase!=='playing'){keys.delete('Space');return;}}
      if (game.phase !== 'playing') return;
      if (e.code === game.save.bindings.interact && !e.repeat) { e.preventDefault(); game.interact(); accumulator = 0; renderScreen(); return; }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      keys.add(e.code);
    });
    listen(window, 'keyup', e => {if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))e.preventDefault();keys.delete(e.code);});
    const unfocus = () => {joystick={x:0,y:0};keys.clear(); accumulator = 0; last = 0; game.pause(); renderScreen(); };
    listen(window, 'blur', unfocus); listen(document, 'visibilitychange', () => { if (document.hidden) unfocus(); });
    listen(shell, 'pointerdown', e => { audio.unlock(); const target = e.target.closest('[data-key]'); if (!target || game.phase !== 'playing') return; e.preventDefault(); target.setPointerCapture(e.pointerId); const action=Object.keys(game.save.bindings).find(a=>({attack:'Space',ability:'ShiftLeft',interact:'KeyE',eat:'KeyF'})[a]===target.dataset.key);target.dataset.activeKey=action?game.save.bindings[action]:target.dataset.key;keys.add(target.dataset.activeKey); });
    const releasePointer = e => { const target = e.target.closest('[data-key]'); if (target) keys.delete(target.dataset.activeKey||target.dataset.key); };
    listen(shell, 'pointerup', releasePointer); listen(shell, 'pointercancel', releasePointer); listen(shell, 'lostpointercapture', releasePointer);
    const joy=shell.querySelector('.joystick');
    listen(joy,'pointerdown',e=>{if(game.phase!=='playing'||joyPointer!==null)return;e.preventDefault();joyPointer=e.pointerId;joyOrigin={x:e.clientX,y:e.clientY};joy.setPointerCapture(e.pointerId);});
    listen(joy,'pointermove',e=>{if(e.pointerId!==joyPointer)return;const dx=e.clientX-joyOrigin.x,dy=e.clientY-joyOrigin.y,length=Math.hypot(dx,dy),scale=Math.min(1,40/Math.max(1,length));joystick={x:dx*scale/40,y:dy*scale/40};joy.querySelector('i').style.transform=`translate(${dx*scale}px,${dy*scale}px)`;});
    const stopJoy=e=>{if(e.pointerId!==joyPointer)return;joyPointer=null;joystick={x:0,y:0};joy.querySelector('i').style.transform='';};listen(joy,'pointerup',stopJoy);listen(joy,'pointercancel',stopJoy);listen(joy,'lostpointercapture',stopJoy);
    const loading={};
    // Robust loading: retry, timeout and never leave the game stuck on one failed or stalled image.
    const failedImages=new Set();
    function loadImage(path,attempt=0){if(loading[path])return loading[path];return loading[path]=new Promise(resolveLoad=>{
      const image=new Image();let settled=false;const done=ok=>{if(settled)return;settled=true;clearTimeout(timer);if(ok){images[path]=image;failedImages.delete(path);resolveLoad(true);return;}delete loading[path];if(attempt<2){setTimeout(()=>loadImage(path,attempt+1).then(resolveLoad),400*(attempt+1));return;}failedImages.add(path);resolveLoad(false);};
      const timer=setTimeout(()=>done(false),15000);image.onload=()=>done(true);image.onerror=()=>done(false);image.src=resolve(path)+(attempt?(resolve(path).includes('?')?'&':'?')+'retry='+attempt:'');
    });}
    function preload({species=game.run?.species||game.save.selectedSpecies,stage=game.run?.stage||0,kinds=[],menu=false}={},onProgress=null){if(menu){const paths=Object.keys(catalog).filter(path=>catalog[path].runtime_enabled!==false&&(!/(behavior|behavior_native|behavior_injured|species_attacks|avatars|player_full|enemy_full|enemy_animations|enemies|player_combat|corpses)\//.test(path)||path.includes('/'+species+'_idle_')));return Promise.all(paths.map(p=>loadImage(p)));} // menu: UI + chosen species only (~200 files; GitHub Pages rate limits per IP). Everything else loads at START or on demand.
    const animals=new Set([species,...(C.FEATURES.raptorPack?['velociraptor']:[]),...C.BIOMES[stage].animals,C.STAGES[stage].boss,...C.LEVELS.filter(l=>l.biome===stage).map(l=>l.boss),...kinds]);const paths=Object.keys(catalog).filter(path=>catalog[path].runtime_enabled!==false&&(!/(behavior|behavior_native|behavior_injured|species_attacks|avatars|player_full|enemy_full|enemy_animations|enemies|player_combat|corpses)\//.test(path)||Array.from(animals).some(id=>path.includes('/'+id+'_'))));let loadedCount=0;const total=paths.length;return Promise.all(paths.map(p=>loadImage(p).then(ok=>{loadedCount++;if(onProgress)onProgress(loadedCount,total);return ok;})));}
    function evictUnused(stage,species){const allowed=new Set([species,...(C.FEATURES.raptorPack?['velociraptor']:[]),...C.BIOMES[stage].animals,C.STAGES[stage].boss,...C.LEVELS.filter(l=>l.biome===stage).map(l=>l.boss)]);for(const path of Object.keys(images))if(/(behavior|behavior_native|behavior_injured|species_attacks|avatars|player_full|enemy_full|enemy_animations|enemies|player_combat|corpses)\//.test(path)&&!Array.from(allowed).some(id=>path.includes('/'+id+'_'))){delete images[path];delete loading[path];delete skins[path];delete displayURLs[path];delete flashes[path];delete decomposition[path];for(const key of npcVariants.keys())if(key.startsWith(path+':'))npcVariants.delete(key);prepared.delete(path);}}
    const querySeed=new URL(location.href).searchParams.get('seed');if(querySeed&&/^\d{1,10}$/.test(querySeed)&&Number(querySeed)<=4294967295)seedInput=querySeed;
    const load = preload({ menu: true }).then(() => { ready = true; renderScreen(true); return true; }).catch(e => { game.phase = 'error'; renderScreen(true); screen.querySelector('.load-error').textContent = e.message; return false; });
    const api = { telegraphShape: (e, r = game.run) => telegraphShape(r, e), preload,assetStats:()=>({loaded:Object.keys(images).length,total:Object.keys(catalog).length,decodedBytes:[...Object.values(images),...Object.values(skins),...Object.values(flashes),...Object.values(decomposition),...npcVariants.values()].reduce((n,i)=>n+i.width*i.height*4,0)}),game, audio, keys, ready: load, update, dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(animationId); cleanups.forEach(f => f()); audio.dispose(); shell.remove(); if (root.primalRun === api) delete root.primalRun; } };
    root.primalRun = api; renderScreen(true); if (!driven) animationId = requestAnimationFrame(frame);
    return api;
  }
  root.PrimalApp = { mount };
})(globalThis);
