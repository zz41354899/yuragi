# characters / createMireaModel

Create the bundled Mirea bindings through the separate character entry. The image must match the authored rig.

Import: `@z7589xxz758/yuragi/mirea`

## Signature

```ts
(textureSrc?: string): RigModel
```

## Parameters

- `textureSrc?: string` (default: `'/models/mirea/texture.png'`) — URL of the exact artwork matching these bundled bindings; replacing the image does not produce a rig.

## Returns

RigModel

## Behavior, defaults and limits

Create the bundled Mirea bindings through the separate character entry. The image must match the authored rig.

## Example

```ts
const model = createMireaModel("/models/mirea/texture.png");
```

## Related


- [Types and constants](types.md)
- [API index](index.md)
