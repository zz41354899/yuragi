# layered-simulation-face / layer

Read face attachment visibility, clipping and iris translation.

Import: `@yuragi/rig`

## Signature

```ts
(id: string, reduced?: boolean): { opacity: number; eye: LayeredEye | undefined; open: number; clip: boolean | undefined; shift: Vec2; }
```

## Parameters

- `id: string` — The ID of an existing authored part.
- `reduced?: boolean` (default: `false`) — Whether to evaluate reduced-motion neutral geometry; defaults to false.

## Returns

{ opacity: number; eye: LayeredEye | undefined; open: number; clip: boolean | undefined; shift: Vec2; }

## Behavior, defaults and limits

Read face attachment visibility, clipping and iris translation.

## Example

```ts
const state = simulation.face.layer("left-iris");
```

## Related

- [layered-simulation-face/set-face](layered-simulation-face-set-face.md)
- [layered-simulation-face/reset](layered-simulation-face-reset.md)
- [layered-simulation-face/eye-for](layered-simulation-face-eye-for.md)
- [layered-simulation-face/set-gaze](layered-simulation-face-set-gaze.md)
- [layered-simulation-face/snapshot](layered-simulation-face-snapshot.md)

- [Types and constants](types.md)
- [API index](index.md)
