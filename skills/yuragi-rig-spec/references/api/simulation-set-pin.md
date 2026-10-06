# simulation / setPin

Patch an existing pin’s position/dynamics; this setter does not rename, reparent or add pins.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(name: string, patch: Partial<Omit<PinSpec, "name" | "parent" | "type">>): void
```

## Parameters

- `name: string` — An existing pin name or supported ParameterName, according to the signature.
- `patch: Partial<Omit<PinSpec, "name" | "parent" | "type">>` — Partial update; omitted fields retain their current values. External model data must be validated.

## Returns

void

## Behavior, defaults and limits

Model coordinates include all source margins, x/y in 0…1. Radius 0.005…0.5. Parent/type edits require validating a new model and recreating the player. The simulation setter does not automatically rebind an already-built mesh; call rebindPin. Unknown names or invalid patches throw without committing the patch.

## Example

```ts
simulation.setPin(model.pins[0].name, { x: .5, radius: .08 });
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [simulation/set-tracking](simulation-set-tracking.md)
- [simulation/set-part](simulation-set-part.md)
- [simulation/rebind-pin](simulation-rebind-pin.md)
- [simulation/set-pointer](simulation-set-pointer.md)
- [simulation/set-parameter](simulation-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
