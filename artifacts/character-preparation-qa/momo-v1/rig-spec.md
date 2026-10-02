# Rig specification: Momo · assisted preparation

Status: reviewed local preview at conservative motion; partial acceptance recorded below.

## Artwork and evidence

- Image fingerprint: `5b84b60034748a50efa3ba8103e6ce267de38f180e1cfdf43c45a40f7eca4475`; 1024 × 1536 pixels.
- Profile: humanoid; semantic confidence: 0.9.
- Evidence: Viewed full-resolution grid: foreshortened humanoid with head at x=.51/y=.155 and neck near y=.246, waist near y=.406. Forward image-left palm overlaps the sleeve and torso; it is not selected. The image-right shoulder, elbow and open hand form the free supported wave side; small greeting is permitted. Keep ears and hair chains static in this initial conversion.
- Original pixel canvas and alpha preserved in `texture.png`.
- 2 visible-region extracts. These are optional authoring assets; the current player renders the single full texture.

## API mapping

| Intent | Runtime API | Enabled |
| --- | --- | --- |
| Gentle idle | setMotion / play / pause | true |
| Pointer following | setPointer | true |
| Humanoid greeting | wave | true |
| Head warping | pose.headWarpBounds | true |
| Local hair / accessories | hair / accessories chains | False / False |

## Normalized bindings

Full original image: left/top (0,0), right/bottom (1,1). No trimmed-image or display-size coordinates.

| Pin | x | y | radius |
| --- | --- | --- | --- |
| waist | 0.56000 | 0.40400 | 0.18000 |
| head-root | 0.54800 | 0.24400 | 0.18000 |
| head-top | 0.52000 | 0.06900 | 0.18000 |
| shoulder-right | 0.66800 | 0.28500 | 0.18000 |
| elbow-right | 0.80200 | 0.35100 | 0.18000 |
| wrist-right | 0.90100 | 0.38500 | 0.14751 |

Pose and chain details are in `model.json`; inspect `binding-overlay.png` before previewing.

## Unsupported or additional work

- Blink, lip-sync, independent layers and large turns require additional material and engine behavior.

## Preview and integration

Run a local HTTP server in this output folder, then open `preview.html`. Runtime included: True.
If missing, rebuild with `--rig-package /path/to/node_modules/@yuragi/rig` (or a built local library checkout).
The preview uses native createPlayer, AbortSignal, a static fallback, low-frequency UI diagnostics and idempotent destroy. Vue uses `@yuragi/rig/vue`; React uses `@yuragi/rig/react`.

## Acceptance

- Actual runtime validateModel: passed.
- 1200 simulation frames with pointer extremes; supported wave included: finite vertices, minimum motionScale 1; maximum displacement gradient 0.170983.
- Live WebGL preview inspected at 1280px and 390px: neutral/idle and pointer behavior preserve the face and artwork silhouette at conservative motion; no page overflow observed.
- Wave: supported free arm enabled and clicked in the live browser.
- Play/pause verified; keyboard Enter verified in Mirea preview. Navigation away and reopen exercised; engine cleanup/cancellation tests passed.
- Reduced motion: QA-only simulated OS media preference in Mirea browser preview keeps playing=false after Play; original preview still uses respect.
- Missing runtime: fallback-check preview keeps original loaded artwork visible.
- Physical mobile touch, actual OS preference changes and exhaustive device coverage: not tested.
- Visible-part masks are authoring candidates. Hidden anatomy and layered animation are not supplied.

## Limitations

- Extracted parts contain visible source pixels only; hidden anatomy was not reconstructed.
- Conservative local preview reviewed; remaining acceptance scope is listed above.
