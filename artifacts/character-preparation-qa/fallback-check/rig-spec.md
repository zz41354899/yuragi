# Rig specification: My character

Status: generated binding candidate; visual acceptance not run.

## Artwork and evidence

- Image fingerprint: `6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05`; 1024 × 1536 pixels.
- Profile: silhouette; semantic confidence: 0.
- Evidence: Silhouette measured by Python; no semantic anatomy review.
- Original pixel canvas and alpha preserved in `texture.png`.
- 0 visible-region extracts. These are optional authoring assets; the current player renders the single full texture.

## API mapping

| Intent | Runtime API | Enabled |
| --- | --- | --- |
| Gentle idle | setMotion / play / pause | true |
| Pointer following | setPointer | false |
| Humanoid greeting | wave | false |
| Head warping | pose.headWarpBounds | false |
| Local hair / accessories | hair / accessories chains | False / False |

## Normalized bindings

Full original image: left/top (0,0), right/bottom (1,1). No trimmed-image or display-size coordinates.

| Pin | x | y | radius |
| --- | --- | --- | --- |
| surface-anchor | 0.50111 | 0.43645 | 0.48682 |

Pose and chain details are in `model.json`; inspect `binding-overlay.png` before previewing.

## Unsupported or additional work

- None requested; blink, lip-sync, large turns and occlusion changes are not implemented.

## Preview and integration

Run a local HTTP server in this output folder, then open `preview.html`. Runtime included: False.
If missing, rebuild with `--rig-package /path/to/node_modules/@yuragi/rig` (or a built local library checkout).
The preview uses native createPlayer, AbortSignal, a static fallback, low-frequency UI diagnostics and idempotent destroy. Vue uses `@yuragi/rig/vue`; React uses `@yuragi/rig/react`.

## Acceptance

- Schema validation: call validateModel in the installed target runtime (the preview does this before loading).
- Neutral / pointer extremes / enabled wave / continuous idle / face / seams / hair roots: not run.
- Desktop / touch / keyboard / reduced motion / load failures / navigation cleanup: not run.
- Require finite diagnostics; sustained motionScale below 1 means reduce motion or repair binding.
- Reinspect after changing artwork; fingerprints must match the annotated image.

## Limitations

- Extracted parts contain visible source pixels only; hidden anatomy was not reconstructed.
- Model data is a binding candidate; visual motion acceptance has not been performed.
