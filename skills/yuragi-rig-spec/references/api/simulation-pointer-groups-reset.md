# simulation-pointer-groups / reset

Reset pointer groups spring or following state.

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

Reset pointer groups spring or following state. No positional arguments; retains authored specs and mesh bindings. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
simulation.pointerGroups.reset();
```

## Related

- [simulation-parts/reset](simulation-parts-reset.md)
- [simulation-pointer-groups/update](simulation-pointer-groups-update.md)
- [simulation-pointer-groups/bind](simulation-pointer-groups-bind.md)
- [simulation-pointer-groups/apply](simulation-pointer-groups-apply.md)
- [simulation/reset](simulation-reset.md)
- [layered-simulation-face/reset](layered-simulation-face-reset.md)

- [Types and constants](types.md)
- [API index](index.md)
