import { fixedSteps } from './review.js';
import { loadImage } from './image.js';
import { createLayeredSimulation } from './layered.js';
import type { LayeredPlayer, LayeredPlayerOptions, LayeredSnapshot } from './layered-types.js';
export async function createLayeredPlayer(options: LayeredPlayerOptions): Promise<LayeredPlayer> {
    if (options.pixelRatio !== undefined && (!Number.isFinite(options.pixelRatio) || options.pixelRatio <= 0)) throw new Error('Pixel ratio must be positive and finite');
    const simulation = createLayeredSimulation(options.model), { model, mesh, batches } = simulation;
    // Abort sibling loads on failure, and retain the caller's cancellation until initialization completes.
    const loading = new AbortController(), cancelLoad = () => loading.abort();
    options.signal?.addEventListener('abort', cancelLoad, { once: true });
    if (options.signal?.aborted)
        loading.abort();
    let images: HTMLImageElement[];
    try {
        images = await Promise.all(model.atlases.map(async (atlas) => {
            const image = await loadImage(atlas.src, loading.signal);
            if (image.naturalWidth !== atlas.width || image.naturalHeight !== atlas.height)
                throw new Error('Atlas dimensions do not match: ' + atlas.id);
            return image;
        }));
    }
    catch (error) {
        loading.abort();
        throw error;
    }
    finally {
        options.signal?.removeEventListener('abort', cancelLoad);
    }
    if (options.signal?.aborted)
        throw new DOMException('Loading cancelled', 'AbortError');
    const canvas = options.canvas, gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: !!options.manual });
    if (!gl)
        throw new Error('WebGL is unavailable');
    const buffers: WebGLBuffer[] = [], shaders: WebGLShader[] = [], textures: WebGLTexture[] = [];
    let program: WebGLProgram | null = null;
    const release = () => { buffers.forEach(b => gl.deleteBuffer(b)); shaders.forEach(s => gl.deleteShader(s)); textures.forEach(t => gl.deleteTexture(t)); if (program)
        gl.deleteProgram(program); };
    function shader(type: number, source: string) {
        const value = gl!.createShader(type);
        if (!value)
            throw new Error('Cannot allocate shader');
        shaders.push(value);
        gl!.shaderSource(value, source);
        gl!.compileShader(value);
        if (!gl!.getShaderParameter(value, gl!.COMPILE_STATUS))
            throw new Error(gl!.getShaderInfoLog(value) || 'Shader compile failed');
        return value;
    }
    let position = 0, uv = 0, maskUV = 0;
    let maskUniform: WebGLUniformLocation | null = null, opacityUniform: WebGLUniformLocation | null = null;
    try {
        program = gl.createProgram();
        if (!program)
            throw new Error('Cannot allocate program');
        gl.attachShader(program, shader(gl.VERTEX_SHADER, `attribute vec2 a_position;attribute vec2 a_uv;attribute vec2 a_mask;varying vec2 v_uv;varying vec2 v_mask;
    void main(){vec2 p=(a_position+vec2(.12))/1.24;gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);v_uv=a_uv;v_mask=a_mask;}`));
        gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `precision mediump float;uniform sampler2D u_image;uniform float u_mask;uniform float u_opacity;uniform float u_clip;uniform float u_open;uniform vec4 u_curve[24];uniform int u_samples;uniform vec4 u_rect;uniform vec4 u_bounds;uniform vec2 u_shift;varying vec2 v_uv;varying vec2 v_mask;
    void main(){vec2 q=(v_uv-u_rect.xy)/u_rect.zw;vec2 source=u_bounds.xy+q*u_bounds.zw;vec2 shifted=v_uv-u_shift;vec2 local=(shifted-u_rect.xy)/u_rect.zw;vec4 color=texture2D(u_image,shifted);if(u_clip>.5){float top=0.;float bottom=0.;for(int i=0;i<23;i++){if(i<u_samples-1 && source.x>=u_curve[i].x && source.x<=u_curve[i+1].x){float t=(source.x-u_curve[i].x)/(u_curve[i+1].x-u_curve[i].x);top=mix(u_curve[i].y,u_curve[i+1].y,t);bottom=mix(u_curve[i].w,u_curve[i+1].w,t);}}float lid=mix(bottom,top,u_open);color*=step(lid,source.y)*step(source.y,bottom)*step(u_curve[0].x,source.x);color*=step(0.,local.x)*step(local.x,1.)*step(0.,local.y)*step(local.y,1.);}float alpha=1.;if(u_mask>.5)alpha=texture2D(u_image,v_mask).a;gl_FragColor=color*(alpha*u_opacity);}`));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
        gl.useProgram(program);
        position = gl.getAttribLocation(program, 'a_position');
        uv = gl.getAttribLocation(program, 'a_uv');
        maskUV = gl.getAttribLocation(program, 'a_mask');
        gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
        maskUniform = gl.getUniformLocation(program, 'u_mask');
        opacityUniform = gl.getUniformLocation(program, 'u_opacity');
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        for (const [data, target, usage] of [[mesh.positions, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW], [mesh.uvs, gl.ARRAY_BUFFER, gl.STATIC_DRAW], [mesh.maskUVs, gl.ARRAY_BUFFER, gl.STATIC_DRAW], [mesh.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW]] as const) {
            const b = gl.createBuffer();
            if (!b)
                throw new Error('Cannot allocate buffer');
            buffers.push(b);
            gl.bindBuffer(target, b);
            gl.bufferData(target, data, usage);
        }
        const maximum = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
        for (let i = 0; i < images.length; i++) {
            if (model.atlases[i].width > maximum || model.atlases[i].height > maximum)
                throw new Error('Atlas exceeds GPU texture limit');
            const t = gl.createTexture();
            if (!t)
                throw new Error('Cannot allocate texture');
            textures.push(t);
            gl.bindTexture(gl.TEXTURE_2D, t);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            for (const pname of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
                gl.texParameteri(gl.TEXTURE_2D, pname, gl.CLAMP_TO_EDGE);
            for (const pname of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
                gl.texParameteri(gl.TEXTURE_2D, pname, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
        }
    }
    catch (error) {
        release();
        throw error;
    }
    let destroyed = false, playing = false, visible = true, frame = 0, lastTime = 0, elapsed = 0, lastReport = -100, cpuMilliseconds = 0, forceUpload = false;
    let media: MediaQueryList;
    try { media = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch (error) { release(); throw error; }
    const reduced = () => options.reducedMotion !== 'ignore' && media.matches;
    function snapshot(): LayeredSnapshot { return { playing, ...(model.face ? { face: simulation.face.snapshot(reduced()) } : {}), reducedMotion: reduced(), pointer: reduced() ? [0, 0] : simulation.getPointer(), nodes: model.nodes.map((n, i) => ({ id: n.id, rotation: reduced() ? 0 : simulation.angles[i] })), diagnostics: { drawCalls: batches.length, vertices: mesh.rest.length / 2, triangles: mesh.indices.length / 3, atlasBytes: model.atlases.reduce((s, a) => s + a.width * a.height * 4, 0), cpuMilliseconds } }; }
    function draw(report = true, delta = 0) {
        if (destroyed || gl!.isContextLost())
            return;
        const started = performance.now(), changed = simulation.update(elapsed, delta, reduced());
        const density = Math.min(2, Math.max(1, options.pixelRatio ?? window.devicePixelRatio ?? 1)), box = canvas.getBoundingClientRect?.();
        const width = Math.max(1, Math.min(4096, Math.round((box?.width || canvas.clientWidth) * density))), height = Math.max(1, Math.min(4096, Math.round((box?.height || canvas.clientHeight) * density)));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        gl!.viewport(0, 0, width, height);
        gl!.clearColor(0, 0, 0, 0);
        gl!.clear(gl!.COLOR_BUFFER_BIT);
        gl!.useProgram(program);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffers[0]);
        if (changed || forceUpload)
            gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, mesh.positions);
        gl!.enableVertexAttribArray(position);
        gl!.vertexAttribPointer(position, 2, gl!.FLOAT, false, 0, 0);
        for (const [index, location] of [[1, uv], [2, maskUV]]) {
            gl!.bindBuffer(gl!.ARRAY_BUFFER, buffers[index]);
            gl!.enableVertexAttribArray(location);
            gl!.vertexAttribPointer(location, 2, gl!.FLOAT, false, 0, 0);
        }
        gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, buffers[3]);
        for (const batch of batches) {
            gl!.bindTexture(gl!.TEXTURE_2D, textures[batch.atlas]);
            gl!.uniform1f(maskUniform, batch.mask ? 1 : 0);
            let opacity = batch.opacity;
            if (model.face) {
                const state = batch.attachment ? simulation.face.layer(batch.attachment, reduced()) : undefined;
                opacity *= state?.opacity ?? 1;
                gl!.uniform1f(gl!.getUniformLocation(program!, 'u_clip'), state?.clip ? 1 : 0);
                if (state?.eye && state.clip) {
                    const attachment = model.attachments.find(a => a.id === batch.attachment)!;
                    const atlas = model.atlases[batch.atlas], r = attachment.rect, b = attachment.bounds;
                    gl!.uniform4f(gl!.getUniformLocation(program!, 'u_rect'), r[0]/atlas.width,r[1]/atlas.height,r[2]/atlas.width,r[3]/atlas.height);
                    gl!.uniform4f(gl!.getUniformLocation(program!, 'u_bounds'), b[0],b[1],b[2]-b[0],b[3]-b[1]);
                    gl!.uniform2f(gl!.getUniformLocation(program!, 'u_shift'), state.shift[0]/(b[2]-b[0])*r[2]/atlas.width,state.shift[1]/(b[3]-b[1])*r[3]/atlas.height);
                    gl!.uniform1f(gl!.getUniformLocation(program!, 'u_open'), state.open);
                    gl!.uniform1i(gl!.getUniformLocation(program!, 'u_samples'), state.eye.top.length);
                    const curves = new Float32Array(96);
                    state.eye.top.forEach((p,i) => curves.set([p[0],p[1],state.eye!.bottom[i][0],state.eye!.bottom[i][1]],i*4));
                    gl!.uniform4fv(gl!.getUniformLocation(program!, 'u_curve[0]'),curves);
                }
            }
            gl!.uniform1f(opacityUniform, opacity);
            gl!.drawElements(gl!.TRIANGLES, batch.count, gl!.UNSIGNED_SHORT, batch.start * 2);
        }
        forceUpload = false;
        cpuMilliseconds = performance.now() - started;
        if (report)
            options.onFrame?.(snapshot());
    }
    function tick(time: number) {
        if (destroyed || !playing)
            return;
        frame = requestAnimationFrame(tick);
        if (!visible || document.hidden || reduced()) {
            lastTime = 0;
            return;
        }
        const dt = Math.min(lastTime ? time - lastTime : 16.67, 50);
        if (dt < 15 && lastTime)
            return;
        lastTime = time;
        elapsed += dt;
        const report = time - lastReport >= 100;
        draw(report, dt);
        if (report)
            lastReport = time;
    }
    function play() { if (destroyed || playing || reduced())
        return; playing = true; lastTime = 0; if (!options.manual) frame = requestAnimationFrame(tick); draw(); }
    function pause() { playing = false; cancelAnimationFrame(frame); lastTime = 0; draw(); }
    let resize: ResizeObserver | undefined, intersection: IntersectionObserver | undefined;
    const visibility = () => { lastTime = 0; }, motionChange = () => { if (reduced())
        pause();
    else if (options.autoplay !== false)
        play(); draw(); };
    const contextLost = (event: Event) => { event.preventDefault(); pause(); options.onError?.(new Error('WebGL context lost. Remount the player to restore it.')); };
    const player: LayeredPlayer = { play, pause,
        advance(milliseconds) { if (destroyed) return; fixedSteps(milliseconds, dt => { elapsed += dt; simulation.update(elapsed, dt, reduced()); }); forceUpload = true; draw(); },
        setGaze(x, y) { if (!destroyed) { simulation.face.setGaze(x, y); draw(); } },
        setFace(pose) { if (!destroyed) { simulation.face.setFace(pose); draw(); } }, setPointer(x, y) { if (destroyed)
            return; simulation.setPointer(x, y); if (!playing && !options.manual) {
            for (let i = 0; i < 120; i++)
                simulation.update(elapsed, 16.67, reduced());
            forceUpload = true;
            draw();
        } }, reset() { if (destroyed)
            return; simulation.reset(); elapsed = 0; draw(); }, getModel: () => structuredClone(model), getSnapshot: snapshot, getMeshSnapshot: () => ({ rest: mesh.rest.slice(), positions: mesh.positions.slice(), indices: mesh.indices.slice() }), destroy() { if (destroyed)
            return; playing = false; cancelAnimationFrame(frame); destroyed = true; resize?.disconnect(); intersection?.disconnect(); document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', motionChange); canvas.removeEventListener('webglcontextlost', contextLost); options.signal?.removeEventListener('abort', player.destroy); release(); } };
    try {
        resize = new ResizeObserver(() => draw());
        intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; lastTime = 0; }, { rootMargin: '160px' });
        resize.observe(canvas);
        intersection.observe(canvas);
        document.addEventListener('visibilitychange', visibility);
        media.addEventListener('change', motionChange);
        canvas.addEventListener('webglcontextlost', contextLost);
        options.signal?.addEventListener('abort', player.destroy, { once: true });
        draw();
        if (options.autoplay !== false)
            play();
    }
    catch (error) {
        player.destroy();
        throw error;
    }
    return player;
}
