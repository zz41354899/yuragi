# simulation-pointer-groups / bind

Compute sparse mesh bindings for pointer groups.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(rest: Float32Array): Binding
```

## Parameters

- `rest: Float32Array<ArrayBufferLike>` — Interleaved full-source normalized x/y vertex buffer.

## Returns

Binding

## Behavior, defaults and limits

Compute sparse mesh bindings for pointer groups. rest is interleaved full-source normalized x/y. Hair columns defaults to 0; pass model columns for a regular grid. Use the returned binding only with its original mesh. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
const mesh = simulation.buildContinuousMesh();
const binding = simulation.pointerGroups.bind(mesh.rest);
```

## Related

- [simulation-hair/bind](simulation-hair-bind.md)
- [simulation-accessories/bind](simulation-accessories-bind.md)
- [simulation-parts/bind](simulation-parts-bind.md)
- [simulation-pointer-groups/update](simulation-pointer-groups-update.md)
- [simulation-pointer-groups/apply](simulation-pointer-groups-apply.md)
- [simulation-pointer-groups/reset](simulation-pointer-groups-reset.md)

- [Types and constants](types.md)
- [API index](index.md)
