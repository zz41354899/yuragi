import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
import { createLayeredPlayer } from './layered-player.js';
import type { LayeredModel, LayeredPlayer, LayeredSnapshot } from './layered-types.js';
export const YuragiLayeredCharacter = defineComponent({
    name: 'YuragiLayeredCharacter',
    props: {
        model: { type: Object as PropType<LayeredModel>, required: true },
        autoplay: { type: Boolean, default: true },
        reducedMotion: { type: String as PropType<'respect' | 'ignore'>, default: 'respect' },
        alt: { type: String, default: 'Animated illustration' },
    },
    emits: {
        ready: (_player: LayeredPlayer) => true,
        error: (_error: Error) => true,
        frame: (_snapshot: LayeredSnapshot) => true,
    },
    setup(props, { emit, expose }) {
        const canvas = ref<HTMLCanvasElement | null>(null);
        const ready = ref(false);
        let player: LayeredPlayer | undefined;
        let controller: AbortController | undefined;
        let mounted = false;
        async function load() {
            controller?.abort();
            player?.destroy();
            player = undefined;
            ready.value = false;
            if (!mounted || !canvas.value)
                return;
            const ownController = new AbortController();
            controller = ownController;
            try {
                const next = await createLayeredPlayer({
                    canvas: canvas.value, model: props.model, autoplay: props.autoplay,
                    reducedMotion: props.reducedMotion, signal: ownController.signal,
                    onFrame: frame => emit('frame', frame), onError: error => { ready.value = false; emit('error', error); },
                });
                if (ownController.signal.aborted) {
                    next.destroy();
                    return;
                }
                player = next;
                if (props.autoplay)
                    next.play();
                else
                    next.pause();
                ready.value = true;
                emit('ready', next);
            }
            catch (error) {
                if (!ownController.signal.aborted)
                    emit('error', error instanceof Error ? error : new Error(String(error)));
            }
        }
        expose({ getPlayer: () => player });
        onMounted(() => { mounted = true; void load(); });
        watch(() => [props.model, props.reducedMotion], () => { void load(); });
        watch(() => props.autoplay, value => { if (value)
            player?.play();
        else
            player?.pause(); });
        onBeforeUnmount(() => { mounted = false; controller?.abort(); player?.destroy(); });
        return () => h('div', {
            class: 'yuragi-character', role: 'img', 'aria-label': props.alt,
            style: { position: 'relative', aspectRatio: props.model.source.width + '/' + props.model.source.height },
        }, [
            h('img', { src: props.model.source.fallback, alt: '', draggable: false, style: { display: ready.value ? 'none' : 'block', width: '100%', height: '100%', objectFit: 'contain' } }),
            h('canvas', { ref: canvas, 'aria-hidden': 'true', style: { position: 'absolute', left: '-12%', top: '-12%', width: '124%', height: '124%', display: ready.value ? 'block' : 'none', pointerEvents: 'none' } }),
        ]);
    },
});
