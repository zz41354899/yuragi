# simulation-parts / update

Update parts engine state.

Import: `@yuragi/rig`

## Signature

```ts
(time: number, delta: number, lookX: number, lookVelocity: number, lookY?: number, verticalVelocity?: number): void
```

## Parameters

- `time: number` — Milliseconds from the start of the simulation or clip, according to the method.
- `delta: number` — Milliseconds since the previous simulation update.
- `lookX: number` — Engine lookX parameter in degrees (normally −30…30).
- `lookVelocity: number` — The simulation.velocity.lookX value.
- `lookY?: number` (default: `0`) — Engine lookY parameter in degrees (normally −30…30).
- `verticalVelocity?: number` (default: `0`) — The simulation.velocity.lookY value.

## Returns

void

## Behavior, defaults and limits

Update parts engine state. time/delta/deltaTime use milliseconds; lookX/lookY are engine angles; lookVelocity/verticalVelocity use simulation.velocity. wave is 0…1. Low-level methods do not separately validate external buffers/indices. Use validated models and bindings from this simulation. updatePins/updateVertices already call these methods; do not update twice in a frame. Infer binding types from return values instead of importing internal factories.

## Example

```ts
simulation.parts.update(16.67, 16.67, simulation.parameters.lookX, simulation.velocity.lookX);
```

## Related

- [simulation-hair/update](simulation-hair-update.md)
- [simulation-accessories/update](simulation-accessories-update.md)
- [simulation-parts/bind](simulation-parts-bind.md)
- [simulation-parts/displacement](simulation-parts-displacement.md)
- [simulation-parts/reset](simulation-parts-reset.md)
- [simulation-pointer-groups/update](simulation-pointer-groups-update.md)

- [Types and constants](types.md)
- [API index](index.md)
