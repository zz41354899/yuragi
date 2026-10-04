# Mirea structure / mesh / installation clarification — 2026-10-03

## Delivered behavior

- Inspected unchanged 1024×1536 Mirea artwork with yuragi-rig-spec after reading its API reference. Source SHA-256: 6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05. Alpha 0–254; inspect/grid are retained.
- 21 measured structure-reference nodes show neck, skull, held/free arms, crossed legs and shoes. Skirt-occluded hips and their connecting segments are explicitly inferred/dashed. This is read-only annotation, not a newly implemented IK skeleton or new skinning pins.
- The seven existing runtime pins remain. Added logical fixed-anchor parent links (waist→grip→canopy; waist→feet/hand) in model.json and author-model.mjs. Interleaved comparison reports zero vertex difference, preserving the reviewed held prop and crossed-leg deformation.
- Editing enters neutral geometry (`motion.weight=0`). Play restores weight 1. Overlay pin positions and reference nodes sample the actual rendered triangle, including ownership/group/sway/translation/limiter changes, rather than drawing static points over moving art.
- `RigPlayer.getMeshSnapshot()` returns isolated copies of the most recently submitted mesh: rest, positions, indices, base weights, pinNames. It makes no allocations unless explicitly called. Website inspection samples at normal onFrame UI frequency (~10 Hz), with per-frame engine state unchanged.
- Mesh toggle shows all 3,577 vertices / 6,912 triangles of the continuous canvas, including transparent areas. Optional orange visualization shows base pin weights only. UI/API docs explicitly distinguish head/neck/rigid/part ownership overrides. Eye compositing changes pixels, not the mesh.
- Homepage CTA: 「從海月範例開始，一步步製作自己的動態角色。」 Three-language copy is registered. Also repaired missing createMomoInteractiveModel import in the existing Vue quickstart string.
- Installation page separates @yuragi/rig runtime/adapters/Momo+starter assets, Agent Skill, Python/Pillow, and website-only Mirea model/artwork/measurements. No npm publication/deployment. Rebuilt local 0.2.0 tarball includes getMeshSnapshot declaration.

## Verification

- npm run typecheck: passed.
- npm test: core 40 passed; initial site run found missing translation 項目, corrected and reran site tests: all 11 passed.
- npm run build: passed after final source edits; includes strict site typecheck and Skill distribution synchronization.
- Site tests verify exact public Skill type synchronization, discovery references and three-language keys.
- GPU mock test compares snapshot positions/indices with the actual submitted buffers, checks array isolation, neutral geometry, rebound weights and repeated cleanup.
- Triangle interpolation test distinguishes barycentric sampling from bilinear interpolation.
- Momo baseline and Mirea rigid prop/crossed-leg tests passed.
- git diff --check: passed.
- Local tarball inspected: dist/types.d.ts contains RigMeshSnapshot and getMeshSnapshot.
- Desktop browser: static guide/source alignment, actual mesh toggle, base-weight toggle, Play/ArrowRight follows transformed geometry; guide neck X 61.410845% equals rendered pin X 61.4108% at the same snapshot. Paused pin keyboard edit changes umbrella-canopy X .340→.341 and neutralizes geometry; reset restores model.
- 390×844 browser: Japanese controls, mesh toggle, matching overlay/artwork boxes, body scroll width 379 without horizontal overflow; new checkbox rows 44px tall. Installation table fits 335px inner width without body overflow. No physical phone tested and no new physical touch gesture certification.
- Homepage/installation content verified in browser. Screenshots retained under qa/; desktop-mesh.png is the final user-facing proof.

## Performance measurement limits

- Core gzip: 18,939 bytes. +50 bytes against the previous 0.2.0 delivery (18,889), still below the original pre-0.2 baseline 19,873.
- Fresh unpaired CPU runs were noisy (medians 1.234 / 1.345 ms vs historical 1.084 ms). Those historical numbers cannot certify this change under differing background load.
- Current interleaved 3-run comparison retained in benchmark-paired.json: before 2.144 ms, after 1.584 ms, exact final vertex difference 0. Both use the unchanged simulation code; before removes only the four fixed-pin parent links. Large timing variance means this is not evidence of a speed improvement or a stable original-plan performance certification.
- Debug overlays disabled in CPU comparison. Browser/GPU/copy/Canvas2D overlay costs have not been benchmarked; they occur only while inspection overlays are enabled. No claim of 60fps debug overlays or physical-mobile performance.
