export type Framework = 'vue' | 'react'
export const integrationExamples: Record<Framework, string> = {
  vue: `<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { createMomoModel, type RigPlayer, type RigSnapshot } from '@yuragi/rig'
import { YuragiCharacter } from '@yuragi/rig/vue'

const model = createMomoModel('/models/momo/texture.webp')
const player = shallowRef<RigPlayer>()
const snapshot = shallowRef<RigSnapshot>()
const autoplay = ref(true)
const error = ref('')

function onReady(next: RigPlayer) {
  player.value = next
  error.value = ''
}
function onError(cause: Error) {
  player.value = undefined
  error.value = cause.message
}
function followPointer(event: PointerEvent) {
  if (event.pointerType === 'touch' && !event.buttons) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  player.value?.setPointer(
    (event.clientX - rect.left) / rect.width - 0.5,
    (event.clientY - rect.top) / rect.height - 0.5,
  )
}
</script>

<template>
  <div style="width: 320px; max-width: 100%"
    @pointermove="followPointer" @pointerleave="player?.setPointer(0, 0)">
    <YuragiCharacter :model="model" :autoplay="autoplay"
      reduced-motion="respect" :alt="model.name"
      @ready="onReady" @error="onError" @frame="snapshot = $event" />
  </div>
  <label><input v-model="autoplay" type="checkbox" /> autoplay</label>
  <button :disabled="!player" @click="player?.wave()">打個招呼</button>
  <output v-if="snapshot">{{ snapshot.diagnostics.motionScale }}</output>
  <p v-if="error" role="alert">{{ error }}</p>
</template>`,
  react: `'use client'
import { useRef, useState, type PointerEvent } from 'react'
import { createMomoModel, type RigSnapshot } from '@yuragi/rig'
import { YuragiCharacter, type YuragiCharacterHandle } from '@yuragi/rig/react'

export function Character() {
  const [model] = useState(() => createMomoModel('/models/momo/texture.webp'))
  const character = useRef<YuragiCharacterHandle>(null)
  const [autoplay, setAutoplay] = useState(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [snapshot, setSnapshot] = useState<RigSnapshot>()

  function followPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' && !event.buttons) return
    const rect = event.currentTarget.getBoundingClientRect()
    character.current?.getPlayer()?.setPointer(
      (event.clientX - rect.left) / rect.width - 0.5,
      (event.clientY - rect.top) / rect.height - 0.5,
    )
  }
  return <>
    <div style={{ width: 320, maxWidth: '100%' }}
      onPointerMove={followPointer}
      onPointerLeave={() => character.current?.getPlayer()?.setPointer(0, 0)}>
      <YuragiCharacter ref={character} model={model} autoplay={autoplay}
        reducedMotion="respect" alt={model.name}
        onReady={() => { setReady(true); setError('') }}
        onError={cause => { setReady(false); setError(cause.message) }}
        onFrame={setSnapshot} />
    </div>
    <label><input type="checkbox" checked={autoplay}
      onChange={event => setAutoplay(event.target.checked)} /> autoplay</label>
    <button disabled={!ready}
      onClick={() => character.current?.getPlayer()?.wave()}>打個招呼</button>
    {snapshot ? <output>{snapshot.diagnostics.motionScale}</output> : null}
    {error ? <p role="alert">{error}</p> : null}
  </>
}`,
}
export const handleExamples: Record<Framework, string> = {
  vue: `<script setup lang="ts">
import { shallowRef } from 'vue'
import { createMomoModel, type RigPlayer } from '@yuragi/rig'
import { YuragiCharacter } from '@yuragi/rig/vue'

type CharacterHandle = { getPlayer(): RigPlayer | undefined }
const character = shallowRef<CharacterHandle>()
const model = createMomoModel('/models/momo/texture.webp')
function wave() { character.value?.getPlayer()?.wave() }
</script>

<template>
  <YuragiCharacter ref="character" :model="model" style="width: 320px" />
  <button @click="wave">打個招呼</button>
</template>`,
  react: `import { useRef, useState } from 'react'
import { createMomoModel } from '@yuragi/rig'
import { YuragiCharacter, type YuragiCharacterHandle } from '@yuragi/rig/react'

export function Character() {
  const [model] = useState(() => createMomoModel('/models/momo/texture.webp'))
  const character = useRef<YuragiCharacterHandle>(null)
  return <>
    <YuragiCharacter ref={character} model={model} style={{ width: 320 }} />
    <button onClick={() => character.current?.getPlayer()?.wave()}>打個招呼</button>
  </>
}`,
}
