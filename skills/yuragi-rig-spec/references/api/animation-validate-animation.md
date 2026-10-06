# animation / validateAnimation

Validate tracks and keyframes. Gaze-strength tracks require reviewed face features.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(clip: AnimationClip, face?: boolean): void
```

## Parameters

- `clip: AnimationClip` — AnimationClip with finite duration, valid tracks and ordered keyframes.
- `face?: boolean` (default: `false`) — Whether this clip has reviewed eyes; false by default.

## Returns

void

## Behavior, defaults and limits

The reviewed-face flag defaults to false. Track targets are parameter, gaze/strength and motion/weight. No arbitrary bone tracks, expressions or Spine imports.

## Example

```ts
validateAnimation(clip, Boolean(model.face));
```

## Related

- [animation/sample-curve](animation-sample-curve.md)
- [animation/sample-track](animation-sample-track.md)

- [Types and constants](types.md)
- [API index](index.md)
