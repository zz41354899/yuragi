# Playground repair — 2026-10-03

- Neutral pin editing now remembers the prior playback state and actual motion weight; switching back to interaction restores them, including an intentional pause.
- Repeated neutral edits no longer pause/reset/redraw the player several times for every slider input.
- Pin changes update only pin weights and, when needed, the head/neck binding. Part geometry changes update only part bindings. Paused edits report one rendered snapshot.
- Very small influence radii use a rescaled Gaussian calculation when ordinary weights underflow, keeping both live edits and fresh model loads finite and normalized. Original Momo baseline tests pass.
- One rig display uses the authored colored part, rigid-region, head and neck outlines. Edges sample the submitted triangle mesh during playback. Editable points use small pink markers with larger transparent click targets.
- Mesh uses its own triangulated icon and the label “Mesh”; the canvas grid remains a separate tool.

Validation: `npm run typecheck`, `npm test` (44 rig + 11 site tests), `npm run build`, and `git diff --check` passed.

Desktop browser checks: set all seven pin radii to .005; switch back to interaction; repeatedly change all four visible motion sliders; edit part rotation/stiffness/damping at their maximum values and a root coordinate; intentionally pause and switch tabs; restore defaults; toggle Mesh. Playback remained responsive, intentional pause was preserved, and no browser warnings/errors were reported. Screenshot: `regions-and-mesh.jpg`.

Physical mobile touch and every browser/GPU combination were not tested.
