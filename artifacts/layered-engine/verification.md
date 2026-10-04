# Layered engine verification — 2026-10-04

Implementation and authoring data use AI assistance. Artwork is unchanged Mirea source pixels, extracted using the existing reviewed masks; no new artwork or occluded pixels were generated.

- Local v2 renderer: hierarchical affine transforms, sparse skinning, bounded springs, canonical shared joints, ordered atlas batching, alpha masks and opacity.
- Browser observed: real WebGL canvas loaded, neutral/rest view, left/right keyboard reversal, reset/pause controls, 390 × 844 viewport with no horizontal overflow, no captured error/warning logs. A desktop preview screenshot is saved in browser-preview.png.
- Offline source-size premultiplied RGBA neutral error: 0. Sampled Mirea geometry at nine pointer targets remains oriented; minimum signed-area ratio 0.9983389968. Mirea has no authored shared joint IDs; synthetic runtime fixtures separately verify exact shared seam positions through all pointer targets.
- Rendered model: 255 vertices, 436 triangles, one actual draw call per frame, one 2048 × 2048 RGBA atlas (16 MiB decoded).
- CPU benchmark: see cpu-benchmark.json; three Node samples, median approximately 0.0031 ms/update on this host. It excludes browser draw submission, GPU completion, loading and physical mobile costs; no cross-framework ranking is claimed.
- Runtime tests include Momo baseline, v2 SSR fallback in both adapters, normalized weights, malformed topology, atlas bounds, canonical seams, aspect-correct rigid distances, batch/mask/opacity submission, paused GPU uploads, low-frequency reports, reduced motion, cancellation and cleanup.
- Python tests include exact neutral roundtrip, extruded gutters, explicit prototype opt-in, fingerprint mismatch, runtime validation before output, pruning error budget, alpha masks and sampled-fold rejection.
- Isolated offline local tarball installation passed public v1/v2 exports and SSR-safe main-entry import. Temporary npm cache used; the user's npm cache was unchanged.

The Mirea demo is visible-only. Occluded artwork completion, large-motion hole/overlap acceptance, physical touch devices, GPU timing, multi-GPU scaling comparisons, IK, Spine import, animation blending and blink/mouth attachment control remain untested or unimplemented. The generated report deliberately retains visualAcceptance: not-run; this document records limited prototype observations separately.
