# @z7589xxz758/yuragi

A TypeScript 2D illustration rig with Mirea as the built-in example, Vue and React adapters, and a local Studio preview.

## License

Yuragi-authored code, documentation and model-binding data are [MIT-licensed](LICENSE). Character artwork, textures, character identities and branding are excluded; third-party materials retain their own terms. See [license scope and AI output notice](LICENSE-SCOPE.md). The MIT license does not automatically license user inputs or newly generated outputs. Installing the runtime or Skills does not generate artwork; invoked Skills disclose actual AI assistance or image generation in their deliverables.

## Installation

```sh
npm install @z7589xxz758/yuragi
```

Vue and React adapters require their corresponding framework to be installed separately.

## Entry points

- `@z7589xxz758/yuragi`: WebGL player, pure simulation, model validation, TypeScript types.
- `@z7589xxz758/yuragi/vue`: `YuragiCharacter` Vue 3 component.
- `@z7589xxz758/yuragi/mirea`: `createMireaModel(textureSrc?)`, the reviewed Mirea character data. This opt-in entry keeps character data outside the core bundle.
- `@z7589xxz758/yuragi/react`: `YuragiCharacter` React 18/19 component.

Vue and React are optional peer dependencies. Importing the core does not import either framework.

```ts
import { createPlayer } from '@z7589xxz758/yuragi'
import { createMireaModel } from '@z7589xxz758/yuragi/mirea'
const player = await createPlayer({
  canvas: document.querySelector<HTMLCanvasElement>('canvas')!,
  model: createMireaModel('/models/mirea/texture.png'),
})
player.setGaze(.6, -.2)
player.setMotion({ hair: 1.2, sway: .8 })
player.destroy()
```

The primary sample is Mirea: `assets/mirea/model.json` and `assets/mirea/texture.png`. Copy `node_modules/@z7589xxz758/yuragi/assets/mirea` to your app's `public/models/mirea`; `createMireaModel()` defaults to `/models/mirea/texture.png`. Installation does not copy files into your app automatically. `assets/starter/model.json` is the template for your own measured rig.

Mirea uses the reviewed 1024×1536 source, measured eyes, owned head/neck, protected umbrella/holding hand, rigid crossed legs, 25 flexible parts and pointer groups. Its held pose does not support waving. Each factory call returns independent data. The website's additional anatomical structure guide is inspection metadata, not new runtime bones or IK.

The pure `createSimulation(model)` API allows a custom renderer to consume `mesh.positions`, `mesh.uvs`, and `mesh.indices`. Model data is serializable, validated, and cloned per simulation. The initial pose behaviors use semantic humanoid pin names; binding a new character requires configuring its own image, pins, pose regions, and local chains.

See the accompanying Vue documentation site for options, adapters, editable fields, and lifecycle behavior. The package is available on npm as `@z7589xxz758/yuragi`.

For a custom character, follow the complete guide at `/docs?section=custom-character` on the accompanying site: prepare artwork, create a model, bind pins and local chains, verify deformation, then load the validated JSON through the Vue or React adapter. The guide includes all model field ranges and error handling. The repository also provides `docs/custom-character.zh-TW.md`; the humanoid starter comes with the installed package at `assets/starter/model.json`. The website offers no standalone JSON downloads or model exports.

Extensibility does not mean automatic rigging. Humanoids with measured semantic pins are the easiest starting point; animals and other structures need new motion bindings. The website playground demonstrates Mirea; use Agent Skills and Python to author other models, then review them in Studio.

For an artwork-specific head position, set optional `pose.headWarpBounds` to the measured increasing `[topY, bottomY]` (0–1). When omitted, the original legacy head-warp behavior is retained. The repository provides English agent skills and a local Python preparation helper at `skills/yuragi-rig-spec`; AI supplies image interpretation, while the helper measures pixels and exports a candidate model and local preview. Visible-region extracts do not reconstruct hidden pixels or create independent runtime layers.

Optional `parts: DeformationPart[]` adds up to 64 polygon-bound spring regions on the shared surface. Each has its own root/tip, feather, rotation limit, stiffness, damping, phase, wind and follow response. `setMotion({ parts: 0 })` disables their displacement; omitted strength is 1. Overlapping regions blend, and face clearance suppresses their local deformation. setPart edits existing local parts; changing surfaceRegions requires player recreation. `getSnapshot().parts` reports per-region rotations; reduced motion reports zero. These regions do not introduce separate textures or draw order.

