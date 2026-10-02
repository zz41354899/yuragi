import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue'
import { createPlayer } from './player.js'
import type { RigModel, RigPlayer, RigSnapshot } from './types.js'
export const YuragiCharacter = defineComponent({
  name: 'YuragiCharacter',
  props: {
    model: { type: Object as PropType<RigModel>, required: true },
    autoplay: { type: Boolean, default: true },
    reducedMotion: { type: String as PropType<'respect' | 'ignore'>, default: 'respect' },
    alt: { type: String, default: 'Animated illustration' },
  },
  emits: {
    ready: (_player: RigPlayer) => true,
    error: (_error: Error) => true,
    frame: (_snapshot: RigSnapshot) => true,
  },
  setup(props, { emit, expose }) {
    const canvas = ref<HTMLCanvasElement | null>(null)
    const ready = ref(false)
    let player: RigPlayer | undefined
    let controller: AbortController | undefined
    let mounted = false
    async function load() {
      controller?.abort(); player?.destroy(); player = undefined; ready.value = false
      if (!mounted || !canvas.value) return
      const ownController = new AbortController(); controller = ownController
      try {
        const next = await createPlayer({
          canvas: canvas.value, model: props.model, autoplay: props.autoplay,
          reducedMotion: props.reducedMotion, signal: ownController.signal,
          onFrame: frame => emit('frame', frame), onError: error => { ready.value = false; emit('error', error) },
        })
        if (ownController.signal.aborted) { next.destroy(); return }
        player = next
        if (props.autoplay) next.play(); else next.pause()
        ready.value = true; emit('ready', next)
      } catch (error) {
        if (!ownController.signal.aborted) emit('error', error instanceof Error ? error : new Error(String(error)))
      }
    }
    expose({ getPlayer: () => player })
    onMounted(() => { mounted = true; void load() })
    watch(() => [props.model, props.reducedMotion], () => { void load() })
    watch(() => props.autoplay, value => { if (value) player?.play(); else player?.pause() })
    onBeforeUnmount(() => { mounted = false; controller?.abort(); player?.destroy() })
    return () => h('div', {
      class: 'yuragi-character', role: 'img', 'aria-label': props.alt,
      style: { position: 'relative', aspectRatio: props.model.texture.width + '/' + props.model.texture.height },
    }, [
      h('img', { src: props.model.texture.src, alt: '', draggable: false, style: { display: ready.value ? 'none' : 'block', width: '100%', height: '100%', objectFit: 'contain' } }),
      h('canvas', { ref: canvas, 'aria-hidden': 'true', style: { position: 'absolute', left: '-12%', top: '-12%', width: '124%', height: '124%', display: ready.value ? 'block' : 'none', pointerEvents: 'none' } }),
    ])
  },
})
