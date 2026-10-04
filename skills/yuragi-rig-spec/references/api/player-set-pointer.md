# player / setPointer

Set centered pointer coordinates, normally −0.5…0.5 per axis; positive X is right and Y is down.

Import: `@yuragi/rig`

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

The v1 player also sets gaze. Call setPointer before setGaze for separate targets. Simulation-only setPointer has no face compositor. v2 drives the authored node response and does not provide the v1 face APIs.

## Example

```ts
player.setPointer(.2, -.1);
```

## Related

- [simulation/set-pointer](simulation-set-pointer.md)
- [layered-simulation/set-pointer](layered-simulation-set-pointer.md)
- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/set-gaze](player-set-gaze.md)
- [player/set-parameter](player-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
