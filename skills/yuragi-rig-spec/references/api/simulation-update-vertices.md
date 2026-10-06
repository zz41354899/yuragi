# simulation / updateVertices

Write the simulated pose into mesh positions and return deformation diagnostics.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(surface: RigMesh, time: number, neutral?: boolean): { motionScale: number; maxDisplacementGradient: number; }
```

## Parameters

- `surface: RigMesh` — The mutable mesh positions with immutable rest positions and triangle indices.
- `time: number` — Milliseconds from the start of the simulation or clip, according to the method.
- `neutral?: boolean` (default: `false`) — Whether to evaluate neutral geometry; defaults to false.

## Returns

{ motionScale: number; maxDisplacementGradient: number; }

## Behavior, defaults and limits

Updates buffers in place; neutral=true requests neutral geometry. Diagnostics report motionScale and maximum displacement gradient, not material or artwork quality.

## Example

```ts
const diagnostics = simulation.updateVertices(mesh, 16.67);
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
