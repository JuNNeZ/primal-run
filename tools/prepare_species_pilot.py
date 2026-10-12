"""Build integer reference strips and precise motion briefs before generation."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'PRIMAL_RUN_Species_Pilot'
IDENTITIES = {
    'edmontosaurus': 'heavy ochre/chestnut hadrosaur, wide flat cream duckbill, '
        'dark dorsal bands, four hoofed limbs, one tapering tail, no crest or horns',
    'iguanodon': 'olive high-shouldered Iguanodon, pale shoulder chevron, narrow beaked '
        'muzzle, one ivory thumb spike on each hand, four limbs, no head horns',
    'archelon': 'slate/teal marine Archelon, one broad low leathery shell and pale '
        'dorsal streak, two long front flippers, two short rear paddles, tiny tail, hooked beak',
}
WALK = {
    'edmontosaurus': 'Heavy quadruped walk. Anatomical right is the lower/near-side. '
        '0 neutral; 1 right front and left rear lift while opposite pair supports; '
        '2 lifted pair reach forward four native pixels; 3 that pair plants while '
        'the opposite pair lifts; 4 left front and right rear reach forward; '
        '5 those feet lower, approaching the first pose. Four connected hoofed '
        'legs. Tail balances within two native pixels. Torso, bands and pelvis stay stable.',
    'iguanodon': 'Quadruped walk. Anatomical right is the lower/near-side. '
        '0 neutral; 1 right front and left rear lift; 2 that pair reaches forward '
        'four native pixels; 3 that pair plants while the opposite pair lifts; '
        '4 left front and right rear reach forward; 5 those feet lower toward '
        'the first pose. Thumb spikes stay attached to the hands throughout. '
        'Four connected limbs, stable torso and shoulder chevron, tail balance within two native pixels.',
    'archelon': 'Slow swimming cycle. 0 neutral front flippers spread; '
        '1 both front flippers lead forward; 2 both start a down/back powerstroke; '
        '3 both sweep back alongside shell; 4 both rotate through recovery; '
        '5 they open toward neutral. Rear paddles steer subtly. Shell, head and '
        'neck stay steady; no body roll, shell morph or extra flippers.',
}
ATTACK = {
    'edmontosaurus': 'Defensive duckbill head shove. 0 neutral; 1 lower broad '
        'head and brace four hooves; 2 neck draws back; 3 CONTACT head extends '
        'three native pixels with closed broad flat duckbill; 4 followthrough; '
        '5 head recovers toward neutral. Pelvis, torso, bands and complete tail '
        'stay stable. No forward body translation or new horn.',
    'iguanodon': 'Defensive RIGHT-HAND thumb-spike thrust; right forearm is '
        'the lower/near-side. 0 neutral; 1 right forehand lifts to chest; '
        '2 forearm retracts with the ivory thumb spike attached to the HAND; '
        '3 CONTACT that forehand thrusts forward toward head; 4 forehand '
        'recoils; 5 forefoot sets down toward neutral. Three other legs support '
        'the body. Never move spike onto the nose, invent an extra arm, or bite.',
    'archelon': 'Restrained hooked-beak bite. 0 neutral; 1 front flippers '
        'brace and neck retracts; 2 beak opens; 3 CONTACT neck extends three '
        'native pixels and beak snaps toward empty space; 4 beak closes; '
        '5 neck and flippers recover. Shell completely stable and four flippers '
        'stay connected. Beak never becomes a toothed dinosaur jaw.',
}

def main():
    sources = PACKAGE / 'Source_Generated'
    canonical = json.loads((PACKAGE / 'canonical_exports.json').read_text())
    prompts = {}
    for species in IDENTITIES:
        meta = next(e for e in canonical if e['species'] == species and e['direction'] == 'E')
        sprite = Image.open(PACKAGE / meta['file']).convert('RGBA')
        pose = sprite.resize((432, 432), Image.Resampling.NEAREST)
        strip = Image.new('RGBA', (1536, 1024))
        for frame in range(6):
            strip.alpha_composite(pose, (frame % 3 * 512 + 40, frame // 3 * 512 + 40))
        strip.save(sources / f'{species}_E_strip_reference_3x.png')
        root = [40 + value * 3 for value in meta['origin']]
        common = f'EDIT this actual native sprite strip of {IDENTITIES[species]}. '
        common += 'Transparent 1536x1024, exactly three columns by two rows of 512x512 cells. '
        common += 'Temporal order left-to-right, top-to-bottom. Six complete distinct '
        common += 'animation poses, ALL facing EAST, head right. Preserve the reference '
        common += 'high-overhead game camera, upper-left light, physical body volume, '
        common += 'palette, anatomy and exact marking geometry. This is three times native '
        common += 'pixel scale; retain crisp clusters without adding high-resolution detail. '
        common += f'Pelvic root stays at local {root} in every cell. Preserve pose 0 exactly. '
        common += 'The repeated neutral sprites are editable templates. Poses 1-5 must '
        common += 'be meaningful successive poses, not duplicates. Edit the necessary '
        common += 'limbs/head only, retain torso/shell and marks. Keep entire animals, '
        if species != 'archelon':
            common += 'UPRIGHT dinosaur posture: limbs beneath torso, clear humerus, '
            common += 'elbow, forearm and hand. Preserve forelimb bone lengths; no lizard '
            common += 'sprawl, sideways frog thighs, feet above dorsal outline or arm stumps. '
        common += 'all toes/flippers and tails inside their cells. No scene, aura, water, '
        common += 'ground shadow, text, borders, rotation, zoom, sideways body drift, '
        common += 'blood, afterimages, extra limbs or disconnected body pieces. '
        prompts[species + '_walk'] = common + WALK[species]
        prompts[species + '_attack'] = common + ATTACK[species]
    (sources / 'pilot_prompts.json').write_text(json.dumps(prompts, indent=2) + '\n')
    print('Prepared native3x references and six precise East pilot briefs.')

if __name__ == '__main__':
    main()
