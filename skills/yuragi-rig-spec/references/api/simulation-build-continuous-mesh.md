# simulation / buildContinuousMesh

Build a continuous triangle mesh and bindings for a source-pixel rectangle.

Import: `@yuragi/rig`

## Signature

```ts
(spec?: MeshSpec, columns?: number, rowCount?: number): RigMesh
```

## Parameters

- `spec?: MeshSpec` (default: `{ x: 0, y: 0, width: textureSize.width, height: textureSize.height }`) — Source-pixel mesh rectangle. Omit for the full artwork.
- `columns?: number` (default: `model.mesh.columns`) — Horizontal mesh cell count; use the default shown in this signature.
- `rowCount?: number` (default: `model.mesh.rows`) — Vertical mesh cell count; defaults to the model value.

## Returns

RigMesh

## Behavior, defaults and limits

spec is a pixel-space MeshSpec; default is the full source texture. columns/rowCount default to the model mesh dimensions. The returned rest/positions use normalized full-source coordinates.

## Example

```ts
const mesh = simulation.buildContinuousMesh();
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [simulation/set-tracking](simulation-set-tracking.md)
- [simulation/set-pin](simulation-set-pin.md)
- [simulation/set-part](simulation-set-part.md)
- [simulation/rebind-pin](simulation-rebind-pin.md)
- [simulation/set-pointer](simulation-set-pointer.md)

- [Types and constants](types.md)
- [API index](index.md)
