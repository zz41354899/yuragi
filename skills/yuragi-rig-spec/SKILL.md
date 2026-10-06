---
name: yuragi-rig-spec
license: MIT
description: "Turn existing character artwork into a Yuragi animated character: inspect anatomy, select suitable motions, annotate visible parts, run the local Python helper, map real TypeScript APIs, and save annotation/decomposition JSON, diagnose missing assets with Python, and open a preview-only Studio. Also supports spec-only planning. Use yuragi-character when designing a character from scratch."
---

# Yuragi Rig Spec

**Read this Skill and its API contract before invoking Python.** Existing-artwork analysis, annotation, extraction, model construction and motion acceptance belong to `yuragi-rig-spec`. Python does not start a Skill or an agent. `yuragi-character` handles character design and artwork creation; hand approved source artwork into this workflow.

Answer in the user's language. Preserve approved art. For an animation request, continue through a runnable local interactive preview and actual visual review. For an explicit spec-only request, deliver measured/pending data without building a player. Do not claim completion without readable artwork or executed acceptance.

## License and AI disclosure

These instructions, helper code, templates and model-binding data are MIT-licensed; see [LICENSE](LICENSE) and [license scope / output notice](LICENSE-SCOPE.md). Artwork and third-party assets have separate rights; MIT does not automatically license user inputs or generated results.

When starting work, briefly explain in the user's language that specifications, annotations, model data or code use AI assistance. Installing the Skill alone generates nothing; the Python helper measures/extracts source pixels and does not generate artwork or call AI. Continue within the authorized request without an extra confirmation for this notice. In the delivered spec or manifest, distinguish original artwork, extracted source pixels, artist supplements and AI-assisted annotations/code. Do not label unchanged or extracted artwork as newly AI-generated, or promise copyright ownership or unrestricted commercial use. This is workflow guidance, not an additional condition on MIT reuse.

For AI-generated artwork or a requested image-generation/editing handoff, briefly disclose that images may involve third-party rights and lawful commercial use is not guaranteed. Users must check source permissions and tool terms and handle usage disputes themselves. Yuragi provides no rights-review or legal dispute-handling service; both parties' responsibilities remain subject to law. Keep the notice concise, avoid repeating it within the workflow and do not add an approval step solely for it.

## Read, view and inspect

Read [all public APIs](references/api/index.md) and the relevant individual function/method reference, then [API capabilities](references/api-reference.md) and [Python workflow / annotation contract](references/character-preparation.md). Read [eye tracking and Mirea](references/eye-tracking.md) for gaze. Use [public types](references/api-types.ts), [custom-character guide](references/custom-character.md) and [spec template](assets/rig-spec.template.md) as needed.

View the actual full-resolution source. Run `inspect` for dimensions, alpha, margins, SHA-256, grid, draft and annotation guide. View the whole grid and enlarged local crops (scripts/grid_region.py) before annotating. Python measures pixels, not anatomy, and does not call AI or remote services. Do not copy another character's coordinates into another character.

## Annotate visible structure

Persist fingerprint-bound `character-analysis.json` from actual observations before calling Python. Keep measured part polygons, parents, confidence, occlusion and protected areas in this file; do not leave subdivision results only in chat. Use full original image coordinates including margins. Record confidence, evidence, uncertain contours, protected pixels, occlusions and required completion assets.

Reviewed humanoids need waist, head-root/top and head bounds. Other/uncertain anatomy uses silhouette mode. Enable wave only for the supported visibly free right arm, never a holding arm. Do not invent missing limbs.

Separate skull/face/headpiece, neck top/body base, each eye and iris, individual bangs/hair strands, torso/shoulders/upper arms/forearms/fingers, visible thighs/knees/shins/ankles/heels/toes, clothing and props. Flexible regions need reviewed root/tip and material response. Rigid canopy, shaft and holding hand should share attachment transforms; ribbons remain flexible. Record parents, subtraction IDs, contact points and protection polygons. HeadMotion owns one skull transform and neck bridge; never subtract a broad whole-head mask from bangs.

