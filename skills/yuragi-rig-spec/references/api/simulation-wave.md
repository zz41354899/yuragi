# simulation / wave

Trigger shared-surface wave progress; requires suitable visible free-arm artwork and bindings.

Import: `@yuragi/rig`

## Signature

```ts
(time?: number): boolean
```

## Parameters

- `time?: number` (default: `performance.now()`) — Milliseconds from the start of the simulation or clip, according to the method.

## Returns

boolean

## Behavior, defaults and limits

The player resumes its loop when paused; the simulation only sets progress at the supplied time. Do not use for a holding arm or claim universal limb animation.

## Example

```ts
simulation.wave();
```

## Related

- [simulation/set-motion](simulation-set-motion.md)
- [simulation/set-tracking](simulation-set-tracking.md)
- [simulation/set-pin](simulation-set-pin.md)
- [simulation/set-part](simulation-set-part.md)
- [simulation/rebind-pin](simulation-rebind-pin.md)
- [simulation/set-pointer](simulation-set-pointer.md)

- [Types and constants](types.md)
- [API index](index.md)
