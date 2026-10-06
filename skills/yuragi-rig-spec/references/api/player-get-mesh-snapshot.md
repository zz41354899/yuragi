# player / getMeshSnapshot

Copy the last submitted mesh on demand for low-frequency inspection.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(): RigMeshSnapshot
```

## Parameters

No positional parameters.

## Returns

RigMeshSnapshot

## Behavior, defaults and limits

v1 includes rest, positions, indices, base pin weights and pinNames. Base weights do not describe head/region/part ownership overrides. v2 includes rest, positions and indices only.

## Example

```ts
const mesh = player.getMeshSnapshot();
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
