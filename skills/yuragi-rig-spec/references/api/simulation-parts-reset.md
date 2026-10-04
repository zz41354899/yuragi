# simulation-parts / reset

Reset parts spring or following state.

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

Reset parts spring or following state. No positional arguments; retains authored specs and mesh bindings. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
simulation.parts.reset();
```

## Related

- [simulation-parts/update](simulation-parts-update.md)
- [simulation-parts/bind](simulation-parts-bind.md)
- [simulation-parts/displacement](simulation-parts-displacement.md)
- [simulation-pointer-groups/reset](simulation-pointer-groups-reset.md)
- [simulation/reset](simulation-reset.md)
- [layered-simulation/reset](layered-simulation-reset.md)

- [Types and constants](types.md)
- [API index](index.md)
