# Rig specification: character name

Status: planning / measured candidate / schema verified / visually accepted (select the actual state).
Target: Yuragi v0.1 single-image mesh deformation.

## Artwork and evidence

- Source location, version, SHA256 and character brief:
- Fixed design features and permitted changes:
- Actual image dimensions, alpha and visible bounds:
- Intended framework, interaction and device scope:
- Observed anatomy, confidence and selected humanoid/silhouette profile:
- Uncertain observations, occlusions and missing material:

## Parts and materials

| Part | Measured region / attachment | Suitable motion | Occlusion / protected area | Extraction or missing material |
| --- | --- | --- | --- | --- |
| Fill from the actual image | Pending | Pending | Pending | Not inspected |

Visible-region PNGs contain only source pixels. They do not restore hidden anatomy and are not runtime layers.

## Motion and API mapping

| Motion | Trigger → response → recovery | Actual API / field | Supported / material / extension / pending | Strength, duration, reduced motion |
| --- | --- | --- | --- | --- |
| Fill from the request | Pending | Pending | Pending | Pending |

## Bindings and coordinates

Use the full original image including margins: top left (0,0), bottom right (1,1). x=px/width and y=py/height. Record measurement evidence; do not invent precise coordinates without viewing the image.

| Pin | Type / parent | Pixel measurement and evidence | x / y / radius | stiffness / damping / wind | Semantic purpose and risk |
| --- | --- | --- | --- | --- | --- |
| Fill supported semantic names | Pending | Pending | Pending | Pending | Pending |

- Mesh columns/rows and performance rationale:
- pose: headCenter, headBounds, headHorizontal, optional headWarpBounds, bodyBounds, bodyPivot, swayPivot:
- Hair: id, root/middle/tip, phase, radius, gain; [] if absent:
- Accessories: id, root/tip, radius, angle in radians, stiffness, damping, phase; [] if absent:
- faceClearance ellipses [cx,cy,rx,ry]; [] if absent:
- Motion: sway, speed, hair, accessories, follow; rationale:
- Whether the supported waving arm is visible, separated and prop-free; wave enabled/disabled:

An unmeasured spec is not executable RigModel data. Validate generated model JSON with the target runtime.

## Required extensions

For each unsupported motion describe missing engine behavior, artwork requirements, proposed integration, fallback and acceptance. Do not invent ParameterName values for blink, lip-sync or large turns.

## Delivery and integration

- Actual files: brief, analysis, measured image report, original texture, visible extracts, model, overlay, spec, preview:
- Local runtime installation and Vue/React/native entry point:
- Mount-time creation, AbortSignal, fallback, reducedMotion, low-frequency snapshots and destroy:
- Actual HTTP preview URL, image dimensions, path/CORS/loading checks:
- Next steps and unresolved blockers:

## Acceptance evidence

| Check | Method / environment | Actual result and evidence | Status |
| --- | --- | --- | --- |
| Schema and finite values | validateModel | Not run | Unverified |
| Neutral and pointer extremes | Actual target-artwork preview | Not run | Unverified |
| Enabled wave and continuous idle | Face, seams, roots, edges, motionScale | Not run | Unverified |
| Desktop / mobile / keyboard / touch | Target viewport and input | Not run | Unverified |
| Reduced motion and static fallback | OS preference / simulated load failure | Not run | Unverified |
| Cancellation and navigation cleanup | Rapid replacement / leave preview | Not run | Unverified |

Report document completion, schema validation and visual acceptance separately.
