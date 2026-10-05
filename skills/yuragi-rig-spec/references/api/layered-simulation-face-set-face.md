# layered-simulation-face / setFace

Set v2 eye openness, mouth shape and openness; missing assets or invalid values throw.

Import: `@yuragi/rig`

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
player.setFace({ eyeOpenLeft: 0, eyeOpenRight: 0 });
```

## Related

- [layered-simulation-face/reset](layered-simulation-face-reset.md)
- [layered-simulation-face/layer](layered-simulation-face-layer.md)
- [layered-simulation-face/eye-for](layered-simulation-face-eye-for.md)
- [layered-simulation-face/set-gaze](layered-simulation-face-set-gaze.md)
- [layered-simulation-face/snapshot](layered-simulation-face-snapshot.md)
- [layered-simulation/set-face](layered-simulation-set-face.md)

- [Types and constants](types.md)
- [API index](index.md)
