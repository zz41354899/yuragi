---
name: yuragi-character
license: MIT
description: "Create or extend an original virtual idol and reusable character artwork: establish a consistent baseline, then produce requested expressions, poses, scenes and asset packs. Use for character design and visual assets; use yuragi-rig-spec to animate an existing illustration with Yuragi."
---

# Yuragi Character

Turn an idea or existing illustration into reusable original character assets. These instructions are in English; communicate in the user's language and accept prompts in any language. Preserve the latest approved design. Complete the requested scope, prioritizing consistency and inspected assets over quantity.

## License and AI disclosure

These instructions and helper resources are MIT-licensed; see [LICENSE](LICENSE) and [license scope / output notice](LICENSE-SCOPE.md). Bundled or referenced character artwork has separate rights. The MIT license does not automatically license user inputs or generated results.

When starting work, briefly tell the user in their language that the workflow uses AI assistance and, when requested, AI image generation or editing. Installing the Skill alone generates nothing. Continue within the user's authorized request; this notice does not require a separate confirmation. At delivery, identify the actual AI-generated or AI-edited files, original inputs and human edits in the handoff or asset manifest. Label prompts/specifications as such if no artwork was generated. Record known source permissions and unknowns; do not promise copyright ownership or unrestricted commercial use. This is workflow guidance, not an additional condition on MIT reuse.

For AI image generation/editing, give one short commercial-use notice and include it in the delivered brief/manifest: images may involve third-party rights; lawful commercial use is not guaranteed. Users must check source permissions and tool terms and handle usage disputes themselves. Yuragi provides no rights-review or legal dispute-handling service; both parties' responsibilities remain subject to law. Keep the notice concise, avoid repeating it within the workflow and do not add an approval step solely for it.

## Route the work

| Request | Read |
| --- | --- |
| No character idea yet | [Student workbook](references/student-workbook.md) |
| Baseline, expressions or poses | [Illustration workflow](references/illustration-and-imagegen-guide.md) and [quality gates](references/quality-and-delivery-guide.md) |
| Backgrounds or composites | [Scene design](references/theme-and-scene-guide.md) and quality gates |
| Asset pack or interaction assets | [Asset and motion guide](references/asset-and-motion-guide.md) |
| Design references | [Reference library](references/reference-library.md) |
| Existing artwork to animate | Hand off the actual image and brief to `$yuragi-rig-spec` |

Only create the backgrounds, variants, packages or code actually requested. A request for a character illustration does not imply a full asset library.

## Establish the baseline

Define identity/activity, personality and the feeling the character should convey. With an uncertain beginner, ask one useful preference or propose a clearly provisional design; do not require a complete questionnaire.

Lock head/face proportions, silhouette, hairstyle or body structure, primary outfit, signature accessories, palette, body proportions, art style and materials. Expressions, gaze, gestures, camera and scene may vary within the request. Record outfit changes as separate versions. Inspect an existing baseline image; text such as "same as before" is not a substitute for the actual reference.

## Produce and inspect assets

Use available image generation/editing tools only when image creation is requested. For existing artwork, include the actual baseline as reference. If tools or references are unavailable, deliver clearly labeled prompts/specifications rather than claiming images were made.

Deliver reusable characters, expressions and poses as separate transparent files; a collage is a preview. Inspect each output for consistent identity, expected anatomy, fingers or other appendages, attachment points and contact. Preserve nonhuman anatomy instead of imposing a humanoid template. Exclude failed assets and repair only those. Verify alpha when files are accessible; otherwise label transparency unverified.

Design backgrounds from the character's activity and space, not repeated decorative motifs. Build and inspect an independent background first, then composite with that exact background and character reference. Preserve landmarks, furniture, light, perspective and ground/seat contact. A seated scene needs an actual seat.

Character boards use already completed assets; they do not regenerate the character or replace originals. Create a ZIP only when requested, documenting versions, included assets and limitations. Keep image sequences, mesh deformation, Live2D and 3D/VRM deliverables distinct.

## Handoff to animation

Deliver `character-brief.md` with identity, fixed features, permitted changes, actual baseline path/version, measured pixel dimensions, alpha/quality status, desired moving parts, intended interactions and occlusions. Do not invent measurements.

When the user wants an animated character, continue through `$yuragi-rig-spec`: The agent must read yuragi-rig-spec and its API contract first, inspect the actual art, annotate it, save character-analysis.json, run the Python workflow to diagnose/extract/build, then open the built model in preview-only Yuragi Studio. Read the rig Skill’s Studio reference and individual API documents. The agent/Python workflow saves annotation, decomposition, diagnosis and missing-assets JSON. Studio automatically saves a missing-assets report for the agent to diagnose/re-extract; it has no authoring or acceptance UI. Python does not launch Skills. If that skill is not installed, provide the handoff and its name. Do not redesign an approved character or imply that replacing a texture automatically binds it.

Report actual files, references used, inspected outputs, completed checks and remaining work. Read linked references relative to this installed skill, not a developer's machine paths. Case-study links are optional evidence, not dependencies required to create a new character.
