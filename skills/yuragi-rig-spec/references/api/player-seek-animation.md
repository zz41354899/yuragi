# player / seekAnimation

Seek the current clip in milliseconds and apply its sampled pose.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(time: number): void
```

## Parameters

- `time: number` — Milliseconds from the start of the simulation or clip, according to the method.

## Returns

void

## Behavior, defaults and limits

Time must be finite and a clip must be active, otherwise throws. Clamps milliseconds to 0…duration. Seeking does not resume a paused clip.

## Example

```ts
player.seekAnimation(500);
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
