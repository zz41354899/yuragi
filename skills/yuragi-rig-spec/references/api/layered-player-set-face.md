# layered-player / setFace

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

- [layered-simulation-face/set-face](layered-simulation-face-set-face.md)
- [layered-simulation/set-face](layered-simulation-set-face.md)
- [layered-player/play](layered-player-play.md)
- [layered-player/pause](layered-player-pause.md)
- [layered-player/advance](layered-player-advance.md)
- [layered-player/set-gaze](layered-player-set-gaze.md)

- [Types and constants](types.md)
- [API index](index.md)
