from pathlib import Path
import zipfile

root=Path(__file__).resolve().parent
assets=root/'PRIMAL_RUN_Sprites'
destination=root/'PRIMAL_RUN_Sprites.zip'
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(assets.rglob('*')):
        if path.is_file(): archive.write(path,path.relative_to(root))
    for name in ['AGENTS.md','export_sprites.py','validate_sprites.py','package_sprites.py']:
        archive.write(root/name,name)
with zipfile.ZipFile(destination) as archive:
    failed=archive.testzip()
    if failed: raise RuntimeError(failed)
    print(f'{destination}: {len(archive.namelist())} files, CRC checks PASS, {destination.stat().st_size:,} bytes')
