"""Blender-only anatomical proxy, explicitly NOT sprite artwork or a fossil scan.

Run: blender -b --python tools/iguanodon_reference_rig.py
Meshes and named joint endpoints use deterministic two-segment IK. The authored
four-beat walk is an animation hypothesis, not a gait measured from fossils.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'PRIMAL_RUN_Species_Pilot/Reference_Rig'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.render.resolution_x = scene.render.resolution_y = 432
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'MATERIAL'
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.display.shading.show_specular_highlight = False
scene.view_settings.view_transform = 'Standard'
scene.render.fps = 16
scene.frame_end = 12

def material(name, rgb):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    return m

clay = material('neutral clay reference', (.49, .54, .48))
near = material('anatomical right joints', (.78, .32, .20))
far = material('anatomical left joints', (.20, .42, .72))
ivory = material('horn and hoof reference', (.72, .68, .51))
eye = material('lateral orbital marker', (.06, .06, .06))
body_objects = []
bone_objects = []

def ellipsoid(name, pos, scale, mat, body=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    if body:
        body_objects.append(obj)
    return obj

def segment(name, a, b, radius, mat, skeletal=False):
    a, b = Vector(a), Vector(b)
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=radius, radius2=radius*.72, depth=(b-a).length, location=(a+b)/2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_quaternion = (b-a).to_track_quat('Z', 'Y')
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = (b-a).to_track_quat('Z', 'Y')
    obj.data.materials.append(mat)
    if skeletal:
        bone_objects.append(obj)
    return obj

ellipsoid('deep ornithopod torso', (.45, 0, 1.35), (1.25, .47, .59), clay, True)
ellipsoid('pelvic body mass', (-.35, 0, 1.43), (.62, .47, .56), clay, True)
segment('neck', (1.40, 0, 1.41), (2.10, 0, 1.48), .28, clay)
ellipsoid('elongate skull', (2.27, 0, 1.49), (.48, .22, .25), clay, True)
ellipsoid('narrow beak', (2.66, 0, 1.40), (.16, .18, .12), ivory, True)
for side in (-1, 1):
    # Lateral, slightly below the dorsal skull: occluded naturally by its mesh.
    ellipsoid('lateral orbit '+str(side), (2.15, side*.212, 1.46), (.052, .028, .052), eye, True)
tail = [(-.73, 0, 1.47), (-1.40, 0, 1.29), (-2.15, 0, 1.12), (-2.90, 0, .99), (-3.55, 0, .91)]
for i, (a, b) in enumerate(zip(tail, tail[1:])):
    segment('stiff tapering tail '+str(i), a, b, [.28, .20, .12, .065][i], clay)

bpy.ops.object.camera_add(location=(0, -8, 22))
camera = bpy.context.object
camera.name = 'fixed game camera 70deg elevation'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 7.8
root = Vector((0, 0, 1.38))
camera.rotation_euler = (root-camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
camera_game_position = camera.location.copy()
camera_game_rotation = camera.rotation_euler.copy()

def ik(a, b, l1, l2, bend):
    a, b = Vector(a), Vector(b)
    v = b-a
    d = v.length
    assert abs(l1-l2) < d < l1+l2, ('unreachable foot', d, l1, l2)
    u = v/d
    n = Vector((bend, 0, 0))
    n = (n-u*n.dot(u)).normalized()
    x = (l1*l1-l2*l2+d*d)/(2*d)
    return a+u*x+n*math.sqrt(max(0, l1*l1-x*x))

records = []
limb_objects = []
for frame in range(12):
    for obj in limb_objects:
        bpy.data.objects.remove(obj, do_unlink=True)
    limb_objects = []
    pose = {'frame': frame, 'phase': frame/12, 'root': list(root), 'limbs': {}}
    # Hind left, fore left, hind right, fore right: four beats; duty factor .75.
    phases = {'LH': 0, 'LF': .25, 'RH': .5, 'RF': .75}
    for name, phase in phases.items():
        fore = name.endswith('F')
        side = 1 if name.startswith('L') else -1
        p = (frame/12-phase) % 1
        stance = p < .75
        stride = .44
        if stance:
            dx, lift = stride*(.5-p/.75), 0
        else:
            t = (p-.75)/.25
            dx = stride*(-.5+.5-.5*math.cos(math.pi*t))
            lift = .18*math.sin(math.pi*t)
        a = Vector((1.20 if fore else -.38, side*(.29 if fore else .33), .81 if fore else 1.29))
        b = Vector((a.x+dx, side*(.29 if fore else .33), .10+lift))
        l1, l2 = (.43, .40) if fore else (.75, .65)
        joint = ik(a, b, l1, l2, -1 if fore else 1)
        color = far if side > 0 else near
        objects = [segment(name+' upper limb', a, joint, .095 if fore else .18, clay),
                   segment(name+' lower limb', joint, b, .070 if fore else .095, clay),
                   ellipsoid(name+' weight bearing digits', (b.x+.03, b.y, b.z-.035), (.11, .085, .065), ivory)]
        if fore:
            # Thumb is separate from the load-bearing middle digits.
            objects.append(segment(name+' separate thumb spike', (b.x-.04, b.y, b.z+.06), (b.x-.08, b.y+side*.16, b.z+.15), .045, ivory))
        for j, v in enumerate((a, joint, b)):
            objects.append(ellipsoid(name+' joint '+str(j), v, (.032,)*3, color))
        limb_objects += objects
        pose['limbs'][name] = {'upper': list(a), 'joint': list(joint), 'foot': list(b), 'stance': stance, 'lengths': [l1, l2]}
    records.append(pose)
    scene.render.filepath = str(OUT / f'guide_E_{frame:03}.png')
    bpy.ops.render.render(write_still=True)
    if frame == 0:
        # Save an inspectable reference scene; geometry is a proxy, not a scan.
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'iguanodon_reference.blend'))
        camera.location = (0, -18, 4.0)
        camera.rotation_euler = (root-camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(OUT/'anatomy_side_clay.png')
        bpy.ops.render.render(write_still=True)
        for o in body_objects:
            o.hide_render = True
        # Side-only schematic exposes the four separate joint chains.
        for name, limb in pose['limbs'].items():
            color = far if name.startswith('L') else near
            for label, a, b in [('upper', limb['upper'], limb['joint']), ('lower', limb['joint'], limb['foot'])]:
                segment('bone '+name+' '+label, a, b, .026, color, True)
        for a, b in zip([(-3.55,0,.91),(-.38,0,1.29),(1.2,0,.81),(2.15,0,1.46),(2.66,0,1.4)], [(-.38,0,1.29),(1.2,0,.81),(2.15,0,1.46),(2.66,0,1.4)]):
            segment('axial skeleton reference', a, b, .026, ivory, True)
        scene.render.filepath = str(OUT/'anatomy_side_joints.png')
        bpy.ops.render.render(write_still=True)
        for o in body_objects:
            o.hide_render = False
        for o in bone_objects:
            o.hide_render = True
        camera.location, camera.rotation_euler = camera_game_position, camera_game_rotation

manifest = {'species': 'Iguanodon bernissartensis', 'type': 'authored_3d_anatomical_proxy_not_fossil_scan',
    'production_approved': False, 'camera_elevation_degrees': math.degrees(math.atan2(22-root.z, 8)),
    'orthographic_scale': 7.8, 'render_size': [432,432], 'root': list(root),
    'fore_to_hind_chain_ratio': (.43+.40+.10)/(.75+.65+.15),
    'gait': 'authored four-beat quadrupedal walk, duty factor .75; precise fossil gait unknown',
    'stride': .44, 'frames': records,
    'literature': ['https://doi.org/10.3897/fr.29.173614', 'https://www.mnhn.fr/fr/actualites/quand-les-dinosaures-passent-a-4-pattes-comment-marchait-iguanodon', 'https://collections.naturalsciences.be/ssh-paleontology/masterpieces/bernissart']}
(OUT/'reference_manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
