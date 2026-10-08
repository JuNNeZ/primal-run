"""Package the shared browser game as a self-contained GDevelop 5 project.

Only generated files under PRIMAL_RUN_Game are written. Original art is copied
byte-for-byte; no exporters, resizing, or asset approval changes are performed.
"""
from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'PRIMAL_RUN_Prototype_Kit'
GAME = ROOT / 'PRIMAL_RUN_Game'


def build():
    base_manifest = json.loads((KIT / 'manifest.json').read_text(encoding='utf-8'))
    manifest = list(base_manifest)
    overlay_file = GAME / 'player_combat_manifest.json'
    if overlay_file.exists():
        manifest += json.loads(overlay_file.read_text(encoding='utf-8'))
    if len({entry['file'] for entry in manifest}) != len(manifest):
        raise SystemExit('Duplicate resource paths in combined manifest')
    for folder in ('assets', 'sounds', 'Source_Generated'):
        shutil.copytree(KIT / folder, GAME / folder, dirs_exist_ok=True)
    for filename in ('manifest.json', 'palette.json', 'SPRITE_RULES.md',
                     'SPRITE_RULES_v1_reference.md', 'SPRITE_RULES_v2_reference.md',
                     'animation_manifest.json', 'validation_report.json'):
        if (KIT / filename).exists():
            shutil.copy2(KIT / filename, GAME / filename)
    (GAME / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    combat_animations = GAME / 'player_combat_animations.json'
    if combat_animations.exists():
        animations = json.loads((GAME / 'animation_manifest.json').read_text(encoding='utf-8'))
        combat = json.loads(combat_animations.read_text(encoding='utf-8'))
        animations['animations'] += combat['animations']
        animations['combat_frame_plan'] = combat['frame_plan_exception']
        animations['north_combat_caveat'] = combat['north_caveat']
        animations['GDevelop_runtime'] = 'Functional Bite_S/N/E/W tests PASS; see player_animation_runtime_report.json. Production art remains unapproved.'
        (GAME / 'animation_manifest.json').write_text(json.dumps(animations, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    assets = {entry['file']: {'origin': entry['origin'], 'size': entry['size']} for entry in manifest}
    asset_code = 'globalThis.PrimalAssets = ' + json.dumps(assets, ensure_ascii=False, separators=(',', ':')) + ';\n'
    (GAME / 'src/assets.js').write_text(asset_code, encoding='utf-8')
    sources = ['src/core.js', 'src/assets.js', 'src/audio.js', 'src/app.js']
    source = '\n'.join((GAME / filename).read_text(encoding='utf-8') for filename in sources)
    css = (GAME / 'style.css').read_text(encoding='utf-8')
    boot = '''// GENERATED from src/*.js and style.css by tools/build_game.py.
// Edit those source files, then rebuild. Mechanics use JavaScript events.
if (!runtimeScene.__primalRun) {
''' + source + '''
  const gameData = runtimeScene.getGame().getGameData();
  const resourceFiles = new Map(gameData.resources.resources.map(r => [r.name, r.file]));
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:0;overflow:auto;z-index:100;background:#101713';
  document.body.appendChild(host);
  const originalCanvas = runtimeScene.getGame().getRenderer().getCanvas();
  if (originalCanvas) originalCanvas.style.visibility = 'hidden';
  const app = globalThis.PrimalApp.mount({host, driven:true, stylesheet:''' + json.dumps(css) + ''', resolve: path => resourceFiles.get(path) || path});
  runtimeScene.__primalRun = app;
  gdjs.registerRuntimeSceneUnloadedCallback(scene => {
    if (scene !== runtimeScene) return;
    app.dispose(); host.remove();
    if (originalCanvas) originalCanvas.style.visibility = '';
  });
}
runtimeScene.__primalRun.update(performance.now());
'''
    resources = [dict(kind='image', name=e['file'], file=e['file'], smoothed=False, userAdded=True, metadata='') for e in manifest]
    resources += [dict(kind='audio', name=p.relative_to(GAME).as_posix(), file=p.relative_to(GAME).as_posix(), userAdded=True, metadata='', preloadAsSound=True, preloadAsMusic=False) for p in sorted((GAME / 'sounds').glob('*.wav'))]
    project = {
        'firstLayout': 'PrimalRun', 'gdVersion': {'major': 5, 'minor': 6, 'build': 283, 'revision': 0},
        'properties': {
            'name': 'PRIMAL RUN', 'description': 'Utahraptor roguelite · four biomes · meat, mutations, bosses and permanent DNA upgrades',
            'author': 'PRIMAL RUN', 'version': '0.2.0', 'packageName': 'com.primalrun.game',
            'projectUuid': '4202b52d-cf20-4b76-807b-a58f0d4bbbcd',
            'windowWidth': 960, 'windowHeight': 640, 'maxFPS': 60, 'minFPS': 20,
            'verticalSync': False, 'latestCompilationDirectory': '',
            'platformSpecificAssets': {}, 'authorIds': [], 'authorUsernames': [],
            'categories': ['action'], 'playableDevices': ['desktop'], 'extensionProperties': [],
            'orientation': 'landscape', 'scaleMode': 'nearest', 'pixelsRounding': True,
            'adaptGameResolutionAtRuntime': False, 'sizeOnStartupMode': '',
            'folderProject': False, 'useExternalSourceFiles': False,
            'platforms': [{'name': 'GDevelop JS platform'}], 'currentPlatform': 'GDevelop JS platform',
            'loadingScreen': {'showGDevelopSplash': True, 'showProgressBar': True, 'backgroundColor': 1054483, 'minDuration': 0},
            'watermark': {'showWatermark': True, 'placement': 'bottom-left'},
        },
        'resources': {'resources': resources, 'resourceFolders': []},
        'objects': [], 'objectsGroups': [], 'variables': [], 'previewLayout': 'PrimalRun',
        'layouts': [{
            'name': 'PrimalRun', 'mangledName': 'PrimalRun', 'title': 'PRIMAL RUN',
            'r': 16, 'v': 23, 'b': 19, 'standardSortMethod': True,
            'stopSoundsOnStartup': True, 'disableInputWhenNotFocused': False,
            'objects': [], 'objectsGroups': [], 'variables': [], 'instances': [],
            'behaviorsSharedData': [],
            'uiSettings': {'grid': False, 'gridType': 'rectangular', 'gridWidth': 32, 'gridHeight': 32, 'gridOffsetX': 0, 'gridOffsetY': 0, 'snap': False, 'zoomFactor': 1, 'windowMask': True},
            'layers': [{'name': '', 'visibility': True, 'isLightingLayer': False, 'followBaseLayerCamera': False,
                        'cameras': [{'defaultSize': True, 'defaultViewport': True, 'width': 0, 'height': 0, 'viewportLeft': 0, 'viewportTop': 0, 'viewportRight': 1, 'viewportBottom': 1}], 'effects': []}],
            'events': [
                {'type': 'BuiltinCommonInstructions::Comment', 'color': {'r': 55, 'g': 90, 'b': 60},
                 'comment': 'PRIMAL RUN — shared JavaScript simulation and canvas UI. Open Preview to play. Edit src/core.js for balance/AI, src/app.js for menus/rendering, src/audio.js for the original soundtrack; regenerate with python tools/build_game.py. No artwork is production-approved.'},
                {'type': 'BuiltinCommonInstructions::JsCode', 'inlineCode': boot.splitlines(), 'parameterObjects': '', 'useStrict': True, 'eventsSheetExpanded': False}
            ],
        }],
        'externalEvents': [], 'eventsFunctionsExtensions': [], 'externalLayouts': [], 'externalSourceFiles': [],
    }
    (GAME / 'project.json').write_text(json.dumps(project, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    mismatches = [e['file'] for e in base_manifest if (KIT / e['file']).read_bytes() != (GAME / e['file']).read_bytes()]
    report = {'result': 'PASS' if not mismatches else 'FAIL', 'copied_assets': len(base_manifest), 'new_combat_assets': len(manifest) - len(base_manifest), 'byte_identical_to_kit': not mismatches,
              'errors': mismatches, 'production_approved': False,
              'scope': 'Integration preserves source pixels, manifest origins and prototype status. Not a visual or animation approval.',
              'source_sha256': {f: hashlib.sha256((GAME / f).read_bytes()).hexdigest() for f in sources + ['style.css']}}
    (GAME / 'integration_report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Built GDevelop project with {len(resources)} resources; {len(base_manifest)} original PNGs preserved and {len(manifest)-len(base_manifest)} combat PNGs.')
    if mismatches:
        raise SystemExit(1)


if __name__ == '__main__':
    build()
