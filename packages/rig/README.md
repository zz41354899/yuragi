# @yuragi/rig

A TypeScript single-surface illustration rig extracted from the Momo character in Kirameki Catch.

## Entry points

- `@yuragi/rig`: WebGL player, pure simulation, model validation, Momo preset, TypeScript types.
- `@yuragi/rig/vue`: `YuragiCharacter` Vue 3 component.
- `@yuragi/rig/react`: `YuragiCharacter` React 18/19 component.

Vue and React are optional peer dependencies. Importing the core does not import either framework.

```ts
import { createPlayer, createMomoModel } from '@yuragi/rig'
const player = await createPlayer({
  canvas: document.querySelector<HTMLCanvasElement>('canvas')!,
  model: createMomoModel('/models/momo/texture.webp'),
})
player.wave()
player.setMotion({ hair: 1.2, sway: .8 })
player.destroy()
```

The package includes `assets/momo/model.json`, `assets/momo/texture.webp`, and `assets/starter/model.json`. After installation, copy `node_modules/@yuragi/rig/assets/momo` to your app's `public/models/momo` and pass that image URL to `createMomoModel`. Files are not automatically copied into your application by installation.

The pure `createSimulation(model)` API allows a custom renderer to consume `mesh.positions`, `mesh.uvs`, and `mesh.indices`. Model data is serializable, validated, and cloned per simulation. The initial pose behaviors use semantic humanoid pin names from Momo; binding a new character requires configuring its own image, pins, pose regions, and local chains.

See the accompanying Vue documentation site for options, adapters, editable fields, and lifecycle behavior. This local preview package has not been published to the npm registry.

For a custom character, follow the complete guide at `/docs?section=custom-character` on the accompanying site: prepare artwork, create a model, bind pins and local chains, verify deformation, then load the validated JSON through the Vue or React adapter. The guide includes all model field ranges and error handling. The repository also provides `docs/custom-character.zh-TW.md`; the humanoid starter comes with the installed package at `assets/starter/model.json`. The website offers no standalone JSON downloads or model exports.

Extensibility does not mean automatic rigging. Momo-like humanoids are the easiest starting point; animals and other structures need new motion bindings. The current website playground edits Momo settings and forces the Momo texture on import.

For an artwork-specific head position, set optional `pose.headWarpBounds` to the measured increasing `[topY, bottomY]` (0–1). When omitted, the original Momo head-warp behavior is retained. The repository provides English agent skills and a local Python preparation helper at `skills/yuragi-rig-spec`; AI supplies image interpretation, while the helper measures pixels and exports a candidate model and local preview. Visible-region extracts do not reconstruct hidden pixels or create independent runtime layers.
