# layered-player / getMeshSnapshot

Copy the last submitted mesh on demand for low-frequency inspection.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(): { rest: Float32Array; positions: Float32Array; indices: Uint16Array; }
```

## Parameters

No positional parameters.

## Returns

{ rest: Float32Array; positions: Float32Array; indices: Uint16Array; }

## Behavior, defaults and limits

v1 includes rest, positions, indices, base pin weights and pinNames. Base weights do not describe head/region/part ownership overrides. v2 includes rest, positions and indices only.

## Example

```ts
const mesh = player.getMeshSnapshot();
```

## Related

- [player/get-mesh-snapshot](player-get-mesh-snapshot.md)
- [layered-player/play](layered-player-play.md)
- [layered-player/pause](layered-player-pause.md)
- [layered-player/advance](layered-player-advance.md)
- [layered-player/set-gaze](layered-player-set-gaze.md)
- [layered-player/set-face](layered-player-set-face.md)

- [Types and constants](types.md)
- [API index](index.md)
