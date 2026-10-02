# Custom character workflow

Prepare artwork → inspect and annotate → build a model → verify in a local player → integrate with Vue or React.

Yuragi renders a single continuous WebGL mesh over the original illustration. It is suited to gentle idle, pose following and visible local hair/accessory motion. Different artwork needs different dimensions, pins and regions. Image replacement alone is not rigging. Eyes, mouth shapes, large turns, independently composited layers and occlusion changes require additional work.

## Artwork and automated preparation

Use one complete frontal or mildly angled image, preferably transparent PNG/WebP, with visible head/arm/hair separation and room around extremities. JPEG can load, but its background moves too. Overscan cannot restore pixels cropped from the source. Use actual pixel dimensions (each 1–8192); practical limits also depend on device WebGL memory/texture size. Around 1024 × 1536 is a useful initial asset size, not a required ratio.

The `yuragi-rig-spec` skill includes a local Python/Pillow helper. It measures dimensions/alpha/silhouette and exports files from AI/user-supplied semantic annotations. The AI inspects the actual artwork, selects a supported motion profile and supplies normalized landmarks/polygons. The helper does not independently identify anatomy or reconstruct hidden material. See the installed skill's `references/character-preparation.md` for commands and the input contract.

Uncertain or nonhuman anatomy starts with silhouette idle. Reviewed humanoids can use measured head/waist landmarks and optional suitable arm/hair/accessory bindings. A prop-holding arm should not be enabled for wave just because an elbow and wrist are visible.

## Local library installation

This library has not been published to npm. In a Yuragi checkout run `npm run build:lib`, then in the target project:

```sh
npm install /path/to/yuragi/packages/rig
```

The installed package includes `assets/momo`, `assets/starter/model.json`, TypeScript declarations and ESM code. Skill installation is separate and does not install the runtime. Do not call `createMomoModel()` for a different illustration: it retains Momo's dimensions and binding.

Copy the humanoid starter into your own public model directory, add the actual artwork, and replace all coordinates and pose/chain settings. Empty hair/accessory/face-clearance arrays are valid. Alternatively, use the installed skill helper to generate a candidate from measured annotations. Its output is still a candidate until inspected in motion. The website's playground edits Momo only and cannot validate arbitrary artwork imports.

## Coordinate and binding semantics

All model positions refer to the complete original image, including transparent margins. Top-left is (0,0), bottom-right is (1,1), X increases rightward and Y downward. A pixel position `(px,py)` becomes `(px/width,py/height)`. Canvas resizing and 12% overscan do not alter those coordinates.

Place parents before children in the pin array. The engine recognizes humanoid names:

- `waist`: body movement/breathing.
- `head-root`: gaze/body-follow offset.
- `head-top`: small rotation around head-root.
- `shoulder-right`, `elbow-right`, `wrist-right`: wave side.
- `wrist-left` with `shoulder-left`: small complementary motion.
- Shoulders and `hip-raised`/`hip-standing` also receive breathing/body movement.

Confirm the visible wave side in the source image. Arbitrarily named joints do not gain those behaviors. `fixed` can still be driven by semantic motion; `joint` is not inverse kinematics. Spring parents supply following offsets. Influence radius is normalized and smoothly weighted, not a hard boundary; begin with small local influence and inspect face/body drift.

Hair chains require separate root/middle/tip points; accessories have root/tip, not inferred from pins. `bang-` IDs use restrained bangs/face protection; `pony-` uses a wider ponytail influence. `sleeve-right`/`ribbon-right` receive additional wave behavior. Avoid those names for unrelated structures. Start with empty local chains, then add observed parts.

## Model contract

| Field | Type / limits / semantics |
| --- | --- |
| version / id / name | version exactly 1; nonempty id; string name (use a readable nonempty name) |
| texture.src | Nonempty URL/path. HTTP(S), blob, image PNG/WebP/JPEG data URL or ordinary path; javascript: rejected. Cross-origin needs CORS; blob is not a permanent asset location. |
| texture.width / height | Actual natural pixel dimensions, each 1–8192; must match the loaded image |
| mesh.columns / rows | Integers 2–200; (columns+1)×(rows+1) ≤ 65535. Density does not fix poor bindings. |
| pins | Required array, 1–256 entries, unique nonempty names; type fixed/joint/spring |
| pins[].parent | Optional existing name, no cycles; parent-before-child order |
| pins[].x / y / radius | x,y 0–1; radius .005–.5 |
| pins[].stiffness / damping / wind | Optional, each 0–1; damping near 1 retains momentum; wind is a displacement coefficient |
| hair | Required array, 0–128 chains with unique IDs |
| hair[].points | Exactly three normalized [x,y] points; adjacent points distinct |
| hair[].phase / radius / gain | phase -100–100 radians; radius .005–.5; gain 0–3. Use motion.hair=0 to disable hair. Helper emits positive gain. |
| accessories | Required array, 0–128 chains; use unique IDs |
| accessories[].root / tip | Normalized [x,y], distinct points |
| accessories[].radius / angle | radius .005–.5; angle 0–1 radians (motion amplitude, not initial orientation) |
| accessories[].stiffness / damping / phase | Required; stiffness/damping 0–1; phase -100–100 radians |
| faceClearance | Required array of ellipses [cx,cy,rx,ry]; center 0–1, radii .001–1; only weakens local hair displacement |
| motion.sway / hair / accessories / follow | Required multipliers 0–2; zero does not suppress every semantic breathing/pin behavior |
| motion.speed | Required multiplier .25–2 |
| pose.headCenter | Normalized head center X, not Y |
| pose.headBounds | [startY,endY], increasing 0–1; head influence fades downward |
| pose.headHorizontal | [innerDistance,outerDistance], increasing 0–1; distances from headCenter, not left/right X bounds |
| pose.headWarpBounds | Optional increasing [topY,bottomY] in 0–1; adapts internal head warping to measured head position. Omission preserves the original Momo behavior. Older runtimes may ignore this extension; rebuild/update before using it. |
| pose.bodyBounds | Increasing [startY,endY], 0–1; body lean fade |
| pose.bodyPivot / swayPivot | Normalized [x,y] rotation pivots |

