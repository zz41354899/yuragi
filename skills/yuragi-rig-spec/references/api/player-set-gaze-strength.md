# player / setGazeStrength

Set gaze strength in 0…1, default 1; unavailable without face features.

Import: `@yuragi/rig`

## Signature

```ts
(value: number): void
```

## Parameters

- `value: number` — Finite numeric input or unknown data to validate, according to the signature.

## Returns

void

## Behavior, defaults and limits

Finite 0…1 is required. This changes only pupil translation; blinking, mouth expressions and expression tracks are not supported in 0.2.0.

## Example

```ts
player.setGazeStrength(.8);
```

## Related

- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)
- [player/set-parameter](player-set-parameter.md)
- [player/set-motion](player-set-motion.md)

- [Types and constants](types.md)
- [API index](index.md)
