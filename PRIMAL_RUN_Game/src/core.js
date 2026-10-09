/* Shared deterministic simulation: browser and GDevelop use this exact file. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PrimalCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 960, HEIGHT = 640, SAVE_KEY = 'primalRun.save.v1';
  const BITE_ANIMATION = { frames: 6, fps: 14, duration: 6 / 14, contactFrame: 3, contactTime: 3 / 14 };
  const STAGES = [
    { name: 'Bregneskoven', subtitle: 'Jagten begynder', target: 24, tile: 'forest_floor', boss: 'carnotaurus', bossName: 'Skovens jæger', dna: 15 },
    { name: 'Flodsletten', subtitle: 'Hold øje med flodens jæger', target: 50, tile: 'sand', boss: 'deinosuchus', bossName: 'Flodens gab', dna: 20 },
    { name: 'Klippelandet', subtitle: 'Angrib de pansrede flanker', target: 75, tile: 'gravel', boss: 'triceratops', bossName: 'Den hornede vogter', dna: 25 },
    { name: 'Den vulkanske dal', subtitle: 'Den sidste jagt', target: 100, tile: 'volcanic', boss: 'tyrannosaurus', bossName: 'Dalens konge', dna: 30 },
  ];
  const LEVELS=[
    {biome:0,name:'Skovbrynet',subtitle:'En kort første jagt',target:12,boss:'pachycephalosaurus',bossName:'Palle - Skovbrynets Bølle',dna:8,mini:true},
    {biome:0,name:'Bregneskovens dyb',subtitle:'Jægerens territorium',target:24,boss:'carnotaurus',bossName:'Carl - Skovens Vogter',dna:15},
    {biome:1,name:'Flodens fiskebanker',subtitle:'Kløer under overfladen',target:26,boss:'baryonyx',bossName:'Benny - Fiskebankens Hersker',dna:12,mini:true},
    {biome:1,name:'Den dybe flodslette',subtitle:'Pas på baghold',target:34,boss:'deinosuchus',bossName:'Doris - Flodens Gab',dna:20},
    {biome:2,name:'Panserplateauet',subtitle:'En hård nød',target:38,boss:'ankylosaurus',bossName:'Asta - Klippernes Skjold',dna:16,mini:true},
    {biome:2,name:'Hornenes klippeland',subtitle:'Lok hornene mod klipperne',target:46,boss:'triceratops',bossName:'Tina - Klippelandets Vogter',dna:25},
    {biome:3,name:'Askejagten',subtitle:'En gammel fjende i nye omgivelser',target:48,boss:'carnotaurus',bossName:'Karl - Askens Jæger',dna:20,mini:true},
    {biome:3,name:'Urkongens dal',subtitle:'Den sidste jagt',target:58,boss:'tyrannosaurus',bossName:'Ragnar - Dalens Konge',dna:35}
  ];
  const SECRET_SEED=1993;
  const RIVALS=[
    {kind:'carnotaurus',names:['Knud Kløvhorn','Grethe Grumme','Sigurd Skarptand']},
    {kind:'baryonyx',names:['Fisker-Frede','Lise Lyngebid','Ole Ålekrog']},
    {kind:'triceratops',names:['Bjarne Bulder','Hilda Hornvæg','Torben Tramp']},
    {kind:'ankylosaurus',names:['Valdemar Vold','Ingrid Ildskjold','Bo Basalt']}
  ];
  const SPECIES = {
    compy: { hp: 8, speed: 90, damage: 3, meat: 1, chance: .02, dna: 1, radius: 4 },
    parasaurolophus: { hp: 30, speed: 60, damage: 0, meat: 3, chance: .15, dna: 2, radius: 18 },
    carnotaurus: { hp: 48, speed: 77, damage: 13, meat: 5, chance: .30, dna: 4, radius: 21 },
    ankylosaurus: { hp: 65, speed: 38, damage: 16, meat: 5, chance: .30, dna: 4, radius: 23 },
    deinosuchus: { hp: 70, speed: 53, damage: 17, meat: 5, chance: .30, dna: 4, radius: 32 },
    triceratops: { hp: 80, speed: 50, damage: 19, meat: 5, chance: .30, dna: 4, radius: 28 },
    tyrannosaurus: { hp: 95, speed: 65, damage: 22, meat: 5, chance: .30, dna: 4, radius: 32 },
  };
  Object.assign(SPECIES,{pachycephalosaurus:{hp:38,speed:70,damage:10,meat:3,chance:.15,dna:2,radius:16},gallimimus:{hp:24,speed:100,damage:0,meat:3,chance:.15,dna:2,radius:15},baryonyx:{hp:62,speed:65,damage:15,meat:5,chance:.3,dna:4,radius:22}});
  const SPECIES_LABELS = { velociraptor:'Velociraptor', pachycephalosaurus:'Pachycephalosaurus',gallimimus:'Gallimimus',baryonyx:'Baryonyx',compy: 'Compsognathus', utahraptor: 'Utahraptor', parasaurolophus: 'Parasaurolophus', carnotaurus: 'Carnotaurus', ankylosaurus: 'Ankylosaurus', deinosuchus: 'Deinosuchus', triceratops: 'Triceratops', tyrannosaurus: 'Tyrannosaurus rex' };
  // Habitat suitability, not a claim that these species coexisted historically.
  const BIOMES = [
    { animals: ['compy','compy','parasaurolophus','carnotaurus'], plants: ['cycad','broad_fern','seed_fern','conifer','horsetail','shrub','moss','roots','mushrooms','leaf_litter','twigs'], insects: ['beetle','firefly'] },
    { animals: ['compy','parasaurolophus','carnotaurus','deinosuchus'], plants: ['cycad','broad_fern','horsetail','reeds','shrub','fruit_bush','moss','roots','flowers'], insects: ['dragonfly','beetle','firefly'] },
    { animals: ['compy','parasaurolophus','carnotaurus','ankylosaurus','triceratops'], plants: ['conifer','shrub','dry_grass','lichen','succulent','twigs','flowers'], insects: ['beetle'] },
    { animals: ['compy','parasaurolophus','carnotaurus','ankylosaurus','tyrannosaurus'], plants: ['dry_grass','lichen','succulent','twigs'], insects: ['beetle'] },
  ];
  // herb.png is reserved for edible forage, so it is not decorative scenery.
  BIOMES[0].animals.push('pachycephalosaurus','gallimimus');BIOMES[1].animals.push('gallimimus','baryonyx');BIOMES[2].animals.push('pachycephalosaurus','gallimimus');BIOMES[3].animals.push('gallimimus');
  function riverCurve(points){
    const path=[{...points[0]}];let from=points[0];
    for(let i=1;i<points.length-1;i++){const control=points[i],end={x:(control.x+points[i+1].x)/2,y:(control.y+points[i+1].y)/2};for(let j=1;j<=12;j++){const t=j/12,q=1-t;path.push({x:q*q*from.x+2*q*t*control.x+t*t*end.x,y:q*q*from.y+2*q*t*control.y+t*t*end.y});}from=end;}
    path.push({...points[points.length-1]});return path;
  }
  function riverDistance(map, p) {
    let distance = Infinity;
    const line=map.riverCurve||map.river;
    for (let i=1;i<line.length;i++) {
      const a=line[i-1],b=line[i],dx=b.x-a.x,dy=b.y-a.y;
      const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
      distance=Math.min(distance,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));
    }
    return distance;
  }
  function isWater(stage,map,p,margin=0){
    return stage===1&&riverDistance(map,p)<58-margin||(map.ponds||[]).some(pond=>{const rx=pond.radius-margin,ry=pond.radius*.7-margin;return rx>0&&ry>0&&((p.x-pond.x)/rx)**2+((p.y-pond.y)/ry)**2<1;});
  }
  // Overhaul phase 5 terrain: deep river water with shallow fords, lava cracks.
  const DEEP_WATER=26,LAVA_CORE=14;
  function nearFord(map,p){return (map.fords||[]).some(f=>Math.hypot(p.x-f.x,p.y-f.y)<78);}
  function isDeepWater(stage,map,p){
    if(stage===1&&riverDistance(map,p)<DEEP_WATER&&!nearFord(map,p))return true;
    return (map.ponds||[]).some(pond=>((p.x-pond.x)/(pond.radius*.45))**2+((p.y-pond.y)/(pond.radius*.7*.45))**2<1);
  }
  const canSwim=entity=>['deinosuchus','baryonyx'].includes(entity.kind)||entity.radius>=28;
  function isLava(stage,map,p){return stage===3&&riverDistance(map,p)<LAVA_CORE;}
  function suitableHabitat(stage,map,kind,p) {
    if (!BIOMES[stage].animals.includes(kind) && STAGES[stage].boss!==kind) return false;
    const distance=riverDistance(map,p);
    if(stage===3 && distance<90) return false; // No animals spawn in lava.
    if(stage===1) return kind==='deinosuchus' ? distance>=38 && distance<=135 : kind==='baryonyx'?distance>=58&&distance<=175:distance>=85;
    return kind!=='deinosuchus';
  }
  // Display-only mapping stays within the existing Primal Earth 32 palette.
  const SPECIES_COLORS={};
  const warm=['443027','674333','8d6042','b98252','d4a36c','edd0a0','54282d','913b32','c6663c','de954a'];
  const tones={
    compy:['28372a','3f5030','586d38','799447','a8b15b','ded392','28372a','3f5030','586d38','799447'],
    utahraptor:['3b4144','3c7180','3c7180','69a4a0','a2d4c1','e8ece1','3b4144','3c7180','69a4a0','a2d4c1'],
    carnotaurus:['443027','674333','8d6042','b98252','d4a36c','edd0a0','443027','8d6042','b98252','d4a36c'],
    ankylosaurus:['3b4144','626861','626861','929387','bab8a2','e8ece1','3b4144','626861','929387','bab8a2'],
    parasaurolophus:['28372a','3f5030','586d38','799447','ded392','edd0a0','443027','586d38','a8b15b','ded392'],
    deinosuchus:['151b19','28372a','3f5030','586d38','799447','bab8a2','151b19','28372a','3f5030','586d38'],
    triceratops:['3b4144','626861','626861','929387','bab8a2','edd0a0','443027','626861','929387','bab8a2'],
    tyrannosaurus:['443027','674333','8d6042','b98252','d4a36c','edd0a0','443027','674333','8d6042','b98252'],
  };
  tones.pachycephalosaurus=['443027','626861','8d6042','d4a36c','ded392','e8ece1','443027','626861','d4a36c','ded392'];tones.gallimimus=['28372a','586d38','799447','a8b15b','ded392','e8ece1','28372a','586d38','a8b15b','ded392'];tones.baryonyx=['151b19','3b4144','3c7180','69a4a0','bab8a2','e8ece1','151b19','3b4144','69a4a0','bab8a2'];
  tones.velociraptor=['443027','586d38','799447','a8b15b','ded392','e8ece1','443027','586d38','799447','a8b15b'];
  for(const [id,ramp] of Object.entries(tones)){SPECIES_COLORS[id]=Object.fromEntries(warm.map((color,i)=>[color,ramp[i]]));SPECIES_COLORS[id]['8d2028']=ramp[1];}
  const PLAYER_SPECIES = {
    compy: { name: 'Compy', cost: 0, hp: 80, damage: 6, speed: 175, radius: 12, cooldown: .4, duration: .28, range: 52, skill: 'Smutter', text: 'Hurtige bid og korte undvigelser. Shift: smut frem, 28 stamina.', abilityCost: 28, abilityTime: .16, abilityCooldown: 1.25 },
    utahraptor: { name: 'Utahraptor', cost: 25, hp: 100, damage: 10, speed: 155, radius: 16, cooldown: .6, duration: 6 / 14, range: 66, skill: 'Springangreb', text: 'Balanceret jæger. Shift: beskyttet spring; kløer rammer én gang pr. dyr.', abilityCost: 38, abilityTime: .23, abilityCooldown: 1.8 },
    carnotaurus: { name: 'Carnotaurus', cost: 55, hp: 125, damage: 14, speed: 140, radius: 21, cooldown: .8, duration: .5, range: 74, skill: 'Stormløb', text: 'Tunge bid. Shift: stormløb med kontaktskade; du kan stadig blive ramt.', abilityCost: 45, abilityTime: .4, abilityCooldown: 3.2 },
    ankylosaurus: { name: 'Ankylosaurus', cost: 75, hp: 150, damage: 12, speed: 110, radius: 23, cooldown: .9, duration: .56, range: 80, skill: 'Panserstilling', text: 'Space: haleslag omkring dig. Shift: 75 % mindre skade i ét sekund.', abilityCost: 45, abilityTime: 1, abilityCooldown: 5 },
  };
  Object.assign(PLAYER_SPECIES,{
    triceratops:{name:'Triceratops',cost:90,hp:170,damage:16,speed:100,radius:28,cooldown:.95,duration:.6,range:82,skill:'Hornstorm',text:'Planteæder. 25 % frontpanser. Shift: hornstorm; stærk foran, åben bagtil.',abilityCost:45,abilityTime:.42,abilityCooldown:4,diet:'herbivore'},
    pachycephalosaurus:{name:'Pachycephalosaurus',cost:35,hp:100,damage:9,speed:155,radius:16,cooldown:.65,duration:.4,range:58,skill:'Hovedstød',text:'Planteæder. Hovedstød holder små dyr tilbage. Shift: ram og forskyd fjenden.',abilityCost:35,abilityTime:.24,abilityCooldown:2.6,diet:'herbivore'},
    gallimimus:{name:'Gallimimus',cost:20,hp:70,damage:4,speed:215,radius:15,cooldown:.5,duration:.3,range:50,skill:'Flugtsprint',text:'Omnivor: spis urter eller kød. Shift: hurtig flugt; lav skade, ingen usårlighed.',abilityCost:24,abilityTime:1.1,abilityCooldown:3.5,diet:'omnivore'},
    baryonyx:{name:'Baryonyx',cost:65,hp:120,damage:12,speed:140,radius:22,cooldown:.7,duration:.46,range:74,skill:'Fiskestød',text:'Fiskejæger. Hold F ved fiskestimer; også kød. Shift: fang fisk eller ram tæt bytte.',abilityCost:35,abilityTime:.25,abilityCooldown:3,diet:'piscivore'}
  });
  PLAYER_SPECIES.tyrannosaurus={name:'Tyrannosaurus rex',cost:120,hp:190,damage:38,speed:95,radius:32,cooldown:1.6,duration:1.1,range:96,skill:'Kongebrøl',text:'Kødæder. Langsomt knusende bid. Shift: brøl skræmmer almindelige dyr i nærheden; bosser er immune.',abilityCost:50,abilityTime:.9,abilityCooldown:6,diet:'carnivore'};
  PLAYER_SPECIES.velociraptor={name:'Velociraptor',cost:0,hp:90,damage:8,speed:170,radius:12,cooldown:.5,duration:.32,range:56,skill:'Kløspring',text:'Lille startjæger. Hurtige bid og et kort beskyttet kløspring. Shift:32 stamina.',abilityCost:32,abilityTime:.2,abilityCooldown:2,diet:'carnivore'};
  PLAYER_SPECIES.compy.radius=4;
  // Stamina rebalance (overhaul phase 1): heavy abilities cost more so stamina matters for every species.
  for(const [id,cost] of Object.entries({utahraptor:36,carnotaurus:50,ankylosaurus:55,triceratops:55,pachycephalosaurus:38,gallimimus:30,baryonyx:40,tyrannosaurus:60,velociraptor:30}))PLAYER_SPECIES[id].abilityCost=cost;
  PLAYER_SPECIES.velociraptor.text='Lille startjæger. Hurtige bid og et kort beskyttet kløspring. Shift: 30 stamina.';PLAYER_SPECIES.compy.text='Lille challenge-art. Små bid og korte undvigelser; vær forsigtig blandt store dyr.';
  for(const [id,config] of Object.entries(PLAYER_SPECIES))config.diet=config.diet||(id==='ankylosaurus'?'herbivore':'carnivore');
  const herbivorousNPC=kind=>['parasaurolophus','ankylosaurus','triceratops','pachycephalosaurus','gallimimus'].includes(kind);
  const playerFrame=(species,state,direction,frame)=>'assets/'+(['triceratops','tyrannosaurus'].includes(species)?'enemy_full/':'player_full/')+species+'_'+state+'_'+direction+'_'+String(frame).padStart(3,'0')+'.png';
  const abilityCost=r=>Math.max(16,PLAYER_SPECIES[r.species].abilityCost-5*r.mutations.pounce+6*r.mutations.overclock);
  const mutationWeight=(mutation,ranks)=>MUTATION_RARITIES[mutation.rarity].weight*(1+Math.min(.4,.2*(ranks[mutation.id]||0)));
  function seeded(seed) { let x = seed >>> 0; return () => { x += 0x6D2B79F5; let t = Math.imul(x ^ x >>> 15, 1 | x); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const MUTATIONS = [
    { id: 'teeth', name: 'Kraftigt angreb', text: '+20 % angrebsskade.', icon: 'serrated_teeth', max: 3 },
    { id: 'bleed', name: 'Blødende sår', text: 'Bid giver 3 ekstra skade/sek. pr. rang i 3 sekunder. Nye bid fornyer såret.', icon: 'serrated_teeth', max: 3 },
    { id: 'legs', name: 'Kraftige ben', text: '+8 % bevægelseshastighed.', icon: 'powerful_legs', max: 3 },
    { id: 'feathers', name: 'Udholdenhed', text: '+20 % stamina-regeneration.', icon: 'insulating_feathers', max: 3 },
    { id: 'heart', name: 'Stærkt hjerte', text: '+15 maksimalt liv. Hel også 15 liv.', icon: 'health', max: 3 },
    { id: 'armor', name: 'Sej hud', text: 'Tag 8 % mindre skade.', icon: 'armor', max: 3 },
    { id: 'reach', name: 'Jagtinstinkt', text: '+10 pixels bidrækkevidde og opsamlingsradius.', icon: 'hunger', max: 3 },
    { id: 'pounce', name: 'Effektiv evne', text: 'Din arts evne koster 5 mindre stamina.', icon: 'escape', max: 3 },
    { id: 'quick', name: 'Hurtige angreb', text: '8 % kortere cooldown mellem angreb.', icon: 'bone', max: 3 },
    { id: 'scavenger', name: 'Effektiv fordøjelse', text: 'Din arts føde heler 1 liv pr. fødeværdi pr. rang.', icon: 'hunger', max: 3 },
  ];
  MUTATIONS.find(m => m.id === 'bleed').species = 'utahraptor';
  MUTATIONS.push(
    { id:'scurry',name:'Smut mellem rødder',text:'12 % kortere evne-cooldown pr. rang.',icon:'escape',max:3,species:'compy' },
    { id:'hunter',name:'Lille specialist',text:'+25 % skade mod fredeligt bytte pr. rang.',icon:'hunger',max:3,species:'compy' },
    { id:'claws',name:'Springkløer',text:'+5 skade pr. dyr ramt under spring, pr. rang.',icon:'serrated_teeth',max:3,species:'utahraptor' },
    { id:'ambush',name:'Bagholdsjæger',text:'+50 % første bid mod et uopmærksomt dyr pr. rang.',icon:'hunger',max:3,species:'utahraptor' },
    { id:'gore',name:'Gennembrydning',text:'+8 stormløbsskade pr. rang.',icon:'bone',max:3,species:'carnotaurus' },
    { id:'momentum',name:'Fremdrift',text:'Stormløb genvinder 4 stamina pr. dyr og rang; højst 12 pr. stormløb.',icon:'powerful_legs',max:3,species:'carnotaurus' },
    { id:'spikes',name:'Pigpanser',text:'Når du tager skade: 4 skade til alle dyr inden for 110 pixels pr. rang.',icon:'armor',max:3,species:'ankylosaurus' },
    { id:'guard',name:'Levende fæstning',text:'Panserstilling heler 5 liv pr. rang.',icon:'health',max:3,species:'ankylosaurus' },
    { id:'sweep',name:'Bred halekølle',text:'+12 pixels haleslagsradius pr. rang.',icon:'bone',max:3,species:'ankylosaurus' },
    { id:'fury',name:'Overlevelsesraseri',text:'+20 % angrebsskade under 40 % liv pr. rang. Kombinér med Sej hud og Effektiv fordøjelse.',icon:'serrated_teeth',max:3 }
  );
  const MUTATION_RARITIES = {
    common: { name: 'Almindelig', color: '#e8ece1', weight: 6 },
    uncommon: { name: 'Usædvanlig', color: '#799447', weight: 4 },
    rare: { name: 'Sjælden', color: '#69a4a0', weight: 2 },
    epic: { name: 'Episk', color: '#bb80d9', weight: 1 },
    legendary:{name:'Legendarisk',color:'#e9b75a',weight:.12},
  };
  MUTATIONS.forEach(m => { m.rarity = ['bleed', 'scavenger', 'ambush', 'spikes', 'fury'].includes(m.id) ? 'epic' : ['armor', 'quick', 'reach'].includes(m.id) ? 'rare' : ['teeth', 'heart'].includes(m.id) ? 'uncommon' : 'common'; });
  MUTATIONS.push(
    {id:'apexGenome',name:'Ur-genom',text:'+25 maksimalt liv og +20 % angrebsskade. Kun én rang.',icon:'dna',max:1,rarity:'legendary'},
    {id:'compyFrenzy',name:'Lille torden',text:'Efter en undvigelse: 35 % kortere angrebscooldown i 3 sekunder.',icon:'escape',max:1,rarity:'legendary',species:'compy'},
    {id:'raptorAmbush',name:'Skyggespring',text:'Springet gør 18 ekstra kontaktskade pr. dyr og giver 1 sek. beskyttelse efter landing.',icon:'serrated_teeth',max:1,rarity:'legendary',species:'utahraptor'},
    {id:'carnoBreaker',name:'Knogleknuser',text:'Stormløb gør 20 ekstra skade og holder ramte dyr i stagger i 0,65 sek.',icon:'bone',max:1,rarity:'legendary',species:'carnotaurus'},
    {id:'ankyBastion',name:'Ur-fæstning',text:'Panserstilling giver 20 skjold i 4 sek. og fordobler næste haleslag inden for 4 sek.',icon:'armor',max:1,rarity:'legendary',species:'ankylosaurus'}
  );
  MUTATIONS.push(
    {id:'glassCannon',name:'Glaskanonen',text:'+25 % angrebsskade, men +12 % modtaget skade pr. rang.',icon:'serrated_teeth',max:2,rarity:'rare'},
    {id:'heavyMuscle',name:'Tunge muskler',text:'+20 % angrebsskade, men −8 % fart pr. rang.',icon:'bone',max:2,rarity:'uncommon'},
    {id:'overclock',name:'Højt stofskifte',text:'12 % kortere angrebscooldown, men evner koster +6 stamina pr. rang.',icon:'escape',max:2,rarity:'rare'},
    {id:'horns',name:'Spidse horn',text:'+8 hornstormskade pr. rang.',icon:'bone',max:3,rarity:'common',species:'triceratops'},
    {id:'frill',name:'Skjoldkrave',text:'Yderligere 8 % frontpanser pr. rang; beskytter ikke ryggen.',icon:'armor',max:3,rarity:'rare',species:'triceratops'},
    {id:'dome',name:'Tyk skalle',text:'+0,12 sek. stagger på almindelige dyr pr. rang.',icon:'bone',max:3,rarity:'common',species:'pachycephalosaurus'},
    {id:'impact',name:'Knusende stød',text:'+7 evne-kontaktskade pr. rang.',icon:'serrated_teeth',max:3,rarity:'rare',species:'pachycephalosaurus'},
    {id:'stride',name:'Lange skridt',text:'+8 % sprintfart pr. rang.',icon:'powerful_legs',max:3,rarity:'common',species:'gallimimus'},
    {id:'forager',name:'Effektiv fødesøger',text:'20 % hurtigere spisning pr. rang; også urter.',icon:'hunger',max:3,rarity:'rare',species:'gallimimus'},
    {id:'fisher',name:'Fiskerens klo',text:'20 % hurtigere fiskeri og +1 fødeværdi pr. fisk pr. rang.',icon:'hunger',max:3,rarity:'common',species:'baryonyx'},
    {id:'riverHunter',name:'Flodjæger',text:'+8 % fart i vand pr. rang.',icon:'powerful_legs',max:3,rarity:'rare',species:'baryonyx'},
    {id:'triceBulwark',name:'Levende skjold',text:'Hornstorm giver 20 skjold i 4 sek. og +20 kontaktskade.',icon:'armor',max:1,rarity:'legendary',species:'triceratops'},
    {id:'pachyMeteor',name:'Meteorstød',text:'+25 evne-kontaktskade og 1 sek. stagger på almindelige dyr.',icon:'bone',max:1,rarity:'legendary',species:'pachycephalosaurus'},
    {id:'galliWind',name:'Vindløber',text:'Sprint giver 1 sek. beskyttelse. Planteføde heler yderligere 1 liv pr. portion.',icon:'escape',max:1,rarity:'legendary',species:'gallimimus'},
    {id:'baryTide',name:'Flodens konge',text:'Fiskestød fanger op til 3 fisk fra samme stime og giver +12 kontaktskade.',icon:'serrated_teeth',max:1,rarity:'legendary',species:'baryonyx'}
  );
  MUTATIONS.push({id:'rexJaw',name:'Knusende kæber',text:'+15 % bid-skade pr. rang; det langsomme angreb bevares.',icon:'serrated_teeth',max:3,rarity:'rare',species:'tyrannosaurus'},{id:'rexVoice',name:'Dalens stemme',text:'+0,5 sek. frygt pr. rang. Bosser er immune.',icon:'escape',max:3,rarity:'uncommon',species:'tyrannosaurus'});
  MUTATIONS.push({id:'rexKing',name:'Urkongens bid',text:'+20 % bid-skade. Kun én rang.',icon:'serrated_teeth',max:1,rarity:'legendary',species:'tyrannosaurus'});
  MUTATIONS.push({id:'lightFrame',name:'Let knoglebygning',text:'+15 % fart, men +15 % modtaget skade pr. rang.',icon:'powerful_legs',max:2,rarity:'rare'},{id:'metabolicRush',name:'Hurtigt stofskifte',text:'+25 % spisehastighed, men -15 % stamina-regeneration pr. rang.',icon:'hunger',max:2,rarity:'uncommon'});
  MUTATIONS.push({id:'velociClaw',name:'Små skarpe kløer',text:'+20 % kløspringsskade pr. rang.',icon:'serrated_teeth',max:3,rarity:'rare',species:'velociraptor'},{id:'velociPrime',name:'Den lille alfajæger',text:'Kløspring giver 2 sekunders beskyttelse; én rang.',icon:'escape',max:1,rarity:'legendary',species:'velociraptor'});
  // Stamina tuning (overhaul phase 1): slower refill so abilities are a decision, not a reflex.
  const STAMINA = { regen: 9, combatRegen: 5, delay: 1.5, windedBelow: 8, windedTime: 2, windedSpeed: .8 };
  // Critical hits are the only source of stagger on ordinary bites (overhaul phase 1).
  const CRIT = { base: .08, multiplier: 1.5, stagger: .35, bossBreak: 25, bossBreakStagger: 1.2 };
  MUTATIONS.push(
    {id:'keenClaws',name:'Skarpe kløer',text:'+6 % chance for kritisk træf pr. rang. Kritiske træf gør 50 % ekstra skade og stagger.',icon:'serrated_teeth',max:3,rarity:'common'},
    {id:'instinct',name:'Rovdyrinstinkt',text:'+20 % kritisk chance mod dyr, der ikke har set dig, pr. rang.',icon:'hunger',max:2,rarity:'uncommon'},
    {id:'bonebreak',name:'Knoglebrud',text:'Kritiske træf stagger 0,15 sek. længere og fylder bossens brud-meter 50 % hurtigere pr. rang.',icon:'bone',max:2,rarity:'rare'}
  );
  const critChance=(r,e)=>Math.min(.75,CRIT.base+.06*r.mutations.keenClaws+(e&&!e.alert?.2*r.mutations.instinct:0)+(r.species==='pachycephalosaurus'?.1:0)+(r.species==='compy'?.04:0));
  const UPGRADES = [
    { id: 'health', name: 'Livskraft', text: '+2 % startliv pr. rang', max: 5 },
    { id: 'damage', name: 'Angrebsstyrke', text: '+2 % startskade pr. rang', max: 5 },
    { id: 'regen', name: 'Udholdende jæger', text: '+3 % stamina-regeneration pr. rang', max: 5 },
    { id:'digestion',name:'Effektiv fødeoptagelse',text:'+5 % spise- og fiskerihastighed pr. rang',max:5 },
    { id: 'magnet', name: 'Sporfinder', text: '+5 % opsamlingsradius pr. rang', max: 5 },
  ];
  const ROCKS = [{ x: 225, y: 200, radius: 22 }, { x: 730, y: 180, radius: 22 }, { x: 260, y: 475, radius: 22 }, { x: 735, y: 475, radius: 22 }];
  const MEAT_RARITIES = [
    { name: 'Almindeligt', multiplier: 1, color: '#e8ece1', symbol: '•' },
    { name: 'Nærende', multiplier: 1.5, color: '#799447', symbol: '◆' },
    { name: 'Sjældent', multiplier: 2, color: '#69a4a0', symbol: '◆◆' },
    { name: 'Episk', multiplier: 3, color: '#bb80d9', symbol: '★' },
  ];
  // ---- Sub-biome zones (overhaul phase 3). Each map gets 5-6 Voronoi zones under one biome theme.
  // Animals are tied to zones, so you meet different species in different parts of a level.
  const MAP_SCALE=1.4, HABITAT_SPACING=1.2;
  const ZONES=[
    [{id:'clearing',name:'Lysningen',animals:['parasaurolophus','parasaurolophus','compy','gallimimus'],foliage:.45,start:true},
     {id:'thicket',name:'Bregnekrattet',animals:['compy','compy','gallimimus','pachycephalosaurus'],foliage:1.35,extra:'fern_large'},
     {id:'oldgrowth',name:'Urskoven',animals:['carnotaurus','compy','parasaurolophus'],foliage:1.15,extra:'tree_canopy'},
     {id:'bog',name:'Mosesumpen',animals:['parasaurolophus','gallimimus','compy'],foliage:.9,mud:8}],
    [{id:'meadow',name:'Flodengen',animals:['parasaurolophus','parasaurolophus','gallimimus','compy'],foliage:.6,start:true},
     {id:'reeds',name:'Rørskoven',animals:['gallimimus','compy','baryonyx'],foliage:1.2,mud:10},
     {id:'bank',name:'Flodbredden',animals:['baryonyx','deinosuchus','carnotaurus','compy'],foliage:.8},
     {id:'gallery',name:'Galleriskoven',animals:['carnotaurus','parasaurolophus','compy'],foliage:1.2,extra:'tree_canopy'}],
    [{id:'drygrass',name:'Tørgræssletten',animals:['parasaurolophus','gallimimus','compy'],foliage:.6,start:true},
     {id:'canyon',name:'Kløften',animals:['pachycephalosaurus','compy','carnotaurus'],foliage:.7,rocks:24},
     {id:'plateau',name:'Panserplateauet',animals:['ankylosaurus','triceratops','compy'],foliage:.55,extra:'boulder_large'},
     {id:'thorn',name:'Tornekrattet',animals:['triceratops','gallimimus','pachycephalosaurus'],foliage:1.25}],
    [{id:'ash',name:'Askemarken',animals:['compy','parasaurolophus','gallimimus'],foliage:.6,start:true},
     {id:'deadwood',name:'Den døde skov',animals:['carnotaurus','compy'],foliage:1.1,extra:'dead_tree'},
     {id:'steam',name:'Dampkilderne',animals:['parasaurolophus','gallimimus','ankylosaurus'],foliage:.9,springs:true},
     {id:'lavarim',name:'Lavakanten',animals:['ankylosaurus','compy','carnotaurus'],foliage:.5,extra:'lava_rock'}]
  ];
  function zoneAt(map,p){
    if(!map.zones||!map.zones.length)return null;let best=null,bd=Infinity;
    for(const z of map.zones){const d=(p.x-z.x)**2+(p.y-z.y)**2;if(d<bd){bd=d;best=z;}}
    return best;
  }
  function zoneAllows(map,kind,p){const z=zoneAt(map,p);return !z||z.animals.includes(kind);}
  function buildZones(stage,seed,width,height,parts){
    const random=seeded((seed^0x51ED27^Math.imul(stage+3,40503))>>>0),types=ZONES[stage],zones=[];
    const startType=types.find(t=>t.start),others=types.filter(t=>!t.start);
    zones.push({...startType,index:0,x:480+Math.round(random()*220),y:340+Math.round(random()*160)});
    const total=5+Math.floor(random()*2),order=others.slice().sort(()=>random()-.5);
    for(let i=1,attempt=0;i<total&&attempt<400;attempt++){
      const x=Math.round(260+random()*(width-520)),y=Math.round(260+random()*(height-520));
      if(zones.some(z=>Math.hypot(z.x-x,z.y-y)<Math.min(width,height)*.32))continue;
      zones.push({...order[(i-1)%order.length],index:i,x,y});i++;
    }
    const near=p=>{let best=0,bd=Infinity;zones.forEach((z,i)=>{const d=(p.x-z.x)**2+(p.y-z.y)**2;if(d<bd){bd=d;best=i;}});return zones[best];};
    // Thin or add scenery per zone, so each area reads differently.
    for(let i=parts.decorations.length-1;i>=0;i--){const d=parts.decorations[i],z=near(d);if(z.foliage<1&&d.foliage&&random()>z.foliage)parts.decorations.splice(i,1);}
    for(const z of zones){
      const reach=Math.min(width,height)*.22,scatter=()=>{const a=random()*Math.PI*2,rr=Math.sqrt(random())*reach;return{x:Math.round(Math.max(80,Math.min(width-80,z.x+Math.cos(a)*rr))),y:Math.round(Math.max(110,Math.min(height-80,z.y+Math.sin(a)*rr)))};};
      if(z.foliage>1)for(let i=0;i<Math.round((z.foliage-1)*400);i++){const p=scatter();const prop=z.extra&&random()<.4?z.extra:parts.props[Math.floor(random()*parts.props.length)];if(near(p)!==z||Math.hypot(p.x-480,p.y-340)<70||isWater(stage,parts.waterMap,p,-(prop==='tree_canopy'?96:50)))continue;parts.decorations.push({...p,path:'assets/props/'+prop+'.png',canopy:prop==='tree_canopy',foliage:['fern_large','flower_bush','tree_canopy'].includes(prop)});}
      if(z.extra&&z.foliage<=1)for(let i=0;i<60;i++){const p=scatter();if(near(p)!==z||Math.hypot(p.x-480,p.y-340)<120||isWater(stage,parts.waterMap,p,-(z.extra==='tree_canopy'?96:60)))continue;parts.decorations.push({...p,path:'assets/props/'+z.extra+'.png',canopy:z.extra==='tree_canopy',foliage:z.extra==='tree_canopy'});}
      if(z.rocks)for(let i=0;i<z.rocks;i++){const p=scatter();if(near(p)!==z||Math.hypot(p.x-480,p.y-340)<650||parts.rocks.some(r=>Math.hypot(p.x-r.x,p.y-r.y)<90)||parts.habitats.some(h=>Math.hypot(p.x-h.x,p.y-h.y)<70)||isWater(stage,parts.waterMap,p,-30))continue;parts.rocks.push({...p,radius:22});}
      if(z.mud)for(let i=0;i<z.mud;i++){const p=scatter();if(near(p)!==z||Math.hypot(p.x-480,p.y-340)<160||isWater(stage,parts.waterMap,p,-80))continue;parts.mud.push({...p,rx:45+Math.round(random()*40),ry:28+Math.round(random()*30)});}
      // Each zone hides one reward near its centre: a spring, a fossil or a food cache.
      if(!z.start){const spot=parts.habitats.filter(h=>near(h)===z&&!isWater(stage,parts.waterMap,h,-64)).sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y))[0];if(spot)parts.events.push({x:spot.x+30,y:spot.y+20,type:z.springs?'spring':['cache','fossil','spring'][z.index%3],claimed:false,zone:z.index});}
    }
    for(const h of parts.habitats)h.zone=near(h).index;
    for(const f of parts.forage){const z=near(f);if(['clearing','meadow','drygrass','steam','thorn','bog'].includes(z.id)&&f.rarity===0&&random()<.35)f.rarity=1;}
    return zones.map(z=>({index:z.index,id:z.id,name:z.name,x:z.x,y:z.y,animals:z.animals.slice(),start:!!z.start}));
  }
  function createMap(stage, seed = 1) {
    const random = seeded((seed ^ Math.imul(stage + 1, 2654435761)) >>> 0);
    // Overhaul phase 3: larger maps split into named sub-biome zones (see ZONES).
    const width = Math.round((2880 + stage * 320) * MAP_SCALE), height = Math.round((1920 + stage * 256) * MAP_SCALE), AREA = MAP_SCALE * MAP_SCALE;
    const rocks = [], decorations = [], habitats = [], clearings = [], regions = [], trails = [], sites = [];
    const layout=Math.floor(random()*3),groves=[];
    for(let i=0;i<Math.round((6+layout*2)*AREA);i++)groves.push({x:Math.round(180+random()*(width-360)),y:Math.round(180+random()*(height-360)),radius:150+Math.round(random()*210),kind:i%3});
    // Opening formations change too: never a fixed four-rock tutorial square.
    for(let i=0;i<5+layout;i++){
      const angle=random()*Math.PI*2,distance=170+random()*330,x=Math.round(480+Math.cos(angle)*distance),y=Math.round(340+Math.sin(angle)*distance);
      if(x<80||y<105||x>width-80||y>height-80||Math.hypot(x-480,y-340)<150||rocks.some(r=>Math.hypot(x-r.x,y-r.y)<100))continue;
      rocks.push({x,y,radius:22});
    }
    const safe = (x, y, radius = 650) => Math.hypot(x - 480, y - 340) > radius;
    for (let y = 240; y < height - 160; y += 320 * HABITAT_SPACING) for (let x = 240; x < width - 160; x += 360 * HABITAT_SPACING) {
      const px = x + (random() - .5) * 180, py = y + (random() - .5) * 150;
      if (!safe(px, py)) continue;
      habitats.push({ x: Math.round(px), y: Math.round(py), roll: random() });
    }
    for (let i = 0; i < Math.round((80 + stage * 15) * AREA); i++) {
      const x = 100 + random() * (width - 200), y = 120 + random() * (height - 240);
      if (!safe(x, y, 700) || habitats.some(h => Math.hypot(x - h.x, y - h.y) < 85) || rocks.some(r => Math.hypot(x - r.x, y - r.y) < 110)) continue;
      rocks.push({ x: Math.round(x), y: Math.round(y), radius: 22 });
    }
    for(const grove of groves)regions.push({...grove,seed:random()*100});
    for (let i = 0; i < Math.round(28 * AREA); i++) regions.push({ x: Math.round(random() * width), y: Math.round(random() * height), radius: 90 + random() * 170, seed: random() * 100 });
    const horizontal=random()<.5,riverOffset=.48+random()*.25;
    const river=Array.from({length:7},(_,i)=>horizontal?{x:Math.round(width*i/6),y:Math.round(height*(riverOffset+(random()-.5)*.14))}:{x:Math.round(width*(riverOffset+(random()-.5)*.14)),y:Math.round(height*i/6)});
    const curve=riverCurve(river);
    if(stage===1)for(let i=6;i<curve.length;i+=10){
      const a=curve[i-1],b=curve[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      for(const side of [-1,1]){const x=Math.round((a.x+b.x)/2-dy/length*95*side),y=Math.round((a.y+b.y)/2+dx/length*95*side);if(x>80&&x<width-80&&y>110&&y<height-80&&safe(x,y))habitats.push({x,y,roll:.99});}
    }
    const fords=[];if(stage===1){let run=0;for(let i=1;i<curve.length;i++){run+=Math.hypot(curve[i].x-curve[i-1].x,curve[i].y-curve[i-1].y);if(run>520&&curve[i].x>120&&curve[i].y>140&&curve[i].x<width-120&&curve[i].y<height-120){fords.push({x:Math.round(curve[i].x),y:Math.round(curve[i].y)});run=0;}}}
    const habitatMap={river,riverCurve:curve,fords};
    const mud=[];
    for(let i=0;i<[6,18,4,0][stage];i++){
      const point=stage===1?curve[Math.floor(random()*curve.length)]:{x:140+random()*(width-280),y:160+random()*(height-320)};
      const x=Math.round(point.x+(random()-.5)*250),y=Math.round(point.y+(random()-.5)*180);
      if(x>90&&y>120&&x<width-90&&y<height-90&&Math.hypot(x-480,y-340)>160)mud.push({x,y,rx:40+Math.round(random()*35),ry:25+Math.round(random()*30)});
    }
    const props = stage === 0 ? ['fern_large', 'fern_large', 'fern_large', 'tree_canopy', 'flower_bush', 'fallen_log'] : stage === 1 ? ['fern_large', 'fern_large', 'flower_bush', 'tree_canopy', 'fallen_log'] : stage === 2 ? ['fern_large', 'fern_large', 'boulder_large', 'dead_tree', 'flower_bush'] : ['fern_large', 'lava_rock', 'dead_tree', 'ribcage', 'meteorite'];
    const count = Math.round([850, 850, 600, 450][stage] * AREA);
    const foliagePoint=()=>{
      if(random()<[.75,.5,.85][layout]){const grove=groves[Math.floor(random()*groves.length)],angle=random()*Math.PI*2,radius=Math.sqrt(random())*grove.radius;return {x:Math.round(Math.max(70,Math.min(width-70,grove.x+Math.cos(angle)*radius))),y:Math.round(Math.max(90,Math.min(height-90,grove.y+Math.sin(angle)*radius)))};}
      return {x:Math.round(70+random()*(width-140)),y:Math.round(90+random()*(height-180))};
    };
    for (let i = 0; i < count; i++) {
      const {x,y}=foliagePoint();
      if (Math.hypot(x - 480, y - 340) < 65) continue;
      const prop = props[Math.floor(random() * props.length)];
      if(stage===3 && riverDistance(habitatMap,{x,y})<100) continue;
      decorations.push({ x, y, path: 'assets/props/' + prop + '.png', canopy: prop === 'tree_canopy', foliage: ['fern_large', 'flower_bush', 'tree_canopy'].includes(prop) });
    }
    if(stage<3)for(let i=0;i<Math.round(500*AREA);i++){const p=foliagePoint();if(Math.hypot(p.x-480,p.y-340)>65)decorations.push({...p,path:'assets/environment/fern.png',foliage:true});}
    const ecology=BIOMES[stage];
    for(let i=0;i<Math.round(420*AREA);i++) {
      const {x,y}=foliagePoint();
      if(Math.hypot(x-480,y-340)<65 || stage===3 && riverDistance(habitatMap,{x,y})<145) continue;
      let plant=ecology.plants[Math.floor(random()*ecology.plants.length)];
      if(stage===1 && riverDistance(habitatMap,{x,y})<170) plant=random()<.6?'reeds':'horsetail';
      decorations.push({x,y,path:'assets/ecology/'+plant+'.png',foliage:!['lichen','twigs','leaf_litter','moss'].includes(plant),ecology:true});
    }
    const ambience=[];
    for(let i=0;i<Math.round(45*AREA);i++) {
      let x=Math.round(70+random()*(width-140)),y=Math.round(90+random()*(height-180));
      const kind=ecology.insects[i%ecology.insects.length];
      if(kind==='dragonfly'){ const n=Math.floor(random()*(curve.length-1)),a=curve[n],b=curve[n+1],t=.35+random()*.3;x=Math.round(a.x+(b.x-a.x)*t-80);y=Math.round(a.y+(b.y-a.y)*t); }
      if(stage===3 && riverDistance(habitatMap,{x,y})<145)continue;
      ambience.push({x,y,kind,phase:random()*Math.PI*2});
    }
    for (let i = 0; i < 6; i++) {
      const h = habitats[Math.floor((i + .5) / 6 * habitats.length)];
      sites.push({ id: i, type: i % 3 === 0 ? 'fossil' : i % 3 === 1 ? 'nest' : 'rare', x: h.x, y: h.y, claimed: false, discovered: false });
    }
    const events=[];
    for(let i=0;i<2;i++){const h=habitats[Math.floor(random()*habitats.length)];events.push({x:h.x,y:h.y,type:random()<.5?'spring':'fossil',claimed:false});}
    const arenas=habitats.filter(h=>Math.hypot(h.x-480,h.y-340)>750&&suitableHabitat(stage,habitatMap,STAGES[stage].boss,h)).filter((_,i)=>i%11===0).slice(0,3).map((h,i)=>({...h,style:['grove','ridge','clearing'][(i+layout)%3]}));
    const forage=habitats.filter((_,i)=>i%3!==2).slice(0,Math.round(36*AREA)).map((h,i)=>({id:'plant:'+i,x:h.x,y:h.y,kind:'plant',rarity:i%11===0?2:i%4===0?1:0,value:4+stage+(i%3),depleted:false}));
    const ponds=habitats.filter(h=>riverDistance(habitatMap,h)>150).filter((_,i)=>i%9===0).slice(0,8).map((h,i)=>({x:h.x,y:h.y,radius:72,id:i}));
    const fishSchools=ponds.map((pond,i)=>({id:'fish:'+i,x:pond.x,y:pond.y,stock:8,value:2+stage,kind:'fish',water:'pond'}));
    const waterMap={...habitatMap,ponds};
    if(stage===1)for(let i=8;i<curve.length-8;i+=10){const p=curve[i];if(p.x>80&&p.y>100&&p.x<width-80&&p.y<height-80)fishSchools.push({id:'riverfish:'+i,x:Math.round(p.x),y:Math.round(p.y),stock:8,value:3,kind:'fish',water:'river'});}
    // Keep water visible and edible plants on dry land; tall props clear the shoreline.
    for(const item of [...sites,...events])if(isWater(stage,waterMap,item,-64)){const dry=habitats.filter(h=>!isWater(stage,waterMap,h,-64)).sort((a,b)=>Math.hypot(a.x-item.x,a.y-item.y)-Math.hypot(b.x-item.x,b.y-item.y))[0];if(dry){item.x=dry.x;item.y=dry.y;}}
    const shore=p=>isWater(stage,waterMap,p,-(p.canopy?96:50));
    for(let i=decorations.length-1;i>=0;i--)if(shore(decorations[i]))decorations.splice(i,1);
    for(let i=forage.length-1;i>=0;i--)if(isWater(stage,waterMap,forage[i],-24))forage.splice(i,1);
    for(let i=mud.length-1;i>=0;i--)if(isWater(stage,waterMap,mud[i],-Math.max(mud[i].rx,mud[i].ry)))mud.splice(i,1);
    for(let i=rocks.length-1;i>=0;i--)if(isWater(stage,waterMap,rocks[i],-rocks[i].radius))rocks.splice(i,1);
    const zones=buildZones(stage,seed,width,height,{rocks,decorations,mud,habitats,events,forage,waterMap,props});
    // Edible plants stay visible: no tall scenery right on top of them.
    for(let i=decorations.length-1;i>=0;i--){const d=decorations[i];if(d.foliage&&forage.some(f=>Math.hypot(f.x-d.x,f.y-d.y)<46))decorations.splice(i,1);}
    const cover=decorations.filter(d=>/shrub|fruit_bush|fern_large|flower_bush/.test(d.path)).map(d=>({x:d.x,y:d.y,radius:34}));
    return { fords, zones, ponds,fishSchools,forage, events, arenas, seed, width, height, rocks, decorations, habitats, clearings, regions, trails, river, sites, ambience, layout, groves, riverOrientation:horizontal?'horizontal':'vertical',riverCurve:curve,mud,cover };
  }
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = (n, fallback = 0) => typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  const cleanName = value => String(value || 'Compy').trim().slice(0, 20) || 'Compy';
  function sanitizeSave(raw) {
    const x = raw && typeof raw === 'object' ? raw : {};
    const save = { version: 1, name: cleanName(x.name), dna: Math.floor(clamp(finite(x.dna), 0, 1000000)), upgrades: {}, settings: {}, scores: [] };
    for (const u of UPGRADES) save.upgrades[u.id] = Math.floor(clamp(finite(x.upgrades && x.upgrades[u.id]), 0, u.max));
    for (const key of ['master', 'music', 'sfx', 'ambient']) save.settings[key] = clamp(finite(x.settings && x.settings[key], key === 'music' ? .4 : .7), 0, 1);
    save.settings.autoAttack=!!(x.settings&&x.settings.autoAttack);save.settings.skipIntro=!!(x.settings&&x.settings.skipIntro);save.settings.language=typeof (x.settings&&x.settings.language)==='string'?x.settings.language.slice(0,8):'da';save.settings.reducedMotion=!!(x.settings&&x.settings.reducedMotion);
    for(const key of ['hudScale','textScale'])save.settings[key]=clamp(finite(x.settings&&x.settings[key],1),.85,1.4);
    const defaults={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',attack:'Space',ability:'ShiftLeft',sneak:'KeyC',eat:'KeyF',interact:'KeyE'};save.bindings={...defaults};
    if(x.bindings){const candidate={...defaults};for(const key of Object.keys(defaults))if(/^(Key[A-Z]|Space|ShiftLeft|ShiftRight)$/.test(x.bindings[key]||''))candidate[key]=x.bindings[key];if(new Set(Object.values(candidate)).size===Object.keys(candidate).length)save.bindings=candidate;}
    save.settings.shake = !(x.settings && x.settings.shake === false);
    if (Array.isArray(x.scores)) save.scores = x.scores.filter(s => s && Number.isFinite(s.score) && s.score >= 0).map(s => ({ name: cleanName(s.name), score: Math.floor(clamp(s.score, 0, 100000000)), stage: Math.floor(clamp(finite(s.stage, 1), 1, LEVELS.length)), bosses: Math.floor(clamp(finite(s.bosses), 0, LEVELS.length)), seconds: Math.floor(clamp(finite(s.seconds), 0, 100000)), victory: s.victory === true })).sort((a, b) => b.score - a.score).slice(0, 10);
    save.fieldGuide={};for(const [id,entry] of Object.entries(x.fieldGuide||{}))if(Object.hasOwn(SPECIES,id)&&entry&&typeof entry==='object')save.fieldGuide[id]={biomes:[...new Set((Array.isArray(entry.biomes)?entry.biomes:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<4))],attacks:[...new Set((Array.isArray(entry.attacks)?entry.attacks:[]).filter(n=>['bite','charge','slam','roar'].includes(n)))]};
    // Saves from before the progression overhaul (version 1) always had Compy unlocked.
    const legacy=x.version===1||!x.version&&Object.keys(x).length>0;
    save.version=2;
    save.unlockedSpecies = ['velociraptor', ...(legacy?['compy']:[]), ...Object.keys(PLAYER_SPECIES).filter(id => id !== 'velociraptor' && !(legacy&&id==='compy') && Array.isArray(x.unlockedSpecies) && x.unlockedSpecies.includes(id))];
    save.achievements={};for(const a of ACHIEVEMENTS)if(x.achievements&&Number.isFinite(x.achievements[a.id]))save.achievements[a.id]=x.achievements[a.id];
    save.lifetime={};for(const key of LIFETIME_KEYS)save.lifetime[key]=Math.max(0,finite(x.lifetime&&x.lifetime[key]));
    save.dietRecords={};for(const key of ['carnivore','herbivore','other'])save.dietRecords[key]=Math.floor(clamp(finite(x.dietRecords&&x.dietRecords[key]),0,LEVELS.length));
    save.skins=['classic',...Object.keys(SKINS).filter(id=>id!=='classic'&&Array.isArray(x.skins)&&x.skins.includes(id))];
    save.skin=save.skins.includes(x.skin)?x.skin:'classic';
    save.selectedSpecies = save.unlockedSpecies.includes(x.selectedSpecies) ? x.selectedSpecies : 'velociraptor';
    return save;
  }
  // ---- Progression (overhaul phase 4): a longer unlock ladder, achievements and cosmetic skins.
  const SPECIES_UNLOCKS={
    velociraptor:{free:true},
    utahraptor:{dna:60}, pachycephalosaurus:{dna:80}, carnotaurus:{dna:140}, ankylosaurus:{dna:170},
    compy:{achievement:'survivor'}, gallimimus:{achievement:'marathon'}, baryonyx:{achievement:'fisherKing'},
    triceratops:{achievement:'gentleGiant'}, tyrannosaurus:{achievement:'apex'}
  };
  for(const [id,u] of Object.entries(SPECIES_UNLOCKS))PLAYER_SPECIES[id].cost=u.dna||0;
  const SKINS={classic:{name:'Naturlige farver'},male:{name:'Prydfarver',achievement:'firstBoss'},elite:{name:'Rivalens farver',achievement:'rivalSlayer'},albino:{name:'Albino',achievement:'threeDiets'}};
  const ACHIEVEMENTS=[
    {id:'firstBlood',name:'Første bid',text:'Nedlæg dit første dyr.',dna:5,check:c=>c.life.kills>=1},
    {id:'firstBoss',name:'Bossjæger',text:'Besejr din første boss.',dna:10,skin:'male',check:c=>c.life.bosses>=1},
    {id:'albinoHunter',name:'Hvid skygge',text:'Nedlæg en albino.',dna:10,check:c=>c.life.albinos>=1},
    {id:'critMaster',name:'Præcision',text:'Lav 10 kritiske træf i ét run.',dna:10,check:c=>c.run&&(c.run.stats.crits||0)>=10},
    {id:'grazer',name:'Grønne tænder',text:'Spis 50 planteportioner i alt.',dna:10,check:c=>c.life.plantsEaten>=50},
    {id:'explorer',name:'Opdagelsesrejsende',text:'Find 20 nye områder i alt.',dna:12,check:c=>c.life.zones>=20},
    {id:'hundredKills',name:'Rovdyrets vej',text:'Nedlæg 100 dyr i alt.',dna:15,check:c=>c.life.kills>=100},
    {id:'closeCall',name:'På et hængende hår',text:'Besejr en boss med under 10 % liv tilbage.',dna:15,check:c=>c.flags.closeCall},
    {id:'untouchable',name:'Urørlig',text:'Besejr en boss uden at blive ramt af den.',dna:25,check:c=>c.flags.untouchable},
    {id:'rivalSlayer',name:'Rivalernes skræk',text:'Nedlæg 5 rivaler i alt.',dna:15,skin:'elite',check:c=>c.life.rivals>=5},
    {id:'survivor',name:'Overlever',text:'Overlev 10 minutter i ét run.',species:'compy',check:c=>c.run&&c.run.seconds>=600},
    {id:'marathon',name:'Maratonløber',text:'Løb 20 km i alt.',species:'gallimimus',check:c=>c.life.distance>=20000},
    {id:'fisherKing',name:'Fiskebankens fald',text:'Besejr Benny – Fiskebankens Hersker.',species:'baryonyx',check:c=>c.flags.bossKind==='baryonyx'},
    {id:'gentleGiant',name:'Blid men farlig',text:'Nedlæg 3 elite- eller rivaldyr med en planteæder.',species:'triceratops',check:c=>c.life.herbivoreElites>=3},
    {id:'apex',name:'Urkongens fald',text:'Besejr Ragnar – Dalens Konge på sidste bane.',species:'tyrannosaurus',check:c=>c.flags.bossKind==='tyrannosaurus'&&c.flags.finalBoss},
    {id:'threeDiets',name:'Tre kostformer',text:'Nå bane 3 med en kødæder, en planteæder og en fisker eller altæder.',skin:'albino',check:c=>['carnivore','herbivore','other'].every(d=>c.save.dietRecords[d]>=3)}
  ];
  const LIFETIME_KEYS=['runs','kills','bosses','albinos','rivals','plantsEaten','fishCaught','distance','zones','herbivoreElites','seconds','victories'];
  function upgradeCost(rank) { return Math.round(10 * Math.pow(rank + 1, 1.4)); }
  class Game {
    constructor({ storage = null, random = Math.random } = {}) {
      this.storage = storage; this.random = random; this.storageAvailable = !!storage;
      let raw;
      try { raw = storage && JSON.parse(storage.getItem(SAVE_KEY) || 'null'); } catch (_) { this.storageAvailable = false; }
      this.save = sanitizeSave(raw); this.phase = 'menu'; this.run = null; this.events = []; this.nextId = 0;
    }
    emit(type, detail = {}) { this.events.push({ type, ...detail }); }
    drainEvents() { return this.events.splice(0); }
    persist() {
      try { if (!this.storage) throw Error('No storage'); this.storage.setItem(SAVE_KEY, JSON.stringify(this.save)); this.storageAvailable = true; }
      catch (_) { this.storageAvailable = false; }
    }
    setName(name) { this.save.name = cleanName(name); this.persist(); }
    setSetting(key, value) {
      if (['master', 'music', 'sfx', 'ambient'].includes(key)) this.save.settings[key] = clamp(finite(value), 0, 1);
      else if(['hudScale','textScale'].includes(key))this.save.settings[key]=clamp(finite(value,1),.85,1.4);
      else if (['shake','autoAttack','reducedMotion','skipIntro'].includes(key))this.save.settings[key]=!!value;
      else if (key==='language'&&typeof value==='string')this.save.settings.language=value.slice(0,8);
      else return;
      this.persist();
    }
    setBinding(action,code){if(!(action in this.save.bindings)||!/^(Key[A-Z]|Space|ShiftLeft|ShiftRight)$/.test(code)||Object.entries(this.save.bindings).some(([a,c])=>a!==action&&c===code))return false;this.save.bindings[action]=code;this.persist();return true;}
    purchase(id) {
      if (!['menu', 'shop', 'result'].includes(this.phase)) return false;
      const u = UPGRADES.find(u => u.id === id); if (!u) return false;
      const rank = this.save.upgrades[id], cost = upgradeCost(rank);
      if (rank >= u.max || this.save.dna < cost) return false;
      this.save.dna -= cost; this.save.upgrades[id]++; this.persist(); this.emit('ui'); return true;
    }
    unlockSpecies(id) {
      if (!['menu', 'shop', 'result', 'species'].includes(this.phase)) return false;
      const species = PLAYER_SPECIES[id];
      if (!Object.hasOwn(PLAYER_SPECIES, id) || this.save.unlockedSpecies.includes(id) || SPECIES_UNLOCKS[id].achievement || this.save.dna < species.cost) return false;
      this.save.dna -= species.cost; this.save.unlockedSpecies.push(id); this.persist(); this.emit('ui'); return true;
    }
    setSkin(id){if(!this.save.skins.includes(id))return false;this.save.skin=id;this.persist();return true;}
    lifetimeTotals(){
      const life={...this.save.lifetime},r=this.run;if(!r||r.lifetimeBanked)return life;
      life.kills+=r.stats.kills;life.bosses+=r.bosses;life.albinos+=r.stats.albinos||0;life.rivals+=r.stats.rivals||0;life.plantsEaten+=r.stats.plantsEaten;life.fishCaught+=r.stats.fishCaught;life.distance+=r.stats.distance;life.zones+=r.stats.zones||0;life.herbivoreElites+=r.stats.herbivoreElites||0;life.seconds+=r.seconds;return life;
    }
    bankLifetime(victory){
      const r=this.run;if(!r||r.lifetimeBanked)return;const life=this.lifetimeTotals();life.runs++;if(victory)life.victories++;this.save.lifetime=life;r.lifetimeBanked=true;
      const diet=PLAYER_SPECIES[r.species].diet,key=diet==='carnivore'?'carnivore':diet==='herbivore'?'herbivore':'other';this.save.dietRecords[key]=Math.max(this.save.dietRecords[key],r.levelIndex+1);
    }
    checkAchievements(flags={}){
      const r=this.run;if(r){const diet=PLAYER_SPECIES[r.species].diet,key=diet==='carnivore'?'carnivore':diet==='herbivore'?'herbivore':'other';if(this.save.dietRecords[key]<r.levelIndex+1)this.save.dietRecords[key]=r.levelIndex+1;}
      const context={save:this.save,run:r,life:this.lifetimeTotals(),flags},earned=[];
      for(const a of ACHIEVEMENTS){if(this.save.achievements[a.id]||!a.check(context))continue;
        this.save.achievements[a.id]=Date.now();earned.push(a);
        if(a.dna){this.save.dna+=a.dna;if(r){r.dna+=a.dna;r.stats.dna+=a.dna;}}
        if(a.species&&!this.save.unlockedSpecies.includes(a.species))this.save.unlockedSpecies.push(a.species);
        if(a.skin&&!this.save.skins.includes(a.skin))this.save.skins.push(a.skin);
        this.emit('achievement',{id:a.id,name:a.name,dna:a.dna||0,species:a.species||null,skin:a.skin||null});
      }
      if(earned.length)this.persist();return earned;
    }
    selectSpecies(id) {
      if (!['menu', 'shop', 'result', 'species'].includes(this.phase) || !this.save.unlockedSpecies.includes(id)) return false;
      this.save.selectedSpecies = id; this.persist(); return true;
    }
    currentLevel(){const r=this.run,level=r.campaign[r.levelIndex];return level.biome===r.stage?level:{...STAGES[r.stage],biome:r.stage};}
    start({ seed,campaign='journey' } = {}) {
      const species = this.save.selectedSpecies, config = PLAYER_SPECIES[species];
      const up = { ...this.save.upgrades }, maxHealth = config.hp * (1 + .02 * up.health);
      this.run = { stats:{attacks:0,landedAttacks:0,hits:0,kills:0,fishCaught:0,plantsEaten:0,meatEaten:0,abilities:0,avoidedHits:0,damageTaken:0,damageDealt:0,healing:0,distance:0,staminaSpent:0,food:0,dna:0,dropRolls:0,drops:0,mutations:0,killsBySpecies:{}},stageStats:[],missedSecrets:0,rareRewards:0,rareSelection:false,corpses: [], eating: null, staminaDelay:0, frenzy:0, shield:0, shieldTime:0, tailEmpowered:0, explored: {}, hidden: false, concealTime: 0, revealedUntil: 0, surface: 'ground', seed: seed === undefined ? Math.floor(this.random() * 4294967296) : seed >>> 0, species, abilityHits: [], exploration: 0, eliteKills: 0, player: { x: 480, y: 340, radius: config.radius,kind:species, facing: 'S', walk: 0, moving: false }, health: maxHealth, maxHealth, stamina: 100, slow: 0, stage: 0, meat: 0, totalMeat: 0, level: 1, xp: 0, nextXP: 6, mutations: Object.fromEntries(MUTATIONS.map(m => [m.id, 0])), upgrades: up, choices: [], enemies: [], pickups: [], effects: [], particles: [], decals: [], hitStop: 0, hurt: 0, deathTime: -1, seconds: 0, kills: 0, bosses: 0, dna: 0, score: 0, spawnTimer: 1, attackCooldown: 0, attack: null, biteFacing: 'S', bite: 0, pounce: 0, pounceCooldown: 0, invulnerable: 0, shake: 0, bossSpawned: false, bossDefeated: false, result: null };
      this.run.levelIndex=0;this.run.secret=this.run.seed===SECRET_SEED;this.run.campaign=this.run.secret?[{biome:0,name:'Den hemmelige lysning',subtitle:'Compy-tyvenes banket',target:18,boss:'pachycephalosaurus',bossName:'Mathias - Kødvogteren',dna:12,mini:true}]:campaign==='classic'?STAGES.map((v,i)=>({...v,biome:i})):LEVELS;
      this.behaviorRandom = seeded(this.run.seed ^ 0x9E3779B9); this.run.map = createMap(0, this.run.seed); this.setView(WIDTH, HEIGHT); this.run.jonas = this.save.name.toLowerCase() === 'jonas'; this.phase = 'playing'; this.populate(); this.emit('start'); if (this.run.jonas) this.emit('jonas');
    }
    setView(width, height) {
      if (!this.run) return;
      const r = this.run;
      r.view = { width, height, x: Math.round(clamp(r.player.x - width / 2, 0, Math.max(0, r.map.width - width))), y: Math.round(clamp(r.player.y - height / 2, 0, Math.max(0, r.map.height - height))) };
    }
    populate() {
      const r = this.run;
      const openingRandom=seeded(r.seed^Math.imul(r.stage+1,1234567));
      for(const kind of ['compy','compy','parasaurolophus'])for(let attempt=0;attempt<32;attempt++){
        const angle=openingRandom()*Math.PI*2,distance=110+openingRandom()*160,point={x:Math.round(480+Math.cos(angle)*distance),y:Math.round(340+Math.sin(angle)*distance)};
        if(point.x<65||point.y<100||r.map.rocks.some(rock=>Math.hypot(point.x-rock.x,point.y-rock.y)<70))continue;
        this.spawn(kind,point);break;
      }
      // Small thieves gather in actual independently colliding flocks.
      for(const centre of r.map.habitats.filter((_,i)=>i%4===0).slice(0,r.secret?6:3))for(let n=0;n<6;n++){const angle=n*Math.PI/3,point={x:centre.x+Math.cos(angle)*24,y:centre.y+Math.sin(angle)*24};if(!suitableHabitat(r.stage,r.map,'compy',point))continue;const e=this.spawn('compy',point);if(e){e.thiefPack=true;e.herdId='thieves:'+centre.x+':'+centre.y;}}
      const pool = r.stage===0?['compy','parasaurolophus','compy','gallimimus','pachycephalosaurus']:BIOMES[r.stage].animals;
      r.map.habitats.forEach((p, i) => {
        if (isWater(r.stage, r.map, p, -20)) return;
        const zone=r.map.zones&&r.map.zones[p.zone],zonePool=zone?zone.animals.filter(kind=>BIOMES[r.stage].animals.includes(kind)&&(r.levelIndex>0||pool.includes(kind))):pool;
        const eligible=(zonePool.length?zonePool:pool).filter(kind=>suitableHabitat(r.stage,r.map,kind,p));
        if(eligible.length)this.spawn(eligible[Math.floor(p.roll*eligible.length)],p);
        const flock={x:p.x+45,y:p.y+30};
        const animal=r.enemies[r.enemies.length-1];
        if(animal&&animal.kind==='parasaurolophus'&&i%4===0&&suitableHabitat(r.stage,r.map,'parasaurolophus',flock))this.spawn('parasaurolophus',flock);
        if (i % 3 === 0 && suitableHabitat(r.stage,r.map,'compy',flock)) this.spawn('compy',flock);
      });
      for (const site of r.map.sites) {
        if (site.type === 'rare') { const point=this.habitatPosition('parasaurolophus',site);if(!point)continue;site.x=point.x;site.y=point.y;const e = this.spawn('parasaurolophus', point); e.rare = true;e.variant='albino'; e.speed *= 1.2; site.animalId = e.id; }
        if (site.type === 'nest') { const kind=r.stage===1?'carnotaurus':STAGES[r.stage].boss;const point=this.habitatPosition(kind,{x:site.x+100,y:site.y});if(!point)continue;if(Math.hypot(point.x-site.x,point.y-site.y)>180){site.x=point.x;site.y=point.y+70;}const e=this.spawn(kind,point); e.elite = true; e.guard = true; e.hp *= 1.6; e.maxHP = e.hp; e.damage *= 1.3; e.speed *= 1.08; site.guardId = e.id; }
      }
      if (!r.secret) this.spawnRival();
      r.spawnTimer = r.stage === 0 ? 5 : 1;
    }
    // One optional miniboss per level, far from the start: risk you choose for an epic genome.
    spawnRival() {
      const r=this.run,kind=RIVALS[r.stage].kind,start={x:480,y:340};
      const spots=r.map.habitats.filter(h=>!isWater(r.stage,r.map,h,-40)&&Math.hypot(h.x-start.x,h.y-start.y)>900&&suitableHabitat(r.stage,r.map,kind,h)&&!r.map.rocks.some(rock=>Math.hypot(h.x-rock.x,h.y-rock.y)<70)&&!r.map.sites.some(site=>Math.hypot(h.x-site.x,h.y-site.y)<260));
      if(!spots.length)return null;
      const spot=spots[Math.floor(seeded(r.seed^Math.imul(r.levelIndex+7,97531))()*spots.length)];
      const e=this.spawn(kind,spot);if(!e)return null;
      const names=RIVALS[r.stage].names;
      e.elite=true;e.miniboss=true;e.rivalName=names[(r.seed+r.levelIndex)%names.length];e.hp*=2.6;e.maxHP=e.hp;e.damage*=1.35;e.speed*=1.05;e.visualScale=Math.max(e.visualScale||1,1.35);e.territoryRadius=260;e.herdId=null;
      r.map.rival={id:e.id,kind,x:spot.x,y:spot.y,name:e.rivalName};
      return e;
    }
    habitatPosition(kind, near) {
      const r=this.run;
      const candidates=[near,...r.map.habitats].filter(p=>suitableHabitat(r.stage,r.map,kind,p) && !r.map.rocks.some(rock=>Math.hypot(p.x-rock.x,p.y-rock.y)<65));
      candidates.sort((a,b)=>Math.hypot(a.x-near.x,a.y-near.y)-Math.hypot(b.x-near.x,b.y-near.y));
      return candidates[0] || null;
    }
    hiddenSpawn(kind='compy') {
      const r = this.run, v = r.view, start = this.random() * Math.PI * 2;
      for (let i = 0; i < 32; i++) {
        const angle = start + i * Math.PI * 2 / 32;
        const distance = Math.hypot(v.width, v.height) / 2 + 180;
        const p = { x: r.player.x + Math.cos(angle) * distance, y: r.player.y + Math.sin(angle) * distance };
        if (p.x < 80 || p.y < 100 || p.x > r.map.width - 80 || p.y > r.map.height - 80) continue;
        if (p.x > v.x - 128 && p.x < v.x + v.width + 128 && p.y > v.y - 128 && p.y < v.y + v.height + 128) continue;
        if (r.map.rocks.some(rock => Math.hypot(p.x - rock.x, p.y - rock.y) < 65) || !suitableHabitat(r.stage,r.map,kind,p) || !zoneAllows(r.map,kind,p)) continue;
        return p;
      }
      if(kind==='deinosuchus') {
        return r.map.habitats.find(p=>suitableHabitat(r.stage,r.map,kind,p) && (p.x<v.x-128 || p.x>v.x+v.width+128 || p.y<v.y-128 || p.y>v.y+v.height+128) && !r.map.rocks.some(rock=>Math.hypot(p.x-rock.x,p.y-rock.y)<65)) || null;
      }
      return null;
    }
    spawn(kind, position, boss = false) {
      const r = this.run, base = SPECIES[kind]; if (!base) throw Error('Unknown species');
      const arena=boss&&!position?r.map.arenas.find(a=>suitableHabitat(r.stage,r.map,kind,a)&&(a.x<r.view.x-128||a.x>r.view.x+r.view.width+128||a.y<r.view.y-128||a.y>r.view.y+r.view.height+128)&&!r.map.rocks.some(rock=>Math.hypot(a.x-rock.x,a.y-rock.y)<65)):null;
      const p = position || arena || this.hiddenSpawn(kind); if (!p) return null;
      const scale = 1 + r.stage * .22 + r.levelIndex * .04;
      const level=this.currentLevel(),hp = boss ? level.boss===kind&&r.campaign.length!==4?(level.mini?100+r.levelIndex*30:180+r.levelIndex*55):(220+r.stage*85) : base.hp*scale;
      const e = { id: ++this.nextId, kind, x: p.x, y: p.y, radius: boss ? (kind==='carnotaurus'?42:32) : base.radius, hp, maxHP: hp, speed: Math.min(base.speed * (1 + r.stage * .08), 110), damage: boss ? 20 + r.stage * 5 : base.damage * (1 + r.stage * .18), boss, facingX: 0, facingY: 1, cooldown: boss ? 1.8 : .5, mode: 'chase', timer: 0, chargeX: 0, chargeY: 1, bleed: 0, hit: 0, stagger: 0, pattern: 0, walk: 0, poseTime: 0, moving: false, direction: 'S', attackHit: false, attackRadius: kind === 'ankylosaurus' ? 90 : boss ? 130 : base.radius + 28 };
      if(arena){e.arenaStyle=arena.style;const clearingRadius=arena.style==='grove'?100:arena.style==='ridge'?150:200;r.map.cover=r.map.cover.filter(d=>Math.hypot(d.x-arena.x,d.y-arena.y)>clearingRadius);r.map.decorations=r.map.decorations.filter(d=>Math.hypot(d.x-arena.x,d.y-arena.y)>(arena.style==='grove'?100:arena.style==='ridge'?150:200));r.map.rocks=r.map.rocks.filter(d=>Math.hypot(d.x-arena.x,d.y-arena.y)>120);}
      e.stamina=100;e.skillCooldown=1.5;e.skillDelay=0;if(boss)e.bossName=level.boss===kind?level.bossName:STAGES[r.stage].bossName;
      e.sex=seeded(r.seed^Math.imul(e.id,123457))()<.5?'female':'male';e.pattern=e.pattern||0; e.visualScale=['deinosuchus','tyrannosaurus'].includes(kind)||boss&&kind==='carnotaurus'?2:1; e.herdId=['compy','parasaurolophus','gallimimus','pachycephalosaurus'].includes(kind)?(r.enemies.find(o=>o.kind===kind&&Math.hypot(o.homeX-p.x,o.homeY-p.y)<220)?.herdId||kind+':'+e.id):null;e.naturalTime=(e.id*1.73)%12;e.activity='roam';e.territoryRadius=['carnotaurus','ankylosaurus','deinosuchus','triceratops','tyrannosaurus'].includes(kind)?330:180; e.bossPhase = 1; e.attackCycle = 0; e.attackName = ''; e.followUp = false; e.trailTimer = 0; e.homeX = p.x; e.homeY = p.y; e.alert = boss; e.lastAttackedAt = -1000; e.disengagedUntil = 0; r.enemies.push(e); return e;
    }
    terrainAt(entity) {
      const r=this.run,map=r.map;
      if(isLava(r.stage,map,entity))return {kind:'lava',speed:.7,cover:false,burn:entity===r.player};
      if(isWater(r.stage,map,entity)&&isDeepWater(r.stage,map,entity))return {kind:'deep',speed:entity.kind==='deinosuchus'?1:entity.kind==='baryonyx'?1.1*(1+(entity===r.player?.08*r.mutations.riverHunter:0)):.45,cover:false};
      if(isWater(r.stage,map,entity))return {kind:'water',speed:entity.kind==='deinosuchus'?1:entity.kind==='baryonyx'?1.05*(1+(entity===r.player?.08*r.mutations.riverHunter:0)):.6,cover:false};
      if((map.mud||[]).some(p=>((entity.x-p.x)/p.rx)**2+((entity.y-p.y)/p.ry)**2<1))return {kind:'mud',speed:entity.kind==='deinosuchus'?.9:.75,cover:false};
      const zone=r.stage>=2?zoneAt(map,entity):null;
      if(zone&&zone.id==='ash')return {kind:'ash',speed:.9,cover:false};
      if(zone&&zone.id==='canyon'&&!(map.cover||[]).some(p=>Math.hypot(entity.x-p.x,entity.y-p.y)<p.radius))return {kind:'gravel',speed:1.05,cover:false};
      if((map.cover||[]).some(p=>Math.hypot(entity.x-p.x,entity.y-p.y)<p.radius))return {kind:'bush',speed:.9,cover:true};
      return {kind:'ground',speed:1,cover:false};
    }
    travel(entity,dx,dy){
      const r=this.run;if(entity!==r.player&&!entity.boss&&entity.hp<entity.maxHP*.35){dx*=.72;dy*=.72;}const surface=this.terrainAt(entity);dx*=surface.speed;dy*=surface.speed;
      // Non-swimmers cannot step from shallow into deep water; animals also refuse lava.
      const blocked=p=>!canSwim(entity)&&isDeepWater(r.stage,r.map,p)&&!isDeepWater(r.stage,r.map,entity)||entity!==r.player&&isLava(r.stage,r.map,p)&&!isLava(r.stage,r.map,entity);
      if(blocked({x:entity.x+dx,y:entity.y+dy})){if(!blocked({x:entity.x+dx,y:entity.y}))dy=0;else if(!blocked({x:entity.x,y:entity.y+dy}))dx=0;else{dx=0;dy=0;}}
      this.move(entity,dx,dy);
    }
    move(entity, dx, dy) {
      entity.x = clamp(entity.x + dx, 42 + entity.radius, this.run.map.width - 42 - entity.radius);
      entity.y = clamp(entity.y + dy, 76 + entity.radius, this.run.map.height - 42 - entity.radius);
      for (const rock of this.run.map.rocks) {
        const x = entity.x - rock.x, y = entity.y - rock.y, d = Math.hypot(x, y), min = entity.radius + rock.radius;
        if (d < min) { entity.x = rock.x + (d > .001 ? x / d : 1) * min; entity.y = rock.y + (d > .001 ? y / d : 0) * min; }
      }
    }
    separateDinosaurs() {
      if (this.phase !== 'playing') return;
      const enemies = this.run.enemies;
      // Stable torso circles; tails and animation poses never change collision.
      // Iterate so a correction cannot leave the next neighbour stacked.
      for (let pass = 0; pass < 12; pass++) {
        let overlapping = false;
        const buckets=new Map(),pairs=[];
        for(let i=0;i<enemies.length;i++){const e=enemies[i],key=Math.floor(e.x/128)+','+Math.floor(e.y/128);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(i);}
        for(let i=0;i<enemies.length;i++){const e=enemies[i],gx=Math.floor(e.x/128),gy=Math.floor(e.y/128);for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++)for(const j of buckets.get(x+','+y)||[])if(j>i)pairs.push([i,j]);}
        for (const [i,j] of pairs) {
          const a = enemies[i], b = enemies[j];
          const dx = b.x - a.x, dy = b.y - a.y, gap = Math.hypot(dx, dy), minimum = a.radius + b.radius + 4;
          if (gap >= minimum - .05) continue;
          overlapping = true;
          // Deterministic direction also resolves exact coincident spawns.
          const angle = ((a.id * 31 + b.id * 17) % 360) * Math.PI / 180;
          const nx = gap > .001 ? dx / gap : Math.cos(angle), ny = gap > .001 ? dy / gap : Math.sin(angle);
          const massA = a.radius * a.radius * (a.boss ? 4 : 1) * (a.mode === 'charge' ? 3 : 1);
          const massB = b.radius * b.radius * (b.boss ? 4 : 1) * (b.mode === 'charge' ? 3 : 1);
          const overlap = minimum - gap;
          const pushA = overlap * massB / (massA + massB), pushB = overlap - pushA;
          const ax = a.x, ay = a.y, bx = b.x, by = b.y;
          this.move(a, -nx * pushA, -ny * pushA);
          this.move(b, nx * pushB, ny * pushB);
          // An animal pinned against the map/rock leaves more correction to its neighbour.
          const movedA = Math.max(0, (ax - a.x) * nx + (ay - a.y) * ny);
          const movedB = Math.max(0, (b.x - bx) * nx + (b.y - by) * ny);
          if (movedA < pushA - .01) this.move(b, nx * (pushA - movedA), ny * (pushA - movedA));
          if (movedB < pushB - .01) this.move(a, -nx * (pushB - movedB), -ny * (pushB - movedB));
        }
        if (!overlapping) break;
      }
    }
    pause() { if (this.phase === 'playing') { this.phase = 'paused'; this.emit('pause'); } }
    resume() { if (this.phase === 'paused') this.phase = 'playing'; }
    abandon() { if (this.run && !this.run.result) this.finish(false); this.phase = 'menu'; }
    addDNA(amount,quiet=false) { this.save.dna += amount; this.run.dna += amount;this.run.stats.dna+=amount; this.persist(); this.emit('dna', { amount, quiet }); }
    addXP(amount) { this.run.xp += amount; this.maybeLevelUp(); }
    offerRareReward(){
      const r=this.run;if(this.phase!=='playing'||!r.rareRewards)return false;r.rareRewards--;
      const pool=MUTATIONS.filter(m=>m.rarity==='epic'&&(!m.species||m.species===r.species)&&r.mutations[m.id]<m.max);
      if(!pool.length){this.addDNA(8);return this.offerRareReward();}
      r.choices=[];while(pool.length&&r.choices.length<3)r.choices.push(pool.splice(Math.floor(this.random()*pool.length),1)[0].id);
      r.rareSelection=true;this.phase='mutation';this.emit('level_up');return true;
    }
    recordObservation(e){
      const r=this.run;if(Math.hypot(e.x-r.player.x,e.y-r.player.y)>420)return;
      const entry=this.save.fieldGuide[e.kind]||(this.save.fieldGuide[e.kind]={biomes:[],attacks:[]});let changed=false;
      if(!entry.biomes.includes(r.stage)){entry.biomes.push(r.stage);changed=true;}
      const attack=['bite','charge','slam'].includes(e.mode)?e.pattern===3?'roar':e.mode:null;
      if(attack&&!entry.attacks.includes(attack)){entry.attacks.push(attack);changed=true;}
      if(changed)this.persist();
    }
    runSummary(){const r=this.run;return r.species==='baryonyx'&&r.stats.fishCaught>=6?'Flodjæger':r.bosses>=2?'Boss-specialist':r.health>0&&r.health<=3?'Overlevede med '+Math.ceil(r.health)+' liv':r.exploration>=3?'Dalens opdagelsesrejsende':r.kills>=10?'Vedholdende jæger':'En ny gren på stamtræet';}
    statistics(stageOnly=false){
      const r=this.run,previous=stageOnly&&r.stageStats.length?r.stageStats[r.stageStats.length-1]:null,stats={};
      for(const [key,value] of Object.entries(r.stats))if(typeof value==='number')stats[key]=value-(previous?.[key]||0);
      return {...stats,steps:Math.floor(stats.distance/24),attackAccuracy:stats.attacks?100*stats.landedAttacks/stats.attacks:0,actualDNADropRate:stats.dropRolls?100*stats.drops/stats.dropRolls:0,secretsMissed:(stageOnly?0:r.missedSecrets)+r.map.sites.filter(s=>!s.claimed).length+r.map.events.filter(e=>!e.claimed).length,summary:this.runSummary(),mutations:Object.fromEntries(Object.entries(r.mutations).filter(([,v])=>v)),killsBySpecies:{...r.stats.killsBySpecies}};
    }
    maybeLevelUp() {
      const r = this.run;
      if (r.xp < r.nextXP || this.phase !== 'playing') return;
      const pool = MUTATIONS.filter(m => (!m.species || m.species === r.species) && r.mutations[m.id] < m.max);
      if (!pool.length) { r.xp = Math.min(r.xp, r.nextXP - 1); return; }
      r.xp -= r.nextXP; r.level++; r.nextXP = 6 + (r.level - 1) * 3;
      const choices = [];
      while (choices.length < 3 && pool.length) {
        const total = pool.reduce((sum, m) => sum + mutationWeight(m,r.mutations), 0);
        let roll = this.random() * total, index = pool.length - 1;
        for (let i = 0; i < pool.length; i++) { roll -= mutationWeight(pool[i],r.mutations); if (roll < 0) { index = i; break; } }
        choices.push(pool.splice(index, 1)[0].id);
      }
      r.choices = choices; this.phase = 'mutation'; this.emit('level_up');
    }
    choose(id) {
      const r = this.run; if (this.phase !== 'mutation' || !r.choices.includes(id)) return false;
      const beforeHealth=r.health;r.mutations[id]++;r.stats.mutations++;r.rareSelection=false;if(id==='apexGenome'){r.maxHealth+=25;r.health=Math.min(r.maxHealth,r.health+25);} if (id === 'heart') { r.maxHealth += 15; r.health = Math.min(r.maxHealth, r.health + 15); }
      r.stats.healing+=Math.max(0,r.health-beforeHealth);r.choices = []; this.phase = 'playing'; this.emit('ui');if(!this.offerRareReward())this.maybeLevelUp();
      if (this.phase === 'playing' && r.bossDefeated) this.phase = 'cleared';
      if (this.phase === 'playing') r.invulnerable = Math.max(r.invulnerable, 1);
      return true;
    }
    damage(amount, source) {
      const r = this.run; if (r.invulnerable > 0 || (r.pounce > 0 && ['compy', 'utahraptor','velociraptor'].includes(r.species)) || this.phase !== 'playing') {if(this.phase==='playing'&&source){r.stats.avoidedHits++;if(!r.lastDodgeText||r.seconds-r.lastDodgeText>.6){r.lastDodgeText=r.seconds;r.effects.push({x:r.player.x,y:r.player.y,text:'UNDVIGET',color:'#a2d4c1',life:.55});}}return;}
      r.eating=null;r.staminaDelay=Math.max(r.staminaDelay,1);r.revealedUntil=r.seconds+1;r.hidden=false;r.concealTime=0; const facing={N:[0,-1],S:[0,1],E:[1,0],W:[-1,0]}[r.player.facing];const sx=source?source.x-r.player.x:0,sy=source?source.y-r.player.y:0,sd=Math.hypot(sx,sy);const front=r.species==='triceratops'&&sd>0&&(sx*facing[0]+sy*facing[1])/sd>.35;amount*=(1+.12*r.mutations.glassCannon+.15*r.mutations.lightFrame)*(front?1-.25-.08*r.mutations.frill:1); amount*= (1 - .08 * r.mutations.armor) * (r.species === 'ankylosaurus' && r.pounce > 0 ? .25 : 1);const shielded=Math.min(r.shield,amount);r.shield-=shielded;amount-=shielded;r.stats.damageTaken+=Math.min(r.health,amount);if(source&&source.boss)source.hitPlayer=true;r.lastHit=source&&Object.hasOwn(SPECIES,source.kind)?{kind:source.kind,direction:source.direction,mode:source.mode,boss:!!source.boss,sex:source.sex}:null;r.health = Math.max(0, r.health - amount); r.invulnerable = .65; r.hurt = .25; r.shake = .18; this.emit('hit');
      if (r.species === 'ankylosaurus' && r.mutations.spikes) { for (const e of r.enemies) if (Math.hypot(e.x-r.player.x,e.y-r.player.y)<110) { e.hp -= 4*r.mutations.spikes*(e.npcGuardUntil>r.seconds?.25:1); this.provoke(e); } }
      if (r.health <= 0) this.finish(false);
    }
    attack() {
      const r = this.run; if (r.attackCooldown > 0 || r.attack || this.phase !== 'playing') return false;
      r.stats.attacks++;r.revealedUntil=r.seconds+2;r.hidden=false;r.concealTime=0;
      const speed = (1 - .08 * r.mutations.quick)*(1-.12*r.mutations.overclock)*(r.frenzy>0?.65:1);
      r.attackDuration=PLAYER_SPECIES[r.species].cooldown*speed;
      r.attackCooldown = r.attackDuration;
      r.attack = { elapsed: 0, duration: PLAYER_SPECIES[r.species].duration * speed, contactTime: PLAYER_SPECIES[r.species].duration / 2 * speed, facing: r.player.facing, contact: false };
      this.emit('attack_start'); return true;
    }
    advanceAttack(dt) {
      const r = this.run, attack = r.attack; if (!attack) return;
      attack.elapsed += dt;
      if (!attack.contact && attack.elapsed >= attack.contactTime) {
        attack.contact = true; r.bite = .12; r.biteFacing = attack.facing;
        this.resolveBite(attack.facing); this.emit('bite');
      }
      if (attack.elapsed >= attack.duration) r.attack = null;
    }
    burst(x, y, kind = 'blood', count = 8, seed = 0) {
      const r = this.run;
      for (let i = 0; i < count; i++) {
        const angle = (i * 2.39996 + seed), speed = 30 + i % 4 * 22;
        r.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 12, life: .3 + i % 3 * .1, maxLife: .3 + i % 3 * .1, kind, size: i % 2 + 2 });
      }
      r.particles = r.particles.slice(-160);
      if (kind === 'blood') { r.decals.push({ x, y, life: 4, seed }); r.decals = r.decals.slice(-80); }
    }
    resolveBite(facing) {
      const r = this.run;
      const dir = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[facing];
      let hits = 0, strong = false;
      for (const e of r.enemies) {
        const dx = e.x - r.player.x, dy = e.y - r.player.y, dist = Math.hypot(dx, dy);
        if (dist > PLAYER_SPECIES[r.species].range + e.radius + 10 * r.mutations.reach + (r.species === 'ankylosaurus' ? 12 * r.mutations.sweep : 0) || (r.species !== 'ankylosaurus' && dist > 24 && (dx * dir[0] + dy * dir[1]) / dist < .35)) continue;
        const frontal = dist > 0 && ((-dx * e.facingX - dy * e.facingY) / dist > .6);
        const armor = ['triceratops', 'ankylosaurus'].includes(e.kind) && frontal ? .5 : 1;
        const vulnerable = e.boss && (e.mode === 'broken' || e.mode === 'recover' && !frontal);
        const crit = this.random() < critChance(r,e);
        const damage = (crit ? CRIT.multiplier : 1) * PLAYER_SPECIES[r.species].damage * (1 + .02 * r.upgrades.damage + .15*r.mutations.rexJaw + .2*r.mutations.rexKing + .2 * r.mutations.teeth + .2*r.mutations.apexGenome + .25*r.mutations.glassCannon + .2*r.mutations.heavyMuscle + (r.species === 'compy' && e.kind === 'parasaurolophus' ? .25 * r.mutations.hunter : 0) + (r.species === 'utahraptor' && !e.alert ? .5 * r.mutations.ambush : 0) + (r.health < r.maxHealth * .4 ? .2 * r.mutations.fury : 0)) * armor * (e.npcGuardUntil>r.seconds?.25:1) * (vulnerable ? 1.25 : 1)*(r.tailEmpowered>0?2:1);
        e.hp -= damage; this.provoke(e); hits++; strong ||= crit || vulnerable || damage >= 16;if(crit){r.stats.crits=(r.stats.crits||0)+1;this.emit('crit');}
        this.burst(e.x, e.y, 'blood', vulnerable ? 12 : 8, e.id);
        e.bleed = r.mutations.bleed ? 3 : 0; e.hit = .15;
        if (!e.boss) {
          const distance = (armor < 1 ? 5 : 10) * (crit ? 1.8 : 1);
          this.move(e, (dist > 1 ? dx / dist : dir[0]) * distance, (dist > 1 ? dy / dist : dir[1]) * distance);
          // Only critical hits interrupt ordinary animals; Pachy's dome lengthens its stagger.
          e.flinch = .12; // brief movement pause; never cancels an attack in progress
          if (crit) e.stagger = Math.max(e.stagger||0, CRIT.stagger + .15 * r.mutations.bonebreak + (r.species==='pachycephalosaurus' ? .12 * r.mutations.dome : 0));
        } else if (crit) this.breakBoss(e, CRIT.bossBreak * (1 + .5 * r.mutations.bonebreak));
        r.effects.push({ x: e.x, y: e.y, text: (crit ? 'KRITISK · ' : armor < 1 ? 'PANSSER · ' : vulnerable ? 'ÅBEN FLANKE · ' : '') + Math.round(damage), color: crit ? '#dfbc52' : undefined, crit, life: crit ? .8 : .55 });
      }
      if(hits){r.stats.landedAttacks++;r.stats.hits+=hits;}
      if (hits) { r.hitStop = Math.max(r.hitStop, strong || hits > 1 ? .05 : .033); r.shake = Math.max(r.shake, strong ? .1 : .055); this.emit('bite_hit', { hits, strong }); }
      if(r.species==='ankylosaurus')r.tailEmpowered=0;
    }
    breakBoss(e,amount){
      if(!e.boss||e.mode==='broken')return;
      e.breakMeter=(e.breakMeter||0)+amount;
      if(e.breakMeter>=100){e.breakMeter=0;e.mode='broken';e.timer=CRIT.bossBreakStagger;e.attackName='BRUDT · ANGRIB NU';e.followUp=false;e.secondBite=false;this.emit('boss_break');this.burst(e.x,e.y,'dust',16,e.id);}
    }
    kill(e) {
      const r = this.run; r.kills++;r.stats.kills++;r.stats.killsBySpecies[e.kind]=(r.stats.killsBySpecies[e.kind]||0)+1;r.corpses.push({id:e.id,lifetime:60+Math.min(10,e.radius/4),foodLifetime:14+Math.min(4,e.radius/8),poseVariant:e.id%2,spoilAt:7,decayPortions:0,kind:e.kind,x:e.x,y:e.y,direction:e.direction,visualScale:e.visualScale,variant:e.rare?'albino':e.elite?'elite':e.sex==='male'?'male':null,age:0});r.corpses=r.corpses.slice(-32);
      if (e.boss) {
        r.bosses++; r.score += 1000 * (r.stage + 1); r.bossDefeated = true;
        this.addDNA(this.currentLevel().dna); this.emit('boss_dead');
        this.checkAchievements({bossKind:e.kind,finalBoss:r.levelIndex===r.campaign.length-1,closeCall:r.health<r.maxHealth*.1,untouchable:!e.hitPlayer});
      } else {
        const base = SPECIES[e.kind]; r.score += base.meat * 15;
        const roll = this.random(), thresholds = base.meat === 1 ? [.76, .95, .995] : base.meat === 3 ? [.6, .88, .98] : [.55, .8, .95];
        const rarity = e.rare || e.elite ? Math.max(2, thresholds.filter(t => roll >= t).length) : thresholds.filter(t => roll >= t).length;
        if (e.rare) r.stats.albinos=(r.stats.albinos||0)+1;
        if (e.miniboss) r.stats.rivals=(r.stats.rivals||0)+1;
        if ((e.elite||e.miniboss) && PLAYER_SPECIES[r.species].diet==='herbivore') r.stats.herbivoreElites=(r.stats.herbivoreElites||0)+1;
        if (e.elite) { r.eliteKills++; this.addDNA(base.dna + r.stage + 2); r.rareRewards++; r.rewardSource='elite'; }
        if (e.rare) {this.addDNA(base.dna+3+r.stage);r.rareRewards++;r.rewardSource='albino'; const site = r.map.sites.find(s => s.animalId === e.id); if (site) site.claimed = true; }
        r.pickups.push({ id: ++this.nextId, kind: 'meat', corpseId:e.id, x: e.x, y: e.y, rarity, value: Math.ceil(base.meat * MEAT_RARITIES[rarity].multiplier) });
        r.stats.dropRolls++;if (this.random() < base.chance) {r.stats.drops++;r.pickups.push({ id: ++this.nextId, kind: 'dna', x: clamp(e.x + 20, 48, r.map.width - 48), y: e.y, value: base.dna });}
        if (this.random() < .10) r.pickups.push({ id: ++this.nextId, kind: 'heal', x: e.x, y: clamp(e.y + 18, 80, r.map.height - 54), value: 15 });
        // Epic genome is the reward for the kill itself, offered at once on its own screen.
        if ((e.rare || e.elite) && this.phase === 'playing') this.offerRareReward();
      }
    }
    awardFood(value,x,y,label='FØDE') {
      const r=this.run;r.stats.food+=value;r.meat+=value;r.totalMeat+=value;r.xp+=value;r.score+=value*10;r.health=Math.min(r.maxHealth,r.health+value*r.mutations.scavenger);r.effects.push({x,y,text:'+'+value+' '+label,color:'#a2d4c1',life:.55});this.emit('pickup');
    }
    catchFish(school,count=1) {
      const r=this.run;if(PLAYER_SPECIES[r.species].diet!=='piscivore'||!r.map.fishSchools.includes(school)||!isWater(r.stage,r.map,school,14))return 0;const caught=Math.min(count,school.stock);if(!caught)return 0;school.stock-=caught;r.stats.fishCaught+=caught;this.awardFood(caught*(school.value+r.mutations.fisher),school.x,school.y,'FISK');return caught;
    }
    eat(dt,input) {
      const r=this.run;
      if(!input.eat || input.x || input.y || input.attack || r.attack || r.pounce>0 || r.hurt>0){r.eating=null;return;}
      const diet=PLAYER_SPECIES[r.species].diet;
      const candidates=[];
      if(diet==='herbivore'||diet==='omnivore')candidates.push(...r.map.forage.filter(p=>!p.depleted));
      if(diet!=='herbivore')candidates.push(...r.pickups.filter(p=>p.corpseId!==undefined));
      if(diet==='piscivore')candidates.push(...r.map.fishSchools.filter(p=>p.stock>0&&isWater(r.stage,r.map,p,14)));
      const food=candidates.filter(p=>(p.kind==='fish'?p.stock>0:p.value>0)&&Math.hypot(p.x-r.player.x,p.y-r.player.y)<55+r.player.radius).sort((a,b)=>Math.hypot(a.x-r.player.x,a.y-r.player.y)-Math.hypot(b.x-r.player.x,b.y-r.player.y))[0];
      if(!food){r.eating=null;return;}r.hidden=false;r.concealTime=0;r.revealedUntil=r.seconds+1;
      const foodId=food.kind==='meat'?food.corpseId:food.id;if(!r.eating||r.eating.corpseId!==foodId)r.eating={corpseId:foodId,kind:food.kind,progress:0};
      if(food.kind==='fish'&&r.stamina<4){r.eating=null;return;}
      r.eating.progress+=dt*(1+.05*r.upgrades.digestion+.25*r.mutations.metabolicRush)/(food.kind==='fish'?1.2/(1+.2*r.mutations.fisher):.6/(1+.2*r.mutations.forager));
      if(r.eating.progress>=1){r.eating.progress-=1;if(food.kind==='fish'){r.stamina-=4;r.stats.staminaSpent+=4;r.staminaDelay=1;this.catchFish(food);}else{r.stats[food.kind==='plant'?'plantsEaten':'meatEaten']++;food.value--;this.awardFood(1,food.x,food.y,food.kind==='plant'?'PLANTEFØDE':MEAT_RARITIES[food.rarity].name);if(food.kind==='plant'&&r.mutations.galliWind)r.health=Math.min(r.maxHealth,r.health+1);}
        if(food.kind==='fish'?food.stock<=0:food.value<=0){if(food.kind==='plant')food.depleted=true;r.pickups=r.pickups.filter(p=>p!==food);r.eating=null;}
      }
    }
    provoke(e) {
      for(const mate of this.run.enemies)if(mate!==e&&e.herdId&&mate.herdId===e.herdId&&Math.hypot(mate.x-e.x,mate.y-e.y)<240){mate.alert=true;mate.herdAlarmUntil=this.run.seconds+4;mate.mode=mate.kind==='parasaurolophus'?'flee':'chase';}
      e.lastAttackedAt = this.run.seconds; e.disengagedUntil = 0; e.alert = true;
      if (['return', 'wander', 'flee', 'watch','graze','rest','roam','warning'].includes(e.mode)) e.mode = 'chase';
    }
    chaseGiveUpRate(e, distance) {
      if (e.boss || !e.damage || this.run.seconds - e.lastAttackedAt < 8 || distance < 160) return 0;
      const age = Math.min(40, this.run.seconds - e.lastAttackedAt);
      return Math.min(1.2, (distance - 160) / 650 * (.12 + Math.max(0, age - 8) * .025));
    }
    disengage(e) { e.alert = false; e.mode = 'return'; e.disengagedUntil = this.run.seconds + 4; e.cooldown = Math.max(e.cooldown, .8); }
    returnHome(e, dt) {
      const dx=e.homeX-e.x,dy=e.homeY-e.y,d=Math.hypot(dx,dy);
      if(d<10){e.mode='wander';return;}
      e.facingX=dx/d;e.facingY=dy/d;this.travel(e,dx/d*e.speed*.7*dt,dy/d*e.speed*.7*dt);
    }
    enemyStep(e, dt) {
      if (this.phase !== 'playing') return;
      const x = e.x, y = e.y; e.wounded=e.hp<e.maxHP*.35;
      this.recordObservation(e);this.enemyAI(e, dt);
      this.regenerateEnemy(e,dt);
      if(e.wounded&&!e.boss&&Math.hypot(e.x-x,e.y-y)>1){e.woundTrail=(e.woundTrail||0)+dt;if(e.woundTrail>.4){e.woundTrail=0;this.run.decals.push({x:e.x,y:e.y,life:3,seed:e.id});}}
      e.moving = Math.hypot(e.x - x, e.y - y) > .001;
      e.walk = e.moving ? (e.walk + dt) % 1.5 : 0; e.poseTime += dt;
      const dx = e.moving && !['charge', 'windup'].includes(e.mode) ? e.x - x : e.facingX;
      const dy = e.moving && !['charge', 'windup'].includes(e.mode) ? e.y - y : e.facingY;
      if (Math.hypot(dx, dy) > .001) e.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
    }
    interact() {
      if (this.phase !== 'playing') return false;
      const r = this.run, site = r.map.sites.find(s => !s.claimed && s.type !== 'rare' && Math.hypot(s.x-r.player.x,s.y-r.player.y)<75);
      if (!site) return false;
      if (site.type === 'fossil') { site.claimed = true; r.exploration++; this.addDNA(3+r.stage); r.effects.push({x:site.x,y:site.y,text:'FOSSIL · +'+(3+r.stage)+' DNA',life:1}); return true; }
      r.activeSite = site.id; this.phase = 'exploration'; return true;
    }
    explore(take) {
      if (this.phase !== 'exploration') return false;
      const r = this.run, site = r.map.sites.find(s => s.id === r.activeSite);
      this.phase = 'playing'; r.activeSite = null;
      if (take && site && !site.claimed) {
        site.claimed = true; r.exploration++; if(['herbivore','omnivore'].includes(PLAYER_SPECIES[r.species].diet))r.map.forage.push({id:'plant:site:'+site.id,kind:'plant',rarity:2,value:8+r.stage*2,x:site.x,y:site.y,depleted:false});else r.pickups.push({id:++this.nextId,kind:'meat',rarity:2,value:8+r.stage*2,x:site.x,y:site.y});
        const guard = r.enemies.find(e => e.id === site.guardId); if (guard) this.provoke(guard);
      }
      return true;
    }
    // Shared boss smarts: turn toward the player during the early windup, punish
    // players who stay behind the boss, and recover from a crit "break".
    bossCommon(e,dt){
      const r=this.run,dx=r.player.x-e.x,dy=r.player.y-e.y,d=Math.max(1,Math.hypot(dx,dy));
      if(e.mode==='broken'){e.timer-=dt;e.hit=Math.max(0,e.hit-dt);if(e.timer<=0){e.mode='recover';e.timer=.35;}return true;}
      if(e.mode==='windup'&&e.timer>(e.windupDuration||1)*.4&&e.pattern!==2&&e.pattern!==3){
        const target=Math.atan2(dy,dx),current=Math.atan2(e.chargeY,e.chargeX);let diff=Math.atan2(Math.sin(target-current),Math.cos(target-current));const turn=Math.min(Math.abs(diff),(e.bossPhase===2?3.2:2.4)*dt)*Math.sign(diff);const a=current+turn;e.chargeX=e.facingX=Math.cos(a);e.chargeY=e.facingY=Math.sin(a);
      }
      if(e.mode==='charge'&&e.bossPhase===2){const target=Math.atan2(dy,dx),current=Math.atan2(e.chargeY,e.chargeX);let diff=Math.atan2(Math.sin(target-current),Math.cos(target-current));if(Math.abs(diff)<1.4){const a=current+Math.min(Math.abs(diff),1.1*dt)*Math.sign(diff);e.chargeX=e.facingX=Math.cos(a);e.chargeY=e.facingY=Math.sin(a);}}
      if(['chase','recover'].includes(e.mode)){
        const dot=(dx*e.facingX+dy*e.facingY)/d;
        e.behindTime=d<170&&dot<-.25?(e.behindTime||0)+dt:Math.max(0,(e.behindTime||0)-dt*2);
        if(e.behindTime>(e.bossPhase===2?.9:1.3)&&(e.mode==='chase'||e.timer<.6)){
          e.behindTime=0;e.pattern=2;e.attackRadius=e.radius+78;e.mode='windup';e.windupDuration=e.timer=e.bossPhase===2?.45:.55;e.attackName='SVING · TRÆK DIG VÆK';e.followUp=false;e.spin=true;e.chargeX=dx/d;e.chargeY=dy/d;return true;
        }
      }
      return false;
    }
    laterBossAI(e, dt) {
      const r = this.run, dx = r.player.x-e.x, dy = r.player.y-e.y, d = Math.max(1,Math.hypot(dx,dy));
      e.hit = Math.max(0,e.hit-dt); e.cooldown = Math.max(0,e.cooldown-dt);
      if (this.bossCommon(e,dt)) return;
      if (e.hp <= e.maxHP*.5 && e.bossPhase === 1) { e.bossPhase=2; e.mode='enrage'; e.timer=1.1; e.attackName='FASE 2 · RASERI'; this.emit('boss_enrage'); return; }
      if (e.mode === 'enrage' || e.mode === 'recover') { e.timer-=dt; if(e.timer<=0){e.mode='chase';e.cooldown=.35;} return; }
      if (e.mode === 'windup') {
        e.timer-=dt; if(e.timer<=0){e.mode=e.pattern===0?'charge':e.pattern===1?'bite':'slam';e.timer=e.pattern===0?.65:.25;e.attackHit=false;this.emit('roar');} return;
      }
      if (e.mode === 'charge') {
        const x=e.x,y=e.y, speed=e.kind==='deinosuchus'?(e.bossPhase===2?390:300):370;
        this.travel(e,e.chargeX*speed*dt,e.chargeY*speed*dt);
        this.burst(e.x,e.y,'dust',2,e.id);
        if(!e.attackHit && Math.hypot(r.player.x-e.x,r.player.y-e.y)<e.radius+r.player.radius+3){e.attackHit=true;this.damage(e.damage,e);}
        e.timer-=dt;
        const blocked=Math.hypot(e.x-x,e.y-y)<speed*dt*.5;
        if(e.timer<=0 || blocked){if(e.followUp&&!blocked){e.followUp=false;e.mode='windup';e.timer=e.windupDuration=.85;e.attackName='HORNSTORM 2/2';e.chargeX=e.facingX=dx/d;e.chargeY=e.facingY=dy/d;}else{e.mode='recover';e.timer=blocked&&e.kind==='triceratops'?2.4:1.5;e.attackName=blocked?'HORNENE SIDDER FAST':'ÅBEN FLANKE';}} return;
      }
      if(e.mode==='bite'||e.mode==='slam') {
        e.timer-=dt;
        if(!e.attackHit&&e.timer<=.12){e.attackHit=true;const dot=(dx*e.facingX+dy*e.facingY)/d;
          if(d<e.attackRadius&&(e.pattern>=2||dot>.35)){if(e.pattern===3){r.stamina=Math.max(0,r.stamina-40);r.slow=1;}else{this.damage(e.damage+(e.pattern===2?5:0),e);if(e.kind==='deinosuchus'&&e.pattern===2&&e.bossPhase===2)r.slow=.8;}}
          this.burst(e.x,e.y,'dust',20,e.id);r.shake=Math.max(r.shake,.14);
        }
        if(e.timer<=0){
          if(e.bossPhase===2&&e.kind==='tyrannosaurus'&&e.pattern===1&&!e.secondBite){e.secondBite=true;e.mode='windup';e.timer=e.windupDuration=.8;e.attackName='DOBBELTBID 2/2';e.facingX=e.chargeX=dx/d;e.facingY=e.chargeY=dy/d;}
          else{e.mode='recover';e.timer=e.spin?.7:e.pattern===2?1.8:1.3;e.spin=false;}
        }return;
      }
      e.facingX=dx/d;e.facingY=dy/d;
      if(d>80)this.travel(e,dx/d*e.speed*dt,dy/d*e.speed*dt);
      if(e.cooldown>0||d>380)return;
      e.pattern=e.attackCycle++%3;e.secondBite=false;
      if(e.kind==='tyrannosaurus'&&e.pattern===0)e.pattern=3;
      e.followUp=e.kind==='triceratops'&&e.bossPhase===2&&e.pattern===0;
      e.attackRadius=e.pattern===3?230:e.pattern===2?(e.kind==='deinosuchus'?(e.bossPhase===2?210:150):e.kind==='tyrannosaurus'?190:125):110;
      const names=e.kind==='pachycephalosaurus'?['KUPPELSTØD · SIDETRIN','DOBBELTSTØD · BAGOM','STENSTØD · HOLD AFSTAND']:e.kind==='baryonyx'?['FISKESTØD · SIDETRIN','KLØGAB · BAGOM','HALESLAG · HOLD AFSTAND']:e.kind==='ankylosaurus'?['PANSERMARCH · SIDETRIN','HALEKØLLE · BAGOM','HALESVING · HOLD AFSTAND']:e.kind==='deinosuchus'?['BAGHOLD · SIDETRIN','GAB · UNDVIG BAGOM','HALEBØLGE · HOLD AFSTAND']:e.kind==='triceratops'?['HORNSTORM · LOK MOD KLIPPE','HORNSTØD · BAGOM','TRAMP · HOLD AFSTAND']:['BRØL · HOLD AFSTAND',e.bossPhase===2?'DOBBELTBID 1/2':'KÆMPEBID · BAGOM','JORDRYSTELSE · HOLD AFSTAND'];
      e.attackName=e.pattern===3?'BRØL · TABER STAMINA':names[e.pattern];e.mode='windup';e.timer=e.windupDuration=(e.pattern>=2?1.25:1.1)*(e.bossPhase===2?.9:1);e.chargeX=dx/d;e.chargeY=dy/d;
    }
    forestBossAI(e, dt) {
      const r = this.run, dx = r.player.x - e.x, dy = r.player.y - e.y, d = Math.max(1, Math.hypot(dx, dy));
      e.cooldown = Math.max(0, e.cooldown - dt); e.hit = Math.max(0, e.hit - dt);
      if (this.bossCommon(e,dt)) return;
      if (e.hp <= e.maxHP * .5 && e.bossPhase === 1) {
        e.bossPhase = 2; e.mode = 'enrage'; e.timer = 1.1; e.followUp = false; e.attackCycle = 0; e.attackName = 'FASE 2 · RASERI';
        this.burst(e.x, e.y, 'dust', 18, e.id); this.emit('boss_enrage'); return;
      }
      if (e.mode === 'enrage') {
        e.timer -= dt; if (e.timer <= 0) { e.mode = 'chase'; e.cooldown = .2; } return;
      }
      if (e.mode === 'windup') {
        e.timer -= dt;
        if (e.timer <= 0) {
          e.mode = e.pattern === 2 ? 'slam' : e.pattern === 1 ? 'bite' : 'charge';
          e.timer = e.mode === 'charge' ? .58 : .22; e.attackHit = false;
          this.burst(e.x, e.y, 'dust', 10, e.id); this.emit('roar');
        }
        return;
      }
      if (e.mode === 'charge') {
        this.travel(e, e.chargeX * (e.bossPhase === 2 ? 370 : 320) * dt, e.chargeY * (e.bossPhase === 2 ? 370 : 320) * dt);
        e.trailTimer -= dt;
        if (e.trailTimer <= 0) { this.burst(e.x, e.y, 'dust', 3, e.id); e.trailTimer = .09; }
        if (!e.attackHit && Math.hypot(r.player.x - e.x, r.player.y - e.y) < e.radius + r.player.radius + 3) { e.attackHit = true; this.damage(e.damage,e); }
        e.timer -= dt;
        if (e.timer <= 0) {
          if (e.followUp) {
            e.followUp = false; e.mode = 'windup'; e.windupDuration = .65; e.timer = .65; e.attackName = 'STORMLØB 2/2';
            const x = r.player.x - e.x, y = r.player.y - e.y, gap = Math.max(1, Math.hypot(x, y));
            e.chargeX = e.facingX = x / gap; e.chargeY = e.facingY = y / gap;
          } else { e.mode = 'recover'; e.timer = e.bossPhase === 2 ? 1.2 : 1.5; }
        }
        return;
      }
      if (e.mode === 'bite' || e.mode === 'slam') {
        e.timer -= dt;
        if (!e.attackHit && e.timer <= .12) {
          e.attackHit = true; this.burst(e.x, e.y, 'dust', e.mode === 'slam' ? 20 : 8, e.id);
          const dot = (dx * e.facingX + dy * e.facingY) / d;
          if (d < e.attackRadius && (e.mode === 'slam' || dot > .35)) this.damage(e.damage + (e.mode === 'slam' ? 4 : 0),e);
          if (e.mode === 'slam') r.shake = Math.max(r.shake, .12);
        }
        if (e.timer <= 0) { e.mode = 'recover'; e.timer = e.spin ? .7 : e.pattern === 2 ? 1.8 : 1.15; e.spin = false; } return;
      }
      if (e.mode === 'recover') { e.timer -= dt; if (e.timer <= 0) { e.mode = 'chase'; e.cooldown = .35; } return; }
      e.facingX = dx / d; e.facingY = dy / d;
      if (d > e.radius + 38) this.travel(e, dx / d * e.speed * (e.bossPhase === 2 ? 1.18 : 1) * dt, dy / d * e.speed * (e.bossPhase === 2 ? 1.18 : 1) * dt);
      if (e.cooldown > 0 || d >= 360) return;
      const cycle = e.attackCycle++ % (e.bossPhase === 2 ? 3 : 2);
      e.pattern = cycle === 1 && d < 150 ? 1 : cycle === 2 && d < 180 ? 2 : 0;
      e.attackRadius = e.pattern === 2 ? 115 : 100;
      e.followUp = e.bossPhase === 2 && e.pattern === 0;
      e.attackName = e.pattern === 1 ? 'BID · UNDVIG BAGOM' : e.pattern === 2 ? 'TRAMP · HOLD AFSTAND' : e.followUp ? 'STORMLØB 1/2' : 'STORMLØB';
      e.mode = 'windup'; e.windupDuration = e.pattern === 1 ? .6 : e.pattern === 2 ? .9 : .95; e.timer = e.windupDuration;
      e.chargeX = dx / d; e.chargeY = dy / d;
    }
    regenerateEnemy(e,dt){
      const r=this.run;
      e.regenerating=false;
      if(e.boss||e.hp<=0||e.hp>=e.maxHP||r.seconds-e.lastAttackedAt<10||e.alert||e.bleed>0||Math.hypot(e.x-r.player.x,e.y-r.player.y)<350)return;
      e.hp=Math.min(e.maxHP,e.hp+e.maxHP*.025*dt);e.regenerating=true;
    }
    carrionTarget(e){
      const r=this.run;if(e.boss||e.guard||herbivorousNPC(e.kind)||!e.damage)return null;
      let best=null,bestScore=0;
      for(const corpse of r.corpses){if(!r.pickups.some(p=>p.corpseId===corpse.id&&p.value>0))continue;const distance=Math.hypot(corpse.x-e.x,corpse.y-e.y);if(distance>(e.kind==='compy'?850:650)*(.6+.8*(e.hunger??.5)))continue;
        const cluster=r.pickups.filter(p=>p.corpseId!==undefined&&Math.hypot(p.x-corpse.x,p.y-corpse.y)<180).reduce((n,p)=>n+p.value,0);
        const score=cluster*(1-corpse.age/corpse.lifetime)/(1+distance/180);
        if(score>bestScore){bestScore=score;best=corpse;}}
      return best;
    }
    scavenge(e,dt){
      const target=this.carrionTarget(e);if(!target)return false;
      e.mode=e.activity='scavenge';const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);
      if(d>45){e.facingX=dx/d;e.facingY=dy/d;this.travel(e,dx/d*e.speed*.4*dt,dy/d*e.speed*.4*dt);e.scavengeTime=0;}
      else {e.scavengeTime=(e.scavengeTime||0)+dt;if(e.scavengeTime>=(e.kind==='compy'?.8:2)){e.scavengeTime-=e.kind==='compy'?.8:2;const food=this.run.pickups.find(p=>p.corpseId===target.id&&p.value>0);if(food){food.value--;e.hunger=Math.max(0,(e.hunger??.5)-.25);e.hp=Math.min(e.maxHP,e.hp+3);this.run.pickups=this.run.pickups.filter(p=>p.value>0);}}}
      return true;
    }
    decayCorpses(dt){
      const r=this.run;
      for(const corpse of r.corpses){corpse.age+=dt;const portions=Math.max(0,Math.floor((corpse.age-(corpse.spoilAt||7))/2.5));const lost=portions-(corpse.decayPortions||0);corpse.decayPortions=portions;
        if(lost>0)for(const food of r.pickups)if(food.corpseId===corpse.id)food.value=Math.max(0,food.value-lost);}
      r.corpses=r.corpses.filter(c=>c.age<c.lifetime);r.pickups=r.pickups.filter(p=>p.value>0&&(p.corpseId===undefined||r.corpses.some(c=>c.id===p.corpseId&&c.age<(c.foodLifetime||c.lifetime))));
    }
    naturalBehavior(e,dt){
      const r=this.run;if(this.scavenge(e,dt))return;e.naturalTime+=dt;const cycle=e.naturalTime%22;e.activity=cycle<8?(herbivorousNPC(e.kind)?'graze':'rest'):cycle<12?'rest':'roam';if(e.activity==='graze'&&cycle>5&&isWater(r.stage,r.map,{x:e.x,y:e.y},-70))e.activity='drink';e.mode=e.activity;if(e.activity==='graze')e.hunger=Math.max(0,(e.hunger??.5)-dt/40);
      if(e.activity!=='roam')return;
      const peers=e.herdId?r.enemies.filter(o=>o!==e&&o.herdId===e.herdId&&Math.hypot(o.x-e.x,o.y-e.y)<280):[];
      let tx=e.homeX+Math.cos(e.naturalTime*.22+e.id)*90,ty=e.homeY+Math.sin(e.naturalTime*.22+e.id)*90;
      if(peers.length){tx=(tx+peers.reduce((s,o)=>s+o.x,0)/peers.length)/2;ty=(ty+peers.reduce((s,o)=>s+o.y,0)/peers.length)/2;}
      const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d>8){e.facingX=dx/d;e.facingY=dy/d;this.travel(e,dx/d*e.speed*.3*dt,dy/d*e.speed*.3*dt);}
    }
    npcAbility(e,dt){
      const r=this.run,c=PLAYER_SPECIES[e.kind];if(!c||e.boss)return false;
      e.skillCooldown=Math.max(0,e.skillCooldown-dt);e.skillDelay=Math.max(0,e.skillDelay-dt);
      if(!e.skillDelay)e.stamina=Math.min(100,e.stamina+18*dt);
      if(e.speciesSkill){
        if(e.stagger>0){e.speciesSkill=false;e.npcGuardUntil=0;e.mode='recover';e.timer=.4;return false;}
        e.timer-=dt;e.hit=Math.max(0,e.hit-dt);
        if(e.mode==='windup'){
          if(e.timer<=0){e.mode=['ankylosaurus','tyrannosaurus'].includes(e.kind)?'slam':'charge';e.timer=c.abilityTime;e.attackHit=false;if(e.kind==='ankylosaurus')e.npcGuardUntil=r.seconds+c.abilityTime;}
          return true;
        }
        if(e.mode==='recover'){if(e.timer<=0){e.speciesSkill=false;e.mode='chase';e.cooldown=.5;}return true;}
        const escaping=['compy','gallimimus'].includes(e.kind);
        if(!['ankylosaurus','tyrannosaurus'].includes(e.kind))this.travel(e,e.chargeX*c.speed*3*dt,e.chargeY*c.speed*3*dt);
        const d=Math.hypot(r.player.x-e.x,r.player.y-e.y);
        if(!e.attackHit&&e.kind==='tyrannosaurus'){e.attackHit=true;if(d<230){r.slow=Math.max(r.slow,.9);r.stamina=Math.max(0,r.stamina-20);}this.emit('roar');}
        if(!escaping&&!['ankylosaurus','tyrannosaurus'].includes(e.kind)&&!e.attackHit&&d<e.radius+r.player.radius+5){e.attackHit=true;this.damage(e.kind==='triceratops'?22:e.kind==='carnotaurus'?20:14,e);if(e.kind==='pachycephalosaurus')r.slow=Math.max(r.slow,.55);}
        if(e.kind==='baryonyx'&&!e.fishTaken){const school=r.map.fishSchools.find(f=>f.stock>0&&isWater(r.stage,r.map,f,12)&&Math.hypot(f.x-e.x,f.y-e.y)<55);if(school){school.stock--;e.hp=Math.min(e.maxHP,e.hp+3);e.fishTaken=true;}}
        if(e.timer<=0){e.mode='recover';e.timer=.4;}return true;
      }
      if(e.skillCooldown||e.stamina<c.abilityCost||['windup','charge','bite','slam','recover'].includes(e.mode)||e.stagger>0)return false;
      const dx=r.player.x-e.x,dy=r.player.y-e.y,d=Math.max(1,Math.hypot(dx,dy));
      const escaping=['compy','gallimimus'].includes(e.kind),nearFish=e.kind==='baryonyx'&&r.map.fishSchools.find(f=>f.stock>0&&isWater(r.stage,r.map,f,12)&&Math.hypot(f.x-e.x,f.y-e.y)<80);
      if(!(nearFish||e.alert&&d<(e.kind==='tyrannosaurus'?210:escaping?90:220)))return false;
      if(e.kind==='compy'&&e.hp>e.maxHP*.4)return false;
      e.speciesSkill=true;e.stamina-=c.abilityCost;e.skillDelay=1.25;e.skillCooldown=c.abilityCooldown;e.mode='windup';e.timer=e.windupDuration=escaping?.3:e.kind==='tyrannosaurus'?.9:.7;e.attackName=c.skill.toUpperCase();e.pattern=e.kind==='tyrannosaurus'?3:e.kind==='ankylosaurus'?2:0;e.attackRadius=e.kind==='tyrannosaurus'?230:90;e.attackHit=false;e.fishTaken=false;
      const tx=nearFish?nearFish.x-e.x:dx*(escaping?-1:1),ty=nearFish?nearFish.y-e.y:dy*(escaping?-1:1),gap=Math.max(1,Math.hypot(tx,ty));e.chargeX=e.facingX=tx/gap;e.chargeY=e.facingY=ty/gap;return true;
    }
    // ---- Ecology (overhaul phase 2): hunger, real flight, retreat, thieves, neutral herbivores, hunts.
    fleeFrom(e,x,y,dt,mult=1.2){
      const r=this.run,dx=x-e.x,dy=y-e.y,d=Math.max(1,Math.hypot(dx,dy));let best=null;
      for(let i=0;i<8;i++){
        const angle=Math.atan2(-dy,-dx)+i*Math.PI/4,vx=Math.cos(angle),vy=Math.sin(angle),px=e.x+vx*70,py=e.y+vy*70;
        const room=px>42+e.radius&&px<r.map.width-42-e.radius&&py>76+e.radius&&py<r.map.height-42-e.radius;
        const clear=r.map.rocks.every(rock=>Math.hypot(px-rock.x,py-rock.y)>rock.radius+e.radius+4);
        const wet=e.kind!=='deinosuchus'&&e.kind!=='baryonyx'&&isWater(r.stage,r.map,{x:px,y:py});
        const score=(-dx*vx-dy*vy)/d+(room?0:-4)+(clear?0:-3)+(wet?-1.5:0);
        if(!best||score>best.score)best={vx,vy,score};
      }
      e.mode=e.activity='flee';e.facingX=best.vx;e.facingY=best.vy;this.travel(e,best.vx*e.speed*mult*dt,best.vy*e.speed*mult*dt);
    }
    alarmHerd(e){const r=this.run;if(!e.herdId)return;for(const mate of r.enemies)if(mate!==e&&mate.herdId===e.herdId&&Math.hypot(mate.x-e.x,mate.y-e.y)<300){mate.fleeUntil=Math.max(mate.fleeUntil||0,r.seconds+18);mate.herdAlarmUntil=r.seconds+4;}}
    nearestHunter(e){const r=this.run;let best=null,bd=320;for(const o of r.enemies)if(o.huntTarget===e.id){const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;best=o;}}return best;}
    findPrey(e){
      const r=this.run;if((e.huntCooldownUntil||0)>r.seconds||r.enemies.filter(o=>o.huntTarget).length>=2)return null;
      let best=null,bd=420;for(const o of r.enemies)if(o!==e&&!o.boss&&!o.rare&&herbivorousNPC(o.kind)&&!o.damage){const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;best=o;}}
      return best;
    }
    huntPrey(e,prey,dt){
      const r=this.run;if(e.huntTarget!==prey.id){e.huntTarget=prey.id;e.huntStarted=r.seconds;}
      const dx=prey.x-e.x,dy=prey.y-e.y,d=Math.max(1,Math.hypot(dx,dy));e.mode=e.activity='hunt';e.facingX=dx/d;e.facingY=dy/d;
      if(r.seconds-e.huntStarted>12){e.huntTarget=null;e.huntCooldownUntil=r.seconds+25;return;}
      if(d>e.radius+prey.radius+6)this.travel(e,dx/d*e.speed*1.05*dt,dy/d*e.speed*1.05*dt);
      else{e.huntBite=(e.huntBite||0)-dt;if(e.huntBite<=0){e.huntBite=.8;prey.hp-=e.damage;prey.hit=.15;this.burst(prey.x,prey.y,'blood',6,prey.id);if(prey.hp<=0&&r.seconds-prey.lastAttackedAt>3){prey.naturalDeath=true;e.huntTarget=null;e.hunger=Math.max(0,e.hunger-.5);}}}
    }
    naturalDeath(e){
      const r=this.run,base=SPECIES[e.kind];
      r.corpses.push({id:e.id,lifetime:60,foodLifetime:16,poseVariant:e.id%2,spoilAt:7,decayPortions:0,kind:e.kind,x:e.x,y:e.y,direction:e.direction,visualScale:e.visualScale,variant:e.sex==='male'?'male':null,age:0});r.corpses=r.corpses.slice(-32);
      r.pickups.push({id:++this.nextId,kind:'meat',corpseId:e.id,x:e.x,y:e.y,rarity:0,value:base.meat});
      this.emit('nature_kill',{kind:e.kind});
    }
    ecologyAI(e,dt,dx,dy,d){
      const r=this.run,diet=PLAYER_SPECIES[r.species].diet,recent=r.seconds-e.lastAttackedAt<8;
      if(e.hunger===undefined)e.hunger=.25+((e.id*.618034)%1)*.5;
      e.hunger=Math.min(1,e.hunger+dt/150);
      if(e.guard||e.miniboss||['windup','charge','slam','bite','recover'].includes(e.mode))return false;
      const sight=r.hidden?90:480;
      // Wounded small predators run, heal out of sight and come back if still hungry.
      const fleeAt={compy:.45,carnotaurus:.2,baryonyx:.2,pachycephalosaurus:.3}[e.kind];
      if(fleeAt&&!e.elite&&e.damage){
        if(!e.retreating&&e.hp<e.maxHP*fleeAt&&recent){e.retreating=true;e.alert=false;this.emit('npc_flee',{id:e.id});}
        if(e.retreating){
          if(e.hp>=e.maxHP*.8){e.retreating=false;if(e.hunger>.4){e.alert=true;e.mode='chase';e.disengagedUntil=0;e.lastAttackedAt=r.seconds;this.emit('npc_return',{id:e.id});}return false;}
          if(d<sight+60){this.fleeFrom(e,r.player.x,r.player.y,dt,1.15);return true;}
          e.alert=false;e.mode=e.activity='rest';e.hp=Math.min(e.maxHP,e.hp+e.maxHP*.06*dt);return true;
        }
      }
      // Compys are thieves first: food near you is the target, you are not.
      if(e.kind==='compy'&&!recent){
        if(e.carrying>0){if(d<sight){this.fleeFrom(e,r.player.x,r.player.y,dt,1.1);e.mode=e.activity='steal';return true;}e.carrying=0;e.hunger=Math.max(0,e.hunger-.4);}
        const food=r.pickups.find(p=>p.corpseId!==undefined&&p.value>0&&Math.hypot(p.x-e.x,p.y-e.y)<320&&Math.hypot(p.x-r.player.x,p.y-r.player.y)<300);
        if(food){
          e.mode=e.activity='steal';const fx=food.x-e.x,fy=food.y-e.y,fd=Math.hypot(fx,fy);
          if(fd>16){e.facingX=fx/fd;e.facingY=fy/fd;this.travel(e,fx/fd*e.speed*1.1*dt,fy/fd*e.speed*1.1*dt);}
          else{food.value--;e.carrying=1;r.pickups=r.pickups.filter(p=>p.value>0);r.effects.push({x:e.x,y:e.y-14,text:'STJÅLET!',color:'#de954a',life:.8});this.emit('steal');if(r.eating&&r.eating.corpseId===food.corpseId&&food.value<=0)r.eating=null;}
          return true;
        }
        const pack=e.herdId?r.enemies.filter(o=>o.herdId===e.herdId&&o.alert).length:1,bold=pack>=4&&e.hunger>.6;
        if(e.alert&&!bold){
          if(d<110){this.fleeFrom(e,r.player.x,r.player.y,dt,.6);e.mode=e.activity='watch';return true;}
          if(d<320){e.mode=e.activity='watch';e.facingX=dx/d;e.facingY=dy/d;return true;}
        }
      }
      // Herbivores leave a herbivore player alone unless crowded or attacked.
      if(herbivorousNPC(e.kind)&&e.damage&&diet==='herbivore'&&!recent){
        e.alert=false;e.tooClose=d<95?(e.tooClose||0)+dt:Math.max(0,(e.tooClose||0)-dt);
        if(e.tooClose>2.5){e.tooClose=0;e.alert=true;e.lastAttackedAt=r.seconds;e.mode='chase';e.disengagedUntil=0;return false;}
        if(d<170){e.mode=e.activity='warning';e.facingX=dx/d;e.facingY=dy/d;return true;}
        this.naturalBehavior(e,dt);return true;
      }
      // Prey runs until it can no longer see the threat, and remembers it for a while.
      if(herbivorousNPC(e.kind)&&!e.damage){
        const hunter=this.nearestHunter(e);
        const playerThreat=(diet!=='herbivore'||recent)&&(!r.hidden||d<90||recent);
        let tx=null,ty=null;
        if(hunter){tx=hunter.x;ty=hunter.y;}
        else if(playerThreat&&(d<(r.player.moving||recent?280:150)||(e.fleeUntil>r.seconds||e.herdAlarmUntil>r.seconds)&&d<sight)){tx=r.player.x;ty=r.player.y;}
        if(tx!==null){if(!(e.fleeUntil>r.seconds))this.alarmHerd(e);e.fleeUntil=r.seconds+20+(e.id*7)%10;e.alert=true;this.fleeFrom(e,tx,ty,dt,1.25);return true;}
        if(e.fleeUntil>r.seconds){e.alert=false;e.mode=e.activity='wary';e.facingX=-dx/d;e.facingY=-dy/d;this.travel(e,-dx/d*e.speed*.3*dt,-dy/d*e.speed*.3*dt);return true;}
        e.alert=false;this.naturalBehavior(e,dt);return true;
      }
      // Predators: hungry ones hunt real prey or scavenge first; sated ones let you go.
      if(e.damage&&!herbivorousNPC(e.kind)&&e.kind!=='compy'){
        if(!recent&&e.hunger>.55&&this.carrionTarget(e)&&d>120&&this.scavenge(e,dt))return true;
        if(!e.alert&&e.hunger>.65){const prey=e.huntTarget?r.enemies.find(o=>o.id===e.huntTarget)||this.findPrey(e):this.findPrey(e);if(prey){this.huntPrey(e,prey,dt);return true;}e.huntTarget=null;}
        if(e.alert&&!recent&&e.hunger<.2&&d>160){this.disengage(e);return false;}
      }
      return false;
    }
    enemyAI(e, dt) {
      if (e.boss && e.kind !== 'carnotaurus') { this.laterBossAI(e, dt); return; }
      if (e.boss && e.kind === 'carnotaurus') { this.forestBossAI(e, dt); return; }
      const r = this.run, dx = r.player.x - e.x, dy = r.player.y - e.y, d = Math.max(1, Math.hypot(dx, dy));
      if(!e.boss&&e.thiefPack&&r.enemies.filter(o=>o.herdId===e.herdId&&o.hp>0).length<=2){e.thiefPack=false;e.scaredUntil=r.seconds+6;e.disengagedUntil=r.seconds+8;}
      if(!e.boss&&!(e.scaredUntil>r.seconds)&&this.npcAbility(e,dt))return;
      e.cooldown = Math.max(0, e.cooldown - dt); e.hit = Math.max(0, e.hit - dt);
      if(!e.boss&&e.scaredUntil>r.seconds){e.alert=false;e.mode=e.activity='flee';e.facingX=-dx/d;e.facingY=-dy/d;this.travel(e,-dx/d*e.speed*dt,-dy/d*e.speed*dt);return;}
      if (e.guard && !e.alert && e.mode !== 'return') return;
      if (e.stagger > 0) { e.stagger = Math.max(0, e.stagger - dt); return; }
      if (e.flinch > 0) { e.flinch = Math.max(0, e.flinch - dt); if (!['windup', 'charge', 'slam', 'bite', 'recover'].includes(e.mode)) return; }
      if (!e.boss && this.ecologyAI(e, dt, dx, dy, d)) return;
      if (!e.boss && !['windup', 'charge', 'slam', 'bite', 'recover'].includes(e.mode)) {
        if (e.mode === 'return' && !e.alert) {
          if (r.seconds >= e.disengagedUntil && d < 120) { e.alert = true; e.mode = 'chase'; }
          else { this.returnHome(e, dt); return; }
        }
        const recent=r.seconds-e.lastAttackedAt<8,visible=!r.hidden||d<70||recent;
        const territorial=e.damage&&!e.herdId,homeDistance=Math.hypot(r.player.x-e.homeX,r.player.y-e.homeY);
        if(territorial&&e.alert&&homeDistance>e.territoryRadius+200&&!recent){this.disengage(e);this.returnHome(e,dt);return;}
        const notice=e.kind==='parasaurolophus'?260:territorial?e.territoryRadius:220;
        if(visible&&d<notice&&r.seconds>=e.disengagedUntil){
          if(territorial&&!recent&&d>150&&homeDistance>e.territoryRadius*.6){e.mode='warning';e.activity='warning';e.facingX=dx/d;e.facingY=dy/d;return;}
          e.alert=true;
        }
        if(r.hidden&&d>70&&!recent&&(!e.herdAlarmUntil||r.seconds>e.herdAlarmUntil)){e.alert=false;this.naturalBehavior(e,dt);return;}
        if (e.alert && e.damage) {
          const rate = this.chaseGiveUpRate(e, d)*(e.wounded?2:1);
          if (d > 1200 && r.seconds-e.lastAttackedAt >= 8 || rate > 0 && this.behaviorRandom() < 1-Math.exp(-rate*dt)) { this.disengage(e); this.returnHome(e,dt); return; }
        }
        if (!e.alert) {this.naturalBehavior(e,dt);return;}
      }
      if (e.mode === 'windup') {
        e.timer -= dt;
        if (e.timer <= 0) {
          e.mode = e.pattern === 2 ? 'slam' : e.pattern===1?'bite': e.kind === 'compy' && !e.boss ? 'bite' : 'charge';
          e.timer = e.mode === 'charge' ? .55 : .18; e.attackHit = false;
          if (e.kind !== 'compy') this.emit('roar');
        }
      } else if (e.mode === 'charge') {
        this.travel(e, e.chargeX * (e.boss ? 340 : 230) * dt, e.chargeY * (e.boss ? 340 : 230) * dt);
        if (Math.hypot(r.player.x - e.x, r.player.y - e.y) < e.radius + r.player.radius + 3) this.damage(e.damage,e);
        e.timer -= dt; if (e.timer <= 0) { e.mode = 'recover'; e.timer = e.boss ? 1.4 : .9; }
      } else if (e.mode === 'slam' || e.mode === 'bite') {
        e.timer -= dt;
        if (!e.attackHit && e.timer <= .1) {
          e.attackHit = true;
          const facingDot = (dx * e.facingX + dy * e.facingY) / d;
          if (d < e.attackRadius && (e.mode === 'slam' || facingDot > .2)) this.damage(e.damage + (e.boss ? 6 : 0),e);
        }
        if (e.timer <= 0) { e.mode = 'recover'; e.timer = e.kind === 'compy' ? .35 : 1.6; }
      } else if (e.mode === 'recover') {
        e.timer -= dt; if (e.timer <= 0) { e.mode = 'chase'; e.cooldown = e.kind === 'compy' ? .8 : 1.2; }
      } else {
        e.facingX = dx / d; e.facingY = dy / d;
        if (['parasaurolophus','gallimimus'].includes(e.kind) && !e.boss) {
          const threatened = r.seconds-e.lastAttackedAt < 8 || e.herdAlarmUntil>r.seconds;
          // A stationary observer is not an endless threat. Maintain a small
          // personal-space bubble only; moving hunters trigger a wider flight zone.
          const flightDistance = threatened || r.player.moving ? 260 : 110;
          if (d >= flightDistance) { e.mode='watch'; e.facingX=dx/d; e.facingY=dy/d; if(d>550)e.alert=false; return; }

          e.mode = 'flee';
          // Pick a free escape heading rather than running forever into an edge or rock.
          let best = null;
          for (let i = 0; i < 8; i++) {
            const angle = Math.atan2(-dy, -dx) + i * Math.PI / 4;
            const vx = Math.cos(angle), vy = Math.sin(angle), px = e.x + vx * 65, py = e.y + vy * 65;
            const room = px > 42 + e.radius && px < r.map.width - 42 - e.radius && py > 76 + e.radius && py < r.map.height - 42 - e.radius;
            const clear = r.map.rocks.every(rock => Math.hypot(px - rock.x, py - rock.y) > rock.radius + e.radius + 4);
            const score = (-dx * vx - dy * vy) / d + (room ? 0 : -4) + (clear ? 0 : -3);
            if (!best || score > best.score) best = { vx, vy, score };
          }
          e.facingX = best.vx; e.facingY = best.vy; this.travel(e, best.vx * e.speed * 1.25 * dt, best.vy * e.speed * 1.25 * dt); return;
        }
        e.mode = 'chase';
        let vx = dx / d, vy = dy / d, speed = e.speed;
        if (e.kind === 'compy' && !e.boss) {
          const pack = r.enemies.filter(other => other !== e && other.kind === 'compy' && !other.boss && Math.hypot(other.x - e.x, other.y - e.y) < 180);
          speed *= 1 + Math.min(pack.length, 2) * .08;
          for (const other of pack) {
            const sx = e.x - other.x, sy = e.y - other.y, gap = Math.hypot(sx, sy);
            if (gap < 42) { vx += (gap > .01 ? sx / gap : (e.id < other.id ? -1 : 1)) * .75; vy += (gap > .01 ? sy / gap : 0) * .75; }
          }
          const norm = Math.max(1, Math.hypot(vx, vy)); vx /= norm; vy /= norm;
        }
        if(e.kind==='compy'&&e.herdId){const pack=r.enemies.filter(o=>o.herdId===e.herdId&&o.alert).sort((a,b)=>a.id-b.id);const slot=pack.indexOf(e),angle=slot*Math.PI*2/Math.max(3,pack.length)+r.seconds*.12;const tx=r.player.x+Math.cos(angle)*70,ty=r.player.y+Math.sin(angle)*70;const gap=Math.hypot(tx-e.x,ty-e.y);if(gap>20&&d>60){vx=(tx-e.x)/gap;vy=(ty-e.y)/gap;}const committed=pack.filter(o=>o!==e&&['windup','bite','charge'].includes(o.mode)).length;e.packRole=slot===0?'leader':'flank';if(committed>=2){if(d>70)this.travel(e,vx*speed*dt,vy*speed*dt);return;}}
        if (d > e.radius + 18) this.travel(e, vx * speed * dt, vy * speed * dt);
        const charger = e.boss || e.kind === 'carnotaurus';
        if (charger && e.cooldown === 0 && d < (e.boss ? 360 : 230)) {
          e.pattern = e.boss && ['triceratops', 'tyrannosaurus'].includes(e.kind) ? (e.pattern + 1) % 3 : 0;
          e.mode = 'windup'; e.windupDuration = e.kind === 'deinosuchus' ? .95 : e.boss ? .8 : .9; e.timer = e.windupDuration;
          e.chargeX = dx / d; e.chargeY = dy / d;
        } else if (!charger && e.cooldown === 0 && ((e.kind === 'ankylosaurus' && d < 100) || (e.kind === 'compy' && d < e.radius + 24))) {
          e.pattern = e.kind === 'ankylosaurus' ? 2 : 0;
          e.mode = 'windup'; e.windupDuration = e.kind === 'compy' ? .45 : .9; e.timer = e.windupDuration;
          e.chargeX = dx / d; e.chargeY = dy / d;
        } else if (!charger && !['compy', 'ankylosaurus', 'parasaurolophus'].includes(e.kind) && e.damage && d < e.radius + 20 && e.cooldown === 0) {
          e.mode='windup';e.pattern=1;e.windupDuration=.85;e.timer=.85;e.attackRadius=e.radius+35;e.attackName=e.kind==='triceratops'?'HORNSTØD':'GAB';e.chargeX=e.facingX=dx/d;e.chargeY=e.facingY=dy/d;
        }
      }
    }
    step(dt, input = {}) {
      if (this.phase !== 'playing') return;
      dt = clamp(finite(dt), 0, .05); if (!dt) return;
      const r = this.run, m = r.mutations;
      if (r.hitStop > 0) { const stopped = Math.min(dt, r.hitStop); r.hitStop = Math.max(0, r.hitStop - stopped); dt -= stopped; if (dt <= .000001) return; }
      r.seconds += dt;
      for (const timer of ['attackCooldown', 'bite', 'pounce', 'pounceCooldown', 'invulnerable', 'shake', 'slow', 'hurt','staminaDelay','frenzy','tailEmpowered','shieldTime','winded']) r[timer] = Math.max(0, (r[timer]||0) - dt);
      if(r.shieldTime===0)r.shield=0;
      const inCombat=r.attack||r.enemies.some(e=>e.alert&&e.damage&&Math.hypot(e.x-r.player.x,e.y-r.player.y)<400);
      if(r.staminaDelay===0&&r.pounce===0)r.stamina=Math.min(100,r.stamina+dt*(inCombat?STAMINA.combatRegen:STAMINA.regen)*(1+.03*r.upgrades.regen+.2*m.feathers)*(1-.15*m.metabolicRush));
      let dx = clamp(finite(input.x), -1, 1), dy = clamp(finite(input.y), -1, 1), n = Math.hypot(dx, dy);
      const config = PLAYER_SPECIES[r.species], cost = abilityCost(r);
      if (input.pounce && (n || ['ankylosaurus','tyrannosaurus'].includes(r.species)) && r.pounceCooldown === 0 && r.stamina >= cost) {
        r.revealedUntil=r.seconds+2;r.hidden=false;r.concealTime=0; r.stamina -= cost;r.staminaDelay=STAMINA.delay;if(r.stamina<STAMINA.windedBelow){r.winded=STAMINA.windedTime;this.emit('winded');} r.pounce = config.abilityTime; r.stats.abilities++;r.stats.staminaSpent+=cost;r.abilityCooldownDuration=config.abilityCooldown*(1-.12*m.scurry);r.pounceCooldown=r.abilityCooldownDuration; r.abilityHits = []; r.abilityRefund=0;if(r.species==='velociraptor'&&m.velociPrime)r.invulnerable=2;if(m.compyFrenzy)r.frenzy=3;if(m.raptorAmbush)r.invulnerable=Math.max(r.invulnerable,config.abilityTime+1);if(m.galliWind)r.invulnerable=Math.max(r.invulnerable,1);if(m.triceBulwark){r.shield=20;r.shieldTime=4;}if(m.ankyBastion){r.shield=20;r.shieldTime=4;r.tailEmpowered=4;} r.abilityX = n ? dx/n : 0; r.abilityY = n ? dy/n : 1;
        if(r.species==='tyrannosaurus'){for(const e of r.enemies)if(!e.boss&&!e.guard&&Math.hypot(e.x-r.player.x,e.y-r.player.y)<250){e.scaredUntil=r.seconds+2+.5*m.rexVoice;e.alert=false;e.mode='flee';}this.emit('roar');}
        if(r.species==='baryonyx'){const school=r.map.fishSchools.find(f=>f.stock>0&&isWater(r.stage,r.map,f,14)&&Math.hypot(f.x-r.player.x,f.y-r.player.y)<110);if(school)this.catchFish(school,m.baryTide?3:1);}
        if (r.species === 'ankylosaurus' && m.guard) r.health = Math.min(r.maxHealth, r.health + 5 * m.guard);
        this.burst(r.player.x, r.player.y, 'dust', 10, r.level); this.emit('pounce');
      }
      if (['carnotaurus','triceratops','pachycephalosaurus','baryonyx'].includes(r.species) && r.pounce > 0) { dx = r.abilityX; dy = r.abilityY; n = 1; }
      if (input.interact) { this.interact(); if (this.phase !== 'playing') return; }
      for (const site of r.map.sites) if (Math.hypot(site.x-r.player.x,site.y-r.player.y)<550) site.discovered = true;
      r.player.moving = false;
      if (n) {
        const beforeX = r.player.x, beforeY = r.player.y;
        const facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
        // Keep gait phase across turns rather than restarting with every key change.
        r.player.facing = facing;
        const speed = config.speed * (input.sneak ? .45 : 1) * (r.slow > 0 ? .65 : 1) * (r.winded > 0 ? STAMINA.windedSpeed : 1) * (1 + .08 * m.legs+.15*m.lightFrame)*(1-.08*m.heavyMuscle) * (r.pounce > 0 ? ['ankylosaurus','tyrannosaurus'].includes(r.species) ? .3 : r.species==='gallimimus'?1.6*(1+.08*m.stride):2.5 : r.attack ? .7 : 1);
        this.travel(r.player, dx / n * speed * dt, dy / n * speed * dt);
        r.stats.distance+=Math.hypot(r.player.x-beforeX,r.player.y-beforeY);r.player.moving = Math.hypot(r.player.x - beforeX, r.player.y - beforeY) > .001;
      }
      r.player.walk = r.player.moving ? (r.player.walk + dt) % 1.5 : 0;
      if (r.pounce > 0 && ['utahraptor','velociraptor', 'carnotaurus','triceratops','pachycephalosaurus','baryonyx'].includes(r.species)) for (const e of r.enemies) {
        if (!r.abilityHits.includes(e.id) && Math.hypot(e.x-r.player.x,e.y-r.player.y)<e.radius+r.player.radius+12) {
          r.abilityHits.push(e.id); e.hp -= (r.species==='triceratops'?22+8*m.horns+20*m.triceBulwark:r.species==='pachycephalosaurus'?14+7*m.impact+25*m.pachyMeteor:r.species==='baryonyx'?14+12*m.baryTide:r.species === 'carnotaurus' ? 20 + 8*m.gore+20*m.carnoBreaker : 8*(1+.2*m.velociClaw) + 5*m.claws+18*m.raptorAmbush)*(e.npcGuardUntil>r.seconds?.25:1); this.provoke(e);if(!e.boss&&(m.carnoBreaker||r.species==='pachycephalosaurus'))e.stagger=r.species==='pachycephalosaurus'?(m.pachyMeteor?1:.55):.65; e.hit = .15;
          if(m.momentum){const refund=Math.min(4*m.momentum,12-(r.abilityRefund||0));r.abilityRefund=(r.abilityRefund||0)+refund;r.stamina=Math.min(100,r.stamina+refund);}
          r.hitStop = Math.max(r.hitStop,.04); this.burst(e.x,e.y,'blood',10,e.id); this.emit('bite_hit', {hits:1,strong:true});
        }
      }
      const surface=this.terrainAt(r.player);r.surface=surface.kind;
      if(surface.burn){r.burnTick=(r.burnTick||0)-dt;if(r.burnTick<=0){r.burnTick=.5;const inv=r.invulnerable;r.invulnerable=0;this.damage(4,null);r.invulnerable=Math.max(inv,.1);r.lastHit=null;if(this.phase!=='playing')return;}}
      const quiet=(!r.player.moving||!!input.sneak)&&!r.attack&&r.pounce===0&&r.seconds>=r.revealedUntil;
      r.concealTime=surface.cover&&quiet?r.concealTime+dt:0;r.hidden=r.concealTime>=.6;
      this.decayCorpses(dt);
      this.advanceAttack(dt);
      if (input.attack) this.attack();
      const survivors = [];
      for (const e of r.enemies) {
        if (e.bleed > 0) { const duration = Math.min(e.bleed, dt); e.hp -= 3 * m.bleed * duration*(e.npcGuardUntil>r.seconds?.25:1); e.bleed -= duration; e.bleedTrail = (e.bleedTrail || 0) - dt; if (e.bleedTrail <= 0) { r.decals.push({ x: e.x, y: e.y, life: 2, seed: e.id }); e.bleedTrail = .25; } }
        if (e.hp <= 0) { if (e.naturalDeath) this.naturalDeath(e); else this.kill(e); }
        else {
          // Level of detail: calm animals far off screen think 5x less often (same total time).
          const far = !e.boss && !e.alert && !e.huntTarget && Math.abs(e.x - r.player.x) > 1400 || !e.boss && !e.alert && !e.huntTarget && Math.abs(e.y - r.player.y) > 1000;
          if (far) { e.lodDt = (e.lodDt || 0) + dt; if (e.lodDt >= .2) { this.enemyStep(e, Math.min(.2, e.lodDt)); e.lodDt = 0; } }
          else { if (e.lodDt) { this.enemyStep(e, Math.min(.2, e.lodDt + dt)); e.lodDt = 0; } else this.enemyStep(e, dt); }
          survivors.push(e);
        }
        if (this.phase !== 'playing') break;
      }
      // Preserve remaining enemies on death; never process rewards after a fatal hit.
      if (this.phase !== 'playing') return;
      r.enemies = survivors; this.separateDinosaurs();
      const collected = [], radius = 26 * (1 + .05 * r.upgrades.magnet) + 10 * m.reach;
      for (const p of r.pickups) {
        if(p.kind==='fish'||p.corpseId!==undefined||PLAYER_SPECIES[r.species].diet==='herbivore'&&p.kind==='meat')continue;
        if (Math.hypot(p.x - r.player.x, p.y - r.player.y) >= radius) continue;
        collected.push(p.id);
        if (p.kind === 'meat') {r.stats.food+=p.value; r.meat += p.value; r.totalMeat += p.value; r.xp += p.value; r.score += p.value * 10; r.health = Math.min(r.maxHealth, r.health + p.value * m.scavenger); r.effects.push({ x: p.x, y: p.y, text: '+' + p.value + ' ' + MEAT_RARITIES[p.rarity || 0].name.toUpperCase(), color: MEAT_RARITIES[p.rarity || 0].color, life: .55 }); this.emit('pickup'); }
        else if (p.kind === 'dna') this.addDNA(p.value);
        else { r.health = Math.min(r.maxHealth, r.health + p.value); this.emit('pickup'); }
      }
      r.pickups = r.pickups.filter(p => !collected.includes(p.id));
      this.eat(dt,input);
      for(let x=Math.floor(r.view.x/192);x<=Math.floor((r.view.x+r.view.width)/192);x++)for(let y=Math.floor(r.view.y/192);y<=Math.floor((r.view.y+r.view.height)/192);y++)r.explored[x+','+y]=true;
      for(const event of r.map.events)if(!event.claimed&&Math.hypot(event.x-r.player.x,event.y-r.player.y)<110){event.claimed=true;r.exploration++;if(event.type==='spring'){r.health=Math.min(r.maxHealth,r.health+20);this.emit('discovery',{text:'KILDE · +20 liv'});}else if(event.type==='cache'){const value=6+r.stage*2;if(['herbivore','omnivore'].includes(PLAYER_SPECIES[r.species].diet))r.map.forage.push({id:'plant:cache:'+event.x+':'+event.y,kind:'plant',rarity:3,value,x:event.x,y:event.y,depleted:false});else r.pickups.push({id:++this.nextId,kind:'meat',rarity:3,value,x:event.x,y:event.y});this.emit('discovery',{text:'GEMT FØDE · '+value+' episk føde'});}else{this.addDNA(2+r.stage);this.emit('discovery',{text:'SJÆLDENT FOSSIL · DNA fundet'});}}

      r.achievementCheck=(r.achievementCheck||0)-dt;if(r.achievementCheck<=0){r.achievementCheck=1;this.checkAchievements();}
      r.zoneCheck=(r.zoneCheck||0)-dt;
      if(r.zoneCheck<=0&&r.map.zones){r.zoneCheck=.4;const z=zoneAt(r.map,r.player);r.zonesSeen=r.zonesSeen||{};if(z&&!r.zonesSeen[z.index]){r.zonesSeen[z.index]=true;r.stats.zones=(r.stats.zones||0)+1;if(!z.start){this.addDNA(1,true);r.exploration++;}this.emit('zone',{name:z.name,first:!z.start});}r.zone=z?z.index:null;}
      for (const p of r.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 50 * dt; }
      r.particles = r.particles.filter(p => p.life > 0); r.decals = r.decals.filter(p => (p.life -= dt) > 0).slice(-80);
      r.effects = r.effects.filter(e => (e.life -= dt) > 0);
      this.setView(r.view.width, r.view.height);
      if (!r.bossSpawned && r.meat >= this.currentLevel().target && this.spawn(this.currentLevel().boss, null, true)) { r.bossSpawned = true; this.emit('boss'); }
      if (!r.bossSpawned) {
        r.spawnTimer -= dt;
        const opening = r.stage === 0 && r.meat < 6;
        const building = r.stage === 0 && !opening && r.meat < 12;
        const cap = r.stage === 0 ? (opening ? 3 : building ? 5 : 7) : 9 + r.stage * 2;
        if (r.spawnTimer <= 0 && r.enemies.filter(e => Math.hypot(e.x - r.player.x, e.y - r.player.y) < 900).length < cap && r.enemies.length < 120) {
          const pool = r.stage === 0 ? (opening ? ['compy', 'parasaurolophus'] : building ? ['compy', 'compy', 'parasaurolophus'] : ['compy', 'parasaurolophus', 'carnotaurus']) : BIOMES[r.stage].animals;
          let kind = pool[Math.floor(this.random() * pool.length)];
          if (r.stage === 0 && r.enemies.filter(e => e.kind === 'carnotaurus' && !e.elite).length >= 1 && kind === 'carnotaurus') kind = 'compy';
          this.spawn(kind); r.spawnTimer = r.stage === 0 ? (opening ? 4 : building ? 3.2 : 2.6) : Math.max(1, 2.4 - r.stage * .35);
        }
      }
      this.maybeLevelUp();
      if (this.phase === 'playing' && r.bossDefeated) this.phase = 'cleared';
    }
    nextStage() {
      if (this.phase !== 'cleared') return false;
      const r = this.run;
      for (const p of r.pickups) if (p.kind === 'dna') this.addDNA(p.value);
      if (r.levelIndex === r.campaign.length - 1) { this.finish(true); return true; }
      r.missedSecrets+=r.map.sites.filter(s=>!s.claimed).length+r.map.events.filter(e=>!e.claimed).length;r.stageStats.push({...r.stats,killsBySpecies:{...r.stats.killsBySpecies}});r.levelIndex++;r.stage=r.campaign[r.levelIndex].biome; r.meat = 0; r.bossSpawned = false; r.bossDefeated = false; r.enemies = []; r.pickups = []; r.attack = null; r.bite = 0; r.hitStop = 0; r.particles = []; r.decals = [];
      r.corpses=[];r.zonesSeen={};r.zone=null;r.eating=null;r.shield=0;r.shieldTime=0;r.tailEmpowered=0;r.frenzy=0;r.staminaDelay=0;r.explored={};r.hidden=false;r.concealTime=0;r.revealedUntil=0;
      r.player.x = 480; r.player.y = 340; r.health = Math.min(r.maxHealth, r.health + r.maxHealth * .3); r.stamina = 100; r.invulnerable = 1;
      r.map = createMap(r.stage, (r.seed^Math.imul(r.levelIndex,2246822519))>>>0); this.setView(r.view.width, r.view.height); this.phase = 'playing'; this.populate(); this.emit('stage'); return true;
    }
    finish(victory) {
      const r = this.run; if (!r || r.result) return;
      r.result = { name: this.save.name, score: r.score + (victory ? 3000 : 0), stage: r.levelIndex + 1, bosses: r.bosses, seconds: Math.floor(r.seconds), victory: !!victory };
      this.save.scores = [...this.save.scores, r.result].sort((a, b) => b.score - a.score).slice(0, 10);
      this.checkAchievements();this.bankLifetime(victory);
      r.attack = null; r.bite = 0; r.deathTime = victory ? -1 : 0; this.phase = 'result'; this.persist(); this.emit(victory ? 'victory' : 'death');
    }
  }
  // Metrics observe the same simulation, including early returns and fatal hits.
  const simulationStep=Game.prototype.step;
  Game.prototype.step=function(dt,input){
    const r=this.run;if(!r||this.phase!=='playing')return simulationStep.call(this,dt,input);
    const health=r.health,taken=r.stats.damageTaken,enemies=r.enemies.map(e=>[e,e.hp]);
    try{return simulationStep.call(this,dt,input);}finally{
      r.stats.healing+=Math.max(0,r.health-health+r.stats.damageTaken-taken);
      for(const [e,hp] of enemies)r.stats.damageDealt+=Math.max(0,hp-Math.max(0,e.hp));
    }
  };
  return { isDeepWater, isLava, canSwim, ACHIEVEMENTS, SKINS, SPECIES_UNLOCKS, ZONES, zoneAt, MAP_SCALE, RIVALS, STAMINA, CRIT, critChance, playerFrame,abilityCost,mutationWeight,LEVELS,SECRET_SEED,Game, isWater, WIDTH, HEIGHT, BITE_ANIMATION, STAGES, SPECIES, SPECIES_LABELS, PLAYER_SPECIES, MUTATIONS, MUTATION_RARITIES, UPGRADES, ROCKS, MEAT_RARITIES, SPECIES_COLORS, BIOMES, riverCurve, riverDistance, suitableHabitat, createMap, SAVE_KEY, sanitizeSave, upgradeCost };
});
