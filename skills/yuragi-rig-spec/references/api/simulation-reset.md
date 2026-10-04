# simulation / reset

Restore neutral state while retaining edited model settings.

Import: `@yuragi/rig`

## Signature

```ts
(): void
```

## Parameters

No positional parameters.

## Returns

void

## Behavior, defaults and limits

The v1 player stops its timeline and resets gaze/parameters. It preserves model motion values; zero motion.weight and gaze strength when comparing against unchanged artwork.

## Example

```ts
simulation.reset();
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [simulation/set-tracking](simulation-set-tracking.md)
- [simulation/set-pin](simulation-set-pin.md)
- [simulation/set-part](simulation-set-part.md)
- [simulation/rebind-pin](simulation-rebind-pin.md)
- [simulation-parts/reset](simulation-parts-reset.md)

- [Types and constants](types.md)
- [API index](index.md)
