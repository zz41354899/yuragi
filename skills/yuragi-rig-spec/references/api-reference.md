# Yuragi v0.2 API and capability boundaries

See [all public APIs](api/index.md) for an individual reference for every public function/method, plus types and constants. Signatures come from the real package. Read [Studio workflow](studio.md) to preview, compare and record issues for an agent-prepared character locally.

This reference follows the actual exports, types, player and simulation in Yuragi. Read [custom-character.md](custom-character.md) for full model ranges and framework integration, [api-types.ts](api-types.ts) for the contract, and [character-preparation.md](character-preparation.md) for assisted conversion.

## Installation and entry points

The library has not been published to npm. Build a Yuragi checkout with `npm run build:lib`, then install it in the target project with `npm install /path/to/yuragi/packages/rig`. Installing this skill supplies instructions, Python preparation code and templates; it does not install the runtime or artwork.

- `@yuragi/rig`: createPlayer, createSimulation, validateModel, validateAnimation, sampleCurve, sampleTrack, constrainSharedSurface, CANVAS_PADDING, toCanvas and public types.
- `@yuragi/rig/mirea`: createMireaModel(textureSrc?), separately imported reviewed Mirea data; defaults to /models/mirea/texture.png. Copy assets/mirea into public/models/mirea first.
- `@yuragi/rig/vue`: YuragiCharacter; required model prop, optional autoplay/reducedMotion/alt; ready/error/frame events; exposed getPlayer().
- `@yuragi/rig/react`: separately imported YuragiCharacter, equivalent props plus onReady/onError/onFrame. The core does not import either framework.

## Player contract

`createPlayer(options: PlayerOptions & { signal?: AbortSignal }): Promise<RigPlayer>` requires canvas and model. autoplay defaults to true, reducedMotion to respect, pixelRatio is limited to 1–2. onFrame reports roughly every 100ms (manual actions can report immediately). Initialization errors reject the promise; playback errors call onError. Abort loading on unmount. Actual image dimensions must match the model. Relative texture URLs resolve against the document, not the JSON URL.

| Intent | Actual API | Constraints |
| --- | --- | --- |
| Start / pause | play() / pause() | play respects reduced motion; pause keeps pose |
| Idle and local strength | setMotion(Partial<MotionSettings>) | sway/hair/accessories/follow/parts 0–2; speed 0.25–2; weight/layers 0–1 |
| Polygon-bound part strength | setMotion({ parts }) | optional 0–2, omitted means 1; shared-surface deformation only |
| Pointer following | setPointer(x,y) | centered (0,0), normally -0.5–0.5 |
| Eyes only | setGaze(x,y) | finite inputs clamp to −1…1; requires reviewed face; see [eye tracking](eye-tracking.md) |
| Eye intensity | setGazeStrength(value) | reviewed face; finite 0–1, default 1 |
| Tracking | setTracking(patch) | live bounded spring settings; creates default profile when absent |
| Part edits | setPart(id,patch) | existing parts only; geometry changes rebuild bindings |
| Timeline | playAnimation / pauseAnimation / seekAnimation / stopAnimation | milliseconds; one clip; stop keeps last values |
| Pose | setParameter(name,value) | lookX/lookY -30–30; bodyX -10–10; wave 0–1 |
| Greeting | wave() | ~1.15s; resumes a paused player; requires suitable humanoid pins |
| Existing pin edits | setPin(name,patch) | position/radius/stiffness/damping/wind; cannot rename/reparent/change type |
| Model / diagnostics | getModel() / getSnapshot() | copied model; snapshot is not a validation result |
| Actual rendered mesh | getMeshSnapshot() | on-demand copied rest/positions/indices and vertex-major base weights with pinNames; full-source normalized coordinates, not overscan coordinates |
| Neutral pose | reset() | retains edited model and motion settings |
| Cleanup | destroy() | idempotent; stops frames, removes listeners, releases WebGL |

Native canvas needs the artwork aspect ratio and 12% overscan (124% canvas, left/top -12%); adapters handle this. Keep static artwork on loading/WebGL failures. Create players after mount, not during SSR module evaluation.

## Binding semantics

