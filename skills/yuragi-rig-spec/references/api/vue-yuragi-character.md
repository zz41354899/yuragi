# vue / YuragiCharacter

Shared-surface component with artwork fallback, reduced motion and unmount cleanup.

Import: `@yuragi/rig/vue`

## Signature

```ts
<YuragiCharacter :model="model" :autoplay="true" reduced-motion="respect" alt="Character" @ready="ready" @error="onError" @frame="onFrame" />
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
import { YuragiCharacter } from '@yuragi/rig/vue'
import type { RigModel } from '@yuragi/rig'
defineProps<{ model: RigModel }>()
</script>
<template>
  <YuragiCharacter :model="model" alt="Character" />
</template>
```

## Related

- [vue/yuragi-character-get-player](vue-yuragi-character-get-player.md)
- [vue/yuragi-layered-character](vue-yuragi-layered-character.md)
- [vue/yuragi-layered-character-get-player](vue-yuragi-layered-character-get-player.md)
- [react/yuragi-character](react-yuragi-character.md)

- [Types and constants](types.md)
- [API index](index.md)
