# react / YuragiLayeredCharacter

Layered v2 component with cancellable loading, artwork fallback and cleanup.

Import: `@yuragi/rig/react`

## Signature

```ts
<YuragiLayeredCharacter model={model} autoplay reducedMotion="respect" alt="Character" onReady={ready} onError={onError} onFrame={onFrame} />
```

## Parameters

No positional parameters.

## Returns

React component with an optional imperative ref

## Behavior, defaults and limits

Props: model (required), autoplay=true, reducedMotion="respect", alt="Animated illustration". Vue emits ready(player), error(Error), frame(snapshot); expose getPlayer(). React: onReady, onError, onFrame; ref.current?.getPlayer(); className and style are optional. Loading is cancellable; model/reducedMotion changes recreate the player; unmount destroys it. Artwork is shown while loading or on WebGL failure.

## Example

```tsx
import { YuragiLayeredCharacter } from '@yuragi/rig/react'
import type { LayeredModel } from '@yuragi/rig'
export function Example({ model }: { model: LayeredModel }) {
  return <YuragiLayeredCharacter model={model} alt="Character" />
}
```

## Related

- [vue/yuragi-layered-character](vue-yuragi-layered-character.md)
- [react/yuragi-character](react-yuragi-character.md)
- [react/yuragi-character-get-player](react-yuragi-character-get-player.md)
- [react/yuragi-layered-character-get-player](react-yuragi-layered-character-get-player.md)

- [Types and constants](types.md)
- [API index](index.md)
