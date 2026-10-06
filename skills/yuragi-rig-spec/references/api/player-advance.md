# player / advance

Advance a manual player using shared fixed steps and render the result.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(milliseconds: number): void
```

## Parameters

- `milliseconds: number` — Finite elapsed milliseconds, 0…60000.

## Returns

void

## Behavior, defaults and limits

Use manual:true at creation. advance does not schedule requestAnimationFrame; it runs the shared fixed-step engine and draws. Fixed review definitions are shared by Studio and the CLI.

## Example

```ts
player.advance(1000);
```

## Related

- [player/play](player-play.md)
- [player/pause](player-pause.md)
- [player/set-pointer](player-set-pointer.md)
- [player/set-gaze](player-set-gaze.md)
- [player/set-parameter](player-set-parameter.md)
- [player/set-motion](player-set-motion.md)

- [Types and constants](types.md)
- [API index](index.md)
