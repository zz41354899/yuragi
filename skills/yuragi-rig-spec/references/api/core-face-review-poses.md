# core / faceReviewPoses

Return fixed face review definitions; filter by available authored assets.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(): ReviewPose[]
```

## Parameters

No positional parameters.

## Returns

ReviewPose[]

## Behavior, defaults and limits

Return fixed face review definitions; filter by available authored assets.

## Example

```ts
const poses = faceReviewPoses().filter(pose => pose.id === "eyes-closed");
```

## Related

- [core/create-player](core-create-player.md)
- [core/to-canvas](core-to-canvas.md)
- [core/create-simulation](core-create-simulation.md)
- [core/constrain-shared-surface](core-constrain-shared-surface.md)
- [core/validate-model](core-validate-model.md)
- [core/fixed-steps](core-fixed-steps.md)

- [Types and constants](types.md)
- [API index](index.md)
