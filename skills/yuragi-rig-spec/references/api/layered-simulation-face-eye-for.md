# layered-simulation-face / eyeFor

Find the authored eye owning an attachment.

Import: `@yuragi/rig`

## Signature

```ts
(id: string): LayeredEye | undefined
```

## Parameters

- `id: string` — The ID of an existing authored part.

## Returns

LayeredEye | undefined

## Behavior, defaults and limits

Find the authored eye owning an attachment.

## Example

```ts
const eye = simulation.face.eyeFor("left-iris");
```

## Related

- [layered-simulation-face/set-face](layered-simulation-face-set-face.md)
- [layered-simulation-face/reset](layered-simulation-face-reset.md)
- [layered-simulation-face/layer](layered-simulation-face-layer.md)
- [layered-simulation-face/set-gaze](layered-simulation-face-set-gaze.md)
- [layered-simulation-face/snapshot](layered-simulation-face-snapshot.md)

- [Types and constants](types.md)
- [API index](index.md)
