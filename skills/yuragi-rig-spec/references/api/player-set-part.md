# player / setPart

Patch an existing flexible part; the player rebinds when geometry fields change.

Import: `@yuragi/rig`

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
if (model.parts?.[0]) player.setPart(model.parts[0].id, { rotation: .05 });
```

## Related

- [simulation/set-part](simulation-set-part.md)
- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)
- [player/set-parameter](player-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
