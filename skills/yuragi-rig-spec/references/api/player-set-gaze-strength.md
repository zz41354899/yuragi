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

Finite 0…1 is required. This changes only pupil translation; v1 does not support blink/mouth/expression tracks; v2 attachment-based setFace is separate.

## Example

```ts
player.setGazeStrength(.8);
```

## Related

- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/advance](player-advance.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)
- [player/set-parameter](player-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
