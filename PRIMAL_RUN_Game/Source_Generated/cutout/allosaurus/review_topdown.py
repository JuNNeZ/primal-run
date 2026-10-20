"""Native and animated cutout checks; this script never grants art approval."""
import hashlib,json,subprocess,sys,shutil
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageSequence
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[3]
sys.path.insert(0,str(REPO/'tools'))
import cutout_rig as C
BASE='158d6dde2db675337d621ca93b68c9bd41da869d'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 sid=ROOT.name;spec=json.loads((ROOT/f'{sid}_parts.json').read_text());views=C.load_parts(ROOT,sid)
 pal={tuple(map(int,c)) for c in C.D.PALETTE}
 report={'species':sid,'status':'PASS','art_status':'prototype_static','visual_status':'unapproved','production_approved':False,'runtime_integrated':False,'base_commit':BASE,'directions':{},'preserved_SN':{},'sources':{},'rig':{}}
 old=json.loads(subprocess.check_output(['git','show',f'{BASE}:{ROOT.relative_to(REPO)}/{sid}_parts.json'],cwd=REPO))
 for d in 'SNEW':
  v=spec['directions'][d];owner=np.full((144,144),'',dtype='<U20');mask={};images={};joints={}
  if d in 'SN':assert v==old['directions'][d],(d,'changed rig data')
  for n in list(v['parts'])+['full']:
   p=ROOT/f'{sid}_{d}_{n}.png';im=Image.open(p);a=np.array(im)
   assert im.mode=='RGBA' and im.size==(144,144)
   assert set(np.unique(a[:,:,3]))<={0,255}
   assert not a[a[:,:,3]==0,:3].any()
   assert {tuple(map(int,c)) for c in a[a[:,:,3]>0,:3]}<=pal
   x0,y0,x1,y1=im.getbbox();assert min(x0,y0)>=2 and max(x1,y1)<=142,(p.name,'margin')
   images[n]=im;mask[n]=a[:,:,3]>0
   if d in 'SN':
    prior=subprocess.check_output(['git','show',f'{BASE}:{p.relative_to(REPO)}'],cwd=REPO)
    assert hashlib.sha256(prior).hexdigest()==sha(p),(p.name,'changed S/N')
    report['preserved_SN'][p.name]=sha(p)
  full=Image.new('RGBA',(144,144))
  for n in v['order']:
   full.alpha_composite(images[n]);owner[mask[n]]=n
  assert np.array_equal(np.array(full),np.array(images['full']))
  assert v['parts']['body']['pivot']==[72,72]
  for n,p in v['parts'].items():
   for key in ['pivot','tip']:
    x,y=p[key];assert type(x) is int and type(y) is int and mask[n][y,x],(d,n,key)
   if p['parent']:
    x,y=p['pivot'];assert mask[p['parent']][y,x],(d,n,'pivot outside parent')
    overlap=int((mask[n]&mask[p['parent']]).sum());assert overlap>=3,(d,n,'overlap',overlap);joints[n]=overlap
  feet={n:int((owner==n).sum()) for n in ['foot_L','foot_R']}
  assert min(feet.values())>=3,(d,'invisible foot',feet)
  if d in 'EW':
   far='L' if d=='E' else 'R';tail=min(v['order'].index(n) for n in ['tail1','tail2','tail3'])
   assert all(v['order'].index(f'{n}_{far}')<tail for n in ['thigh','shin','foot','arm'])
  box=images['full'].getbbox()
  report['directions'][d]={'bbox':list(box),'length_px':box[2]-box[0],'visible_foot_pixels':feet,'joint_overlap_pixels':joints,'full_sha256':sha(ROOT/f'{sid}_{d}_full.png')}
 assert report['directions']['E']['length_px']=={'tyrannosaurus':115,'allosaurus':130}[sid]
 assert not np.array_equal(np.array(images['full']),np.array(Image.open(ROOT/f'{sid}_E_full.png'))[:,::-1])
 rig=json.loads(Path(f'/tmp/frames/{sid}_cutout.json').read_text());assert len(rig['frames'])==120
 clip=[n for n,f in rig['frames'].items() if min(f['bbox'][:2])<=0 or max(f['bbox'][2:])>=144]
 assert not clip,('animation clipping',clip)
 report['rig']={'frames':120,'clipped_frames':clip,'command':f'python tools/cutout_rig.py --species {sid} --parts {ROOT.relative_to(REPO)} --out /tmp/frames --gif /tmp/gif','gif_sequences':{},'separated_joints':[]}
 msid=C.MOTION.get(sid,sid);info=C.R.RigInfo(msid);rest=C.rest_points(msid,info);k=C.D.SPECIES[msid].get('scale',1);gain=C.motion_gain(views,rest,k) if sid!=msid else 1
 previews=ROOT/'previews';dest=previews/'gif';dest.mkdir(exist_ok=True)
 for state in ['walk','run','attack']:
  n=C.R.STATES[state][0];contact=Image.new('RGB',(n*288,4*312),'#ddd7c6');draw=ImageDraw.Draw(contact)
  for row,d in enumerate('SEWN'):
   p=Path(f'/tmp/gif/{sid}_{state}_{d}.gif');
   if d in 'EW':shutil.copyfile(p,dest/p.name)
   with Image.open(p) as gif:
    assert gif.n_frames==n
    report['rig']['gif_sequences'][f'{state}_{d}']={'frames':n,'duration_ms':[]}
    for f,im in enumerate(ImageSequence.Iterator(gif)):
     report['rig']['gif_sequences'][f'{state}_{d}']['duration_ms'].append(im.info.get('duration'))
     a=im.convert('RGB').resize((144,144),Image.Resampling.NEAREST).resize((288,288),Image.Resampling.NEAREST)
     contact.paste(a,(f*288,row*312+24));draw.text((f*288+5,row*312+5),f'{sid} {state} {d} {f}',fill='black')
  contact.save(previews/f'topdown_gif_{state}_contact.png')
  for f in range(n):
   posed=C.posed_points(msid,info,rest,state,f,n)
   for d in 'EW':
    v=views[d];tf=C.transforms(v,rest,posed,C.R.HEADING[d],k,gain=gain,jaw=C.JAW_OPEN.get(state,[0.0]*n)[f])
    masks={n:C.warp(p['img'],*tf[n])[:,:,3]>0 for n,p in v['parts'].items()}
    for name,p in v['parts'].items():
     par=p['parent']
     if par and name!='jaw' and not (C.grow1(masks[name])&masks[par]).any():report['rig']['separated_joints'].append([state,f,d,name])
 assert not report['rig']['separated_joints'],report['rig']['separated_joints']
 for p in (ROOT/'sources').glob('topdown*.png'):report['sources'][p.name]=sha(p)
 report['limitations']=['Prototype art awaiting Jonas visual review.','No runtime assets or GDevelop integration changed.','Jaw opening is the existing 2D rig translation.']
 (ROOT/'validation_report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(sid,'PASS: 64 PNGs, E length, S/N byte equality, far-leg order, joints, 120 frames, 12 GIF sequences / 3 contact sheets; unapproved.')
if __name__=='__main__':main()
