import { createSimulation } from './simulation.js';
import { validateModel } from './validation.js';
import { applySway } from './sway.js';
export const CANVAS_PADDING = .12;
export const toCanvas = (n) => (n + CANVAS_PADDING) / (1 + CANVAS_PADDING * 2);
function loadImage(src, signal) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const abort = () => { cleanup(); image.src = ''; reject(new DOMException('Loading cancelled', 'AbortError')); };
        const timeout = setTimeout(() => { cleanup(); image.src = ''; reject(new Error('Texture load timed out')); }, 20000);
        const cleanup = () => { clearTimeout(timeout); image.onload = null; image.onerror = null; signal?.removeEventListener('abort', abort); };
        image.onload = () => { cleanup(); resolve(image); };
        image.onerror = () => { cleanup(); reject(new Error('Unable to load texture: ' + src)); };
        if (signal?.aborted) {
            abort();
            return;
        }
        signal?.addEventListener('abort', abort, { once: true });
        image.crossOrigin = 'anonymous';
        image.decoding = 'async';
        image.src = src;
    });
}
export async function createPlayer(options) {
    validateModel(options.model);
    const simulation = createSimulation(options.model);
    const image = await loadImage(simulation.model.texture.src, options.signal);
    if (image.naturalWidth !== simulation.model.texture.width || image.naturalHeight !== simulation.model.texture.height)
        throw new Error('Texture dimensions do not match the model');
    if (options.signal?.aborted)
        throw new DOMException('Loading cancelled', 'AbortError');
    const canvas = options.canvas;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl)
        throw new Error('WebGL is unavailable');
    const shaders = [];
    const buffers = [];
    let program = null;
    let texture = null;
    let mesh;
    let positionLocation = 0, uvLocation = 0;
    let destroyed = false, playing = false, visible = true, lastTime = 0, elapsed = 0, frame = 0, lastReport = -100;
    let diagnostics = { motionScale: 1, maxDisplacementGradient: 0 };
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => options.reducedMotion !== 'ignore' && media.matches;
    function release() {
        for (const buffer of buffers)
            gl.deleteBuffer(buffer);
        for (const shader of shaders)
            gl.deleteShader(shader);
        if (program)
            gl.deleteProgram(program);
        if (texture)
            gl.deleteTexture(texture);
    }
    function shader(type, source) {
        const value = gl.createShader(type);
        if (!value)
            throw new Error('Cannot allocate shader');
        shaders.push(value);
        gl.shaderSource(value, source);
        gl.compileShader(value);
        if (!gl.getShaderParameter(value, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(value) || 'Shader compile failed');
        return value;
    }
    try {
        program = gl.createProgram();
        if (!program)
            throw new Error('Cannot allocate program');
        gl.attachShader(program, shader(gl.VERTEX_SHADER, `
      attribute vec2 a_position; attribute vec2 a_uv; varying vec2 v_uv;
      void main() {
        vec2 p = (a_position + vec2(0.12)) / 1.24;
        gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
        v_uv = a_uv;
      }
    `));
        gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
      precision mediump float; uniform sampler2D u_image; varying vec2 v_uv;
      void main() { gl_FragColor = texture2D(u_image, v_uv); }
    `));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
        gl.useProgram(program);
        positionLocation = gl.getAttribLocation(program, 'a_position');
        uvLocation = gl.getAttribLocation(program, 'a_uv');
        gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        mesh = simulation.buildContinuousMesh();
        for (const [data, target, usage] of [
            [mesh.positions, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW],
            [mesh.uvs, gl.ARRAY_BUFFER, gl.STATIC_DRAW],
            [mesh.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW],
        ]) {
            const buffer = gl.createBuffer();
            if (!buffer)
                throw new Error('Cannot allocate buffer');
            buffers.push(buffer);
            gl.bindBuffer(target, buffer);
            gl.bufferData(target, data, usage);
        }
        texture = gl.createTexture();
        if (!texture)
            throw new Error('Cannot allocate texture');
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }
    catch (error) {
        release();
        throw error;
    }
    function snapshot() {
        return {
            parameters: { ...simulation.parameters },
            pins: simulation.pins.map(p => ({
                name: p.name, parent: p.parent, type: p.type,
                ...(reduced() ? { x: p.x, y: p.y } : applySway(p.px, p.py, simulation.sway, simulation.model)),
            })),
            diagnostics: { ...diagnostics }, sway: { ...simulation.sway }, playing,
        };
    }
    function draw(report = true) {
        if (destroyed || gl.isContextLost())
            return;
        const density = Math.min(2, Math.max(1, options.pixelRatio ?? window.devicePixelRatio ?? 1));
        const width = Math.max(1, Math.round(canvas.clientWidth * density));
        const height = Math.max(1, Math.round(canvas.clientHeight * density));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        diagnostics = simulation.updateVertices(mesh, elapsed, reduced());
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[0]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.positions);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[1]);
        gl.enableVertexAttribArray(uvLocation);
        gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[2]);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        canvas.dataset.motionScale = String(diagnostics.motionScale);
        canvas.dataset.playing = String(playing);
        if (report && options.onFrame)
            options.onFrame(snapshot());
    }
    function tick(time) {
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
        simulation.updatePins(elapsed, dt);
        draw(time - lastReport >= 100);
        if (time - lastReport >= 100)
            lastReport = time;
    }
    function play() {
        if (destroyed || playing || reduced())
            return;
        playing = true;
        lastTime = 0;
        frame = requestAnimationFrame(tick);
        draw();
    }
    function pause() {
        playing = false;
        cancelAnimationFrame(frame);
        lastTime = 0;
        draw();
    }
    function settle() {
        if (playing || destroyed)
            return;
        for (let i = 0; i < 30; i++)
            simulation.updatePins(elapsed, 0);
        draw();
    }
    const resize = new ResizeObserver(() => draw());
    resize.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; lastTime = 0; }, { rootMargin: '160px' });
    intersection.observe(canvas);
    const visibility = () => { lastTime = 0; };
    const motionChange = () => { if (reduced())
        pause();
    else if (options.autoplay !== false)
        play(); draw(); };
    const contextLost = (event) => {
        event.preventDefault();
        pause();
        options.onError?.(new Error('WebGL context lost. Remount the player to restore it.'));
    };
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', motionChange);
    canvas.addEventListener('webglcontextlost', contextLost);
    const player = {
        play, pause,
        setPointer(x, y) {
            if (destroyed)
                return;
            if (!Number.isFinite(x) || !Number.isFinite(y))
                throw new Error('Pointer coordinates must be finite');
            simulation.setPointer(x, y);
            settle();
        },
        setParameter(name, value) {
            if (destroyed)
                return;
            if (!Number.isFinite(value) || !simulation.setParameter(name, value))
                throw new Error('Invalid parameter');
            settle();
        },
        setMotion(settings) { if (!destroyed) {
            simulation.setMotion(settings);
            simulation.updatePins(elapsed, 0);
            draw();
        } },
        setPin(name, patch) {
            if (destroyed)
                return;
            simulation.setPin(name, patch);
            mesh = simulation.buildContinuousMesh();
            settle();
            draw();
        },
        wave() { if (!destroyed) {
            simulation.wave(elapsed);
            if (!playing)
                play();
        } },
        reset() {
            if (destroyed)
                return;
            const previousMotion = { ...simulation.model.motion };
            for (const p of simulation.pins) {
                p.px = p.x;
                p.py = p.y;
                p.vx = 0;
                p.vy = 0;
            }
            for (const p of simulation.hair.pins) {
                p.dx = 0;
                p.dy = 0;
                p.vx = 0;
                p.vy = 0;
            }
            for (const p of simulation.accessories.pins) {
                p.rotation = 0;
                p.velocity = 0;
            }
            simulation.reset();
            simulation.velocity.lookX = 0;
            simulation.velocity.lookY = 0;
            Object.assign(simulation.parameters, { lookX: 0, lookY: 0, bodyX: 0, wave: 0 });
            simulation.setMotion(previousMotion);
            draw();
        },
        getModel: () => structuredClone(simulation.model),
        getSnapshot: snapshot,
        destroy() {
            if (destroyed)
                return;
            pause();
            destroyed = true;
            resize.disconnect();
            intersection.disconnect();
            document.removeEventListener('visibilitychange', visibility);
            media.removeEventListener('change', motionChange);
            canvas.removeEventListener('webglcontextlost', contextLost);
            options.signal?.removeEventListener('abort', player.destroy);
            release();
        },
    };
    options.signal?.addEventListener('abort', player.destroy, { once: true });
    draw();
    if (options.autoplay !== false)
        play();
    return player;
}
//# sourceMappingURL=player.js.map