# simulation / setPart

Patch an existing flexible part; the player rebinds when geometry fields change.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(id: string, patch: Partial<Omit<DeformationPart, "id">>): void
```

## Parameters

- `id: string` — The ID of an existing authored part.
- `patch: Partial<Omit<DeformationPart, "id">>` — Partial update; omitted fields retain their current values. External model data must be validated.

## Returns

void

## Behavior, defaults and limits

Polygons contain 3…32 normalized vertices. Root/tip must differ. Geometry changes in a manually rendered simulation require rebuilding the mesh bindings; the player handles this for you. Unknown IDs or invalid patches throw without committing the patch.

## Example

```ts
if (model.parts?.[0]) simulation.setPart(model.parts[0].id, { rotation: .05 });
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [simulation/set-tracking](simulation-set-tracking.md)
- [simulation/set-pin](simulation-set-pin.md)
- [simulation/rebind-pin](simulation-rebind-pin.md)
- [simulation/set-pointer](simulation-set-pointer.md)
- [simulation/set-parameter](simulation-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
