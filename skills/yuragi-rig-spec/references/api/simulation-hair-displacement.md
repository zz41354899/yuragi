# simulation-hair / displacement

Sample hair displacement at a vertex.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(binding: Binding, vertex: number): { x: number; y: number; }
```

## Parameters

- `binding: Binding` — Sparse binding returned by this subsystem for the same rest mesh.
- `vertex: number` — Zero-based vertex index into the bound mesh.

## Returns

{ x: number; y: number; }

## Behavior, defaults and limits

Sample hair displacement at a vertex. vertex is a zero-based mesh index. x/y and displacement use full-source normalized coordinates. apply returns transformed absolute coordinates; displacement returns an offset. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
const mesh = simulation.buildContinuousMesh();
const binding = simulation.hair.bind(mesh.rest, model.mesh.columns);
const result = simulation.hair.displacement(binding, 0);
```

## Related

- [simulation-hair/update](simulation-hair-update.md)
- [simulation-hair/bind](simulation-hair-bind.md)
- [simulation-accessories/displacement](simulation-accessories-displacement.md)
- [simulation-parts/displacement](simulation-parts-displacement.md)

- [Types and constants](types.md)
- [API index](index.md)