## Native preview and validation

Always parse external JSON as unknown and call `validateModel`. The player separately checks image dimensions/load results and WebGL availability. `texture.src` resolves against the page URL, not the model.json path; use a root URL in a web app, or resolve it explicitly in a standalone preview.

```ts
import { createPlayer, validateModel } from '@yuragi/rig'
const controller = new AbortController()
const fallback = document.querySelector<HTMLImageElement>('#fallback')!
window.addEventListener('pagehide', () => controller.abort(), { once: true })
try {
  const response = await fetch('/models/my-character/model.json', { signal: controller.signal })
  if (!response.ok) throw new Error('Model HTTP ' + response.status)
  const model: unknown = await response.json()
  validateModel(model)
  const player = await createPlayer({
    canvas: document.querySelector<HTMLCanvasElement>('#character')!,
    model, signal: controller.signal, reducedMotion: 'respect',
    onError: error => { fallback.hidden = false; console.error(error) },
  })
  fallback.hidden = true
  // Keep player state in the engine; report only low-frequency UI snapshots.
} catch (error) {
  fallback.hidden = false
  if (!controller.signal.aborted) console.error(error)
}
```

Maintain an image-aspect-ratio wrapper and an absolutely positioned canvas at left/top -12%, width/height 124%. Include the static image above the canvas until ready; restore it on error. The Vue/React adapters already handle overscan, fallback and cleanup.

Validate neutral, pointer extremes, enabled wave and extended idle. Inspect face, seams, roots and clipping. Diagnostics must stay finite; sustained `motionScale` significantly below 1 calls for reduced intensity or repaired bindings. Test desktop/mobile input, keyboard, reduced motion, failed load, rapid model switching and leaving the page. Use local HTTP rather than file://. Structural validation and visual acceptance are separate results.

## Vue (primary adapter)

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, shallowRef, ref } from 'vue'
import { YuragiCharacter } from '@yuragi/rig/vue'
import { validateModel, type RigModel } from '@yuragi/rig'
const model = shallowRef<RigModel>()
const error = ref('')
const controller = new AbortController()
onMounted(async () => {
  try {
    const response = await fetch('/models/my-character/model.json', { signal: controller.signal })
    if (!response.ok) throw new Error('Model HTTP ' + response.status)
    const value: unknown = await response.json()
    validateModel(value)
    if (!controller.signal.aborted) model.value = value
  } catch (cause) { if (!controller.signal.aborted) error.value = String(cause) }
})
onBeforeUnmount(() => controller.abort())
</script>
<template>
  <div style="width: 320px">
    <YuragiCharacter v-if="model" :model="model" :alt="model.name" @error="cause => error = cause.message" />
    <img v-else src="/models/my-character/texture.png" alt="My character" style="width: 100%" />
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
```

React uses the separately imported `@yuragi/rig/react` component. Load after mount in an effect with an AbortController, validate unknown JSON, avoid state updates after abort and return cleanup. onReady/onError/onFrame correspond to Vue ready/error/frame events. Stable model identity avoids unnecessary remounts. Pure core imports do not import either framework; never instantiate DOM/player at module load during SSR.

## Errors

- Invalid rig model / JSON syntax: inspect required fields, ranges, unique IDs, parents/cycles and zero-length chains.
- Texture load failure / timeout: check URL, HTTP/CORS and image decoding. Timeout is 20 seconds.
- AbortError: expected cancellation during navigation/unmount.
- Dimension mismatch: use natural pixel dimensions, not CSS size.
- WebGL unavailable: retain the original artwork fallback.
- Unknown pin / invalid parameter: use existing pin names and lookX/lookY/bodyX/wave with finite values.
- Valid JSON but wrong motion: repair full-image coordinates, semantic layout, pose distances and observed chains; unsupported anatomy needs a conservative mode or explicit engine extension.
