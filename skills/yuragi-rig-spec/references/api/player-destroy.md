# player / destroy

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

- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/advance](player-advance.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)
- [player/set-parameter](player-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
