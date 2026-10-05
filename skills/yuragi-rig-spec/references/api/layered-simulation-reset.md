# layered-simulation / reset

Restore neutral state while retaining edited model settings.

Import: `@yuragi/rig`

## Signature

```ts
(): void
```

## Parameters

No positional parameters.

## Returns

void

## Behavior, defaults and limits

The v1 player stops its timeline and resets gaze/parameters. It preserves model motion values; zero motion.weight and gaze strength when comparing against unchanged artwork.

## Example

```ts
simulation.reset();
```

## Related

- [simulation-parts/reset](simulation-parts-reset.md)
- [simulation-pointer-groups/reset](simulation-pointer-groups-reset.md)
- [simulation/reset](simulation-reset.md)
- [layered-simulation-face/reset](layered-simulation-face-reset.md)
- [layered-simulation/set-face](layered-simulation-set-face.md)
- [layered-simulation/set-pointer](layered-simulation-set-pointer.md)

- [Types and constants](types.md)
- [API index](index.md)
