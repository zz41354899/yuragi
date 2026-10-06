# Saved JSON → Python → Studio preview

The agent reads the Skill, views the original/grid/local crops and saves semantic annotations. Python measures the saved polygons, diagnoses extractability, extracts pixels and compiles bindings. Studio only previews the result. Installing a Skill alone does not run anything.

## Files and commands

Use the actual installed Skill script directory, Python/Pillow environment and built `@z7589xxz758/yuragi` package directory. Existing inspect/extract/build commands remain available.

```sh
python /actual/skill/scripts/prepare_character.py inspect source.png --out inspection-v1
# Agent views source/grid/crops and writes character-analysis.json.
python /actual/skill/scripts/workflow.py diagnose source.png \
  --analysis character-analysis.json --out diagnosis-v1
# Agent inspects measured bounds and corrects saved annotations if needed.
python /actual/skill/scripts/workflow.py run source.png \
  --analysis character-analysis.json --out character-v1 \
  --rig-package ./node_modules/@z7589xxz758/yuragi --studio
```

`run` saves diagnostics, extracts into `prepared/`, compiles into `model/` and opens Studio with output `preview/`. Omit `--studio` when building without starting a server. `--port` chooses the local port; `--no-open` leaves opening the URL to the user/agent. The process stays running while Studio is open; cancel it normally when finished. Required missing materials stop compilation but still save diagnostic JSON. Failed candidates never replace earlier versions.

For v2 pass `--manifest ./layered-authoring.json`. Explicit attachment images/masks, parents, weights and draw order belong to that manifest. If a required file is absent, diagnose first; use `prepare_character.py extract` on reviewed source regions, inspect the extracts, update the manifest to real files and retry in a fresh output folder. Visible-only cuts do not reconstruct occluded artwork. User/artist materials can use the existing `--supplements` extraction option.

| File | Written by | Meaning |
| --- | --- | --- |
| character-analysis.json | Agent; copied unchanged by Python | Source fingerprint, normalized polygons, hierarchy, binding/deformation, confidence, occlusion and protected areas |
| decomposition.json | Python | Source/analysis fingerprints, visible pixel counts/bounds, part IDs, parents and extraction actions |
| diagnosis.json | Python | Stage, required blockers, actual runtime version, extraction/format status; visual acceptance starts not-run |
| missing-assets.json | Python; also saved by Studio | Missing material IDs, part IDs, reasons, required/optional flag and nextAction |
| model/model.json | Python | Validated runtime model and relative material references |

Region-level `confidence`, `occlusion` and `protectedAreas` preserve observations. Protection affecting extraction must also use actual polygons/subtract regions; prose does not mask pixels.

## Missing material feedback

Studio displays `preview/missing-assets.json`. It contains `version:1`, `producer`, `sourceSha256`, `modelFingerprint`, `assetFingerprint`, `versionId` and `items`. Optional missing eyes/mouths do not block existing motion. Only the agent can establish that a particular source region contains the requested material.

An optional `missingAssets` array in the analysis uses this item structure:

```json
{
  "id": "rear-hair-visible",
  "partId": "rear-hair",
  "reason": "Extract the reviewed visible strand after correcting its contour.",
  "sourceRegion": "rear-hair",
  "required": false
}
```

```sh
python /actual/skill/scripts/workflow.py diagnose source.png \
  --analysis character-analysis.json \
  --missing character-v1/preview/missing-assets.json --out diagnosis-v2
```

- `extract`: a reviewed sourceRegion has visible pixels. Re-extract through Python, inspect materials and update binding/manifest before compiling.
- `revise-annotation`: the region is absent or its mask has no visible pixels. Inspect source/crops and correct annotations.
- `provide-artwork`: no reviewed extractable region exists. Request the actual image/placement/provenance. Extraction cannot create missing eyelids, closed eyes, hidden hair or mouth shapes.

Different-source reports are rejected. Use fresh folders for all reruns; do not edit verified materials while retaining old fingerprints. Required requests remain blockers until the agent records an actual fix in the analysis/material manifest. The agent saves quality observations in JSON after viewing the player or optional pose sheet; Studio does not manage acceptance or resolve issues.

The current website/Studio preview uses source-pixel pointer gaze and preserves existing eyelids and mouth. It does not request supplemental clean face, sclera, blink or mouth artwork. Keep other part diagnostics and extraction requests.
