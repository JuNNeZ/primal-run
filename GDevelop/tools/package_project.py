"""Create standalone editable GDevelop ZIP and include real export if available."""
from pathlib import Path
import zipfile,sys
root=Path(__file__).resolve().parents[1];out=Path(sys.argv[1] if len(sys.argv)>1 else 'PRIMAL_RUN_GDevelop_2026-10-06.zip').resolve()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  if p.is_file() and '__pycache__' not in p.parts:z.write(p,Path('PRIMAL_RUN_GDevelop')/p.relative_to(root))
print(str(out))
