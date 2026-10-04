# player / setPin

Patch an existing pin’s position/dynamics; this setter does not rename, reparent or add pins.

Import: `@yuragi/rig`

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
player.setPin(model.pins[0].name, { x: .5, radius: .08 });
```

## Related

- [simulation/set-pin](simulation-set-pin.md)
- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)
- [player/set-parameter](player-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
