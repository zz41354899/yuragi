# simulation / rebindPin

Recompute pin weights for a mesh; keep this low-level operation consistent with model settings.

Import: `@yuragi/rig`

## Signature

```ts
(mesh: RigMesh, name: string, patch: Partial<PinSpec>): void
```

## Parameters

- `mesh: RigMesh` — An already-built continuous mesh; keep model settings and bindings consistent.
- `name: string` — An existing pin name or supported ParameterName, according to the signature.
- `patch: Partial<PinSpec>` — Partial update; omitted fields retain their current values. External model data must be validated.

## Returns

void

## Behavior, defaults and limits

Recompute pin weights for a mesh; keep this low-level operation consistent with model settings.

## Example

```ts
simulation.setPin(model.pins[0].name, { radius: .08 });
simulation.rebindPin(mesh, model.pins[0].name, { radius: .08 });
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [simulation/set-tracking](simulation-set-tracking.md)
- [simulation/set-pin](simulation-set-pin.md)
- [simulation/set-part](simulation-set-part.md)
- [simulation/set-pointer](simulation-set-pointer.md)
- [simulation/set-parameter](simulation-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
