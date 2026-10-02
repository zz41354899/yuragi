---
name: yuragi-character
description: "Create or extend an original virtual idol and reusable character artwork: establish a consistent baseline, then produce requested expressions, poses, scenes and asset packs. Use for character design and visual assets; use yuragi-rig-spec to animate an existing illustration with Yuragi."
---

# Yuragi Character

Turn an idea or existing illustration into reusable original character assets. These instructions are in English; communicate in the user's language and accept prompts in any language. Preserve the latest approved design. Complete the requested scope, prioritizing consistency and inspected assets over quantity.

## Route the work

| Request | Read |
| --- | --- |
| No character idea yet | [Student workbook](references/student-workbook.md) |
| Baseline, expressions or poses | [Illustration workflow](references/illustration-and-imagegen-guide.md) and [quality gates](references/quality-and-delivery-guide.md) |
| Backgrounds or composites | [Scene design](references/theme-and-scene-guide.md) and quality gates |
| Asset pack or interaction assets | [Asset and motion guide](references/asset-and-motion-guide.md) |
| Design references | [Reference library](references/reference-library.md); [Momo case study](references/momo-case-study.md) when relevant |
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

When the user wants an animated character, continue through `$yuragi-rig-spec`: AI inspects anatomy and writes annotations; its Python helper prepares visible-region extracts, a model, spec and local player preview. If that skill is not installed, provide the handoff and its name. Do not redesign an approved character or imply that replacing a texture automatically binds it.

Report actual files, references used, inspected outputs, completed checks and remaining work. Read linked references relative to this installed skill, not a developer's machine paths. Case-study links are optional evidence, not dependencies required to create a new character.
