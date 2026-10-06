# simulation / setTracking

Merge pointer inertia settings within the TrackingSettings bounds.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(settings: Partial<TrackingSettings>): void
```

## Parameters

- `settings: Partial<TrackingSettings>` — Partial settings merged with the current model; validation bounds still apply.

## Returns

void

## Behavior, defaults and limits

response: 0.001…0.2; damping: 0.1…0.98; maxVelocity: 0.1…5; bodyFollow: 0…1; translation per axis: 0…0.08. Invalid patches throw without partial mutation.

## Example

```ts
simulation.setTracking({ response: .024, damping: .65, maxVelocity: 1.8 });
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [simulation/set-pin](simulation-set-pin.md)
- [simulation/set-part](simulation-set-part.md)
- [simulation/rebind-pin](simulation-rebind-pin.md)
- [simulation/set-pointer](simulation-set-pointer.md)
- [simulation/set-parameter](simulation-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
