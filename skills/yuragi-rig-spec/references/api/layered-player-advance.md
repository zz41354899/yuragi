# layered-player / advance

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

- [player/advance](player-advance.md)
- [layered-player/play](layered-player-play.md)
- [layered-player/pause](layered-player-pause.md)
- [layered-player/set-gaze](layered-player-set-gaze.md)
- [layered-player/set-face](layered-player-set-face.md)
- [layered-player/set-pointer](layered-player-set-pointer.md)

- [Types and constants](types.md)
- [API index](index.md)
