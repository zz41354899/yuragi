# Yuragi Studio implementation verification — 2026-10-04

Studio is prebuilt in the local package. Installation does not launch it and does not install Vite. No npm publication, deployment, image generation or remote service was added. Existing uncommitted project work was retained. Following the user’s final scope decision, Momo factories and assets remain removed; Studio bundles only Mirea. Numeric baseline fixtures continue to test the legacy v1 deformation.

## Implemented scope

- CLI `yuragi studio`: selected project/output roots, available port by default, `--port`, `--no-open`, loopback-only server and session-authenticated writes.
- Shared-surface v1 editing: pins/parent relationships, parts, polygons/exclusions, rigid/weighted regions, roots/tips, head/neck, eyes, motion, undo/redo and saved drafts. Invalid drafts retain the last valid player.
- Layered v2: source-derived nodes, attachments/draw order, mesh, preview and diagnostics; editing is rejected in both the document and export server.
- Model/asset fingerprints separate structural validation from manual review. Exports create new version folders with model, assets, observations and Vue/React/vanilla examples. Historical annotations are not re-certified.
- API catalogue: 78 independent callable pages, 41 types/constants, every manifest export entry (including bundled assets), and English skill references. TypeScript signatures and reachable simulation subsystem methods are extracted from the owning source. Behavior/examples are shared with the website.

## Checks passed

- `npm run typecheck`: rig, site and Studio workspaces.
- `npm test`: 61 rig tests + 15 site tests, including numeric deformation baselines, cancellation/cleanup, source-coordinate transforms, document history, invalid drafts, review invalidation, symlink containment and the npm-bin symlink regression.
- `npm run build`, followed by the site build after final catalogue and translation updates.
- All 78 API examples compile against public TypeScript contracts; generated skill/API files match actual exports.
- Both skills pass `quick_validate.py` using the existing cached PyYAML module (no Python dependency installation).
- Final tarball installed offline into `/private/tmp/yuragi-studio-install-20261004/mirea-consumer`: only the rig package installed initially. Vue and React remain optional peers, and Vite is absent. CLI help through both the npm bin and `npx --no-install yuragi` works.
- `scripts/verify-studio-package.mjs`: packaged UI/assets, the bundled Mirea character, session authentication, draft persistence, versioned exports and exported-model reload. Also tested authored v2 input, rejected v2 edits and reloaded its delivered model/assets.
- Delivered integration examples for both v1 and v2 compile with `vue-tsc` against the isolated tarball. Framework/type packages were copied only into the QA consumer for this compilation.
- Live browser: zoomed drag, keyboard adjustment, invalid numeric edits, draft reload, model examples, v2 read-only inspection, 390px configured responsive panels, API search/separate methods, English/Japanese pages, legacy query redirect and the preserved website playground.
- Temporary browser fixtures simulate WebGL failure and reduced-motion preference: fallback artwork remains loaded; export is disabled on renderer failure; reduced-motion diagnostics report zero displacement gradient. Production UI/runtime and OS preferences were not changed by these fixtures.
- `git diff --check` passed.

## Evidence and limits

- [Studio](studio.jpg), [API index](api.jpg), [narrow inspector](mobile.jpg), [fallback](fallback.jpg), [reduced motion](reduced-motion.jpg), [website playground](playground.jpg).
- Browser QA does not certify a user's character. Test export checkboxes were synthetic and explicitly identified as such in their notes. Physical touch devices, other GPUs and operating-system preference switching remain untested. Each real character still requires its own visual acceptance.
- The website build retains its existing large-chunk advisory; the build succeeds.

## Local package

- `yuragi-rig-0.2.0.tgz`
- SHA-256: `f1c86041b919045e05b2fa8a0be8220cebe31a757ee0174098b96eddb240f909`
- Reproduce packaging: `npm run build:lib`, then `npm pack --workspace @yuragi/rig --pack-destination /your/output`.
- Install with the actual tarball path, then run `npx yuragi studio --project ./my-character --out ./yuragi-output`.
