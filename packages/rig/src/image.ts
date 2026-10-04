export function loadImage(src: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const abort = () => { cleanup(); image.src = ''; reject(new DOMException('Loading cancelled', 'AbortError')) }
    const timeout = setTimeout(() => { cleanup(); image.src = ''; reject(new Error('Texture load timed out')) }, 20000)
    const cleanup = () => { clearTimeout(timeout); image.onload = null; image.onerror = null; signal?.removeEventListener('abort', abort) }
    image.onload = () => { cleanup(); resolve(image) }
    image.onerror = () => { cleanup(); reject(new Error('Unable to load texture: ' + src)) }
    if (signal?.aborted) { abort(); return }
    signal?.addEventListener('abort', abort, { once: true })
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.src = src
  })
}

