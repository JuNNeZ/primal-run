"""Check every atlas crop and transparent gutter against untouched source PNGs."""
from pathlib import Path
import hashlib
import json
from PIL import Image
from build_sprite_atlases import GAME

def validate():
    atlas=json.loads((GAME/'sprite_atlas_manifest.json').read_text())
    manifest={e['file']:e for e in json.loads((GAME/'manifest.json').read_text()) if e.get('runtime_enabled') is not False}
    assert set(atlas['frames'])==set(manifest), 'incomplete frame coverage'
    checked=0;unique=0;seen=set()
    for entry in atlas['sheets']:
        sheet=Image.open(GAME/entry['file']).convert('RGBA')
        assert max(sheet.size)<=atlas.get('max_dimension',2048),entry['file']+' dimension limit'
        assert hashlib.sha256((GAME/entry['file']).read_bytes()).hexdigest()==entry['sha256']
        index=json.loads((GAME/entry['file']).with_suffix('.json').read_text())
        occupied=Image.new('1',sheet.size)
        for path,f in index.items():
            x,y,w,h=f['x'],f['y'],f['w'],f['h']
            assert path not in seen,path+' duplicate index';seen.add(path)
            assert x>=1 and y>=1 and x+w<sheet.width and y+h<sheet.height,path+' bounds'
            assert f['anchor']==manifest[path]['origin'],path+' anchor'
            assert [w,h]==manifest[path]['size'],path+' size'
            assert sheet.crop((x,y,x+w,y+h)).tobytes()==Image.open(GAME/path).convert('RGBA').tobytes(),path+' pixels'
            if 'alias_of' in f:
                master=index.get(f['alias_of'])
                assert master and 'alias_of' not in master,path+' alias target'
                assert [f[k] for k in ('x','y','w','h')]==[master[k] for k in ('x','y','w','h')],path+' alias region'
            else:
                assert not occupied.crop((x-1,y-1,x+w+1,y+h+1)).getbbox(),path+' overlap'
                occupied.paste(1,(x-1,y-1,x+w+1,y+h+1));unique+=1
            for box in [(x-1,y-1,x+w+1,y),(x-1,y+h,x+w+1,y+h+1),(x-1,y,x,y+h),(x+w,y,x+w+1,y+h)]:
                assert not any(sheet.crop(box).tobytes()),path+' gutter'
            assert atlas['frames'][path]==dict(file=entry['file'],**f),path+' index'
            checked+=1
    assert seen==set(manifest) and checked==len(manifest),'duplicate/incomplete coverage'
    if atlas.get('version')==2:
        assert unique==atlas['unique_frames'] and checked-unique==atlas['alias_frames'],'alias statistics'
    approved=json.loads((GAME/'presentation_manifest.json').read_text())
    for entry in approved:
        digest=hashlib.sha256((GAME/entry['file']).read_bytes()).hexdigest()
        assert digest==entry['visual_approval']['approved_export_sha256'],entry['file']+' approval'
        assert digest==entry['export_sha256']==entry['source_sha256'],entry['file']+' provenance'
        assert (GAME/entry['file']).read_bytes()==(GAME/entry['source']).read_bytes(),entry['file']+' master'
    result=dict(status='PASS',approved_exports=len(approved),frames=checked,unique_frames=unique,alias_frames=checked-unique,sheets=len(atlas['sheets']),checks=['exact native RGBA bytes','unaltered anchors and dimensions','one-pixel zero-RGBA gutters','nonoverlapping unique frames; aliases share only exact rectangles','complete active catalog coverage','unchanged user-approved exports and masters'])
    (GAME/'sprite_atlas_validation.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))
if __name__=='__main__':validate()
