# player / getSnapshot

Read current state and diagnostics; snapshots are not a frame clock.

Import: `@yuragi/rig`

## Signature

```ts
(): RigSnapshot
```

## Parameters

No positional parameters.

## Returns

RigSnapshot

## Behavior, defaults and limits

Read current state and diagnostics; snapshots are not a frame clock.

## Example

```ts
const snapshot = player.getSnapshot();
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
