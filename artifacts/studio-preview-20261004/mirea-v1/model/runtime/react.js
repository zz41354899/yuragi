import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPlayer } from './player.js';
export const YuragiCharacter = forwardRef(function YuragiCharacter({ model, autoplay = true, reducedMotion = 'respect', alt = 'Animated illustration', className, style, onReady, onError, onFrame }, ref) {
    const canvas = useRef(null);
    const player = useRef(undefined);
    const autoplayRef = useRef(autoplay);
    autoplayRef.current = autoplay;
    const callbacks = useRef({ onReady, onError, onFrame });
    callbacks.current = { onReady, onError, onFrame };
    const [ready, setReady] = useState(false);
    useImperativeHandle(ref, () => ({ getPlayer: () => player.current }), []);
    useEffect(() => {
        const controller = new AbortController();
        setReady(false);
        if (!canvas.current)
            return;
        void createPlayer({
            canvas: canvas.current, model, reducedMotion, autoplay,
            signal: controller.signal,
            onError: error => { setReady(false); callbacks.current.onError?.(error); },
            onFrame: snapshot => callbacks.current.onFrame?.(snapshot),
        }).then(next => {
            if (controller.signal.aborted) {
                next.destroy();
                return;
            }
            player.current = next;
            if (autoplayRef.current)
                next.play();
            else
                next.pause();
            setReady(true);
            callbacks.current.onReady?.(next);
        }).catch(error => {
            if (!controller.signal.aborted)
                callbacks.current.onError?.(error instanceof Error ? error : new Error(String(error)));
        });
        return () => { controller.abort(); player.current?.destroy(); player.current = undefined; };
        // autoplay is updated independently without recreating WebGL resources.
    }, [model, reducedMotion]);
    useEffect(() => { if (autoplay)
        player.current?.play();
    else
        player.current?.pause(); }, [autoplay]);
    return _jsxs("div", { role: "img", "aria-label": alt, className: className, style: { position: 'relative', aspectRatio: model.texture.width + '/' + model.texture.height, ...style }, children: [_jsx("img", { src: model.texture.src, alt: "", draggable: false, style: { display: ready ? 'none' : 'block', width: '100%', height: '100%', objectFit: 'contain' } }), _jsx("canvas", { ref: canvas, "aria-hidden": "true", style: { position: 'absolute', left: '-12%', top: '-12%', width: '124%', height: '124%', display: ready ? 'block' : 'none', pointerEvents: 'none' } })] });
});
export { YuragiLayeredCharacter } from './react-layered.js';
//# sourceMappingURL=react.js.map