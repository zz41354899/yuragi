# player / setGaze

Set independent eye direction in −1…1 per axis; requires measured eyes and does not move the head/body.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(x: number, y: number): void
```

## Parameters

- `x: number` — X coordinate; units and accepted ranges are described above.
- `y: number` — Y coordinate; positive is down. Units and ranges are described above.

## Returns

void

## Behavior, defaults and limits

Requires face.eyes; missing measurements or non-finite coordinates throw. Finite input is clamped to −1…1 per axis, positive X right and Y down. Reduced motion preserves source pupils.

## Example

```ts
player.setGaze(.6, -.2);
```

## Related

- [layered-simulation-face/set-gaze](layered-simulation-face-set-gaze.md)
- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/advance](player-advance.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-parameter](player-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
