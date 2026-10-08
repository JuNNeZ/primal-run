/* Original adaptive score: scene compositions, crossfades and health layers. */
(function (root) {
  'use strict';
  // Original compositions. A motif/chord/tempo/voice belongs to each scene.
  const SCORES={
    menu:{name:'Junglens morgen',bpm:76,root:50,voice:'sine',motif:[12,null,19,16,14,null,9,12,7,null,14,12,9,null,7,null],chords:[0,5,9,7],drums:0},
    forest:{name:'Bregnernes jagt',bpm:104,root:50,voice:'triangle',motif:[0,7,9,12,7,null,5,2,0,9,7,5,2,null,7,null],chords:[0,5,7,0],drums:1},
    river:{name:'Flodens strøm',bpm:88,root:55,voice:'sine',motif:[12,14,null,19,16,14,12,null,9,7,9,12,14,null,7,null],chords:[0,9,5,7],drums:1},
    rocks:{name:'Stenens ekko',bpm:112,root:45,voice:'triangle',motif:[0,null,3,7,10,7,3,null,5,8,12,8,7,3,0,null],chords:[0,5,3,7],drums:2},
    volcano:{name:'Aske og ild',bpm:120,root:43,voice:'triangle',motif:[0,1,7,null,8,7,3,1,0,null,6,7,3,1,0,null],chords:[0,1,5,0],drums:2},
    boss0:{name:'Skovens stormløb',bpm:142,root:38,voice:'square',motif:[0,0,7,3,0,10,7,null,0,3,7,12,10,7,3,0],chords:[0,3,5,0],drums:3},
    boss1:{name:'Gab under vandet',bpm:128,root:41,voice:'triangle',motif:[0,null,1,0,6,null,7,6,0,1,6,7,10,7,1,null],chords:[0,1,6,0],drums:3},
    boss2:{name:'Den hornede march',bpm:136,root:40,voice:'square',motif:[0,7,0,7,3,3,10,null,5,12,5,12,7,3,0,null],chords:[0,5,3,7],drums:3},
    boss3:{name:'Dalens sidste konge',bpm:156,root:36,voice:'square',motif:[0,1,0,7,6,3,1,0,12,10,7,6,3,1,0,0],chords:[0,1,6,0],drums:3},
    victory:{name:'Dalens nye konge',bpm:92,root:55,voice:'triangle',motif:[0,4,7,12,null,11,9,7,4,7,12,16,14,12,null,null],chords:[0,5,7,0],drums:0},
    defeat:{name:'Evolutionen fortsætter',bpm:64,root:45,voice:'sine',motif:[12,null,10,null,7,null,3,null,5,null,3,null,0,null,null,null],chords:[0,3,5,0],drums:0},
  };
  const frequency=midi=>440*Math.pow(2,(midi-69)/12);
  class PrimalAudio {
    constructor(resolve, settings) {
      this.resolve = resolve; this.settings = settings; this.context = null;
      this.intensity = 'menu'; this.beat = 0; this.nextBeat = 0; this.active = new Set(); this.error = null;
      this.timer = null; this.trackId='menu'; this.healthBand=0; this.ducked=false; this.voices=new Set();this.retiredBuses=new Map();this.transitions=0;
    }
    async unlock() {
      try {
        if (!this.context) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          this.context = new AudioContext(); this.music = this.context.createGain(); this.music.connect(this.context.destination);
          this.effects = this.context.createGain(); this.effects.connect(this.context.destination);
          this.bus=this.context.createGain();this.bus.gain.value=1;this.bus.connect(this.music);
          this.nextBeat = this.context.currentTime + .06;
          this.timer = setInterval(() => this.schedule(), 100);
        }
        if (this.context.state === 'suspended') await this.context.resume();
        this.sync();
      } catch (e) { this.error = e.message; }
    }
    sync() {
      const s = this.settings;
      if (this.context) this.effects.gain.setTargetAtTime(s.master * s.sfx, this.context.currentTime, .01);
      if (this.context) this.music.gain.setTargetAtTime(s.master * s.music * (this.ducked ? .28 : 1), this.context.currentTime, .1);
      for (const audio of this.active) audio.volume = s.master * s.sfx;
    }
    tone(frequency, start, length, volume, wave = 'triangle', endFrequency, destination = this.bus) {
      const c = this.context, oscillator = c.createOscillator(), gain = c.createGain();
      oscillator.type = wave; oscillator.frequency.setValueAtTime(frequency, start);
      if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + length);
      gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + length);
      oscillator.connect(gain); gain.connect(destination || this.music); this.voices.add(oscillator); oscillator.start(start); oscillator.stop(start + length + .02);
      oscillator.onended = () => { this.voices.delete(oscillator);oscillator.disconnect(); gain.disconnect(); };
    }
    setScene({phase='menu',stage=0,boss=false,health=1,maxHealth=1,victory=false}={}) {
      const gameplay=['playing','paused','mutation','exploration','cleared'].includes(phase);
      const ratio=Math.max(0,Math.min(1,health/Math.max(1,maxHealth)));
      // Hysteresis prevents healing/damage around a threshold from flickering layers.
      let band=this.healthBand;
      if(!gameplay || phase==='cleared')band=0;
      else if(ratio<=.10)band=3;
      else if(ratio<=.25)band=Math.max(2,band===3&&ratio<.15?3:2);
      else if(ratio<=.50)band=band>=2&&ratio<.30?2:1;
      else band=band>0&&ratio<.55?1:0;
      this.healthBand=band;this.ducked=gameplay&&phase!=='playing';
      this.intensity=this.ducked?'paused':gameplay?(boss?'boss':'hunt'):'menu';
      const track=phase==='result'?(victory?'victory':'defeat'):gameplay?(boss&&phase!=='cleared'?'boss'+stage:['forest','river','rocks','volcano'][stage]):'menu';
      if(track===this.trackId)return;
      this.trackId=track;this.beat=0;this.transitions++;
      if(!this.context)return;
      const c=this.context,t=c.currentTime,old=this.bus;
      const bus=c.createGain();bus.gain.setValueAtTime(0,t);bus.gain.linearRampToValueAtTime(1,t+.65);bus.connect(this.music);this.bus=bus;
      if(old){old.gain.cancelScheduledValues(t);old.gain.setValueAtTime(old.gain.value,t);old.gain.linearRampToValueAtTime(0,t+.65);this.retiredBuses.set(old,t+2.5);}
      this.nextBeat=t+.04;
    }
    schedule() {
      const c=this.context;if(!c||c.state!=='running')return;
      for(const [bus,until]of this.retiredBuses)if(c.currentTime>=until){bus.disconnect();this.retiredBuses.delete(bus);}
      if(this.settings.master*this.settings.music===0){this.nextBeat=c.currentTime+.04;return;}
      if(this.nextBeat<c.currentTime)this.nextBeat=c.currentTime+.03;
      const score=SCORES[this.trackId]||SCORES.menu,interval=30/score.bpm;
      while(this.nextBeat<c.currentTime+.16){
        const t=this.nextBeat,beat=this.beat++,chord=score.chords[Math.floor(beat/16)%4],note=score.motif[beat%16];
        if(beat%8===0){this.tone(frequency(score.root-12+chord),t,interval*7.7,.05,'sine');this.tone(frequency(score.root+chord+7),t,interval*7.5,.012,'sine');}
        if(note!==null)this.tone(frequency(score.root+12+note),t,interval*(score.drums===0?1.8:.8),score.voice==='square'?.011:.028,score.voice);
        if(score.drums&&beat%2===0)this.tone(110,t,.15,.035+score.drums*.018,'sine',38);
        if(score.drums>=2&&beat%4===3)this.tone(240,t,.06,.018,'triangle',90);
        if(score.drums===3&&beat%2)this.tone(330,t,.045,.012,'triangle',140);
        if(this.healthBand&&!this.ducked){
          if(beat%4===0||this.healthBand>=2&&beat%4===1)this.tone(65,t,.12,.035+this.healthBand*.01,'sine',42);
          if(this.healthBand>=2&&beat%2===1)this.tone(frequency(score.root+13),t,interval*.55,.012,'triangle');
          if(this.healthBand===3&&beat%4===2)this.tone(frequency(score.root+18),t,interval*.6,.012,'sine');
        }
        this.nextBeat+=interval;
      }
    }
    impact(strong = false) {
      const c = this.context; if (!c || c.state !== 'running') return;
      const t = c.currentTime, osc = c.createOscillator(), gain = c.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(180, t); osc.frequency.exponentialRampToValueAtTime(48, t + .09);
      gain.gain.setValueAtTime(strong ? .4 : .3, t); gain.gain.exponentialRampToValueAtTime(.0001, t + .12);
      osc.connect(gain); gain.connect(this.effects); osc.start(t); osc.stop(t + .13);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      const buffer = c.createBuffer(1, Math.floor(c.sampleRate * .035), c.sampleRate), samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i * 127.1) * Math.cos(i * 31.7) * (1 - i / samples.length);
      const snap = c.createBufferSource(), snapGain = c.createGain(); snap.buffer = buffer; snapGain.gain.value = strong ? .13 : .08; snap.connect(snapGain); snapGain.connect(this.effects); snap.start(t); snap.onended = () => { snap.disconnect(); snapGain.disconnect(); };
    }
    play(event, detail = {}) {
      if (event === 'bite_hit') { if (this.settings.master * this.settings.sfx > 0) this.impact(detail.strong); return; }
      if (['roar', 'boss_enrage'].includes(event)) {
        const c = this.context; if (!c || c.state !== 'running' || this.settings.master * this.settings.sfx === 0) return;
        const osc = c.createOscillator(), gain = c.createGain(), t = c.currentTime; osc.type = 'sawtooth'; osc.frequency.setValueAtTime(event === 'boss_enrage' ? 95 : 70, t); osc.frequency.exponentialRampToValueAtTime(32, t + .32); gain.gain.setValueAtTime(.06, t); gain.gain.exponentialRampToValueAtTime(.0001, t + .35); osc.connect(gain); gain.connect(this.effects); osc.start(t); osc.stop(t + .36); osc.onended = () => { osc.disconnect(); gain.disconnect(); }; return;
      }
      const names = { bite: 'bite', hit: 'hit', pickup: 'pickup', dna: 'pickup', pounce: 'pounce', level_up: 'level_up', death: 'death', ui: 'ui_select', boss: 'meteor', boss_dead: 'level_up', victory: 'level_up', stage: 'ui_select', start: 'ui_select' };
      const name = names[event]; if (!name || this.settings.master * this.settings.sfx === 0 || this.active.size > 8) return;
      const audio = new Audio(this.resolve('sounds/' + name + '.wav')); audio.volume = this.settings.master * this.settings.sfx;
      this.active.add(audio);
      const cleanup = () => this.active.delete(audio);
      audio.onended = cleanup; audio.onerror = () => { this.error = 'Kunne ikke indlæse ' + name; cleanup(); };
      audio.play().catch(cleanup);
    }
    dispose() {
      if (this.timer) clearInterval(this.timer);
      for (const audio of this.active) audio.pause(); this.active.clear();
      for(const voice of this.voices){try{voice.stop();}catch(_){}}this.voices.clear();
      if(this.bus)this.bus.disconnect();for(const bus of this.retiredBuses.keys())bus.disconnect();this.retiredBuses.clear();
      if (this.context) this.context.close();
    }
  }
  PrimalAudio.SCORES=SCORES;root.PrimalAudio = PrimalAudio;
})(globalThis);
