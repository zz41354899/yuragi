---
name: yuragi-rig-spec
description: "Turn existing character artwork into a Yuragi animated character: inspect anatomy, select suitable motions, annotate visible parts, run the local Python helper, map real TypeScript APIs, and verify a model/spec/player preview. Also supports spec-only planning. Use yuragi-character when designing a character from scratch."
---

# Yuragi Rig Spec

These instructions are in English; understand and answer in the user's language. Preserve the actual approved artwork. For "animate/convert my character", continue through a runnable local preview and visual verification. For an explicit spec-only request, deliver the spec without implementing the player. This skill uses the AI agent's image understanding plus a local Python helper; the helper itself does not infer semantic anatomy or call a remote AI service.

## Read and inspect

Read [API capabilities](references/api-reference.md) first. For execution read [preparation workflow and annotation format](references/character-preparation.md). Use [custom-character guide](references/custom-character.md), [public types](references/api-types.ts) and [spec template](assets/rig-spec.template.md) as needed.

Inspect the user's actual full-resolution image. Run the helper's `inspect` command to measure dimensions, alpha, silhouette and image fingerprint. View the artwork and inspection grid; do not guess missing anatomy from a filename. If no readable image is available, produce a pending-input spec and identify the missing image; never claim conversion completed.

## Select a suitable motion profile

- **Reviewed humanoid**: annotate the actual head bounds, head root/top and waist, optional shoulders/elbows/wrists, free hair strands and accessories. Use gentle following and idle. Enable wave only if the actual supported arm is visible, has suitable separation and is not holding a prop or merged into clothing.
- **Other or uncertain structure**: use silhouette mode for gentle whole-artwork idle. Add explicitly observed local chains only when their geometry supports it. Do not map a quadruped, wing or tentacle to human joints merely to expose every button.
- **Occlusion / expressive features**: list missing material or required engine work for hidden surfaces, blinking, mouth shapes, large turns and layer switching. Visible-part extraction does not reconstruct pixels behind an arm or hair.

The AI creates `character-analysis.json` using the measured fingerprint and its actual visual observations. The user need not hand-author annotations. Coordinates refer to the full original image including margins. Mark uncertain observations and select a conservative profile. Do not copy Momo's normalized layout to another character.

## Build, review, refine

Run [scripts/prepare_character.py](scripts/prepare_character.py) with the artwork and analysis in a new output version folder. It exports the unchanged texture canvas, optional full-canvas transparent visible-part extracts, `model.json`, `binding-overlay.png`, `rig-spec.md`, `build-report.json` and `preview.html`. Runtime playback uses the full original texture; part extracts are authoring material, not automatically composited layers.

Provide the built/installed `@yuragi/rig` package via `--rig-package` so the preview includes the local runtime. No CDN or API key is needed. Open through a local HTTP server, not file://. If the library is unavailable, finish preparation and report playback unverified rather than implying the website provides a hosted animation API.

View the binding overlay, extracted regions and live character. Check neutral, pointer extremes, enabled wave, continuous idle, face, seams, hair roots, clipping and diagnostics. Revise annotations or intensity in a new version folder when the image is distorted; do not merely list problems and stop. Disable unsuitable motions. Separately verify reduced motion, static fallback, touch/keyboard operation and navigation cleanup. Only report checks actually executed.

Finish with the model, source analysis, spec, output folder and usable preview URL plus verification status. Update the spec's acceptance section from actual observations; generated `not-run` labels are not a completed rig. Structural JSON validation alone does not prove visual quality.

## Integration constraints

Use the installed project's actual exports/version. The bundled contract includes optional `pose.headWarpBounds` for new head positions; older runtimes may ignore it and distort different layouts. Rebuild/update the local package before relying on that field.

Vue imports `@yuragi/rig/vue`; React imports `@yuragi/rig/react`. Keep strict TypeScript, SSR-safe imports, mount-time creation, cancellable loading, fallback artwork, reduced-motion handling and idempotent cleanup. Per-frame state stays in the engine; use only low-frequency snapshots for framework UI.

When modifying the library, retain the Momo baseline and run typecheck, tests and build; inspect the browser for UI changes. Do not invent new ParameterName values, promise universal auto-rigging, publish/deploy or generate missing artwork as an incidental step.
