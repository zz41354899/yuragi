# player / playAnimation

Play a validated parameter, gaze-strength or motion-weight clip.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(clip: AnimationClip): void
```

## Parameters

- `clip: AnimationClip` — AnimationClip with finite duration, valid tracks and ordered keyframes.

## Returns

void

## Behavior, defaults and limits

Clones and validates the clip, throwing for invalid tracks/keys. Time/duration use milliseconds; loop defaults to false. Resumes the player loop. Reduced motion preserves neutral artwork.

## Example

```ts
player.playAnimation(clip);
```

## Related

- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/advance](player-advance.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)
- [player/set-parameter](player-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
