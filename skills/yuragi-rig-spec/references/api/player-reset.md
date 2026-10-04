# player / reset

Restore neutral state while retaining edited model settings.

Import: `@yuragi/rig`

## Signature

```ts
(): void
```

## Parameters

No positional parameters.

## Returns

void

## Behavior, defaults and limits

The v1 player stops its timeline and resets gaze/parameters. It preserves model motion values; zero motion.weight and gaze strength when comparing against unchanged artwork.

## Example

```ts
player.reset();
```

## Related

- [simulation-parts/reset](simulation-parts-reset.md)
- [simulation-pointer-groups/reset](simulation-pointer-groups-reset.md)
- [simulation/reset](simulation-reset.md)
- [layered-simulation/reset](layered-simulation-reset.md)
- [player/play](player-play.md)
- [player/pause](player-pause.md)

- [Types and constants](types.md)
- [API index](index.md)