- waist drives body/breathing; head-root follows gaze; head-top rotates around head-root.
- shoulder-right, elbow-right and wrist-right drive the supported wave side. Check the actual artwork before assigning those names. wrist-left cooperates with shoulder-left; shoulders and hip-raised/hip-standing also receive breathing.
- fixed does not permanently lock pixels; joint is not inverse kinematics; spring parent adds displacement following. Put parent pins first.
- Hair chains have root/middle/tip. bang- IDs select fringe behavior; pony- selects ponytail behavior. Accessories have root/tip; sleeve-right/ribbon-right receive additional wave force.
- pose.headCenter is X; headHorizontal contains distances from that center, not left/right bounds. faceClearance attenuates local hair movement, not all face deformation.
- Optional pose.headWarpBounds is [topY,bottomY], increasing within 0–1. It adapts head warp to the actual layout. Absence preserves the legacy formula. Use an updated local runtime before relying on this extension.
- Optional pose.headFollow replaces legacy head warping with aspect-correct rotation (0–0.3 radians) and X/Y translation amplitudes (0–0.08 each), using existing head bounds for feathering. Absence preserves legacy behavior.
- Optional parts holds 0–64 DeformationPart regions. Each has a unique ID, kind (hair/cloth/ribbon/accessory), simple polygon of 3–32 normalized original-image points, distinct root/tip, feather 0.002–0.2 (source-width units), maximum rotation 0–0.35 radians, stiffness/damping 0.001–1, phase -100–100, wind 0–2 and follow -2–2. Kind is a material label; numeric fields define the response. Local masks protect face clearance, normalize overlap and fade to zero at polygon edges/roots. These are not independent image layers. setPart(id, patch) validates existing-part edits and rebuilds bindings. Add/remove parts by recreating the player; no setLayer API exists. getSnapshot().parts reports per-part rotation, zero under reduced motion.

## Capability classification

| Classification | Meaning |
| --- | --- |
| Supported | Maps to real APIs; still needs artwork-specific measured binding and visual review |
| Missing material | Cropped pixels, merged limbs, occluded surfaces or opaque background; list needed assets |
| Engine extension | Artist-authored face attachment rendering, independent layers, occlusion switching, large turns or new limb semantics |
| Pending | Artwork not viewed, unknown dimensions, unmeasured coordinates or preview not run |

The runtime uses one continuous WebGL mesh. Python can extract annotated visible pixels for authoring; the AI agent supplies semantic judgment. Neither reconstructs hidden surfaces or creates a Live2D/VRM rig. There is no hosted animation API, remote AI endpoint, lip-sync API, MCP server or Plugin. If motionScale stays substantially below 1, lower motion or correct bindings rather than only raising mesh density.

## Region ownership

`createMireaModel(textureSrc?)` is available from `@yuragi/rig/mirea`. It returns independently cloned bindings for the bundled Mirea artwork, including flexible parts, rigid protection and reviewed eyes.

`surfaceRegions?: SurfaceRegion[]` accepts at most 64 simple polygons of 3–32 points. `feather` is 0.002–0.2 source-width units, aspect corrected, outside the polygon. `mode: weighted` requires unique known `pins`; `secondary: false` removes local hair/accessory/part displacement while retaining procedural poses and sway. `mode: rigid` uses an optional known `anchor` and `rotation: none/head/body`. Rigid regions have no weighted pin list. Fully owned interiors suppress neighboring feather influence; the last region wins an interior overlap, so overlapping conflicting rigid objects need revised masks. The whole-surface limiter still applies and can reduce rigidity at extreme settings.

`tracking?: { response, damping, maxVelocity }`: response 0.001–0.2, damping 0.1–0.98, maxVelocity 0.1–5 parameter units per reference tick. Tracking clamps look parameters to ±30. Omit to retain the original response. `DeformationPart.channel?: hair/accessories` adds the respective motion multiplier; `motion.parts` remains the shared gain.

Surface ownership geometry requires model validation and player recreation; use setTracking for live tracking edits. Existing DeformationPart geometry can instead be updated with setPart. No `setLayer`, automatic segmentation API, SDK, MCP service or independent texture-layer renderer exists. Use the Python authoring manifest for part PNGs and missing occlusion material; current playback still uses the full source texture.

`DeformationPart.exclusions?: Vec2[][]` protects up to 16 simple 3–32 point polygons from that part's flexible flow. Exclusion is fully active inside and feathers outside by the part's feather distance. This removes neighboring skin/props from local binding without altering source texture pixels.

Existing parts can be edited with `player.setPart(id, patch)`: root/tip, polygon/exclusions, material response and channel are validated before any state change. Binding rebuild uses existing GPU buffers; part spring state resets without duplicating the animation loop. Inputs are copied and getModel() includes edits. Recreate for adding/removing parts or changing surfaceRegions.

## Owned skull and neck tracking

An optional `pose.headFollow.region` (simple 3–32 point polygon) plus `feather` (0.002–0.2) changes head tracking to one aspect-correct rotation/translation about the measured `head-root`. Head-root/top Gaussian displacement and the older head warp are excluded from the body surface in this mode. Reviewed local hair flow is transformed with the head; face exclusions still protect facial pixels. Rigid held objects retain their own ownership at overlaps.

