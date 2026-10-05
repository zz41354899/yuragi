# Optional v2 hair, mesh and face authoring

Existing v2 models need no new fields and keep their behavior. Never convert visible v1 cuts into a claimed complete layered rig. Use the public v2 types and validator; coordinates below are measured full-source normalized coordinates, not reference-character coordinates. Preserve completed artwork provenance, source and per-image/mask fingerprints.

## Hair and local mesh

Attachments may have a same-atlas alpha mask. Parent-bound hair roots and tip spring weights must be explicit; use shared `joints` with identical position/weights at shared boundaries. A mask restricts pixels, not vertex binding; weights must also restrict the affected material. Hair groups are optional `{id, nodes, coupling}`; nodes must be sibling spring nodes, coupling 0…1. Coupling draws spring angles toward the group mean and clamps each to its own declared spring rotation limit. Choose measured per-character limits and test rapid reversal and return frames.

The Python manifest supports `mesh: [columns,rows]`, `refine: [{boundsPixels:[left,top,right,bottom],cellPixels:8}]`, and `pruneTransparent: true`. Refined coordinates extend grid rows/columns to avoid T-junctions inside an attachment. Across attachments, explicitly authored shared joints are required. Transparent-cell pruning keeps triangles whose covered source alpha is nonempty; it does not infer protected anatomy. Refinement stays within attachment bounds and has a vertex budget. Review face curvature, strand bends, seams, triangle orientation and actual draw performance. Studio reports vertices, triangles, atlas bytes and CPU update time.

## Face assets and bindings

`face.eyes` has up to two entries with `side`, head `node`, `ball`, optional `iris`, `lines` attachment IDs, mandatory `half` and `closed` IDs, measured `top`/`bottom` curves (2…24 increasing-X pairs with equal X), and `travel` (per-axis 0…0.1). All referenced attachments must have complete coverage and bind wholly to that same head node. Supply eyelid background and clean skin in the base layer; the tool cannot remove original eyes painted into an unprepared face texture. Open ball/iris pixels clip to the measured eye curve; iris travel remains inside that clip. Half/closed supplied artwork replaces open attachments. Reduced motion restores open eyes and source gaze.

Existing optional v2 face bindings remain compatible with `face.mouth.shapes` (closed and legacy vowels) and explicit setFace calls. These are legacy model capabilities, not current Studio preparation requirements. New preview work uses the reviewed original-image gaze workflow; do not request or generate blink/mouth supplements. All legacy facial attachments still require complete coverage and one head transform.

```ts
const player = await createLayeredPlayer({canvas, model})
player.setGaze(.5, 0) // requires an iris
player.setFace({eyeOpenLeft: .5, eyeOpenRight: .5})
player.setFace({mouthShape: 'a', mouthOpen: .8}) // legacy authored model only
player.reset()
player.destroy()
```

Openness is 0…1; invalid or missing capability requests throw without partial updates. Open mouth geometry scales vertically about its authored center; supplied legacy texture shapes switch at the requested setting. All attachments inherit the same head transform. v1 APIs and legacy v2 behavior remain separate. These capabilities do not mean Mirea contains closed-eye or vowel artwork. List missing materials and keep other motion previews enabled. No image generation is part of this workflow.
