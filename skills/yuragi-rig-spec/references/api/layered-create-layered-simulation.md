# layered / createLayeredSimulation

Compile v2 nodes, sparse weights and consecutive draw batches; call update yourself.

Import: `@yuragi/rig`

## Signature

```ts
(input: LayeredModel): { model: LayeredModel; mesh: { rest: Float32Array<ArrayBuffer>; positions: Float32Array<ArrayBuffer>; uvs: Float32Array<ArrayBuffer>; maskUVs: Float32Array<ArrayBuffer>; indices: Uint16Array<ArrayBuffer>; binding: { offsets: Uint32Array<ArrayBuffer>; indices: Uint16Array<ArrayBuffer>; weights: Float32Array<ArrayBuffer>; }; }; batches: { atlas: number; mask: boolean; opacity: number; start: number; count: number; }[]; matrices: Float64Array<ArrayBuffer>; rotations: Float64Array<ArrayBuffer>; angles: Float64Array<ArrayBuffer>; setPointer: (x: number, y: number) => void; reset: () => void; update: (time: number, delta: number, reduced?: boolean) => boolean; getPointer: () => [number, number]; }
```

## Parameters

- `input: LayeredModel` — A validated model; the constructor clones it. Model v1 and layered v2 are separate formats.

## Returns

{ model: LayeredModel; mesh: { rest: Float32Array<ArrayBuffer>; positions: Float32Array<ArrayBuffer>; uvs: Float32Array<ArrayBuffer>; maskUVs: Float32Array<ArrayBuffer>; indices: Uint16Array<ArrayBuffer>; binding: { offsets: Uint32Array<ArrayBuffer>; indices: Uint16Array<ArrayBuffer>; weights: Float32Array<ArrayBuffer>; }; }; batches: { atlas: number; mask: boolean; opacity: number; start: number; count: number; }[]; matrices: Float64Array<ArrayBuffer>; rotations: Float64Array<ArrayBuffer>; angles: Float64Array<ArrayBuffer>; setPointer: (x: number, y: number) => void; reset: () => void; update: (time: number, delta: number, reduced?: boolean) => boolean; getPointer: () => [number, number]; }

## Behavior, defaults and limits

Validates v2 and throws for invalid nodes, weights, attachments or joints. Matrices, sparse bindings and batches are engine state; do not copy them into framework UI on every frame.

## Example

```ts
const simulation = createLayeredSimulation(layeredModel);
simulation.setPointer(.2, 0);
simulation.update(16.67, 16.67);
```

## Related

- [layered/validate-layered-model](layered-validate-layered-model.md)
- [layered/create-layered-player](layered-create-layered-player.md)

- [Types and constants](types.md)
- [API index](index.md)
