import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createPlayer } from './player.js';
export const YuragiCharacter = defineComponent({
    name: 'YuragiCharacter',
    props: {
        model: { type: Object, required: true },
        autoplay: { type: Boolean, default: true },
        reducedMotion: { type: String, default: 'respect' },
        alt: { type: String, default: 'Animated illustration' },
    },
    emits: {
        ready: (_player) => true,
        error: (_error) => true,
        frame: (_snapshot) => true,
    },
    setup(props, { emit, expose }) {
        const canvas = ref(null);
        const ready = ref(false);
        let player;
        let controller;
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
                const next = await createPlayer({
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
            style: { position: 'relative', aspectRatio: props.model.texture.width + '/' + props.model.texture.height },
        }, [
            h('img', { src: props.model.texture.src, alt: '', draggable: false, style: { display: ready.value ? 'none' : 'block', width: '100%', height: '100%', objectFit: 'contain' } }),
            h('canvas', { ref: canvas, 'aria-hidden': 'true', style: { position: 'absolute', left: '-12%', top: '-12%', width: '124%', height: '124%', display: ready.value ? 'block' : 'none', pointerEvents: 'none' } }),
        ]);
    },
});
export { YuragiLayeredCharacter } from './vue-layered.js';
//# sourceMappingURL=vue.js.map