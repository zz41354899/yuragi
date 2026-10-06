# layered-simulation-face / snapshot

Read face and gaze state; reduced motion returns neutral values.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(reduced?: boolean): { gaze: Vec2; eyeOpenLeft: number; eyeOpenRight: number; mouthOpen: number; mouthShape: MouthShape; }
```

## Parameters

- `reduced?: boolean` (default: `false`) — Whether to evaluate reduced-motion neutral geometry; defaults to false.

## Returns

{ gaze: Vec2; eyeOpenLeft: number; eyeOpenRight: number; mouthOpen: number; mouthShape: MouthShape; }

## Behavior, defaults and limits

Read face and gaze state; reduced motion returns neutral values.

## Example

```ts
const pose = simulation.face.snapshot();
```

## Related

- [layered-simulation-face/set-face](layered-simulation-face-set-face.md)
- [layered-simulation-face/reset](layered-simulation-face-reset.md)
- [layered-simulation-face/layer](layered-simulation-face-layer.md)
- [layered-simulation-face/eye-for](layered-simulation-face-eye-for.md)
- [layered-simulation-face/set-gaze](layered-simulation-face-set-gaze.md)

- [Types and constants](types.md)
- [API index](index.md)
