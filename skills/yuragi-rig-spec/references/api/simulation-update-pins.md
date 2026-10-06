# simulation / updatePins

Update parameters, pins and spring state using elapsed time and delta in milliseconds.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(time: number, deltaTime: number): void
```

## Parameters

- `time: number` — Milliseconds from the start of the simulation or clip, according to the method.
- `deltaTime: number` — Milliseconds since the previous simulation update.

## Returns

void

## Behavior, defaults and limits

Call updatePins(time, deltaTime) before updateVertices(mesh, time). Time and deltaTime are milliseconds. Keep this state outside Vue/React render cycles.

## Example

```ts
simulation.updatePins(16.67, 16.67);
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [simulation/set-tracking](simulation-set-tracking.md)
- [simulation/set-pin](simulation-set-pin.md)
- [simulation/set-part](simulation-set-part.md)
- [simulation/rebind-pin](simulation-rebind-pin.md)
- [simulation/set-pointer](simulation-set-pointer.md)

- [Types and constants](types.md)
- [API index](index.md)
