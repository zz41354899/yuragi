# Yuragi Studio / Agent workflow verification

Verified locally on 2026-10-04. No deployment or npm publication was performed.

## Delivered behavior

- Studio uses the Yuragi logo, fonts, blue controls, custom dropdowns, desktop three-column layout and mobile Preview / Parts / Review tabs. Traditional Chinese is the default; English and Japanese are available.
- Preview controls do not edit bindings. Original, neutral, animation and synchronized side-by-side comparison support zoom, pan, selected-part fit, mesh and annotation overlays.
- Issues save a frozen pose, source coordinates, model/material fingerprints, observation and screenshot into local `review/issues.json`. Existing issues remain until a human explicitly resolves them.
- Optional project catalogs retain immutable versions and dependency fingerprints. Validated new versions are offered by polling; switching preserves the view. Invalid/incomplete builds keep the prior valid preview. Acceptance is specific to the current fingerprints.
- Agent Skill and site guide document inspect → visual annotation → extraction → binding/build → Studio review → issue report → fresh version. Python records actual runtime identity/capabilities and version.
- `yuragi review` renders the actual player at shared deterministic time steps, with 14 base poses, detail crops and contact sheets. Models with face capabilities add seven face poses.
- Optional v2 hair coupling, masks and local mesh refinement are compiled from authoring manifests. Optional eye curves/attachments, half/closed-eye sprites and closed/A/I/U/E/O mouth sprites have gaze/face controls and asset validation.

## Automated verification

- `npm run typecheck`: passed.
- `npm test`: 68 rig tests and 15 site tests passed (83 total).
- `npm run build`: passed. The site retains the existing >500 kB bundle advisory.
- Bundled Python unittest suite: 36 tests passed, covering extraction, layered compilation and project publication/dependencies.
- Full Mirea position-buffer SHA-256 baselines at frames 0, 59, 119 and 179 match for both shared and layered simulation. Portable fixture: `packages/rig/test/fixtures/mirea-studio-baseline.json`; original saved baseline: `baseline-before.json`.
- API generation, translation/resource checks and public API examples passed. Catalog contains 91 callable entries and 48 type/constant entries.

## Browser and workflow verification

- Inspected the live desktop Studio and 390 × 844 mobile layout, zoom, selected-part fit, keyboard/pointer pose controls, issue saving, languages, custom version dropdowns and synchronized comparison.
- Recorded a real issue against the layered face fixture, read the saved report, compiled a new manifest into a separate version directory and registered it. Studio detected the new version and preserved 125% zoom when loading it. Returning to the old version retained its unresolved issue.
- Generated and visually inspected layered Mirea's 14-pose sheet (`layered-review/`) and the supplied geometric face fixture's 21-pose sheet (`face-fixture/compiled/review/`). Generating these sheets is not recorded as human acceptance.
- Desktop and mobile screenshots: `studio-desktop.jpg` and `studio-mobile.jpg`.

## Independent package installation

- Packed `package/yuragi-rig-0.2.0.tgz`; installed it into `/private/tmp/yuragi-install-20261004-XL1lpr` with Vue, React and optional local Playwright. Reinstalled the final tarball offline and reran the smoke script successfully.
- The installed package opened Studio and generated v1 Mirea and v2 face review sheets without loading the Yuragi source checkout.
- Vue/React v1/v2 imports and SSR rendering passed. Actual Chromium Vue rendering passed reduced-motion/static-mesh checks, WebGL-context-loss fallback, invalid-atlas fallback and unmount/resource cleanup. React client interaction was not separately exercised in the browser.
- Saved consumer smoke script, rendered-browser check and its JSON result under `install-verification/`. The scripts are consumer examples and expect the isolated fixture folders/dependencies described above.

## Material limitations

- Mirea's original illustration and existing behavior are preserved. Its missing eye/closed-eye/mouth artwork is listed and the corresponding tests remain disabled. No character artwork was generated; the geometric face fixture verifies implementation, not Mirea's artistic quality.
- Human visual acceptance remains separate from format, material and geometry validation. No acceptance is automatically carried to a changed model/material fingerprint.
- Browser checks used local desktop Chromium and a mobile viewport; physical-phone/GPU coverage was not performed.
- Mesh Avatar Studio was inspected as a reference. No source code or character artwork from it was copied.

The ready-to-use local preview is `http://127.0.0.1:4340/` while its CLI process remains running.
