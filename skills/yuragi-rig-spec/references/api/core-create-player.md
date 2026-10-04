# core / createPlayer

Create a shared-surface player after model validation and source-image loading.

Import: `@yuragi/rig`

## Signature

```ts
(options: PlayerOptions & { signal?: AbortSignal; }): Promise<RigPlayer>
```

## Parameters

- `options: PlayerOptions & { signal?: AbortSignal; }` — See the actual options signature and linked PlayerOptions/LayeredPlayerOptions. signal can cancel loading and trigger cleanup.

## Returns

Promise<RigPlayer>

## Behavior, defaults and limits

autoplay=true; reducedMotion="respect"; pixelRatio defaults to devicePixelRatio, clamped to 1…2. signal is part of the callable options intersection. Initialization errors reject the Promise; onError reports later rendering errors. onFrame reports about every 100 ms plus explicit operations.

## Example

```ts
const player = await createPlayer({ canvas, model, signal });
player.pause();
player.destroy();
```

## Related

- [core/to-canvas](core-to-canvas.md)
- [core/create-simulation](core-create-simulation.md)
- [core/constrain-shared-surface](core-constrain-shared-surface.md)
- [core/validate-model](core-validate-model.md)

- [Types and constants](types.md)
- [API index](index.md)
