#!/usr/bin/env python3
"""Checks tools/i18n/lang/<code>/*.json against the source keys (tools/i18n/source/chunk*.json):
every key present, no unknown keys, same count of # and @, same {n} set, ' · ' parts preserved.
Run: python tools/i18n/check_lang.py <code> [<code> ...]   (exit 1 on problems)"""
import json, pathlib, re, sys
here = pathlib.Path(__file__).resolve().parent
src = {}
for f in sorted((here / 'source').glob('chunk*.json')):
    for row in json.loads(f.read_text(encoding='utf-8')):
        src[row['da']] = row['en']
def load(code):
    out = {}
    for f in sorted((here / 'lang' / code).glob('*.json')):
        out.update(json.loads(f.read_text(encoding='utf-8')))
    return out
bad = 0
for code in sys.argv[1:]:
    d, problems = load(code), []
    for k in src:
        if k not in d: problems.append(f'missing: {k}'); continue
        v = d[k]
        if not isinstance(v, str) or not v.strip(): problems.append(f'empty: {k}'); continue
        if v.count('#') != k.count('#') or v.count('@') != k.count('@'): problems.append(f'placeholder #/@: {k!r} -> {v!r}')
        if sorted(re.findall(r'\{\d\}', v)) != sorted(re.findall(r'\{\d\}', k)): problems.append(f'placeholder {{n}}: {k!r} -> {v!r}')
        if k.count(' · ') != v.count(' · '): problems.append(f'separator " · ": {k!r} -> {v!r}')
    for k in d:
        if k not in src: problems.append(f'unknown key: {k}')
    print(f'{code}: {len(d)} entries, {len(problems)} problems')
    for p in problems[:40]: print('  ', p)
    bad += len(problems)
sys.exit(1 if bad else 0)
