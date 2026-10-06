# Agent-first character preparation (0.2.0)

Read the Skill and [API contract](api-reference.md) before Python. The agent views artwork and annotates semantic anatomy; Python measures and exports pixels. Python does not launch Skills, infer anatomy, fetch models or call services. Character design belongs to yuragi-character.

For JSON diagnosis and automatic compilation/Studio launch, read [the agent workflow](agent-workflow.md). Studio only previews; missing assets return to the agent as JSON.

## Requirements and staged commands

Python 3.10+ with Pillow, Node.js on PATH, and built local @z7589xxz758/yuragi with the required validator capabilities. Install Skill and runtime separately. In a checkout, run npm run build:lib; in another project install that built package by local path. No npm publication is implied.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r /path/to/yuragi-rig-spec/scripts/requirements.txt
.venv/bin/python /path/to/yuragi-rig-spec/scripts/prepare_character.py inspect artwork.png --out character-inspect
# Agent views source + inspection-grid.png, then writes character-analysis.json.
.venv/bin/python /path/to/yuragi-rig-spec/scripts/prepare_character.py extract artwork.png --analysis character-analysis.json --out character-parts
# Agent reviews parts, masks, contact sheet and contacts before building.
.venv/bin/python /path/to/yuragi-rig-spec/scripts/prepare_character.py build artwork.png --prepared character-parts --out character-v1 --rig-package /path/to/yuragi/packages/rig
python3 -m http.server 4320 --bind 127.0.0.1 --directory character-v1
```

Use a new/empty output folder for every version. inspect creates only image-info.json, inspection-grid.png, analysis.draft.json and annotation-guide.json. It accepts one still image, each dimension 1–8192, visible alpha and baked EXIF orientation; it never resizes, trims or removes backgrounds. SHA-256 binds original file bytes, so even a re-encoded image requires reinspection. Opaque backgrounds are disclosed.

extract requires analysis. It outputs unchanged full-canvas texture.png, image-info.json, analysis.json, overlay, parts-manifest.json, extract-report.json, full/cropped PNGs, masks and contact sheet when regions exist. Empty visible masks are errors. Exports preserve source RGBA; subtract masks use the referenced raw outlines, not recursive subtraction. Extraction is transactional: failure leaves no partial output.

build requires --prepared and --rig-package. Optional --analysis must match the prepared canonical JSON fingerprint; otherwise prepared/analysis.json is used. Before producing a playable preview, it verifies source identity, analysis, part IDs and every PNG fingerprint, then runs validateModel from the actual dist/index.js in Node. Missing/wrong-version runtime, validator rejection or modified assets fails with no partial output. Output includes model.json, rig-spec.md, build-report.json, preview.html, local runtime JS and copied prepared assets. It does not generate animation clips or start an HTTP server.

Python's programmatic build function retains direct candidate preparation for existing callers. Without a runtime it emits no preview.html, modelValidation is not-run and runtimeReady is false. Use the staged CLI for a deliverable player.

## Analysis contract

Analysis version remains 1. Start with the inspection draft; image.sha256/width/height must match exactly. Required: id (lowercase hyphenated identifier), nonempty name, mode humanoid/silhouette, confidence 0–1 and evidence from actual observations. UnsupportedMotions is a list of missing material/engine work, not a claim of implemented motion.

Coordinates are full-source normalized 0–1 including transparent margins. Record uncertainty, protected areas and occlusions in evidence/spec. Never guess anatomy from filenames or copy another character’s coordinates. Humanoid requires confidence >=.7, measured waist/head-root/head-top, increasing headBounds [left,top,right,bottom]. Head-top must be above head-root. Optional supported shoulder/elbow/wrist/hip/knee/ankle landmarks become parent-before-child pins. waveSafe requires supported right shoulder/elbow/wrist; disable it on merged/holding arms. Silhouette mode uses gentle whole-image idle, not invented human joints.

regions allows up to 64 unique parts. Each has id, polygon (3–512 points), optional role, parent, root/tip, chain (2–8 points), subtract IDs (up to16), binding/deformation and outline. Runtime-bound polygons are simple 3–32 points; fine extraction contours use a separate simple outline up to512. Parents/subtract references must exist and have no cycles/self-reference. Roles cover skull/head/face/eyes/iris, neck, torso/shoulders/arms/fingers, each visible leg joint/foot, bangs/hair/cloth/ribbon/accessory/prop. Role labels do not add APIs.

- binding: mode weighted with known unique pins, feather .002–.2, optional secondary false; or mode rigid with optional known anchor and rotation none/head/body. Rigid objects do not use pin weights or flexible deformation.
- deformation: only bangs/hair/cloth/ribbon/accessory, distinct root/tip, feather .002–.2, rotation 0–.35, stiffness/damping .001–1, phase −100…100, wind 0–2, follow/followY −2…2, optional channel hair/accessories. Choose polygon parts or legacy hair/accessories chains to avoid duplicate deformation.
- headMotion: reviewed head/neck region IDs, base landmark distinct from head-root, feather/neckFeather .002–.2, rotation 0–.3, translation [x,y] 0–.08, bodyFollow 0–1. This creates one skull transform and body-to-head neck bridge. Keep raw skull/neck ownership separate from authoring child subtraction; broad head masks must not erase bangs.
- face: only eyes (unique left/right) with center/radius/iris/irisRadius/travel/angle/sclera. Requires headMotion. Full bounds and examples are in [eye tracking](eye-tracking.md). Legacy face.mode/blink/mouth and eye.skinSample/ink are rejected with migration guidance.
- tracking: response .001–.2, damping .1–.98, maxVelocity .1–5, optional bodyFollow 0–1 and nonnegative translation 0–.08.
- pointerGroups: up to16 unique groups with id, optional name, pivot, signed translation −.03… .03, rotation ±.08 radians, response16–1000ms; each has1–8 simple 3–32-point polygons with feather .002–.2. These share the source surface, not independent textures. Later interiors own overlaps. Python exports these directly.

Manifest entries record full/cropped/mask paths, source boundsPixels, role, parent, root/tip/chain anchors, binding and completion needs. analysisSha256 hashes sorted compact UTF-8 JSON; assets hashes exported PNG bytes. These are integrity/provenance checks, not visual approval.

## Artist/user supplements

Supply --supplements completed-parts.json to extract. Its list has at most64 unique IDs matching annotated regions:

```json
[
  {"id":"rear-hair","image":"artist/rear-hair.png","positionPixels":[120,80],"source":"Artist-provided completed rear hair, revision 2","completeness":"completed"}
]
```

Paths resolve relative to that JSON file; placements are nonnegative integer source pixels, without resize. Use completed/partial and nonempty provenance. Still/visible-image rules apply and bounds must fit the original canvas. The package copies each PNG, records original SHA, position and runtimeUsed:false. The current player renders texture.png only; supplied hidden pixels are not independently played and unavailable hidden pixels are never generated.

## Legacy migration

```sh
python3 /path/to/yuragi-rig-spec/scripts/migrate_gaze.py old.json --out new.json
```

The tool never overwrites input or existing output. It removes legacy face/eye fields, converts expression.gaze tracks to gaze.strength and lists removed tracks/fields in new.migration-report.json. Empty resulting clips need removal/replacement. It supports models, analyses and nested clip data; validation remains a separate target-runtime step. Re-extract migrated analysis because its fingerprint changes.

## CLI contract and current exporter gaps

This heading is retained for existing documentation links. inspect/extract/build are deterministic local authoring stages. The exporter supports measured eyes and pointerGroups but does not author keyframe clips, independently render PNG attachments, reconstruct occlusion, implement IK, import Spine files, export animated image files or launch an AI host.

## Acceptance and troubleshooting

partsExtracted, modelValidation:passed and visualAcceptance are separate. Generated visualAcceptance is not-run. Review overlay, crops, masks and live HTTP preview at source/face zoom. Check neutral, extremes/corners, rapid reversal, pupil boundaries, hair roots, head/neck seams and held-prop contacts. Test touch/keyboard, reduced motion, missing texture, cancellation and navigation cleanup. Update report/spec only from actual observations, preserving untested cases.

| Failure | Next action |
| --- | --- |
| Missing PIL | Install requirements in the same Python environment |
| Source/analysis fingerprint mismatch | Reinspect changed art or re-extract revised analysis |
| Prepared asset mismatch | Correct/review source annotations and regenerate extract; do not edit hashed files in place |
| Empty mask | Correct polygons/subtractions; missing visible pixels need actual materials |
| Legacy/unknown face field | Migrate explicitly, inspect report, re-extract and validate |
| Missing/wrong runtime or Node | Build/install the local runtime and make Node available |
| Runtime validation rejected | Correct binding/schema; no playable preview is delivered |
| Valid model with distorted motion | Repair ownership/contact points or reduce motion, then review again |

The site offers Skill documentation, not a hosted rigging endpoint. Installing a Skill does not install its Python dependencies or the runtime.
