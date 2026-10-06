# core / validateModel

Assert the complete v1 model contract, narrow unknown on success and throw on failure.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(value: unknown): asserts value is RigModel
```

## Parameters

- `value: unknown` — Finite numeric input or unknown data to validate, according to the signature.

## Returns

void

## Behavior, defaults and limits

Structural validation returns void and narrows unknown on success. Throws an Invalid rig model error on failure. It neither loads images nor establishes visual acceptance.

## Example

```ts
const input: unknown = JSON.parse(serialized);
validateModel(input);
console.log(input.pins);
```

## Related

- [core/create-player](core-create-player.md)
- [core/to-canvas](core-to-canvas.md)
- [core/create-simulation](core-create-simulation.md)
- [core/constrain-shared-surface](core-constrain-shared-surface.md)
- [core/fixed-steps](core-fixed-steps.md)
- [core/face-review-poses](core-face-review-poses.md)

- [Types and constants](types.md)
- [API index](index.md)
