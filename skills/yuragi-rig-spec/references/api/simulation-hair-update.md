# simulation-hair / update

Update hair engine state.

Import: `@yuragi/rig`

## Signature

```ts
(time: number, deltaTime: number, lookX: number, lookVelocity: number): void
```

## Parameters

- `time: number` — Milliseconds from the start of the simulation or clip, according to the method.
- `deltaTime: number` — Milliseconds since the previous simulation update.
- `lookX: number` — Engine lookX parameter in degrees (normally −30…30).
- `lookVelocity: number` — The simulation.velocity.lookX value.

## Returns

void

## Behavior, defaults and limits

Update hair engine state. time/delta/deltaTime use milliseconds; lookX/lookY are engine angles; lookVelocity/verticalVelocity use simulation.velocity. wave is 0…1. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
simulation.hair.update(16.67, 16.67, simulation.parameters.lookX, simulation.velocity.lookX);
```

## Related

- [simulation-hair/bind](simulation-hair-bind.md)
- [simulation-hair/displacement](simulation-hair-displacement.md)
- [simulation-accessories/update](simulation-accessories-update.md)
- [simulation-parts/update](simulation-parts-update.md)
- [simulation-pointer-groups/update](simulation-pointer-groups-update.md)
- [layered-simulation/update](layered-simulation-update.md)

- [Types and constants](types.md)
- [API index](index.md)
