# simulation-pointer-groups / update

Update pointer groups engine state.

Import: `@yuragi/rig`

## Signature

```ts
(delta: number, lookX: number, lookY: number): void
```

## Parameters

- `delta: number` — Milliseconds since the previous simulation update.
- `lookX: number` — Engine lookX parameter in degrees (normally −30…30).
- `lookY: number` — Engine lookY parameter in degrees (normally −30…30).

## Returns

void

## Behavior, defaults and limits

Update pointer groups engine state. time/delta/deltaTime use milliseconds; lookX/lookY are engine angles; lookVelocity/verticalVelocity use simulation.velocity. wave is 0…1. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
simulation.pointerGroups.update(16.67, simulation.parameters.lookX, simulation.parameters.lookY);
```

## Related

- [simulation-hair/update](simulation-hair-update.md)
- [simulation-accessories/update](simulation-accessories-update.md)
- [simulation-parts/update](simulation-parts-update.md)
- [simulation-pointer-groups/bind](simulation-pointer-groups-bind.md)
- [simulation-pointer-groups/apply](simulation-pointer-groups-apply.md)
- [simulation-pointer-groups/reset](simulation-pointer-groups-reset.md)

- [Types and constants](types.md)
- [API index](index.md)
