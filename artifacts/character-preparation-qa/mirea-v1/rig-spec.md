# Rig specification: Mirea · assisted preparation

Status: reviewed local preview at conservative motion; partial acceptance recorded below.

## Artwork and evidence

- Image fingerprint: `6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05`; 1024 × 1536 pixels.
- Profile: humanoid; semantic confidence: 0.9.
- Evidence: Viewed full-resolution grid: upright humanoid, face centered near x=.56/y=.18, neck at y=.23, waist y=.355. Image-left hand grips the umbrella shaft; image-right arm hangs alongside the skirt. Both waving candidates are unsuitable: keep all arm/prop pixels together and disable wave. Outer hair strands are visible but densely overlap skirt and umbrella ribbons; begin without independent chains.
- Original pixel canvas and alpha preserved in `texture.png`.
- 2 visible-region extracts. These are optional authoring assets; the current player renders the single full texture.

## API mapping

| Intent | Runtime API | Enabled |
| --- | --- | --- |
| Gentle idle | setMotion / play / pause | true |
| Pointer following | setPointer | true |
| Humanoid greeting | wave | false |
| Head warping | pose.headWarpBounds | true |
| Local hair / accessories | hair / accessories chains | False / False |

## Normalized bindings

Full original image: left/top (0,0), right/bottom (1,1). No trimmed-image or display-size coordinates.

| Pin | x | y | radius |
| --- | --- | --- | --- |
| waist | 0.58000 | 0.35500 | 0.18000 |
| head-root | 0.55500 | 0.22300 | 0.18000 |
| head-top | 0.55200 | 0.10600 | 0.18000 |

Pose and chain details are in `model.json`; inspect `binding-overlay.png` before previewing.

## Unsupported or additional work

- Blink, lip-sync, independent layers and large turns require additional material and engine behavior.

## Preview and integration

Run a local HTTP server in this output folder, then open `preview.html`. Runtime included: True.
If missing, rebuild with `--rig-package /path/to/node_modules/@yuragi/rig` (or a built local library checkout).
The preview uses native createPlayer, AbortSignal, a static fallback, low-frequency UI diagnostics and idempotent destroy. Vue uses `@yuragi/rig/vue`; React uses `@yuragi/rig/react`.

## Acceptance

- Actual runtime validateModel: passed.
- 1200 simulation frames with pointer extremes: finite vertices, minimum motionScale 1; maximum displacement gradient 0.097339.
- Live WebGL preview inspected at 1280px and 390px: neutral/idle and pointer behavior preserve the face and artwork silhouette at conservative motion; no page overflow observed.
- Wave: disabled because the umbrella/arm pose is unsuitable.
- Play/pause verified; keyboard Enter verified in Mirea preview. Navigation away and reopen exercised; engine cleanup/cancellation tests passed.
- Reduced motion: QA-only simulated OS media preference in Mirea browser preview keeps playing=false after Play; original preview still uses respect.
- Missing runtime: fallback-check preview keeps original loaded artwork visible.
- Physical mobile touch, actual OS preference changes and exhaustive device coverage: not tested.
- Visible-part masks are authoring candidates. Hidden anatomy and layered animation are not supplied.

## Limitations

- Extracted parts contain visible source pixels only; hidden anatomy was not reconstructed.
- Conservative local preview reviewed; remaining acceptance scope is listed above.
