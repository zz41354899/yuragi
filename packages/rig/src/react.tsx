import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPlayer } from './player.js'
import type { RigModel, RigPlayer, RigSnapshot } from './types.js'
export interface YuragiCharacterProps {
  model: RigModel
  autoplay?: boolean
  reducedMotion?: 'respect' | 'ignore'
  alt?: string
  className?: string
  style?: CSSProperties
  onReady?: (player: RigPlayer) => void
  onError?: (error: Error) => void
  onFrame?: (snapshot: RigSnapshot) => void
}
export interface YuragiCharacterHandle { getPlayer(): RigPlayer | undefined }
export const YuragiCharacter = forwardRef<YuragiCharacterHandle, YuragiCharacterProps>(function YuragiCharacter(
  { model, autoplay = true, reducedMotion = 'respect', alt = 'Animated illustration', className, style, onReady, onError, onFrame }, ref,
) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const player = useRef<RigPlayer | undefined>(undefined)
  const autoplayRef = useRef(autoplay)
  autoplayRef.current = autoplay
  const callbacks = useRef({ onReady, onError, onFrame })
  callbacks.current = { onReady, onError, onFrame }
  const [ready, setReady] = useState(false)
  useImperativeHandle(ref, () => ({ getPlayer: () => player.current }), [])
  useEffect(() => {
    const controller = new AbortController()
    setReady(false)
    if (!canvas.current) return
    void createPlayer({
      canvas: canvas.current, model, reducedMotion, autoplay,
      signal: controller.signal,
      onError: error => { setReady(false); callbacks.current.onError?.(error) },
      onFrame: snapshot => callbacks.current.onFrame?.(snapshot),
    }).then(next => {
      if (controller.signal.aborted) { next.destroy(); return }
      player.current = next
      if (autoplayRef.current) next.play(); else next.pause()
      setReady(true); callbacks.current.onReady?.(next)
    }).catch(error => {
      if (!controller.signal.aborted) callbacks.current.onError?.(error instanceof Error ? error : new Error(String(error)))
    })
    return () => { controller.abort(); player.current?.destroy(); player.current = undefined }
    // autoplay is updated independently without recreating WebGL resources.
  }, [model, reducedMotion])
  useEffect(() => { if (autoplay) player.current?.play(); else player.current?.pause() }, [autoplay])
  return <div role="img" aria-label={alt} className={className} style={{ position: 'relative', aspectRatio: model.texture.width + '/' + model.texture.height, ...style }}>
    <img src={model.texture.src} alt="" draggable={false} style={{ display: ready ? 'none' : 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
    <canvas ref={canvas} aria-hidden="true" style={{ position: 'absolute', left: '-12%', top: '-12%', width: '124%', height: '124%', display: ready ? 'block' : 'none', pointerEvents: 'none' }} />
  </div>
})

export { YuragiLayeredCharacter } from './react-layered.js'
export type { YuragiLayeredCharacterProps, YuragiLayeredCharacterHandle } from './react-layered.js'
