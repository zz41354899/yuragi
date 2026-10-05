# layered-simulation-face / setGaze

Set independent eye direction in −1…1 per axis; requires measured eyes and does not move the head/body.

Import: `@yuragi/rig`

## Signature

```ts
(x: number, y: number): void
```

## Parameters

- `x: number` — X coordinate; units and accepted ranges are described above.
- `y: number` — Y coordinate; positive is down. Units and ranges are described above.

## Returns

void

## Behavior, defaults and limits

Requires face.eyes; missing measurements or non-finite coordinates throw. Finite input is clamped to −1…1 per axis, positive X right and Y down. Reduced motion preserves source pupils.

## Example

```ts
player.setGaze(.6, -.2);
```

## Related

- [layered-simulation-face/set-face](layered-simulation-face-set-face.md)
- [layered-simulation-face/reset](layered-simulation-face-reset.md)
- [layered-simulation-face/layer](layered-simulation-face-layer.md)
- [layered-simulation-face/eye-for](layered-simulation-face-eye-for.md)
- [layered-simulation-face/snapshot](layered-simulation-face-snapshot.md)
- [player/set-gaze](player-set-gaze.md)

- [Types and constants](types.md)
- [API index](index.md)
