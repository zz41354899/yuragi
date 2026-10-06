# layered / validateLayeredModel

Assert v2 atlases, parent order, normalized weights, shared joints and attachments.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(input: unknown): asserts input is LayeredModel
```

## Parameters

- `input: unknown` — A validated model; the constructor clones it. Model v1 and layered v2 are separate formats.

## Returns

void

## Behavior, defaults and limits

Structural validation narrows unknown on success and throws on failure. Checks topology, ordering, weights and shared joints; does not inspect pixels or extract layers.

## Example

```ts
const input: unknown = JSON.parse(serialized);
validateLayeredModel(input);
console.log(input.attachments);
```

## Related

- [layered/create-layered-simulation](layered-create-layered-simulation.md)
- [layered/create-layered-player](layered-create-layered-player.md)

- [Types and constants](types.md)
- [API index](index.md)
