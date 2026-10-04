# simulation-accessories / update

Update accessories engine state.

Import: `@yuragi/rig`

## Signature

```ts
(time: number, deltaTime: number, lookVelocity: number, wave: number): void
```

## Parameters

- `time: number` — Milliseconds from the start of the simulation or clip, according to the method.
- `deltaTime: number` — Milliseconds since the previous simulation update.
- `lookVelocity: number` — The simulation.velocity.lookX value.
- `wave: number` — Wave progress in 0…1.

## Returns

void

## Behavior, defaults and limits

Update accessories engine state. time/delta/deltaTime use milliseconds; lookX/lookY are engine angles; lookVelocity/verticalVelocity use simulation.velocity. wave is 0…1. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
simulation.accessories.update(16.67, 16.67, simulation.velocity.lookX, simulation.parameters.wave);
```

## Related

- [simulation-hair/update](simulation-hair-update.md)
- [simulation-accessories/bind](simulation-accessories-bind.md)
- [simulation-accessories/displacement](simulation-accessories-displacement.md)
- [simulation-parts/update](simulation-parts-update.md)
- [simulation-pointer-groups/update](simulation-pointer-groups-update.md)
- [layered-simulation/update](layered-simulation-update.md)

- [Types and constants](types.md)
- [API index](index.md)
