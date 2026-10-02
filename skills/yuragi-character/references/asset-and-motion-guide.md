# Assets and motion handoff

Use assets that pass [quality gates](quality-and-delivery-guide.md). Separate reusable character art, expressions, poses, backgrounds, composites and previews. This is a taxonomy, not a required count.

For each asset record purpose/ID, versioned filename, actual format/dimensions/alpha, fixed features, permitted change, alignment anchor, source and inspection status. A character board does not replace originals.

Write trigger → character purpose → visual response → recovery → reduced-motion equivalent. Inspect anatomical errors before animation; motion cannot repair malformed artwork.

Expression switching should preserve head/eye/body anchors. Standing sequences align body center and feet; sitting aligns seat contact. Intentional jumps/turns may move anchors, but canvas drift must not unintentionally resize the character.

Distinguish image sequences, single-surface deformation, layered Live2D and 3D/VRM models. Their materials, parameters, bindings and validation differ. A transparent PNG alone is not a broadcast-ready model.

For Yuragi, hand off the actual image and `character-brief.md` to `$yuragi-rig-spec`. AI annotates suitable anatomy; its local Python helper extracts visible regions and builds a candidate model/spec/preview. Extraction does not fill hidden surfaces, and the current renderer uses the full original texture. Record unknown measurements rather than manufacturing precise coordinates.

For requested packs use purpose-based folders and a README documenting baseline, inventory, versions, transparency checks, composite relationships and known limitations. Create an archive only when requested.