Optional `pose.headFollow: { rotation, translation: [x, y] }` replaces the legacy head warp with an aspect-correct head rotation and translation driven by lookX/lookY. The configured head bounds still feather its influence. Omitting both extensions preserves the numeric baseline. The repository's `docs/parts-and-layers.zh-TW.md` distinguishes this implemented region API from the separate implemented layered v2 model.

`surfaceRegions` assigns shared-texture ownership: weighted regions accept named pins and can disable secondary flow; rigid regions use a known anchor and none/head/body rotation. Feathering is outside the polygon. Interior overlap chooses the last region. Rigidity holds in an owned interior while the shared-surface safety limiter is inactive; extreme settings and adjacent transitions still require review. `tracking` configures the pointer spring response, damping and velocity limit, with bounded look parameters. `DeformationPart.channel` optionally connects parts to the hair/accessories gains. Changing region geometry requires model validation and player recreation; use setTracking for live tracking edits.

The separate Rig Spec Skill ships a local Python/Pillow preparation script. Its manifest indexes full-canvas/cropped PNGs, masks, hierarchy and authoring anchors. The library renders the full original texture; these extracts do not become independent layers just by installing the package. Complete hidden pixels before authoring large occlusion changes.

Existing parts can be edited with `player.setPart(id, patch)`: root/tip, polygon/exclusions, material response and channel are validated before any state change. Binding rebuild uses existing GPU buffers; part spring state resets without duplicating the animation loop. Inputs are copied and getModel() includes edits. Recreate for adding/removing parts or changing surfaceRegions.

Owned head tracking uses pose.headFollow.region/feather plus neck.polygon/base/feather and tracking.bodyFollow. It replaces head-pin warping with a single skull transform and a body-attached neck bridge. The Python headMotion annotation produces these fields from reviewed regions and landmarks; fine anatomy and bangs remain visible-only authoring assets. Calibrate against props and recreate the player after pose edits.


## Live floating tracking

`TrackingSettings` is exported by the TypeScript core. Use `player.setTracking(patch)` to validate and copy response, damping, maxVelocity, bodyFollow and translation live, without rebinding or allocating a new player. Omitted fields keep their values; invalid patches leave both model and state unchanged. No existing tracking profile means the call explicitly opts into bounded tracking defaults.

```ts
player.setTracking({
  response: .05425, damping: .757, maxVelocity: 2.72,
  bodyFollow: 0, translation: [.06, .04],
})
player.setPointer(.5, -.5)
player.setPart('hair-strand-left', { stiffness: .018, damping: .95, followY: .55 })
```

`tracking.translation` is an optional nonnegative X/Y pair, 0–.08 in full-source normalized units at look ±30. It moves every guarded vertex by the same offset AFTER local deformation safety checks; it adds no local stretching. `bodyFollow: 0` removes pointer-driven body lean, while whole-artwork travel still applies. A normalized stage pointer is a direction and travel fraction, not a request to teleport the character's center onto the cursor. Keep sufficient canvas overscan.

Opt-in tracking uses fixed half reference ticks from elapsed delta, with at most 50ms catch-up per update. This keeps its parameter response consistent at 30/60/120 Hz and avoids a jump after suspension. The original model without tracking preserves the legacy tick. Zero-delta manual preview edits retain settle behavior.

`DeformationPart.followY` is optional -2–2 vertical follow/inertia response; omitted preserves X-only behavior. Positive/negative signs should follow each reviewed strand's direction. Separate stiffness/damping per material supplies delayed flow without increasing the skull rotation. `getSnapshot().trackingOffset` reports whole-source travel (zero under reduced motion); snapshots remain low frequency. It is separate from local gradient diagnostics, which exclude uniform travel.

Independent attachments and independent bones require additional renderer support and completed artwork. Parameter/gaze.strength/motion clips with Bézier keys already exist; setTracking and extraction do not generate them.

## Gaze and animation curves (0.2.0)

