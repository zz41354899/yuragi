# player / setTracking

Merge pointer inertia settings within the TrackingSettings bounds.

Import: `@yuragi/rig`

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
player.setTracking({ response: .024, damping: .65, maxVelocity: 1.8 });
```

## Related

- [simulation/set-tracking](simulation-set-tracking.md)
- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/advance](player-advance.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)

- [Types and constants](types.md)
- [API index](index.md)
