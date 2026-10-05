# simulation / setPointer

Set centered pointer coordinates, normally −0.5…0.5 per axis; positive X is right and Y is down.

Import: `@yuragi/rig`

## Signature

```ts
(x: number, y: number): void
```

## Parameters

- `x: number` — X coordinate; units and accepted ranges are described above.
- `y: number` — Y coordinate; positive is down. Units and ranges are described above.

## Returns

void

## Behavior, defaults and limits

The v1 player also sets gaze. Call setPointer before setGaze for separate targets. Simulation-only setPointer has no face compositor. v2 drives authored node response; optional attachment-based setGaze/setFace is separate from v1 measured-eye APIs.

## Example

```ts
simulation.setPointer(.2, -.1);
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [simulation/set-tracking](simulation-set-tracking.md)
- [simulation/set-pin](simulation-set-pin.md)
- [simulation/set-part](simulation-set-part.md)
- [simulation/rebind-pin](simulation-rebind-pin.md)
- [simulation/set-parameter](simulation-set-parameter.md)

- [Types and constants](types.md)
- [API index](index.md)
