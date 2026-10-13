"""Extract generated local head edits; preserve existing animated bodies exactly."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from export_iguanodon_rig_review import REVIEW, extract, sha, previews

# Declared native head/neck windows, chosen visually BEFORE validation.
# No masks, silhouette fitting, drawing, resizing, mirroring or phase reuse.
WINDOWS = {'S': [60, 94, 86, 123], 'N': [60, 9, 86, 45],
           'E': [98, 49, 136, 79], 'W': [8, 49, 45, 79]}


def main():
    entries = json.loads((REVIEW / 'export_provenance.json').read_text())
    archive = REVIEW / 'revisions/pre_head_patch'
    archive.mkdir(parents=True, exist_ok=True)
    records = {}
    override_file = REVIEW / 'head_source_overrides.json'
    overrides = json.loads(override_file.read_text()) if override_file.exists() else {}
    for d, window in WINDOWS.items():
        raw = REVIEW / 'raw' / f'walk_{d}_head_sheet.png'
        for i in range(6):
            name = f'iguanodon_walk_{d}_{i:03}'
            path = REVIEW / (name + '.png')
            saved = archive / path.name
            if not saved.exists():
                saved.write_bytes(path.read_bytes())
            original = Image.open(saved).convert('RGBA')
            x, y = i % 3 * 512 + 40, i // 3 * 512 + 40
            source = REVIEW / overrides[name] if name in overrides else raw
            edit, plan = extract(source, None if name in overrides else [x, y, x + 432, y + 432])
            out = original.copy()
            out.paste(edit.crop(window), window[:2])
            before, after = np.array(original), np.array(out)
            outside = np.ones((144, 144), bool)
            outside[window[1]:window[3], window[0]:window[2]] = False
            assert np.array_equal(before[outside], after[outside])
            out.save(path)
            records[name] = {'raw': str(source.relative_to(REVIEW)), 'raw_sha256': sha(source),
                             **plan, 'native_override': window,
                             'body_reused_from': str(saved.relative_to(REVIEW)),
                             'body_reused_sha256': sha(saved), 'export_sha256': sha(path),
                             'outside_override_identical': True, 'origin': [72, 72]}
            entries[name]['head_patch'] = records[name]
            entries[name]['export_sha256'] = sha(path)
    (REVIEW / 'head_patch_provenance.json').write_text(json.dumps(records, indent=2) + '\n')
    (REVIEW / 'export_provenance.json').write_text(json.dumps(entries, indent=2) + '\n')
    previews()
    print('24 head edits extracted; bodies/legs/tails outside declared windows remain byte-identical.')


if __name__ == '__main__':
    main()
