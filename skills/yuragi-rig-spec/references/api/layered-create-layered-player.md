# layered / createLayeredPlayer

Create a v2 player, load atlases and preserve authored attachment order.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(options: LayeredPlayerOptions): Promise<LayeredPlayer>
```

## Parameters

- `options: LayeredPlayerOptions` — See the actual options signature and linked PlayerOptions/LayeredPlayerOptions. signal can cancel loading and trigger cleanup.

## Returns

Promise<LayeredPlayer>

## Behavior, defaults and limits

autoplay=true; reducedMotion="respect"; pixelRatio is clamped to 1…2. AbortSignal cancels loading and destroys an initialized player. Missing images/dimension mismatches reject; callbacks and cleanup are not framework render state.

## Example

```ts
const player = await createLayeredPlayer({ canvas, model: layeredModel, signal });
player.destroy();
```

## Related

- [layered/validate-layered-model](layered-validate-layered-model.md)
- [layered/create-layered-simulation](layered-create-layered-simulation.md)

- [Types and constants](types.md)
- [API index](index.md)
