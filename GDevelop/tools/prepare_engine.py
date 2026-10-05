"""Prepare the pinned official Linux GDevelop engine for reproducible cloud export.
No GitHub credential or Windows machine is involved. Never ship the engine in Git.
Usage: python .../prepare_engine.py [engine-directory] [existing-release-zip]
"""
from pathlib import Path
import sys,urllib.request,hashlib,zipfile,struct,json
version='5.6.283';dest=Path(sys.argv[1] if len(sys.argv)>1 else '.cache/gdevelop-'+version).resolve()
archive=Path(sys.argv[2]) if len(sys.argv)>2 else dest.parent/('GDevelop-'+version+'-linux.zip')
url='https://github.com/4ian/GDevelop/releases/download/v'+version+'/GDevelop-5-'+version+'-linux.zip'
expected='cfc62af67dccffa5f3e10991e784b9d0d8c4009f7d75046f846dd39da6cc550a'
archive.parent.mkdir(parents=True,exist_ok=True)
if not archive.exists():
 with urllib.request.urlopen(url,timeout=120) as inp,archive.open('wb') as out:
  while chunk:=inp.read(1024*1024):out.write(chunk)
assert hashlib.sha256(archive.read_bytes()).hexdigest()==expected,'Official release SHA256 mismatch'
dest.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(archive) as z:
 for info in z.infolist():
  if info.filename.startswith('resources/GDJS/') or info.filename=='resources/app.asar':
   target=(dest/info.filename).resolve();assert target.is_relative_to(dest),'Unsafe archive path';z.extract(info,dest)
with (dest/'resources/app.asar').open('rb') as f:
 header=struct.unpack('<4I',f.read(16));tree=json.loads(f.read(header[3]));base=8+header[1]
 for name in ['libGD.js','libGD.wasm']:
  entry=tree['files']['www']['files'][name];f.seek(base+int(entry['offset']))
  p=dest/'resources/app/www'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(f.read(entry['size']))
print('Prepared official GDevelop '+version+' at '+str(dest))
