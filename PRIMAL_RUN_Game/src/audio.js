/* Original procedural soundtrack: a pentatonic hunt motif and hand-drum pulses. */
(function (root) {
  'use strict';
  class PrimalAudio {
    constructor(resolve, settings) {
      this.resolve = resolve; this.settings = settings; this.context = null;
      this.intensity = 'menu'; this.beat = 0; this.nextBeat = 0; this.active = new Set(); this.error = null;
      this.timer = null;
    }
    async unlock() {
      try {
        if (!this.context) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          this.context = new AudioContext(); this.music = this.context.createGain(); this.music.connect(this.context.destination);
          this.effects = this.context.createGain(); this.effects.connect(this.context.destination);
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
      if (this.context) this.music.gain.setTargetAtTime(s.master * s.music * (this.intensity === 'paused' ? .4 : 1), this.context.currentTime, .1);
      for (const audio of this.active) audio.volume = s.master * s.sfx;
    }
    tone(frequency, start, length, volume, wave = 'triangle', endFrequency) {
      const c = this.context, oscillator = c.createOscillator(), gain = c.createGain();
      oscillator.type = wave; oscillator.frequency.setValueAtTime(frequency, start);
      if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + length);
      gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + length);
      oscillator.connect(gain); gain.connect(this.music); oscillator.start(start); oscillator.stop(start + length + .02);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
    schedule() {
      const c = this.context; if (!c || c.state !== 'running') return;
      if (this.nextBeat < c.currentTime) this.nextBeat = c.currentTime + .03;
      const boss = this.intensity === 'boss', hunt = this.intensity === 'hunt', interval = boss ? .25 : .36;
      const notes = [146.83, 174.61, 196, 220, 261.63, 220, 196, 174.61];
      while (this.nextBeat < c.currentTime + .25) {
        const t = this.nextBeat, beat = this.beat++;
        if (beat % 4 === 0) this.tone(73.42, t, interval * 3.8, .065, 'sine');
        if (beat % 2 === 0) this.tone(notes[Math.floor(beat / 2) % notes.length], t, interval * 1.8, .035);
        if (hunt || boss) this.tone(105, t, .14, boss ? .12 : .08, 'sine', 42);
        if (boss && beat % 2) this.tone(330, t, .06, .025, 'triangle', 150);
        this.nextBeat += interval;
      }
    }
    impact() {
      const c = this.context; if (!c || c.state !== 'running') return;
      const t = c.currentTime, osc = c.createOscillator(), gain = c.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(180, t); osc.frequency.exponentialRampToValueAtTime(48, t + .09);
      gain.gain.setValueAtTime(.3, t); gain.gain.exponentialRampToValueAtTime(.0001, t + .12);
      osc.connect(gain); gain.connect(this.effects); osc.start(t); osc.stop(t + .13);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    }
    play(event) {
      if (event === 'bite_hit') { if (this.settings.master * this.settings.sfx > 0) this.impact(); return; }
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
      if (this.context) this.context.close();
    }
  }
  root.PrimalAudio = PrimalAudio;
})(globalThis);
