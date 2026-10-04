# Rig specification: 海月みれあ · 水母公主

Status: generated single-texture candidate; basic browser acceptance passed on 2026-10-03. See build-report.json visualReview for scope and limitations.

## Artwork and evidence

- Image fingerprint: `6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05`; 1024 × 1536 pixels.
- Profile: humanoid; semantic confidence: 0.9.
- Evidence: Reviewed visible Mirea anatomy, umbrella canopy/shaft and holding hand. Masks contain visible pixels and may need edge refinement; occluded anatomy is not present.
- Original pixel canvas and alpha preserved in `texture.png`.
- 61 visible-region extracts. These are optional authoring assets; the current player renders the single full texture.

## API mapping

| Intent | Runtime API | Enabled |
| --- | --- | --- |
| Gentle idle | setMotion / play / pause | true |
| Pointer following | setPointer | true |
| Humanoid greeting | wave | false |
| Legacy head warping | pose.headWarpBounds | false |
| Whole head / neck bridge | pose.headFollow.region / neck | true |
| Pointer body movement | tracking.bodyFollow | 0.25 |
| Whole-artwork pointer travel | tracking.translation | true |
| Local hair / accessories | hair / accessories chains | False / False |
| Local polygon parts | parts / motion.parts / setPart | 25 parts |
| Surface ownership | surfaceRegions | 5 regions |
| Bounded pointer spring | tracking | true |

## Facial controls

Reviewed face features included: true. Use setGaze and setGazeStrength only with reviewed eyes. Pupils translate within eye bounds; source eyelids and mouth remain unchanged. Curves use playAnimation/pauseAnimation/seekAnimation/stopAnimation; milliseconds, linear/step/Bezier. No Spine file import, independent bones or IK.

## Normalized bindings

Full original image: left/top (0,0), right/bottom (1,1). No trimmed-image or display-size coordinates.

| Pin | x | y | radius |
| --- | --- | --- | --- |
| waist | 0.58000 | 0.35500 | 0.18000 |
| head-root | 0.57000 | 0.21300 | 0.18000 |
| head-top | 0.55200 | 0.10600 | 0.18000 |
| shoulder-left | 0.44900 | 0.27900 | 0.18000 |
| shoulder-right | 0.68700 | 0.32900 | 0.18000 |
| elbow-left | 0.41400 | 0.36000 | 0.18000 |
| elbow-right | 0.73500 | 0.44000 | 0.18000 |
| wrist-left | 0.44400 | 0.27500 | 0.14604 |
| wrist-right | 0.75000 | 0.52500 | 0.14604 |
| hip-left | 0.48000 | 0.50500 | 0.18000 |
| hip-right | 0.56800 | 0.52600 | 0.18000 |
| knee-left | 0.50400 | 0.65700 | 0.18000 |
| knee-right | 0.59200 | 0.65400 | 0.18000 |
| ankle-left | 0.48900 | 0.84000 | 0.18000 |
| ankle-right | 0.52900 | 0.87600 | 0.18000 |

Pose and chain details are in `model.json`; inspect `binding-overlay.png` before previewing.
`parts-manifest.json` records visible extracts, cropped source bounds, attachment metadata and completion needs.
Existing flexible parts can be updated with setPart(id, patch); surfaceRegions and added/removed parts require player recreation. Tracking can be edited live with setTracking(patch).

## Unsupported or additional work

- Hidden anatomy and overlapping cloth need completed assets for independent layer playback.
- Umbrella-holding pose does not support greeting wave.

## Preview and integration

Run a local HTTP server in this output folder, then open `preview.html`. Runtime included: True.
If missing, rebuild with `--rig-package /path/to/node_modules/@yuragi/rig` (or a built local library checkout).
The preview uses native createPlayer, AbortSignal, a static fallback, low-frequency UI diagnostics and idempotent destroy. Vue uses `@yuragi/rig/vue`; React uses `@yuragi/rig/react`.

## Acceptance

- Schema validation: passed using the target 0.2.0 runtime.
- Basic generated-preview review: neutral full artwork, gaze strength/extremes, posture +/-30, reversal and continuous idle passed. Wave is intentionally disabled for this holding pose.
- Detailed face/hair-root/held-prop close-ups were reviewed on the separate authored sandbox; do not treat that model as identical to this generated candidate.
- Desktop, 390px CSS viewport, simulated touch, keyboard, reduced motion, WebGL fallback and navigation cleanup checked. Physical phones and GPU cost not measured.
- Require finite diagnostics; sustained motionScale below 1 means reduce motion or repair binding.
- Reinspect after changing artwork; fingerprints must match the annotated image.

## Limitations

- Extracted parts contain visible source pixels only; hidden anatomy was not reconstructed.
- Basic browser acceptance is recorded; extracted boundaries still need artist review before independent layer playback.