Optional `headFollow.neck` has a reviewed `polygon`, body-attached `base: Vec2`, and `feather` (0.002–0.2). The base must differ from head-root. The neck projects from body base to head-root and smoothly blends body pose into head pose. It uses no extra spring and does not become an independent texture layer. `tracking.bodyFollow` (0–1, omitted=1) controls pointer-driven body lean; 0 keeps pointer input on the head. Explicit bodyX parameters remain supported.

Head and neck binding is precomputed with the mesh. Large transforms or narrow gaps next to props can still trigger the shared-surface safety limiter; calibrate the profile so facial proportions remain rigid under the intended extremes. Existing models without a head region preserve their behavior. Changes to this pose require player recreation.


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

Independent attachments and independent bones require additional rendering support and completed artwork. Parameter/gaze.strength/motion clips and Bézier sampling already exist; setTracking and visible-pixel extraction do not author clips.

## Gaze and animation curves (0.2.0)

`model.face` contains only two unique left/right eyes: center, radius, iris, irisRadius, bounded travel, angle and sclera RGB. It requires owned `pose.headFollow.region`. Models without face annotations reject gaze setters. `setGaze(x,y)` clamps finite direction to −1…1; `setGazeStrength(value)` requires finite 0–1, default 1. These setters require reviewed eyes. Neutral and reduced motion preserve source pixels; eyelids and mouth remain untouched. Eye state smooths over approximately 55ms and is independent of geometry motion weight. Snapshot face is `{ gaze: Vec2, strength: number }`; reduced motion returns zero gaze/strength. Editing measured eye geometry requires validation and player recreation.

`playAnimation`, `pauseAnimation`, `seekAnimation(ms)` and `stopAnimation` manage one clip per player. Tracks target parameter lookX/lookY/bodyX/wave, gaze.strength or motion.weight. Keys use milliseconds and outgoing linear/step/[x1,y1,x2,y2] Bezier curves. Active parameter tracks drive spring targets. Pause freezes the player; pauseAnimation freezes only the clip; stop retains last values, reset restores gaze strength 1 and neutral direction.

0.2.0 removes blink/setExpression and expression types/tracks. Old face mode/blink/mouth and eye skinSample/ink are rejected with migration guidance. Run the Skill's `scripts/migrate_gaze.py old.json --out new.json`; it writes a removal/conversion report, never overwrites input, maps expression.gaze to gaze.strength and removes other expression tracks. Empty resulting clips require removal or reauthoring. Validate migrated data in the target runtime before playback. Models retain version:1.


## Numerical behavior and model updates

`setPointer(x,y)` computes look targets as `clamp(input * 60 * motion.follow, -30, 30)` and bodyX as `clamp(x * 20 * motion.follow * (tracking.bodyFollow ?? 1), -10, 10)`. It also sets eye direction to `(x*2,y*2)`. Call setGaze AFTER setPointer for independent eyes. setParameter on lookX/lookY releases independent gaze and follows the settled head parameters. Finite parameter values clamp to the channel range; model settings and gaze strength outside their ranges throw.

`setMotion({ layers })` scales pointer-group transforms, range 0–1; it does not create image layers. `setMotion({ weight })` scales geometry only, not face channels. setTracking creates defaults `{ response: .018, damping: .75, maxVelocity: 2.4 }` when no profile exists. Missing patch fields retain current values; patches validate before mutation. Pin/part/track inputs and getModel output are copied as implemented; do not mutate snapshots to drive the player.

`pointerGroups` supports at most 16 authored groups, each with pivot, 1–8 polygon regions, signed translation (each axis −.03… .03), rotation (−.08… .08 radians), response (16–1000ms) and region feather (.002–.2). Later interiors own overlaps. Groups share the original surface; getSnapshot().pointerGroups reports offset/rotation. Python exports reviewed pointerGroups; no live setPointerGroup API exists. Validate and recreate after changing groups.

| Update | Lifecycle |
| --- | --- |
| Existing pin values | setPin; rebinds mesh |
| Existing part geometry/response | setPart; geometry fields rebind mesh |
| Motion, tracking, gaze strength | setter; keeps player |
| Texture, mesh, pose/head/neck, face geometry, surfaceRegions, pointerGroups, add/remove pin/part | edit copied model, validateModel, destroy/recreate; adapters reload on new model identity |

## Animation validation and samplers

`validateAnimation(clip, face = false): void` throws on invalid clips. Pass true only for a reviewed face to allow gaze.strength tracks. At most 32 unique target/name tracks, each with 1–2048 keys. Duration is >0…600000ms; times are finite, strictly increasing, within 0…duration. loop defaults false. Values match parameter/strength/weight ranges. Curves belong to the outgoing key: linear, step, or four finite 0–1 Bézier coordinates.

