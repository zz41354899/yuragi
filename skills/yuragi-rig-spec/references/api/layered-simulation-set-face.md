# layered-simulation / setFace

Set v2 eye openness, mouth shape and openness; missing assets or invalid values throw.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(pose: LayeredFacePose): void
```

## Parameters

- `pose: LayeredFacePose` — Authored face pose patch; openness values in 0…1.

## Returns

void

## Behavior, defaults and limits

Set v2 eye openness, mouth shape and openness; missing assets or invalid values throw.

## Example

```ts
simulation.setFace({ eyeOpenLeft: 0, eyeOpenRight: 0 });
```

## Related

- [layered-simulation-face/set-face](layered-simulation-face-set-face.md)
- [layered-simulation/set-pointer](layered-simulation-set-pointer.md)
- [layered-simulation/reset](layered-simulation-reset.md)
- [layered-simulation/update](layered-simulation-update.md)
- [layered-simulation/get-pointer](layered-simulation-get-pointer.md)
- [layered-player/set-face](layered-player-set-face.md)

- [Types and constants](types.md)
- [API index](index.md)
