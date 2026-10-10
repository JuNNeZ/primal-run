"""Integrate user-approved handoff PNGs without changing their pixels."""
from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'PRIMAL_RUN_Art_Handoff'
GAME = ROOT / 'PRIMAL_RUN_Game'


def build():
    approved = json.loads((PACKAGE / 'manifest.json').read_text())
    approval = json.loads((PACKAGE / 'approval.json').read_text())
    for entry in approved['assets']:
        digest = hashlib.sha256((PACKAGE / entry['path']).read_bytes()).hexdigest()
        if approval['exports'].get(entry['path']) != digest:
            raise SystemExit('Export differs from approved pixels: ' + entry['path'])
    source_root = GAME / 'Source_Generated/presentation_approved'
    source_root.mkdir(parents=True, exist_ok=True)
    shutil.copytree(PACKAGE / 'Source_Reused', source_root / 'Source_Reused', dirs_exist_ok=True)
    for name in ('manifest.json', 'approval.json', 'SPRITE_RULES.md', 'REVIEW.md'):
        shutil.copyfile(PACKAGE / name, source_root / name)
    entries = []
    for entry in approved['assets']:
        path = entry['path']
        source, master, output = PACKAGE / path, source_root / path, GAME / path
        master.parent.mkdir(parents=True, exist_ok=True)
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, master)
        shutil.copyfile(source, output)
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        entries.append(dict(file=path, size=entry['size'], origin=entry['origin'],
                            family=entry['family'], frame=entry.get('frame'),
                            source=master.relative_to(GAME).as_posix(), source_crop=None,
                            source_sha256=digest, export_sha256=digest,
                            source_provenance=entry, status='prototype_static',
                            visual_approval={key: approval[key] for key in ('approved','date','by','statement')} | {
                                             'approved_export_sha256': digest},
                            animation_ready=False, production_approved=False))
    (GAME / 'presentation_manifest.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n')
    shutil.copyfile(PACKAGE / 'SPRITE_RULES.md', GAME / 'SPRITE_RULES_PRESENTATION.md')
    print(f'Integrated {len(entries)} approved PNGs byte-identically; runtime gates remain separate.')


if __name__ == '__main__':
    build()
