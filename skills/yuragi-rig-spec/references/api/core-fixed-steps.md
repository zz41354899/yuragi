# core / fixedSteps

Split 0–60000 milliseconds into fixed steps and a final remainder.

Import: `@yuragi/rig`

## Signature

```ts
(milliseconds: number, step: (delta: number) => void): void
```

## Parameters

- `milliseconds: number` — Finite elapsed milliseconds, 0…60000.
- `step: (delta: number) => void` — Callback receiving each fixed delta in milliseconds.

## Returns

void

## Behavior, defaults and limits

Split 0–60000 milliseconds into fixed steps and a final remainder.

## Example

```ts
fixedSteps(1000, delta => console.log(delta));
```

## Related

- [core/create-player](core-create-player.md)
- [core/to-canvas](core-to-canvas.md)
- [core/create-simulation](core-create-simulation.md)
- [core/constrain-shared-surface](core-constrain-shared-surface.md)
- [core/validate-model](core-validate-model.md)
- [core/face-review-poses](core-face-review-poses.md)

- [Types and constants](types.md)
- [API index](index.md)
