#!/usr/bin/env python3
"""Joke language 'dino' (Dinosaurisk): every word becomes a dinosaur sound, deterministically per word.
Placeholders (#, @, {0}), separators ' · ', symbols, numbers and the case of the source are kept, so the
game stays playable. Writes tools/i18n/lang/dino/1.json from tools/i18n/source/chunk*.json.
Run: python tools/i18n/build_dino.py  (then python tools/i18n/build_lang.py)"""
import json, pathlib, re, zlib
here = pathlib.Path(__file__).resolve().parent
SHORT = ['rawr', 'grr', 'hrrk', 'krak', 'snap', 'chomp', 'hiss', 'gnar', 'raa', 'huf']
LONG = ['rooaar', 'skreee', 'grrraah', 'hrooomph', 'kraaak', 'rawrrr', 'snarrgh', 'graaawr', 'hnnnggh', 'roooh', 'skriiik', 'brrrooom']
def sound(word):
    h = zlib.crc32(word.lower().encode('utf-8'))
    s = (SHORT if len(word) <= 4 else LONG)[h % (len(SHORT) if len(word) <= 4 else len(LONG))]
    if word.isupper() and len(word) > 1: return s.upper()
    if word[0].isupper(): return s.capitalize()
    return s
def dino(text):
    # Words = runs of letters (any script); everything else (numbers, #, @, {0}, ·, symbols) stays.
    return re.sub(r'(?<![{@])[^\W\d_]+', lambda m: sound(m.group(0)), text)
out = {}
for f in sorted((here / 'source').glob('chunk*.json')):
    for row in json.loads(f.read_text(encoding='utf-8')):
        out[row['da']] = dino(row['da'])
target = here / 'lang' / 'dino'; target.mkdir(parents=True, exist_ok=True)
(target / '1.json').write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding='utf-8')
print('wrote', target / '1.json', len(out))
