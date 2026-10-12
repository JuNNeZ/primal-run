"""Apply explicit reviewed integer landmarks after source sampling.

This is whole-pose registration, never silhouette centering or pose drawing.
The input pixel digest binds each landmark to the sampled source revision.
"""
import hashlib
import json
from pathlib import Path
import numpy as np

PLAN = Path(__file__).resolve().parents[1] / 'PRIMAL_RUN_Game/Source_Generated/animation_polish/hip_registration.json'

def load_registration():
    return {e['file']: e for e in json.loads(PLAN.read_text())['frames']} if PLAN.exists() else {}

def register_pose(rgba, file, origin, plan):
    entry = plan.get(file)
    if entry is None:
        return rgba, {}
    digest = hashlib.sha256(rgba.tobytes()).hexdigest()
    if digest != entry['sampled_rgba_sha256']:
        raise ValueError(f'Reviewed landmark belongs to a different source export: {file}')
    landmark = entry['sampled_landmark']
    # Keep the canonical idle placement and the legacy logical draw/collision
    # origin. The reviewed anatomical landmark may have a constant offset from
    # that logical origin; moving it to the canvas centre can clip long tails.
    target = entry['target_landmark']
    delta = [target[i] - landmark[i] for i in range(2)]
    if entry['delta'] != delta or entry['review'] != 'landmark_checked':
        raise ValueError(f'Invalid or unchecked landmark: {file}')
    ys, xs = np.where(rgba[:, :, 3] != 0)
    tx, ty = xs + delta[0], ys + delta[1]
    if min(tx) < 2 or min(ty) < 2 or max(tx) > 141 or max(ty) > 141:
        raise ValueError(f'Registration would clip source pixels: {file}')
    result = np.zeros_like(rgba)
    result[ty, tx] = rgba[ys, xs]
    return result, dict(native_registration_delta=delta,
        sampled_native_landmark=landmark, sampled_rgba_sha256=digest,
        registered_native_landmark=target,
        anatomical_landmark_offset=[target[i]-origin[i] for i in range(2)],
        landmark_review=entry['review'], landmark_method=entry['method'])
