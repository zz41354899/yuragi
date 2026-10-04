# Mirea packaged sample and installation docs — 2026-10-03

- Main installation flow uses `assets/mirea/texture.png` and `assets/mirea/model.json`, copied to `public/models/mirea`. The displayed main tree contains Mirea and starter; Momo compatibility is explained separately in a disclosure.
- Public opt-in entry: `@yuragi/rig/mirea`, `createMireaModel()`; no character-data re-export was added to the core entry.
- Canonical packaged model matches the reviewed sandbox model except the public texture URL. PNG fingerprint and dimensions are tested, and factories return independent data.
- Site, Vue/React/vanilla integration examples, READMEs and Skill API references use the packaged Mirea sample. Original Momo assets and baseline remain.
- Root typecheck, 43 rig tests, 11 site tests, build and git diff --check passed. Skill distributions synchronize through site test/build prehooks.
- Local tarball was installed in an isolated temporary project. Imports, model validation, the documented asset copy command, file identity and SSR-safe module imports passed. See install-verification.json.
- Browser proof: qa/installation-mirea.png. Live URL: http://127.0.0.1:4310/docs?section=installation&framework=vue.
- No npm publication, deployment or independent layered playback is claimed.
