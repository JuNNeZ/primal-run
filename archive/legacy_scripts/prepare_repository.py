"""One-time migration from local generation paths to repository source files."""
from pathlib import Path
import shutil,re
root=Path(__file__).resolve().parents[1]
for path in root.glob('check_*.cjs'):
    text=path.read_text(encoding='utf-8-sig')
    text=re.sub(r"const \{\s*chromium\s*\}=require\('C:/Users/Jonas/[^']+'\);", "const {chromium, browserOptions}=require('./tools/browser.cjs');",text,count=1)
    text=text.replace("chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'})",'chromium.launch(browserOptions())')
    path.write_text(text,encoding='utf-8')
source_changes={
 'build_walk_assets.py':("SOURCE=Path(r'", "SOURCE=OUT/'Source_Generated/utahraptor_walk_S_sheet.png'"),
 'build_corrected_walk.py':("SOURCE=Path(r'", "SOURCE=OUT/'Source_Generated/utahraptor_walk_S_sheet.png'"),
 'build_direction_demo.py':("SOURCE=Path(r'", "SOURCE=OUT/'Source_Generated/utahraptor_walk_E_W_sheet.png'"),
}
for name,(prefix,replacement) in source_changes.items():
    path=root/name;text=path.read_text(encoding='utf-8')
    text='\n'.join(replacement if line.startswith(prefix) else line for line in text.splitlines())+'\n'
    text=text.replace("shutil.copy2(SOURCE,source_dir/'utahraptor_walk_S_sheet.png')",'# Source sheet is already stored in this repository.')
    text=text.replace("shutil.copy2(SOURCE,sources/'utahraptor_walk_S_sheet.png')",'# Source sheet is already stored in this repository.')
    text=text.replace("shutil.copy2(SOURCE,OUT/'Source_Generated/utahraptor_walk_E_W_sheet.png')",'# Source sheet is already stored in this repository.')
    text=text.replace('.read_text()',".read_text(encoding='utf-8')")
    path.write_text(text,encoding='utf-8')
path=root/'build_prototype_kit.py';text=path.read_text(encoding='utf-8')
start=text.index('SOURCE_ROOT=');end=text.index('\ndef export(',start)
text=text[:start]+"# Reviewed generation sheets are versioned under OUT/Source_Generated.\n"+text[end:]
text=text.replace('.read_text()',".read_text(encoding='utf-8')");path.write_text(text,encoding='utf-8')
original=root/'Source_Original/concept.png'
if not original.exists():
    source=Path(r'C:\Users\Jonas\AppData\Local\Temp\codex-clipboard-9aea16bf-159b-4b31-87bc-ec517a95b046.png')
    if source.exists():original.parent.mkdir(exist_ok=True);shutil.copy2(source,original)
path=root/'export_sprites.py';text=path.read_text(encoding='utf-8')
text=re.sub(r"SOURCE = Path\(r'[^']+'\)","SOURCE = ROOT / 'Source_Original/concept.png'",text,count=1);path.write_text(text,encoding='utf-8')
print('Tests use installed Playwright; exporters use tracked source sheets.')
