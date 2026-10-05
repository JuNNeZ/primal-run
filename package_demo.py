from pathlib import Path
import shutil,zipfile
root=Path(__file__).resolve().parent
out=root/'PRIMAL_RUN_Demo_v2'
shutil.copy2(root/'PRIMAL_RUN_Sprites/SPRITE_RULES.md',out/'SPRITE_RULES_V1_REFERENCE.md')
archive_path=root/'PRIMAL_RUN_Demo_v2.zip'
with zipfile.ZipFile(archive_path,'w',zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(out.rglob('*')):
        if path.is_file():archive.write(path,path.relative_to(root))
    archive.write(root/'build_demo_assets.py','build_demo_assets.py')
    archive.write(root/'package_demo.py','package_demo.py')
with zipfile.ZipFile(archive_path) as archive:
    if archive.testzip() is not None:raise RuntimeError('ZIP integrity failure')
    assets=[n for n in archive.namelist() if '/assets/' in n and n.endswith('.png')]
    assert len(assets)==6,assets
print(f'{archive_path}: 6 individual game PNGs; ZIP CRC checks PASS; {archive_path.stat().st_size:,} bytes')
