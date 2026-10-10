#!/usr/bin/env python3
"""Patch notes in every menu language.
PATCH_NOTES.html is written in Danish (source language). Each translatable element (h2, li, p, .date; not the
old English summaries in p.en) is keyed by its exact Danish inner HTML, like the game's i18n.

  python tools/i18n/patch_notes.py extract   -> tools/i18n/patch_notes/source.json (Danish keys, in page order)
  python tools/i18n/patch_notes.py build     -> PRIMAL_RUN_Game/patch_notes/<lang>.js (one small file per language)
  python tools/i18n/patch_notes.py check     -> missing keys / broken tags per language (exit 1 on errors)

Translations live in tools/i18n/patch_notes/<lang>.json as {"<Danish inner HTML>": "<translated inner HTML>"}.
The page loads only the chosen language's file (GitHub Pages request budget). 'dino' is generated from the
Danish text with tools/i18n/build_dino.py's word sounds; other fun languages fall back to English."""
import json, pathlib, re, sys, importlib.util
here = pathlib.Path(__file__).resolve().parent
repo = here.parent.parent
page = repo / 'PRIMAL_RUN_Game' / 'PATCH_NOTES.html'
store = here / 'patch_notes'
out_dir = repo / 'PRIMAL_RUN_Game' / 'patch_notes'
SEGMENT = re.compile(r'<(h2|li|p|div)((?:\s+[a-z-]+="[^"]*")*)\s*>(.*?)</\1>', re.S)
FALLBACK = {'tlh': 'en', 'sjn': 'en'}

def segments(html):
    body = html.split('<main>', 1)[1]
    keys = []
    for tag, attrs, inner in SEGMENT.findall(body):
        if 'class="en"' in attrs or (tag == 'div' and 'class="date"' not in attrs) or '<li>' in inner: continue
        key = inner.strip()
        if key and re.search(r'[A-Za-zÆØÅæøå]', re.sub(r'<[^>]+>', '', key)) and key not in keys: keys.append(key)
    return keys

def tags(s): return re.findall(r'</?[a-z]+[^>]*>', s)

def dino_text(html):
    src = (here / 'build_dino.py').read_text(encoding='utf-8').split('out = {}')[0]  # only the word functions
    ns = {'__file__': str(here / 'build_dino.py')}; exec(compile(src, 'build_dino.py', 'exec'), ns)
    return re.sub(r'(<[^>]+>|&[a-z]+;)|([^<&]+)', lambda m: m.group(1) or ns['dino'](m.group(2)), html)

def main(cmd):
    keys = segments(page.read_text(encoding='utf-8'))
    if cmd == 'extract':
        store.mkdir(exist_ok=True)
        (store / 'source.json').write_text(json.dumps(keys, ensure_ascii=False, indent=1), encoding='utf-8')
        print('source.json:', len(keys), 'segments'); return 0
    langs = sorted(p.stem for p in store.glob('*.json') if p.stem != 'source')
    errors = 0
    for lang in langs:
        d = json.loads((store / (lang + '.json')).read_text(encoding='utf-8'))
        miss = [k for k in keys if k not in d]
        bad = [k for k in keys if k in d and sorted(tags(k)) != sorted(tags(d[k]))]
        if miss or bad: print(f'{lang}: {len(miss)} missing, {len(bad)} with changed tags'); errors += len(bad) + len(miss)
        for k in bad[:3]: print('   tags:', tags(k), '->', tags(d[k]))
    if cmd == 'check': return 1 if errors else 0
    out_dir.mkdir(exist_ok=True)
    data = {lang: json.loads((store / (lang + '.json')).read_text(encoding='utf-8')) for lang in langs}
    data['dino'] = {k: dino_text(k) for k in keys}
    for lang, fb in FALLBACK.items(): data.setdefault(lang, data.get(fb, {}))
    for lang, d in data.items():
        d = {k: v for k, v in d.items() if k in keys}
        (out_dir / (lang + '.js')).write_text('window.PATCH_NOTES_I18N=' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print('built', len(data), 'languages into', out_dir.relative_to(repo)); return 1 if errors else 0

if __name__ == '__main__': sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else 'build'))
