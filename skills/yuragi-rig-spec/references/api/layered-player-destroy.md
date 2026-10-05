# layered-player / destroy

Stop playback, detach listeners and release GPU resources; repeated calls are safe.

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

After destruction, create a new player to resume. Resource cleanup is idempotent. An AbortSignal also triggers cleanup.

## Example

```ts
player.destroy();
```

## Related

- [player/destroy](player-destroy.md)
- [layered-player/play](layered-player-play.md)
- [layered-player/pause](layered-player-pause.md)
- [layered-player/advance](layered-player-advance.md)
- [layered-player/set-gaze](layered-player-set-gaze.md)
- [layered-player/set-face](layered-player-set-face.md)

- [Types and constants](types.md)
- [API index](index.md)
