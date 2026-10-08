"""Export reviewed generated atlases; no art is drawn or frames interpolated.

Fixed 512px cells are sampled on a 4px grid, registered to manually reviewed
hip points, and mapped to the existing palette. Generated source PNGs remain
unchanged. First/last ready pose reuse is intentional for a stable recovery.
"""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'PRIMAL_RUN_Game'
SOURCE = GAME / 'Source_Generated/player_attacks_v1'
ORIGINS = {'S': (64, 72), 'N': (64, 56), 'E': (68, 64), 'W': (60, 64)}
# Native coordinates in the sampled cell, reviewed at the hips; never bbox-centred.
ANCHORS = {
    'S': [(70, 70), (64, 71), (61, 71), (70, 72), (64, 72), (70, 70)],
    'N': [(71, 56), (64, 56), (64, 56), (71, 56), (64, 56), (71, 56)],
    'E': [(70, 66), (70, 66), (70, 66), (72, 58), (66, 58), (70, 66)],
    'W': [(63, 68)] * 6,
}


def export():
    colors = json.loads((GAME / 'palette.json').read_text())['colors']
    palette = np.array([[int(c[i:i+2], 16) for i in (1, 3, 5)] for c in colors], dtype=np.int32)
    manifest, animations = [], []
    for direction, origin in ORIGINS.items():
        source = SOURCE / f'bite_{direction}_sheet.png'
        if not source.exists():
            raise SystemExit(f'Missing reviewed source: {source}')
        with Image.open(source) as sheet:
            if sheet.size != (1536, 1024):
                raise SystemExit(f'Unexpected atlas layout: {source} {sheet.size}')
            sheet = sheet.convert('RGBA')
            for frame in range(6):
                source_frame = 0 if frame == 5 else frame
                col, row = source_frame % 3, source_frame // 3
                crop = [col * 512, row * 512, (col + 1) * 512, (row + 1) * 512]
                # Reviewed E contact snout crosses the nominal cell boundary.
                # Extend its source crop; exclude that same snout from recoil.
                # Sampling remains exactly 4x, not a per-pose size adjustment.
                if direction == 'E' and source_frame == 3:
                    crop = [0, 512, 528, 1024]
                if direction == 'E' and source_frame == 4:
                    crop = [528, 512, 1024, 1024]
                # Pixel sampling only; no smoothing or pose interpolation.
                sampled_size = ((crop[2] - crop[0]) // 4, (crop[3] - crop[1]) // 4)
                sample = np.asarray(sheet.crop(crop).resize(sampled_size, Image.Resampling.NEAREST)).copy()
                visible = sample[:, :, 3] >= 192
                rgb = sample[:, :, :3].astype(np.int32)
                distances = np.sum((rgb[:, :, None, :] - palette[None, None, :, :]) ** 2, axis=3)
                sample[:, :, :3] = palette[np.argmin(distances, axis=2)]
                sample[:, :, 3] = np.where(visible, 255, 0)
                sample[~visible] = 0
                anchor = ANCHORS[direction][frame]
                offset = [origin[0] - anchor[0], origin[1] - anchor[1]]
                output = np.zeros((128, 128, 4), dtype=np.uint8)
                ys, xs = np.where(visible)
                tx, ty = xs + offset[0], ys + offset[1]
                if np.any(tx < 2) or np.any(tx >= 126) or np.any(ty < 2) or np.any(ty >= 126):
                    raise SystemExit(f'{direction}/{frame}: registered sprite violates 2px padding; review source anchor/crop')
                output[ty, tx] = sample[ys, xs]
                file = f'assets/player_combat/utahraptor_bite_{direction}_{frame:03}.png'
                path = GAME / file
                path.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(output).save(path)
                manifest.append({
                    'file': file, 'size': [128, 128], 'origin': list(origin), 'body_anchor': list(origin),
                    'direction': direction, 'state': 'bite', 'frame': frame,
                    'status': 'prototype_static', 'production_approved': False, 'animation_ready': False,
                    'source': source.relative_to(GAME).as_posix(), 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                    'source_crop': crop, 'source_cell_anchor': list(anchor), 'registration_offset': offset,
                    'sampled_source_size': list(sampled_size),
                    'source_frame': source_frame,
                    'export': '4x nearest-neighbor sampling; alpha>=192 becomes binary; nearest fixed 32-color palette; manually registered hip anchor; no silhouette auto-centering',
                    'note': 'Attack study integrated for gameplay review. Frame5 intentionally reuses ready frame0. No production animation approval.',
                })
        animations.append({
            'name': 'Bite_' + direction, 'frames': [f'assets/player_combat/utahraptor_bite_{direction}_{i:03}.png' for i in range(6)],
            'origin': list(origin), 'body_anchor': list(origin), 'fps': 14, 'loop': False,
            'duration_seconds': 6 / 14, 'contact_frame': 3, 'contact_seconds': 3 / 14,
            'quick_jaws': 'Scale duration and contact time together by (1 - 0.08 * rank).',
            'validated_animation': False, 'production_approved': False,
            'review': 'Generated poses manually checked for direction and mouth perspective; still require user art review and matching legacy walk refinement.',
        })
    (GAME / 'player_combat_manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    (GAME / 'player_combat_animations.json').write_text(json.dumps({'animations': animations, 'frame_plan_exception': 'Bite upgraded from 4 frames/10fps to 6 frames/14fps for anticipation, gape, contact, recoil and exact ready return.', 'north_caveat': 'New North attacks are separately generated; not a rotation of South. Legacy North walk still has its original rotated-light caveat.'}, indent=2, ensure_ascii=False) + '\n')
    print(f'Exported {len(manifest)} registered player attack PNGs.')


if __name__ == '__main__':
    export()