The v1 face contract has **only measured eyes**: use setGaze and setGazeStrength. Legacy v1 blink/mouth/expression fields remain unsupported. The current website/Studio workflow uses source-pixel gaze tracking only. Do not request clean face beds, sclera completion, blink variants or mouth shapes. Optional v2 attachment-based face controls are a separate contract; read [v2 authoring additions](references/layered-authoring.md). Migrate legacy data using [migrate_gaze.py](scripts/migrate_gaze.py), save a new result and inspect its report. Do not silently strip unsupported fields.

## Extract, inspect, build

Run `extract` with analysis into a new folder. Inspect full/cropped parts, masks, contact sheet and attachment metadata. Correct empty masks, neighboring skin/prop contamination and unstable boundaries before building. Visible cuts do not reconstruct hidden pixels.

Accept artist/user-completed parts through `--supplements`; preserve their placement and source records. This bundles authoring assets only, not independently rendered attachments. Never generate missing artwork as an incidental step.

Run `build --prepared ... --rig-package ...` into another new folder. It verifies source/analysis and asset fingerprints, builds the candidate and invokes the actual built `@z7589xxz758/yuragi` validateModel (package identity and required capabilities checked; actual runtime version recorded) via Node.js. The CLI requires both arguments; missing/invalid runtime or altered prepared assets must fail. Python callers may prepare candidates without runtime, but these have no playable preview and modelValidation is not-run.

Runtime playback uses the unchanged full source texture. Parts, supplements and pointerGroups do not imply independent texture layers. No CDN or API key is needed. Skill, Python/Pillow, Node and local Yuragi runtime installations are separate.

## Diagnose, build and preview

Read [the JSON handoff and Python orchestration](references/agent-workflow.md). Run `scripts/workflow.py diagnose` on the saved analysis; it writes `character-analysis.json`, `decomposition.json`, `diagnosis.json` and `missing-assets.json`. Inspect the measured bounds/masks and correct annotations before proceeding. Python determines extractability from explicit reviewed polygons; it does not recognize anatomy.

Run `scripts/workflow.py run SOURCE --analysis ANALYSIS --out NEW_VERSION --rig-package ACTUAL_PACKAGE --studio`. This diagnoses, extracts, validates and compiles, then starts the installed local Studio only after success. For v2 add `--manifest` with the separately authored attachment manifest. Read [Studio preview](references/studio.md). Studio provides playback, source comparison, zoom/pan, poses and available face controls; it has no authoring, issue form, acceptance checklist or delivery step.

Studio automatically writes `OUT/missing-assets.json` and displays its path. Read it as the agent, then run `workflow.py diagnose ... --missing OUT/missing-assets.json` into a new directory. For `extract`, use the reviewed source region and Python extraction, then update the authoring manifest/bindings and compile a new version. For `revise-annotation`, inspect full/local artwork again and correct polygons. For `provide-artwork`, list the exact unavailable art; repeated extraction cannot recover hidden pixels. Do not generate artwork incidentally. Remove a required request from annotations only after the real material is supplied or its need is explicitly withdrawn; no automatic clearing from a valid JSON result.

Keep existing valid models and source art. The agent saves observed quality findings/untested cases in a local JSON report alongside diagnosis; Studio remains a viewer. Inspect neutral, directions/corners, reversal, face zoom, neck seams, hair roots, clipping and held props. Optional `yuragi review` produces actual-player sheets for agent inspection. Report partsExtracted, modelValidation and visualAcceptance separately; visualAcceptance stays not-run until real observation. Deliver the saved JSON, prepared parts, model and runnable preview URL with limits. Follow [v2 authoring additions](references/layered-authoring.md) for independent layers; v1 visible cuts are authoring assets, not full v2 attachments.

## Integrate

Vue uses `@z7589xxz758/yuragi/vue`; React separately imports `@z7589xxz758/yuragi/react`. Keep strict types, SSR-safe imports, mount-time creation, cancellable loading, fallback, reduced motion and idempotent cleanup. Keep per-frame state in engine; snapshots are low frequency.

Call setPointer before setGaze for combined head/body and independent eyes; lookX/lookY parameter tracks reclaim gaze following. Preserve numeric deformation baselines when changing library behavior and run typecheck/tests/build plus browser QA. Do not promise npm publication, hosted API, MCP/Plugin, universal auto-rigging, IK or automatic completion of layered artwork.
