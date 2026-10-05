"""Optional original synthetic cues. Not realistic dinosaur recordings."""
from pathlib import Path
import wave,math,random,struct,json
root=Path(__file__).resolve().parents[1];out=root/'sounds';out.mkdir(exist_ok=True)
rate=22050;rng=random.Random(42)
specs={'bite':(.16,190,65,.55),'hit':(.18,110,45,.65),'pickup':(.20,650,1050,.0),'level_up':(.60,440,880,.0),'pounce':(.24,230,70,.45),'death':(.70,200,40,.12),'meteor':(.75,100,35,.8),'ui_select':(.12,550,760,.0)}
report=[]
for name,(duration,start,end,noise) in specs.items():
    count=round(rate*duration);samples=[];phase=0
    for i in range(count):
        t=i/rate;u=i/max(1,count-1);frequency=start+(end-start)*u
        if name=='level_up':frequency=[440,554.365,659.255,880][min(3,int(u*4))]
        phase+=2*math.pi*frequency/rate
        envelope=min(1,t/.01)*min(1,(duration-t)/.025)*(1-u*.55)
        value=.38*envelope*((1-noise)*math.sin(phase)+noise*rng.uniform(-1,1))
        samples.append(round(value*32767))
    with wave.open(str(out/f'{name}.wav'),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(struct.pack('<'+'h'*len(samples),*samples))
    assert max(map(abs,samples))<32767 and samples[0]==0
    report.append({'file':f'sounds/{name}.wav','duration_seconds':duration,'sample_rate':rate,'mono':True,'peak':max(map(abs,samples)),'status':'synthetic_placeholder'})
(out/'manifest.json').write_text(json.dumps(report,indent=2))
(out/'README.md').write_text('Eight original synthetic WAV placeholders, mono PCM16 at 22050Hz. Use for bite, damage, loot, level-up, pounce, death, meteor and UI. These are tones/noise cues, not realistic dinosaur recordings. They are not connected to browser gameplay. Import into GDevelop and play once on the corresponding event; use separate channels for simultaneous sounds. Volume should be adjusted during playtesting. No external sound assets or recordings used.')
print('8 WAV placeholders; PCM format and no-clipping checks PASS')
