# layered-player / getSnapshot

Read current state and diagnostics; snapshots are not a frame clock.

Import: `@yuragi/rig`

## Signature

```ts
(): LayeredSnapshot
```

## Parameters

No positional parameters.

## Returns

LayeredSnapshot

## Behavior, defaults and limits

Read current state and diagnostics; snapshots are not a frame clock.

## Example

```ts
const snapshot = player.getSnapshot();
```

## Related

- [player/get-snapshot](player-get-snapshot.md)
- [layered-player/play](layered-player-play.md)
- [layered-player/pause](layered-player-pause.md)
- [layered-player/set-pointer](layered-player-set-pointer.md)
- [layered-player/reset](layered-player-reset.md)
- [layered-player/get-model](layered-player-get-model.md)

- [Types and constants](types.md)
- [API index](index.md)
