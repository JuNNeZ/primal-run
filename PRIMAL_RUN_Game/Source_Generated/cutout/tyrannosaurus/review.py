"""Check source parts and inspect actual rig GIF frames; never grants art approval."""
import hashlib
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageSequence

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
sys.path.insert(0, str(REPO / 'tools'))
import cutout_rig as C


def main():
    spec = json.loads((ROOT / 'tyrannosaurus_parts.json').read_text())
    palette = {tuple(map(int, x)) for x in C.D.PALETTE}
    views = C.load_parts(ROOT, 'tyrannosaurus')
    report = {'species': 'tyrannosaurus', 'art_status': 'prototype_static',
              'visual_status': 'unapproved', 'runtime_integration': False,
              'technical_check': 'PASS', 'native_png_count': 0,
              'directions': {}, 'rig': {}, 'sources': {}}
    expected = set(C.skeleton('tyrannosaurus'))
    assert set(spec['directions']) == set('SNEW')
    for d, v in spec['directions'].items():
        assert set(v['parts']) == expected and len(v['order']) == len(expected)
        assert set(v['order']) == expected
        assert v['parts']['body']['pivot'] == [72, 72]
        masks, images, owner = {}, {}, np.full((144, 144), '', dtype='<U16')
        for name in list(v['parts']) + ['full']:
            path = ROOT / f'tyrannosaurus_{d}_{name}.png'
            im = Image.open(path)
            assert im.mode == 'RGBA' and im.size == (144, 144), path
            a = np.asarray(im)
            assert set(np.unique(a[:, :, 3])) <= {0, 255}, path
            assert not np.any(a[a[:, :, 3] == 0, :3]), path
            assert {tuple(map(int, x)) for x in a[a[:, :, 3] > 0, :3]} <= palette, path
            x0, y0, x1, y1 = im.getbbox()
            assert min(x0, y0) >= 2 and max(x1, y1) <= 142, path
            images[name] = im
            masks[name] = a[:, :, 3] > 0
            if name != 'full':
                padded = np.pad(masks[name], 1)
                inside = (padded[:-2, 1:-1] & padded[2:, 1:-1] & padded[1:-1, :-2] & padded[1:-1, 2:])
                ink = np.all(a[:, :, :3] == C.D.PALETTE[0], axis=2) | np.all(a[:, :, :3] == C.D.PALETTE[1], axis=2)
                assert not (masks[name] & ~inside & ink).any(), (d, name, 'exterior ink')
            report['native_png_count'] += 1
        full = Image.new('RGBA', (144, 144))
        joints = {}
        for name in v['order']:
            full.alpha_composite(images[name])
            owner[masks[name]] = name
        assert np.array_equal(np.array(full), np.array(images['full'])), (d, 'composite')
        for name, p in v['parts'].items():
            for point in ['pivot', 'tip']:
                x, y = p[point]
                assert type(x) is int and type(y) is int and masks[name][y, x], (d, name, point)
            parent = p['parent']
            if parent:
                x, y = p['pivot']
                assert masks[parent][y, x], (d, name, 'pivot outside parent')
                count = int((masks[name] & masks[parent]).sum())
                assert count > 0, (d, name, 'no joint overlap')
                joints[name] = count
        feet = {n: int((owner == n).sum()) for n in ['foot_L', 'foot_R']}
        if d in 'SN':
            assert min(feet.values()) >= 3, (d, 'feet not visible', feet)
        report['directions'][d] = {'parts': len(v['parts']), 'visible_foot_pixels': feet,
                                  'joint_overlap_pixels': joints,
                                  'full_sha256': hashlib.sha256((ROOT / f'tyrannosaurus_{d}_full.png').read_bytes()).hexdigest()}
    assert report['native_png_count'] == 64
    e = np.array(Image.open(ROOT / 'tyrannosaurus_E_full.png'))
    w = np.array(Image.open(ROOT / 'tyrannosaurus_W_full.png'))
    assert not np.array_equal(e[:, ::-1], w)
    for path in sorted((ROOT / 'sources').glob('*.png')):
        report['sources'][path.name] = hashlib.sha256(path.read_bytes()).hexdigest()
    frames = Path('/tmp/frames')
    gifs = Path('/tmp/gif')
    rig = json.loads((frames / 'tyrannosaurus_cutout.json').read_text())
    assert len(rig['frames']) == 120 and rig['motion'] == 'allosaurus'
    clipping = [n for n, f in rig['frames'].items()
                if min(f['bbox'][:2]) <= 0 or max(f['bbox'][2:]) >= 144]
    assert not clipping, ('clipped animation', clipping)
    report['rig'] = {'frames': len(rig['frames']), 'motion': rig['motion'],
                     'motion_gain': rig['motion_gain'], 'clipped_frames': clipping,
                     'command': 'python tools/cutout_rig.py --species tyrannosaurus --parts PRIMAL_RUN_Game/Source_Generated/cutout/tyrannosaurus --out /tmp/frames --gif /tmp/gif',
                     'gif_sequences': {}}
    previews = ROOT / 'previews'
    previews.mkdir(exist_ok=True)
    for state in rig['states']:
        files = [gifs / f'tyrannosaurus_{state}_{d}.gif' for d in 'SNEW']
        n = rig['states'][state]['frames']
        contact = Image.new('RGB', (n*288, 4*312), '#ddd7c6')
        draw = ImageDraw.Draw(contact)
        for row, (d, path) in enumerate(zip('SNEW', files)):
            with Image.open(path) as gif:
                assert gif.n_frames == n
                durations = []
                for f, im in enumerate(ImageSequence.Iterator(gif)):
                    durations.append(im.info.get('duration'))
                    native = np.array(im.convert('RGB'))[::3, ::3]
                    assert native.shape == (144, 144, 3)
                    z = Image.fromarray(native).resize((288, 288), Image.Resampling.NEAREST)
                    contact.paste(z, (f*288, row*312+22))
                    draw.text((f*288+5, row*312+5), f'{state} {d} {f}', fill='#151b19')
                report['rig']['gif_sequences'][f'{state}_{d}'] = {'frames': n, 'duration_ms': durations}
            if state in ['walk', 'run', 'attack']:
                dest = previews / 'gif'
                dest.mkdir(exist_ok=True)
                shutil.copyfile(path, dest / path.name)
        contact.save(previews / f'gif_{state}_contact.png')
    # Quantitative joint-surface evidence supplements visual GIF inspection.
    msid = 'allosaurus'
    info = C.R.RigInfo(msid)
    rest = C.rest_points(msid, info)
    k = C.D.SPECIES[msid].get('scale', 1.0)
    gain = C.motion_gain(views, rest, k)
    gaps = []
    for state in ['walk', 'run', 'attack']:
        n = C.R.STATES[state][0]
        for f in range(n):
            posed = C.posed_points(msid, info, rest, state, f, n)
            for d, view in views.items():
                tf = C.transforms(view, rest, posed, C.R.HEADING[d], k, gain=gain)
                masks = {name: C.warp(p['img'], *tf[name])[:, :, 3] > 0 for name, p in view['parts'].items()}
                for name, p in view['parts'].items():
                    parent = p['parent']
                    if parent and not (masks[name] & masks[parent]).any():
                        gaps.append({'state': state, 'frame': f, 'direction': d, 'part': name,
                                     'touching_1px': bool((C.grow1(masks[name]) & masks[parent]).any())})
    report['rig']['zero_area_joint_overlaps'] = gaps
    separated = [g for g in gaps if not g['touching_1px']]
    report['rig']['separated_joints'] = separated
    assert not separated, ('separated joint surfaces', separated)
    (ROOT / 'validation_report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Native and rig checks PASS: 64 PNGs, 120 frames, 24 GIFs; motion gain {gain:.3f}.')
    print('Joints with zero pixel-area intersection in walk/run/attack:', len(gaps))
    for gap in gaps:
        print(gap)
    print('Art remains unapproved. Review the actual GIF contacts; file checks are not visual approval.')


if __name__ == '__main__':
    main()
