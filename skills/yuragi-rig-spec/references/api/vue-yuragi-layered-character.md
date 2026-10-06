# vue / YuragiLayeredCharacter

Layered v2 component with cancellable loading, artwork fallback and cleanup.

Import: `@z7589xxz758/yuragi/vue`

## Signature

```ts
<YuragiLayeredCharacter :model="model" :autoplay="true" reduced-motion="respect" alt="Character" @ready="ready" @error="onError" @frame="onFrame" />
```

## Parameters

No positional parameters.

## Returns

Vue component instance with getPlayer()

## Behavior, defaults and limits

Props: model (required), autoplay=true, reducedMotion="respect", alt="Animated illustration". Vue emits ready(player), error(Error), frame(snapshot); expose getPlayer(). React: onReady, onError, onFrame; ref.current?.getPlayer(); className and style are optional. Loading is cancellable; model/reducedMotion changes recreate the player; unmount destroys it. Artwork is shown while loading or on WebGL failure.

## Example

```vue
<script setup lang="ts">
import { YuragiLayeredCharacter } from '@z7589xxz758/yuragi/vue'
import type { LayeredModel } from '@z7589xxz758/yuragi'
defineProps<{ model: LayeredModel }>()
</script>
<template>
  <YuragiLayeredCharacter :model="model" alt="Character" />
</template>
```

## Related

- [vue/yuragi-character](vue-yuragi-character.md)
- [vue/yuragi-character-get-player](vue-yuragi-character-get-player.md)
- [vue/yuragi-layered-character-get-player](vue-yuragi-layered-character-get-player.md)
- [react/yuragi-layered-character](react-yuragi-layered-character.md)

- [Types and constants](types.md)
- [API index](index.md)
