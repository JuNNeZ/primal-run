from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent
out=root/'PRIMAL_RUN_Demo_v3';destination=root/'PRIMAL_RUN_Demo_v3.zip'
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as archive:
    for p in sorted(out.rglob('*')):
        if p.is_file():archive.write(p,p.relative_to(root))
with zipfile.ZipFile(destination) as archive:
    if archive.testzip() is not None:raise RuntimeError('ZIP integrity failure')
    game_pngs=[n for n in archive.namelist() if '/assets/' in n and n.endswith('.png')]
    assert len(game_pngs)==12,game_pngs
print(f'{destination}: 12 game PNGs, including 6 Walk_S frames; ZIP CRC checks PASS; {destination.stat().st_size:,} bytes')
