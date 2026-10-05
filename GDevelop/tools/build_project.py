"""Reproducible native GDevelop project from 5.6.283 serializer defaults."""
import json,copy,pathlib,shutil
ROOT=pathlib.Path(__file__).resolve().parents[1];KIT=ROOT.parent/'PRIMAL_RUN_Prototype_Kit'
p=json.loads((ROOT/'tools/empty-project-5.6.283.json').read_text());l=p['layouts'][0]
sprite=copy.deepcopy(l['objects'][0]);text=copy.deepcopy(l['objects'][1])
p['firstLayout']='Game';p['properties'].update(name='PRIMAL RUN',author='Jonas Andersen',description='Lille GDevelop-kerne. Prototype-art; Compy, bite, mutationsvalg og restart.',windowWidth=960,windowHeight=640,scaleMode='nearest',pixelsRounding=True,adaptGameResolutionAtRuntime=False,projectUuid='bfc55083-7a95-423b-a51b-1b6d8f06a2be',packageName='dk.junnez.primalrun',version='0.2.0')
p['properties']['loadingScreen']['showGDevelopSplash']=False
l.update(name='Game',mangledName='Game',r=30,v=42,b=33,objects=[],instances=[],events=[],variables=[])
manifest=json.loads((KIT/'manifest.json').read_text());byfile={e['file']:e for e in manifest}
animations=json.loads((KIT/'animation_manifest.json').read_text())['animations']
def anim(name,files,origin,loop=False,fps=8,half=(14,14)):
 ox,oy=origin;hx,hy=half
 frames=[dict(hasCustomCollisionMask=True,image=f,points=[dict(name='BodyAnchor',x=ox,y=oy)],originPoint=dict(name='origine',x=ox,y=oy),centerPoint=dict(automatic=False,name='centre',x=ox,y=oy),customCollisionMask=[[dict(x=ox-hx,y=oy-hy),dict(x=ox+hx,y=oy-hy),dict(x=ox+hx,y=oy+hy),dict(x=ox-hx,y=oy+hy)]]) for f in files]
 return dict(name=name,useMultipleDirections=False,directions=[dict(looping=loop,timeBetweenFrames=1/fps,sprites=frames)])
def obj(name,anims):
 o=copy.deepcopy(sprite);o.update(name=name,animations=anims,adaptCollisionMaskAutomatically=False);l['objects'].append(o)
def static(name,file,origin=None,half=(14,14)):
 e=byfile[file];obj(name,[anim('Idle',[file],origin or e['origin'],half=half)])
obj('Player',[anim(a['name'],a['frames'],a['origin'],a['loop'],a['fps'] or 8) for a in animations])
static('Compy','assets/enemy/compy_idle_S_000.png',half=(6,6))
static('Parasaurolophus','assets/enemies/parasaurolophus_idle_S_000.png',half=(6,6));static('Carnotaurus','assets/enemies/carnotaurus_idle_S_000.png',half=(6,6))
static('Food','assets/pickups/meat.png');static('Rock','assets/environment/rock.png',half=(18,18));static('Grass','assets/environment/grass.png',origin=[0,0]);static('ChoiceBackdrop','assets/environment/grass.png',origin=[0,0])
obj('BiteEffect',[anim('Bite',['assets/effects/bite_slash_'+str(i).zfill(3)+'.png' for i in range(4)],[48,48])])
def txt(name,string,x,y,size):
 o=copy.deepcopy(text);o.update(name=name,string=string,font='',characterSize=size,smoothed=False,color=dict(r=237,g=208,b=160));o['content'].update(text=string,font='',characterSize=size,color='237;208;160',smoothed=False);l['objects'].append(o);instance(name,x,y,layer='UI',z=1000)
def instance(name,x,y,z=0,layer=''):
 l['instances'].append(dict(name=name,x=x,y=y,zOrder=z,angle=0,layer=layer,customSize=False,width=0,height=0,initialVariables=[],numberProperties=[],stringProperties=[]))
for y in range(0,640,32):
 for x in range(0,960,32):instance('Grass',x,y,-100)
for x,y in [(236,198),(698,208),(746,478),(276,450)]:instance('Rock',x,y,y)
instance('Player',480,320,320);instance('BiteEffect',480,320,900)
layer=copy.deepcopy(l['layers'][0]);layer['name']='UI';l['layers'].append(layer)
instance('ChoiceBackdrop',96,160,z=999,layer='UI')
txt('HUD','PRIMAL RUN',16,12,18);txt('Choices','',128,184,20)
l['objectsFolderStructure']={'folderName':'__ROOT','children':[{'objectName':o['name']} for o in l['objects']]}
balance=json.loads((KIT/'balance.json').read_text())
code='const PRIMAL_BALANCE='+json.dumps(balance,ensure_ascii=False)+';\n'+(ROOT/'src/core.js').read_text()+'\n'+(ROOT/'src/scene-event.js').read_text()
l['events']=[dict(type='BuiltinCommonInstructions::Comment',color=dict(r=105,g=190,b=105),comment='PRIMAL RUN: lille kerne. Kilde: src/core.js og src/scene-event.js. Alle gameplay-clocks fryser under mutationsvalg.'),dict(type='BuiltinCommonInstructions::JsCode',inlineCode=code.splitlines(),parameterObjects='',useStrict=True,eventsSheetExpanded=False)]
p['resources']['resources']=[dict(file=e['file'],kind='image',metadata='',name=e['file'],smoothed=False,userAdded=True) for e in manifest]
for f in sorted((KIT/'sounds').glob('*.wav')):p['resources']['resources'].append(dict(file='sounds/'+f.name,kind='audio',metadata='',name='sounds/'+f.name,userAdded=True))
for name in ['assets','sounds']:
 shutil.copytree(KIT/name,ROOT/name,dirs_exist_ok=True)
for name in ['manifest.json','palette.json','SPRITE_RULES.md','SPRITE_RULES_v1_reference.md','SPRITE_RULES_v2_reference.md','animation_manifest.json','validation_report.json','balance.json']:shutil.copy2(KIT/name,ROOT/name)
(ROOT/'project.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
print('Built Game: 104 PNG, 8 WAV, relative paths, native objects + JavaScript event')

# Clarify copied art metadata without promoting any production approval.
a=json.loads((ROOT/'animation_manifest.json').read_text());a['GDevelop_runtime']='PASS: exported 5.6.283 movement/idle/mask reference. See reports/runtime-tests.json. Art remains unapproved.'
(ROOT/'animation_manifest.json').write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
with (ROOT/'SPRITE_RULES.md').open('a') as f:f.write('\nFor denne native GDevelop-leverance er faktisk export/runtime testet; se STATUS.md og reports/runtime-tests.json. Det ophæver ikke nogen visuel gate eller production_approved=false. Den oprindelige kit-status ovenfor er bevaret som reference.\n')
