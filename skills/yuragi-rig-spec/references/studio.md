# Local Yuragi Studio

Studio is a prebuilt Vue authoring tool bundled with the local `@yuragi/rig` package. Users need Node.js/npm, not Vite. Python/Pillow are only required for the existing inspect/extract/build preparation flow. No npm publication is implied.

## Prepare and open

Read the Skill and [API index](api/index.md) first. View the actual source artwork and inspect grid, write fingerprint-bound annotations, run extract and build with the real built runtime, then open the resulting character folder:

```sh
npm install /actual/path/to/yuragi-rig-0.2.0.tgz
npx yuragi studio --project ./character-v1 --out ./yuragi-output
```

In the Yuragi checkout, `npm run pack:lib` builds the library and Studio and creates the tarball. A local source-directory installation also requires that build first. Use the actual checkout/tarball path, never the developer’s hardcoded machine path. Installing the package does not start Studio or install Skills. `--no-open` prints the URL without opening it; `--port 4321` chooses a port. With no project, Studio opens a start screen with the Mirea example. It listens only on 127.0.0.1.

The project needs `model.json` and its referenced local relative images. v1 Python output is supported directly; analysis.json, character-analysis.json, report.json, image-info.json and parts-manifest.json are optional historical records. v2 needs its authored model, atlas images and fallback. Remote, absolute and escaping image paths are rejected; rewrite references relative to model.json before opening.

## Edit and review

v1 supports pins/parents, polygons, roots/tips, exclusions, region ownership, head/neck, measured eyes and motion settings. New geometry is a draft to measure against actual artwork, not an inferred anatomy result. Coordinates use the entire original image including margins: top-left (0,0), bottom-right (1,1), positive X right and Y down. Do not use canvas padding, zoomed display pixels or trimmed bounds as source coordinates.

Edit mode uses unchanged geometry. Select a point/polygon in the structure or inspector, drag handles or use arrow keys (Shift for larger steps). Numeric fields expose the exact model contract. Re-draw a selected polygon by clicking reviewed vertices, then Finish. Fix invalid edits or Undo; Studio retains the last valid preview. Optional geometry can be removed in the inspector. The full model editor exposes existing chains, tracking, pointer groups, mesh and protected areas.

Layered v2 is inspection-only: view nodes, attachment order/coverage, atlas metadata, meshes and diagnostics; do not claim that the tool creates independent layers or weights. Visible-only coverage still needs completed occluded artwork before large-motion acceptance.

Compare source artwork, neutral geometry, four directions/corners, rapid reversal, eyes at zoom, roots, seams, clipping and prop contacts. Test reduced motion and WebGL failure in the actual browser. Record missing/N/A anatomy, observations, devices and untested cases in notes. The checkboxes are explicit human observations, never automatically passed by the preset buttons or format validation. Changes clear review; saved drafts do not restore old acceptance.

## Save and deliver

Save draft at any time, including invalid edits. Drafts live under the selected output root; original artwork, annotations and prepared extraction fingerprints remain unchanged. Edits make the model authoritative; old annotations remain historical evidence and are not re-extracted or re-certified. Source-image changes require reopening and repeating review.

Delivery requires successful model validation and all current visual checks. It creates a new versioned folder containing model.json, local assets, acceptance.json and examples for Vue, React and vanilla JS. Each model image reference is rewritten relative to the delivered folder. Copy model.json and assets/ into the consuming project’s public/models/character; use the provided loader to resolve URLs relative to the model URL. Examples respect reduced motion, provide source-art fallback, cancel loads and clean resources on unmount. Actual physical devices/other GPUs remain untested unless recorded in notes.

Use [individual API references](api/index.md) when adjusting integration behavior. Do not claim universal auto-rigging, hidden-pixel reconstruction, Spine import, IK, npm publication, hosted services or MCP/Plugin support.
