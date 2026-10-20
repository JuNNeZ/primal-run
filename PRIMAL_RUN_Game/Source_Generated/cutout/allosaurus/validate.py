"""Technical cutout contract checks. This does not approve artwork or animation."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
EXPECTED = {'body', 'neck', 'head', 'jaw', 'tail1', 'tail2', 'tail3',
            'thigh_L', 'shin_L', 'foot_L', 'thigh_R', 'shin_R', 'foot_R', 'arm_L', 'arm_R'}
PARENTS = {'body': None, 'neck': 'body', 'head': 'neck', 'jaw': 'head',
           'tail1': 'body', 'tail2': 'tail1', 'tail3': 'tail2',
           'arm_L': 'body', 'arm_R': 'body'}
for side in 'LR':
    PARENTS.update({f'thigh_{side}': 'body', f'shin_{side}': f'thigh_{side}',
                    f'foot_{side}': f'shin_{side}'})


def main():
    metadata = json.loads((ROOT / 'allosaurus_parts.json').read_text())
    palette = {tuple(bytes.fromhex(c[1:])) for c in json.loads(
        (ROOT.parents[2] / 'palette.json').read_text())['colors']}
    assert metadata['species'] == 'allosaurus'
    assert set(metadata['directions']) == set('SNEW')
    report = {'status': 'PASS', 'scope': 'rest-pose cutout files only',
              'art_status': 'prototype_static', 'visual_approval': 'pending Jonas',
              'animation_frames_created': 0, 'runtime_tested': False,
              'checks': ['64 native RGBA PNGs, 144x144', 'Primal Earth 32 only',
                         'binary alpha and zero transparent RGB', '2px transparent margins',
                         'four 15-part hierarchies and orders', 'all body pivots at 72,72',
                         'all pivots and tips opaque in their own part',
                         'all child pivots opaque in parent, with overlapping joint surfaces',
                         'child chain pivots equal parent tips', 'exact ordered compositing',
                         'W differs from mirrored E', 'source SHA-256 provenance'],
              'directions': {}, 'source_sha256': {}}
    paths = []
    for direction, spec in metadata['directions'].items():
        assert set(spec['parts']) == EXPECTED
        assert len(spec['order']) == 15 and set(spec['order']) == EXPECTED
        assert spec['parts']['body']['pivot'] == [72, 72]
        images, pixels = {}, {}
        for name in EXPECTED | {'full'}:
            path = ROOT / f'allosaurus_{direction}_{name}.png'
            image = Image.open(path)
            assert image.mode == 'RGBA' and image.size == (144, 144), path.name
            rgba = np.array(image)
            assert set(np.unique(rgba[:, :, 3])) <= {0, 255}, path.name
            assert not np.any(rgba[rgba[:, :, 3] == 0, :3]), path.name
            used = {tuple(map(int, rgb)) for rgb in rgba[rgba[:, :, 3] == 255, :3]}
            assert used <= palette, (path.name, used - palette)
            x0, y0, x1, y1 = image.getbbox()
            assert min(x0, y0) >= 2 and max(x1, y1) <= 142, path.name
            images[name], pixels[name] = image, rgba
            paths.append(path)
        joints = {}
        for name, part in spec['parts'].items():
            assert part['parent'] == PARENTS[name], (direction, name)
            for point in ('pivot', 'tip'):
                x, y = part[point]
                assert type(x) is int and type(y) is int and 0 <= x < 144 and 0 <= y < 144
                assert pixels[name][y, x, 3] == 255, (direction, name, point)
            parent = part['parent']
            if parent is not None:
                x, y = part['pivot']
                assert pixels[parent][y, x, 3] == 255, (direction, name, 'parent surface')
                overlap = int(np.sum((pixels[name][:, :, 3] > 0) & (pixels[parent][:, :, 3] > 0)))
                assert overlap >= 5, (direction, name, 'joint overlap')
                joints[name] = {'overlapping_pixels': overlap}
                if name in {'head', 'neck', 'tail2', 'tail3', 'shin_L', 'shin_R', 'foot_L', 'foot_R'}:
                    assert part['pivot'] == spec['parts'][parent]['tip'], (direction, name)
        full = Image.new('RGBA', (144, 144))
        for name in spec['order']:
            full.alpha_composite(images[name])
        assert np.array_equal(np.array(full), pixels['full']), (direction, 'composite mismatch')
        report['directions'][direction] = {'parts': 15, 'full_sha256': hashlib.sha256(
            (ROOT / f'allosaurus_{direction}_full.png').read_bytes()).hexdigest(), 'joints': joints}
    assert len(paths) == 64
    assert set(ROOT.glob('allosaurus_*.png')) == set(paths)
    east = Image.open(ROOT / 'allosaurus_E_full.png')
    west = Image.open(ROOT / 'allosaurus_W_full.png')
    assert not np.array_equal(np.array(east.transpose(Image.Transpose.FLIP_LEFT_RIGHT)), np.array(west))
    sampling = json.loads((ROOT / 'source_sampling.json').read_text())
    for part in sampling.values():
        source = ROOT / part['source']
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        assert digest == part['source_sha256'], source.name
        report['source_sha256'][part['source']] = digest
    report['native_png_count'] = len(paths)
    (ROOT / 'validation_report.json').write_text(json.dumps(report, indent=2) + '\n')
    print('PASS: 60 parts + 4 composites; palette/alpha/anchors/hierarchy/joints/compositing/source hashes.')
    print('Visual approval remains with Jonas. No animation or runtime approval is asserted.')


if __name__ == '__main__':
    main()
