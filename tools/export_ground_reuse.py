"""Integrate sixteen preserved native terrain tiles with exact source provenance."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'PRIMAL_RUN_Game'
PACKAGE=ROOT/'PRIMAL_RUN_Art_Handoff/Source_Reused/feathered'
SOURCE=GAME/'Source_Generated/ground_reused'

def build():
    SOURCE.mkdir(parents=True,exist_ok=True)
    raw=SOURCE/'biome_ground_atlas.png'
    if not raw.exists():
        raise SystemExit('Preserved source atlas missing; do not reconstruct it from tile exports')
    original=json.loads((PACKAGE/'ground_manifest.json').read_text())
    entries=[]
    for e in original:
        if e['size']!=[32,32]:continue
        master=SOURCE/e['file']
        if not master.exists():
            master.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(PACKAGE/e['file'],master)
        assert hashlib.sha256(master.read_bytes()).hexdigest()==e['export_sha256'],e['file']
        assert hashlib.sha256(raw.read_bytes()).hexdigest()==e['source_sha256'],e['source']
        output=GAME/e['file'];output.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(master,output)
        entries.append(dict(e,source=raw.relative_to(GAME).as_posix(),reused_from='codex/preserved-feathered-starter:PRIMAL_RUN_Game/'+e['file'],reused_sha256=e['export_sha256'],reuse='byte-identical native tile; original crop, sampling and source hash retained'))
    (SOURCE/'original_manifest.json').write_text(json.dumps(original,indent=2)+'\n')
    (GAME/'ground_reuse_manifest.json').write_text(json.dumps(entries,indent=2)+'\n')
    shutil.copyfile(PACKAGE/'reference/SPRITE_RULES_GROUND.md',GAME/'SPRITE_RULES_GROUND.md')
    print('Reused',len(entries),'native tiles byte-identically')
if __name__=='__main__':build()
