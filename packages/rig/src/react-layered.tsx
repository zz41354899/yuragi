import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createLayeredPlayer } from './layered-player.js';
import type { LayeredModel, LayeredPlayer, LayeredSnapshot } from './layered-types.js';
export interface YuragiLayeredCharacterProps {
    model: LayeredModel;
    autoplay?: boolean;
    reducedMotion?: 'respect' | 'ignore';
    alt?: string;
    className?: string;
    style?: CSSProperties;
    onReady?: (player: LayeredPlayer) => void;
    onError?: (error: Error) => void;
    onFrame?: (snapshot: LayeredSnapshot) => void;
}
export interface YuragiLayeredCharacterHandle {
    getPlayer(): LayeredPlayer | undefined;
}
export const YuragiLayeredCharacter = forwardRef<YuragiLayeredCharacterHandle, YuragiLayeredCharacterProps>(function YuragiLayeredCharacter({ model, autoplay = true, reducedMotion = 'respect', alt = 'Animated illustration', className, style, onReady, onError, onFrame }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const player = useRef<LayeredPlayer | undefined>(undefined);
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
        void createLayeredPlayer({
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
    return <div role="img" aria-label={alt} className={className} style={{ position: 'relative', aspectRatio: model.source.width + '/' + model.source.height, ...style }}>
    <img src={model.source.fallback} alt="" draggable={false} style={{ display: ready ? 'none' : 'block', width: '100%', height: '100%', objectFit: 'contain' }}/>
    <canvas ref={canvas} aria-hidden="true" style={{ position: 'absolute', left: '-12%', top: '-12%', width: '124%', height: '124%', display: ready ? 'block' : 'none', pointerEvents: 'none' }}/>
  </div>;
});
