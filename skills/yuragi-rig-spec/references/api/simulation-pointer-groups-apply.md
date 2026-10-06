# simulation-pointer-groups / apply

Apply shared transforms to a source vertex.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(binding: Binding | undefined, vertex: number, x: number, y: number): { x: number; y: number; }
```

## Parameters

- `binding: Binding | undefined` — Sparse binding returned by this subsystem for the same rest mesh.
- `vertex: number` — Zero-based vertex index into the bound mesh.
- `x: number` — X coordinate; units and accepted ranges are described above.
- `y: number` — Y coordinate; positive is down. Units and ranges are described above.

## Returns

{ x: number; y: number; }

## Behavior, defaults and limits

Apply shared transforms to a source vertex. vertex is a zero-based mesh index. x/y and displacement use full-source normalized coordinates. apply returns transformed absolute coordinates; displacement returns an offset. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
const mesh = simulation.buildContinuousMesh();
const binding = simulation.pointerGroups.bind(mesh.rest);
const result = simulation.pointerGroups.apply(binding, 0, mesh.rest[0], mesh.rest[1]);
```

## Related

- [simulation-pointer-groups/update](simulation-pointer-groups-update.md)
- [simulation-pointer-groups/bind](simulation-pointer-groups-bind.md)
- [simulation-pointer-groups/reset](simulation-pointer-groups-reset.md)

- [Types and constants](types.md)
- [API index](index.md)
