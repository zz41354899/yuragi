# simulation-parts / displacement

Sample parts displacement at a vertex.

Import: `@yuragi/rig`

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

Sample parts displacement at a vertex. vertex is a zero-based mesh index. x/y and displacement use full-source normalized coordinates. apply returns transformed absolute coordinates; displacement returns an offset. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
const mesh = simulation.buildContinuousMesh();
const binding = simulation.parts.bind(mesh.rest);
const result = simulation.parts.displacement(binding, 0, mesh.rest[0], mesh.rest[1]);
```

## Related

- [simulation-hair/displacement](simulation-hair-displacement.md)
- [simulation-accessories/displacement](simulation-accessories-displacement.md)
- [simulation-parts/update](simulation-parts-update.md)
- [simulation-parts/bind](simulation-parts-bind.md)
- [simulation-parts/reset](simulation-parts-reset.md)

- [Types and constants](types.md)
- [API index](index.md)
