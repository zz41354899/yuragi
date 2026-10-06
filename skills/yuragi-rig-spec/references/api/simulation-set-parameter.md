# simulation / setParameter

Set lookX/lookY (−30…30), bodyX (−10…10) or wave (0…1).

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(name: ParameterName, value: number): boolean
```

## Parameters

- `name: ParameterName` — An existing pin name or supported ParameterName, according to the signature.
- `value: number` — Finite numeric input or unknown data to validate, according to the signature.

## Returns

boolean

## Behavior, defaults and limits

The player rejects non-finite or unknown parameter inputs. The simulation returns a success boolean. lookX/lookY setters and parameter animation tracks restore gaze following the head.

## Example

```ts
simulation.setParameter("bodyX", 4);
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
