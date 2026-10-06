# Local Studio preview

Studio is the preview-only viewer for models produced by the agent's [saved JSON / Python workflow](agent-workflow.md). The agent saves annotation, decomposition, diagnosis and quality records. Studio does not edit contours/bindings, launch an agent, collect issue forms, manage acceptance or deliver a model.

```sh
npm install /actual/path/to/z7589xxz758-yuragi-0.2.0.tgz
npx yuragi studio --project ./character-v1/model --out ./character-v1/preview
```

Studio is prebuilt in the local runtime package; consumer projects do not need Vite. Skill, Python/Pillow and Node/npm are separate installations. The Skill's workflow.py run ... --studio compiles successfully before invoking the installed CLI. No npm publication is implied.

## Preview controls

Play, pause, reset pose, source/model comparison, zoom/pan and fixed poses affect only the view. Optional part location and mesh/annotation overlays help examine deformation. Face controls appear only for actual supplied/bound capabilities. Mobile separates preview from controls; Traditional Chinese is default, with English and Japanese available.

The server automatically saves OUT/missing-assets.json with source/model/material fingerprints and material IDs, and displays its path. Ask the agent to read it and return to Python diagnosis/extraction. The UI has no save button or repair operation. Hidden artwork requires supplied materials; missing optional eyes/mouths leave existing motion usable. Python diagnostics copied alongside the model remain authoring evidence.

Old folders with model.json and local relative PNG/WebP/JPEG references still open. Optional project.json catalogs support independent version folders. Studio checks versions every two seconds while visible, offers valid new versions and preserves zoom/pan when switching. Failed loads preserve the previous valid preview. Use project.py to validate/register complete versions; never overwrite published files.

--port 4321 chooses the port; --no-open prints the URL. Omitting --project opens the bundled Mirea start screen. Studio listens only on 127.0.0.1. All files stay local.

## Optional agent pose sheets

```sh
npm install -D playwright
npx playwright install chromium
npx yuragi review --project ./character-v1/model --out ./character-v1/model/review
```

Output must be a fresh folder. Actual-player 60Hz stepping produces full frames, detail crops, a contact sheet and fingerprint-bound poses.json. The agent views these artifacts and records observations in JSON. Executed rendering and format checks are separate from human visual acceptance. See [v2 authoring](layered-authoring.md) for independent hair, mesh and face attachments.

Reviewed v1 eyes expose pointer tracking and a strength slider. Pointer coordinates account for zoom/pan; leaving returns gaze to neutral. Blink/mouth controls and requests for supplemental facial artwork are absent. Existing v1/v2 models still open.
