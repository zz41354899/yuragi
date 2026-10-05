# player / wave

Trigger shared-surface wave progress; requires suitable visible free-arm artwork and bindings.

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

The player resumes its loop when paused; the simulation only sets progress at the supplied time. Do not use for a holding arm or claim universal limb animation.

## Example

```ts
player.wave();
```

## Related

- [simulation/wave](simulation-wave.md)
- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/advance](player-advance.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)

- [Types and constants](types.md)
- [API index](index.md)
