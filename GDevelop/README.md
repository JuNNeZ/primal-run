# PRIMAL RUN — GDevelop

Start med [START_HER.md](START_HER.md). Åbn **project.json** direkte i GDevelop
5.6.283. Dette er et reelt native projekt, med Game-scene og relative ressourcer.
Alle filer i mappen skal følge projektet. [STATUS.md](STATUS.md) adskiller kernel,
browserdemo, serializer, faktisk export/runtime og ikke-kørt editor-UI.

## Reproducerbar cloud-udvikling

Fra repository-roden:

```sh
npm ci
python GDevelop/tools/build_project.py
python GDevelop/tools/validate_project.py
node GDevelop/tools/test_core.cjs
python GDevelop/tools/prepare_engine.py
node GDevelop/tools/export_gdevelop.cjs .cache/gdevelop-5.6.283
npx playwright install --with-deps chromium
node GDevelop/tools/test_runtime.cjs
python GDevelop/tools/package_project.py
```

Engine-download er den officielle Linux-release **5.6.283**, kontrolleret med
release-SHA256. Ingen konto eller lokal Windows-computer kræves til build/test.
På socket-begrænsede cloud-systemer kan `PRIMAL_CHROME_PATH` pege på Chromium
Headless Shell og `PRIMAL_CHROME_ARGS` sættes til en JSON-liste med
`--single-process`, `--no-zygote`, `--use-gl=angle`, `--use-angle=swiftshader` og
`--enable-unsafe-swiftshader`. CI på almindelig Ubuntu bruger standard Chromium.

`build_project.py` skaber projektet fra en tom projekt/scene/object-skabelon,
som GDevelop 5.6.283's egen serializer har skrevet. Den indlejrer src/core.js,
src/scene-event.js og balance.json. Scriptet overskriver project.json og er til
kildebaseret udvikling; brugerens redigerede GDevelop-projekt må gemmes separat.

`export_gdevelop.cjs` bruger den reelle C++/WASM-deserializer og exporter.
Runtime-testen loader den faktiske genererede HTML5-export i Chromium/Pixi.
Playwright leverer filerne direkte til browseren; ingen TCP-server eller fake
gdjs-runtime. Kun test-bootstrap eksponerer RuntimeGame til testinspektion.

## Officielle format-/API-kilder

Kontrolleret mod tag v5.6.283, commit 00b0041478eb4a69473ae9a4875400a2aa97de42:

- [Officiel release](https://github.com/4ian/GDevelop/releases/tag/v5.6.283)
- [JsCodeEvent serializer](https://github.com/4ian/GDevelop/blob/v5.6.283/GDJS/GDJS/Events/Builtin/JsCodeEvent.cpp)
- [Native project serializer-tests](https://github.com/4ian/GDevelop/blob/v5.6.283/GDevelop.js/__tests__/GDJSProjectSerialization.js)
- [LocalHTML5Export og ExportOptions](https://github.com/4ian/GDevelop/blob/v5.6.283/newIDE/app/src/ExportAndShare/LocalExporters/LocalHTML5Export.js)
- [SpriteRuntimeObject: origins, hitboxes, animation](https://github.com/4ian/GDevelop/blob/v5.6.283/GDJS/Runtime/spriteruntimeobject.ts)
- [RuntimeScene](https://github.com/4ian/GDevelop/blob/v5.6.283/GDJS/Runtime/runtimescene.ts)
- [Officielt eksempel med JavaScript-events](https://github.com/GDevelopApp/GDevelop-examples/tree/main/examples/javascript-blocks-in-platformer)

Skabelonens defaults er produceret af engineen; der er ikke kopieret spilkunst
fra eksemplet. Exporten indeholder GDevelops MIT-licenstekst. Projektkunst og
balance kommer uændret fra Jonas' Prototype Kit og har fortsat prototype-status.
