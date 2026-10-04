# layered-simulation / getPointer

Return the current v2 pointer target.

Import: `@yuragi/rig`

## Signature

```ts
(): [number, number]
```

## Parameters

No positional parameters.

## Returns

[number, number]

## Behavior, defaults and limits

Returns the v2 normalized target in −1…1 per axis: twice the setPointer input, clamped. This is a target, not the current node pose. No positional arguments.

## Example

```ts
const pointer = simulation.getPointer();
```

## Related

- [layered-simulation/set-pointer](layered-simulation-set-pointer.md)
- [layered-simulation/reset](layered-simulation-reset.md)
- [layered-simulation/update](layered-simulation-update.md)

- [Types and constants](types.md)
- [API index](index.md)
