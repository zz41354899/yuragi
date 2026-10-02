# Assisted character preparation

The AI agent views the image and chooses bindings. Python measures and exports deterministic files. No remote service, API key, pretrained model or automatic semantic detector is involved. Users provide artwork and intent; the agent performs annotation and conversion.

## Local setup

Python 3.10+ and Pillow are required. Create a virtual environment in the user's working project, not inside the installed skill:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r /path/to/yuragi-rig-spec/scripts/requirements.txt
.venv/bin/python /path/to/yuragi-rig-spec/scripts/prepare_character.py inspect artwork.png --out character-inspect
```

Paths must resolve from the actual installed skill directory. Inspect exports image-info.json, inspection-grid.png and analysis.draft.json. View both the original and grid. Coordinates use the full untrimmed image, not the alpha bounding box. Opaque backgrounds remain visible and will deform. Animated inputs, unknown EXIF orientation and empty artwork are rejected.

## Agent-authored analysis

Copy the measured image object from analysis.draft.json verbatim. SHA256 binds annotations to exact source bytes; changing artwork requires new inspection. The following shows the annotation structure only; replace every coordinate with measurements from the user's artwork:

```json
{
  "version": 1,
  "image": { "sha256": "COPY_MEASURED_SHA256", "width": 1024, "height": 1536 },
  "id": "my-character", "name": "My character", "mode": "humanoid",
  "confidence": 0.9,
  "evidence": "Describe actual observed anatomy, attached props, free strands and uncertainty.",
  "headBounds": [0.3, 0.08, 0.7, 0.3],
  "landmarks": { "waist": [0.5, 0.5], "head-root": [0.5, 0.29], "head-top": [0.5, 0.1] },
  "regions": [{ "id": "visible-head", "polygon": [[0.3,0.08],[0.7,0.08],[0.7,0.3],[0.3,0.3]] }],
  "hair": [], "accessories": [], "waveSafe": false,
  "unsupportedMotions": ["Blink and lip-sync need additional assets and engine behavior."]
}
```

Humanoid requires confidence >=0.7, measured waist/head-root/head-top and headBounds [left,top,right,bottom]. Optional landmarks: shoulder-left/right, elbow-left/right, wrist-left/right. The supported wave side uses right names: annotate only when visually justified, never from guessed anatomical left/right. waveSafe=true requires shoulder-right/elbow-right/wrist-right and a visibly free suitable arm. Disable it for props or merged silhouettes.

Use silhouette for unfamiliar/nonhuman/uncertain structure: no human landmarks required, waveSafe=false, follow disabled. The default without analysis is gentle silhouette idle. confidence expresses the agent's review certainty, not a calibrated model probability.

Regions are polygons with 3–512 normalized points and unique safe IDs. These masks export full-canvas transparent PNGs. Include only visible parts; polygon boundaries can include neighboring pixels and need visual correction. Optional hair/accessories use the exact [API types](api-types.ts): hair has three distinct adjacent points, radius, phase, gain; accessory has root/tip, radius, angle, stiffness, damping, phase. IDs use lowercase letters/numbers/hyphens and start with a letter. Restrict chains to clearly observed free ends. Begin with empty arrays before adding local motion.

## Build an executable preview

Build/install the local Yuragi library first. Then:

```sh
.venv/bin/python /path/to/yuragi-rig-spec/scripts/prepare_character.py build artwork.png --analysis character-analysis.json --out character-v1 --rig-package /path/to/node_modules/@yuragi/rig
python3 -m http.server 4320 --bind 127.0.0.1 --directory character-v1
```

Open http://127.0.0.1:4320/preview.html. A built Yuragi checkout's packages/rig folder can also be used for --rig-package. The helper copies local compiled JS; it does not fetch a CDN. An updated runtime must support pose.headWarpBounds. Without --rig-package, preparation completes but playback remains unavailable.

Outputs: texture.png with source RGBA pixels and canvas preserved; image-info.json; analysis.json; model.json; binding-overlay.png; optional parts/*.png; rig-spec.md; build-report.json; preview.html; optional runtime/*.js. Never overwrite a nonempty output: corrections use character-v2, etc.

The mesh adapts to aspect ratio, and head/body regions adapt to measured anatomy. This remains a candidate: the engine's human semantics do not automatically adapt to every pose. Extracted parts are authoring files; playback deforms the full original texture.

## Visual review and correction

1. Validate using the real target runtime. Check the overlay aligns with the full image and region PNGs contain the intended visible pixels.
2. Inspect neutral pose and idle first. Then check gentle pointer extremes and only supported wave. Inspect face shape, seams, attached props, hair roots and clipping.
3. Check finite diagnostics and motionScale. Correct coordinates/chains or lower motion for distortions; disable inappropriate controls. Build another output version and repeat until the requested supported preview works.
4. Test keyboard buttons, touch/pointer input, mobile width, reduced-motion preference, missing texture/runtime fallback and leaving/reopening the page. State which are unverified.
5. Update generated rig-spec.md acceptance and build-report.json visualAcceptance from actual evidence. Keep limitations explicit. Do not label preparation alone a completed animated character.

For spec-only requests stop at documented measurements and API mapping. For unsupported hidden anatomy or expressions, provide concrete missing material/engine work rather than pretending segmentation solves it.
