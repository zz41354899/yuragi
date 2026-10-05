# layered-simulation / update

Update v2 node matrices and mesh positions using milliseconds; return whether positions changed.

Import: `@yuragi/rig`

## Signature

```ts
(time: number, delta: number, reduced?: boolean): boolean
```

## Parameters

- `time: number` — Milliseconds from the start of the simulation or clip, according to the method.
- `delta: number` — Milliseconds since the previous simulation update.
- `reduced?: boolean` (default: `false`) — Whether to evaluate reduced-motion neutral geometry; defaults to false.

## Returns

boolean

## Behavior, defaults and limits

time and delta are milliseconds. reduced=false by default; true evaluates the static neutral pose. Mesh buffers and matrices are reused; do not replace them per frame.

## Example

```ts
simulation.update(16.67, 16.67);
```

## Related

- [simulation-hair/update](simulation-hair-update.md)
- [simulation-accessories/update](simulation-accessories-update.md)
- [simulation-parts/update](simulation-parts-update.md)
- [simulation-pointer-groups/update](simulation-pointer-groups-update.md)
- [layered-simulation/set-face](layered-simulation-set-face.md)
- [layered-simulation/set-pointer](layered-simulation-set-pointer.md)

- [Types and constants](types.md)
- [API index](index.md)
