# player / setMotion

Merge motion settings; omitted fields retain their values and validation failures do not partially commit.

Import: `@yuragi/rig`

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
player.setMotion({ sway: .6, speed: .8 });
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/advance](player-advance.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)

- [Types and constants](types.md)
- [API index](index.md)
