# simulation / setMotion

Merge motion settings; omitted fields retain their values and validation failures do not partially commit.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(settings: Partial<MotionSettings>): void
```

## Parameters

- `settings: Partial<MotionSettings>` — Partial settings merged with the current model; validation bounds still apply.

## Returns

void

## Behavior, defaults and limits

sway/hair/accessories/follow/parts: 0…2; speed: 0.25…2; weight/layers: 0…1. Defaults come from the loaded model, with optional weight/parts/layers defaulting to 1. layers scales pointer groups, not independent image layers.

## Example

```ts
simulation.setMotion({ sway: .6, speed: .8 });
```

## Related

- [simulation/set-tracking](simulation-set-tracking.md)
- [simulation/set-pin](simulation-set-pin.md)
- [simulation/set-part](simulation-set-part.md)
- [simulation/rebind-pin](simulation-rebind-pin.md)
- [simulation/set-pointer](simulation-set-pointer.md)
- [simulation/set-parameter](simulation-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
