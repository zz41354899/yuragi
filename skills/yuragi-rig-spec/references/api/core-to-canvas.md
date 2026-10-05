# core / toCanvas

Convert source-normalized coordinates to canvas coordinates with 12% padding.

Import: `@yuragi/rig`

## Signature

```ts
(n: number): number
```

## Parameters

- `n: number` — Source-normalized coordinate.

## Returns

number

## Behavior, defaults and limits

CANVAS_PADDING is 0.12. Center remains 0.5. Positive source Y points down. Do not mix source coordinates, pointer offsets and parameter degrees.

## Example

```ts
const center = toCanvas(.5);
```

## Related

- [core/create-player](core-create-player.md)
- [core/create-simulation](core-create-simulation.md)
- [core/constrain-shared-surface](core-constrain-shared-surface.md)
- [core/validate-model](core-validate-model.md)
- [core/fixed-steps](core-fixed-steps.md)
- [core/face-review-poses](core-face-review-poses.md)

- [Types and constants](types.md)
- [API index](index.md)
