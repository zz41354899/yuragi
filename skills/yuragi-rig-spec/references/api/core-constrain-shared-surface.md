# core / constrainSharedSurface

Limit triangle displacement gradients by scaling the positions buffer in place.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(surface: Pick<RigMesh, "rest" | "positions" | "indices">, limit?: number): { motionScale: number; maxDisplacementGradient: number; }
```

## Parameters

- `surface: Pick<RigMesh, "rest" | "positions" | "indices">` — The mutable mesh positions with immutable rest positions and triangle indices.
- `limit?: number` (default: `.65`) — Maximum displacement gradient; defaults to 0.65.

## Returns

{ motionScale: number; maxDisplacementGradient: number; }

## Behavior, defaults and limits

Mutates positions, not rest/indices. The default gradient limit is 0.65. It is a geometric limiter, not a guarantee of visual acceptance.

## Example

```ts
const simulation = createSimulation(model);
const mesh = simulation.buildContinuousMesh();
const diagnostics = constrainSharedSurface(mesh, .65);
```

## Related

- [core/create-player](core-create-player.md)
- [core/to-canvas](core-to-canvas.md)
- [core/create-simulation](core-create-simulation.md)
- [core/validate-model](core-validate-model.md)
- [core/fixed-steps](core-fixed-steps.md)
- [core/face-review-poses](core-face-review-poses.md)

- [Types and constants](types.md)
- [API index](index.md)