`model.face` contains only two unique left/right eyes: center, radius, iris, irisRadius, bounded travel, angle and sclera RGB. It requires owned `pose.headFollow.region`. Models without face annotations reject gaze setters. `setGaze(x,y)` clamps finite direction to −1…1; `setGazeStrength(value)` requires finite 0–1, default 1. These setters require reviewed eyes. Neutral and reduced motion preserve source pixels; eyelids and mouth remain untouched. Eye state smooths over approximately 55ms and is independent of geometry motion weight. Snapshot face is `{ gaze: Vec2, strength: number }`; reduced motion returns zero gaze/strength. Editing measured eye geometry requires validation and player recreation.

`playAnimation`, `pauseAnimation`, `seekAnimation(ms)` and `stopAnimation` manage one clip per player. Tracks target parameter lookX/lookY/bodyX/wave, gaze.strength or motion.weight. Keys use milliseconds and outgoing linear/step/[x1,y1,x2,y2] Bezier curves. Active parameter tracks drive spring targets. Pause freezes the player; pauseAnimation freezes only the clip; stop retains last values, reset restores gaze strength 1 and neutral direction.

0.2.0 removes blink/setExpression and expression types/tracks. Old face mode/blink/mouth and eye skinSample/ink are rejected with migration guidance. Run the Skill's `scripts/migrate_gaze.py old.json --out new.json`; it writes a removal/conversion report, never overwrites input, maps expression.gaze to gaze.strength and removes other expression tracks. Empty resulting clips require removal or reauthoring. Validate migrated data in the target runtime before playback. Models retain version:1.


Read yuragi-rig-spec before Python. Use inspect → annotation → extract → build --prepared --rig-package; the actual local runtime validates the model before a playable preview is produced. Parts and artist supplements remain authoring assets. See the repository Skill preparation reference for the complete CLI.

### Inspect the rendered mesh

`player.getMeshSnapshot()` returns independent typed-array copies of `rest`, `positions`, `indices`, base pin `weights` and `pinNames`. Coordinates use the complete source image (0–1); request only while debugging at UI frequency. Base weights do not account for ownership overrides. Current positions reflect the actual rendered geometry, including those overrides. The installed package bundles Mirea/starter assets. Mirea data is separately imported from @z7589xxz758/yuragi/mirea. Installing the runtime does not install Agent Skills or Python/Pillow.

## Independent layers (local v2)

`createLayeredPlayer`, `createLayeredSimulation`, `validateLayeredModel`, and the `LayeredModel` / `LayeredPlayer` types are exported from the main entry. Import `YuragiLayeredCharacter` separately from `@z7589xxz758/yuragi/vue` or `@z7589xxz758/yuragi/react`. Existing `createPlayer` continues to require the v1 model.

v2 supports hierarchical rigid transforms, bounded secondary springs, sparse vertex weights, authoritative shared joints, ordered atlas batches and one static atlas alpha mask per attachment. Asset URLs must be resolved by the caller. Models require explicit coverage and provenance; visible extracts do not reconstruct occluded pixels. The offline `build_layers.py` compiler validates through the actual local runtime and refuses incomplete layers unless prototype mode is explicitly enabled. See the repository's `docs/layered-engine.zh-TW.md` and `src/layered-types.ts` for the contract. No IK, Spine import, layered gaze or animation mixer is provided.

## Local Yuragi Studio and API reference

Install `@z7589xxz758/yuragi` from npm in your project. Studio is prebuilt; no Vite installation is needed by consumers. It is not launched during npm installation.

```sh
npm install @z7589xxz758/yuragi
npx yuragi studio --project ./my-character --out ./yuragi-output
```

The folder contains model.json and local relative artwork paths. Studio is a preview-only viewer for v1/v2: playback, poses, source comparison, zoom/pan and available face controls. It automatically saves `OUT/missing-assets.json` with current model/material fingerprints. Ask the agent to read this file, diagnose/extract through the Skill's Python workflow, and compile into a fresh folder. Annotations, subdivision JSON, diagnosis, quality observations and delivery belong to the agent workflow; Studio has no issue form or acceptance checklist. Optional project.json catalogs retain valid versions and view state when switching. `--port` selects the local port and `--no-open` suppresses browser opening.

Rendered pose sheets use `npx yuragi review --project ./my-character --out ./my-character/review` (legacy folder), or the selected version folder’s review subdirectory. Install the optional Playwright peer and Chromium first. Output must be new; fixed-step full frames, detail crops and fingerprints do not establish visual acceptance.

The website API index is `/docs/api`, with an independent page for each public callable. Installable rig Skills include the same generated API index and per-callable references. The CLI ships with the npm package.
