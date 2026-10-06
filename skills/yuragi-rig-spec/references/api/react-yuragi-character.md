# react / YuragiCharacter

Shared-surface component with artwork fallback, reduced motion and unmount cleanup.

Import: `@z7589xxz758/yuragi/react`

## Signature

```ts
<YuragiCharacter model={model} autoplay reducedMotion="respect" alt="Character" onReady={ready} onError={onError} onFrame={onFrame} />
```

## Parameters

No positional parameters.

## Returns

React component with an optional imperative ref

## Behavior, defaults and limits

Props: model (required), autoplay=true, reducedMotion="respect", alt="Animated illustration". Vue emits ready(player), error(Error), frame(snapshot); expose getPlayer(). React: onReady, onError, onFrame; ref.current?.getPlayer(); className and style are optional. Loading is cancellable; model/reducedMotion changes recreate the player; unmount destroys it. Artwork is shown while loading or on WebGL failure.

## Example

```tsx
import { YuragiCharacter } from '@z7589xxz758/yuragi/react'
import type { RigModel } from '@z7589xxz758/yuragi'
export function Example({ model }: { model: RigModel }) {
  return <YuragiCharacter model={model} alt="Character" />
}
```

## Related

- [vue/yuragi-character](vue-yuragi-character.md)
- [react/yuragi-character-get-player](react-yuragi-character-get-player.md)
- [react/yuragi-layered-character](react-yuragi-layered-character.md)
- [react/yuragi-layered-character-get-player](react-yuragi-layered-character-get-player.md)

- [Types and constants](types.md)
- [API index](index.md)
