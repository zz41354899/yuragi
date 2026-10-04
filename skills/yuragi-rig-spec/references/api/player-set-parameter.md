# player / setParameter

Set lookX/lookY (−30…30), bodyX (−10…10) or wave (0…1).

Import: `@yuragi/rig`

## Signature

```ts
(name: ParameterName, value: number): void
```

## Parameters

- `name: ParameterName` — An existing pin name or supported ParameterName, according to the signature.
- `value: number` — Finite numeric input or unknown data to validate, according to the signature.

## Returns

void

## Behavior, defaults and limits

The player rejects non-finite or unknown parameter inputs. The simulation returns a success boolean. lookX/lookY setters and parameter animation tracks restore gaze following the head.

## Example

```ts
player.setParameter("bodyX", 4);
```

## Related

- [simulation/set-parameter](simulation-set-parameter.md)
- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)
- [player/set-motion](player-set-motion.md)

- [Types and constants](types.md)
- [API index](index.md)