`sampleCurve(progress, curve = 'linear')` returns interpolated progress; `sampleTrack(track, time)` returns the sampled value, holding the first/last key outside its key span. Validate the full clip first; samplers are not schema validators. A `gaze.strength` track changes eye strength (0–1), not a gaze X/Y vector. There are no gazeX/gazeY channels. playAnimation restarts at 0 and resumes playback; pauseAnimation freezes only the clip; seekAnimation requires an active clip and settles immediately; stopAnimation removes the clip and preserves values. pause() freezes the full player. Hidden/offscreen/reduced-motion states suspend time; dt catch-up is bounded to 50ms.

## Pure simulation and coordinates

`createSimulation(model)` validates/clones the model and returns engine state and helpers. It performs geometry simulation only: no texture loading, face shader compositing, timeline, DOM observers or reduced-motion preference detection. A custom renderer manages these responsibilities. Call updatePins(elapsedMs, deltaMs), then updateVertices(mesh, elapsedMs, neutral?) using buildContinuousMesh(). Rebuild bindings after geometry edits. constrainSharedSurface(surface, limit = .65) applies the shared-surface deformation guard and returns Diagnostics; use the actual exported signature/types for a custom renderer.

`CANVAS_PADDING = .12`; `toCanvas(n) = (n + .12) / 1.24` maps a full-source normalized coordinate into the overscanned canvas. Native code supplies the correct artwork aspect ratio and 124% canvas box. Pointer input is a centered stage fraction; model geometry uses the full source 0–1; radians describe angles; timeline/group response use milliseconds. Do not confuse these units.

## Snapshots, lifecycle and failure handling

RigSnapshot contains parameters, posed pins, diagnostics, sway, playing and optional motionWeight, trackingOffset, parts, pointerGroups, face and animation. `playing` is player-loop state; `animation.playing` is clip state. Optional fields depend on model/active clip. trackingOffset is normalized whole-artwork travel, not the full head transform. Diagnostics describe deformation safety, not rig approval.

createPlayer's signal cancels image loading and destroys an initialized player on abort. Imports are SSR-safe; player creation belongs after mount. Native integration must keep a fallback image and catch initialization rejection; onError handles runtime context loss (recreate/remount to recover). Loading timeout is 20s. Texture dimensions must match and cross-origin images need CORS. destroy is idempotent; treat destroyed players as finished. Low-frequency onFrame can report immediately on edits/resize, so do not treat it as a fixed-rate animation clock.

Read [eye tracking](eye-tracking.md) for pointer precedence and framework integration, and [Python workflow](character-preparation.md#cli-contract-and-current-exporter-gaps) for staged commands. Neither Skill installation nor the website starts Python automatically.

## Mesh inspection and structure guides

`getMeshSnapshot()` copies the most recently rendered continuous mesh. Call only while a debug overlay is enabled, at the UI snapshot frequency (about 10 Hz). Mutating returned arrays cannot change playback. `weights[vertex * pinNames.length + pinIndex]` is the normalized base pin weight, not the final influence: head ownership, surface protection, parts and pointer groups can override it. Positions include these transforms, shared-surface limiting, sway, translation and overall motion weight; face compositing changes pixels rather than vertices.

The website Mirea structure guide is source-measured authoring metadata, separate from its seven runtime pins. Its inferred hips are explicitly marked; it is not an IK skeleton. The same reviewed source and model now ship in assets/mirea; the read-only structure-guide nodes remain website metadata.

## Bundled Mirea example

Use `import { createMireaModel } from "@yuragi/rig/mirea"`. This optional entry is included in the same local package but is separate from the core export, avoiding model-data cost for users who only need the engine. Copy `node_modules/@yuragi/rig/assets/mirea` into your app’s `public/models/mirea`. Default texture is `/models/mirea/texture.png`; pass another URL for a different serving location. Model and artwork are paired; changing the image alone cannot produce another character’s binding. Mirea’s held pose uses eyes, head/neck, flexible parts and protected prop/leg groups; do not use the wave API on it. Starter assets remain available as an unbound template.


## Independent layered v2

Use `validateLayeredModel`, `createLayeredSimulation` or `createLayeredPlayer` with `LayeredModel` (version:2, renderer:layered). Vue and React expose a separate `YuragiLayeredCharacter`. See [the complete v2 contract](layered-engine.md) and [types](layered-api-types.ts). v1 extracts do not implicitly become v2 attachments.

## Optional v2 review and face controls

Read [layered authoring](layered-authoring.md) for hairGroups, refinement, eye clipping and supplied mouth sprites. setFace belongs to v2; the v1 gaze and animation contracts above remain unchanged. Both players support opt-in manual:true and advance(milliseconds) using shared fixed steps; manual callbacks remain low frequency.
