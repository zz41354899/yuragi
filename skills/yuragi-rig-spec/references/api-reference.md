# Yuragi v0.1 API and capability boundaries

This reference follows the actual exports, types, player and simulation in Yuragi. Read [custom-character.md](custom-character.md) for full model ranges and framework integration, [api-types.ts](api-types.ts) for the contract, and [character-preparation.md](character-preparation.md) for assisted conversion.

## Installation and entry points

The library has not been published to npm. Build a Yuragi checkout with `npm run build:lib`, then install it in the target project with `npm install /path/to/yuragi/packages/rig`. Installing this skill supplies instructions, Python preparation code and templates; it does not install the runtime or artwork.

- `@yuragi/rig`: createPlayer, createSimulation, createMomoModel, validateModel, CANVAS_PADDING, toCanvas and public types.
- `@yuragi/rig/vue`: YuragiCharacter; required model prop, optional autoplay/reducedMotion/alt; ready/error/frame events; exposed getPlayer().
- `@yuragi/rig/react`: separately imported YuragiCharacter, equivalent props plus onReady/onError/onFrame. The core does not import either framework.

## Player contract

`createPlayer(options: PlayerOptions & { signal?: AbortSignal }): Promise<RigPlayer>` requires canvas and model. autoplay defaults to true, reducedMotion to respect, pixelRatio is limited to 1–2. onFrame reports roughly every 100ms (manual actions can report immediately). Initialization errors reject the promise; playback errors call onError. Abort loading on unmount. Actual image dimensions must match the model. Relative texture URLs resolve against the document, not the JSON URL.

| Intent | Actual API | Constraints |
| --- | --- | --- |
| Start / pause | play() / pause() | play respects reduced motion; pause keeps pose |
| Idle and local strength | setMotion(Partial<MotionSettings>) | sway/hair/accessories/follow 0–2; speed 0.25–2 |
| Pointer following | setPointer(x,y) | centered (0,0), normally -0.5–0.5 |
| Pose | setParameter(name,value) | lookX/lookY -30–30; bodyX -10–10; wave 0–1 |
| Greeting | wave() | ~1.15s; resumes a paused player; requires suitable humanoid pins |
| Existing pin edits | setPin(name,patch) | position/radius/stiffness/damping/wind; cannot rename/reparent/change type |
| Model / diagnostics | getModel() / getSnapshot() | copied model; snapshot is not a validation result |
| Neutral pose | reset() | retains edited model and motion settings |
| Cleanup | destroy() | idempotent; stops frames, removes listeners, releases WebGL |

Native canvas needs the artwork aspect ratio and 12% overscan (124% canvas, left/top -12%); adapters handle this. Keep static artwork on loading/WebGL failures. Create players after mount, not during SSR module evaluation.

## Binding semantics

- waist drives body/breathing; head-root follows gaze; head-top rotates around head-root.
- shoulder-right, elbow-right and wrist-right drive the supported wave side. Check the actual artwork before assigning those names. wrist-left cooperates with shoulder-left; shoulders and hip-raised/hip-standing also receive breathing.
- fixed does not permanently lock pixels; joint is not inverse kinematics; spring parent adds displacement following. Put parent pins first.
- Hair chains have root/middle/tip. bang- IDs select fringe behavior; pony- selects ponytail behavior. Accessories have root/tip; sleeve-right/ribbon-right receive additional wave force.
- pose.headCenter is X; headHorizontal contains distances from that center, not left/right bounds. faceClearance attenuates local hair movement, not all face deformation.
- Optional pose.headWarpBounds is [topY,bottomY], increasing within 0–1. It adapts head warp to the actual layout. Absence preserves the original Momo formula. Use an updated local runtime before relying on this extension.

## Capability classification

| Classification | Meaning |
| --- | --- |
| Supported | Maps to real APIs; still needs artwork-specific measured binding and visual review |
| Missing material | Cropped pixels, merged limbs, occluded surfaces or opaque background; list needed assets |
| Engine extension | Blinking, mouth shapes, independent layers, occlusion switching, large turns or new limb semantics |
| Pending | Artwork not viewed, unknown dimensions, unmeasured coordinates or preview not run |

The runtime uses one continuous WebGL mesh. Python can extract annotated visible pixels for authoring; the AI agent supplies semantic judgment. Neither reconstructs hidden surfaces or creates a Live2D/VRM rig. There is no hosted animation API, remote AI endpoint, lip-sync API, MCP server or Plugin. If motionScale stays substantially below 1, lower motion or correct bindings rather than only raising mesh density.
