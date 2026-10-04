# Playground layers

The Playground control-point editor has been removed: pin handles, coordinate/radius/spring editing, pin lists, weight inspection, file-based JSON import, pasted JSON import, and the associated edit-preview lifecycle. Its tab and toolbar entry now open Layers with a stack icon.

Layers groups the existing 25 Mirea deformation parts into hair, clothing, ribbons and accessories. Selecting a part highlights its authored region. Rotation, stiffness and damping use the existing player.setPart API; this does not implement independent raster compositing, visibility or layer reordering. The library and docs were not edited for this request. Skeleton and Mesh inspection remain available.

Verified locally:

- npm run typecheck: passed for both workspaces.
- npm run test --workspace @yuragi/site: 13 tests passed.
- npm run build --workspace @yuragi/site: passed, with the existing bundle-size advisory.
- git diff --check: passed.
- Live browser: 0 file inputs, 0 JSON textareas, 0 pin handles, no control-point tab.
- Layer rotation updates persisted across selecting different parts; other parts retained their own values. Selecting a layer and changing its settings preserved playback. A manual pause survived edits and switching tabs.
- Reset restored the original part settings. English and Japanese layer labels rendered correctly.
- At 390 × 844 the updated mobile notice referenced layers, selection/sliders worked, and document width remained within the viewport. The temporary viewport override was reset.
- No browser warnings/errors were captured during verification.

Screenshot: layers.png (default desktop viewport, Layers selected and the left long hair settings visible).
