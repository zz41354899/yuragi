import { regionInfluence } from './regions.js';
/** Rigid group interiors avoid interpolated rotations shrinking crossed limbs or props. */
export function createPointerGroups(model) {
    const aspect = model.texture.height / model.texture.width;
    const states = (model.pointerGroups ?? []).map(spec => ({ spec, x: 0, y: 0, rotation: 0, dx: 0, dy: 0, sin: 0, cos: 1 }));
    function update(delta, lookX, lookY) {
        const dt = delta === 0 ? 16.67 : Math.max(0, Math.min(50, Number.isFinite(delta) ? delta : 0));
        const gain = model.motion.layers ?? 1;
        for (const s of states) {
            const follow = 1 - Math.exp(-dt / s.spec.response);
            s.x += (lookX / 30 - s.x) * follow;
            s.y += (lookY / 30 - s.y) * follow;
            s.rotation = s.x * s.spec.rotation * gain;
            s.dx = s.x * s.spec.translation[0] * gain;
            s.dy = s.y * s.spec.translation[1] * gain;
            s.sin = Math.sin(s.rotation);
            s.cos = Math.cos(s.rotation);
        }
    }
    function bind(rest) {
        const offsets = new Uint32Array(rest.length / 2 + 1), indices = [], weights = [];
        for (let v = 0; v < rest.length / 2; v++) {
            const start = indices.length;
            let owner = -1, remaining = 1;
            for (const [i, s] of states.entries()) {
                const w = Math.max(...s.spec.regions.map(r => regionInfluence(r.polygon, r.feather, aspect, rest[v * 2], rest[v * 2 + 1])));
                if (w <= .00001)
                    continue;
                indices.push(i);
                weights.push(w);
                remaining *= 1 - w;
                if (w === 1)
                    owner = weights.length - 1;
            }
            if (owner >= 0) {
                for (let i = start; i < weights.length; i++)
                    weights[i] = i === owner ? 1 : 0;
            }
            else {
                let sum = 0;
                for (let i = start; i < weights.length; i++) {
                    weights[i] /= 1 - weights[i];
                    sum += weights[i];
                }
                for (let i = start; i < weights.length; i++)
                    weights[i] *= (1 - remaining) / sum;
            }
            offsets[v + 1] = indices.length;
        }
        return { offsets, indices: new Uint16Array(indices), weights: new Float32Array(weights) };
    }
    function apply(binding, vertex, x, y) {
        if (!binding)
            return { x, y };
        let dx = 0, dy = 0;
        for (let i = binding.offsets[vertex]; i < binding.offsets[vertex + 1]; i++) {
            const s = states[binding.indices[i]], w = binding.weights[i];
            const px = x - s.spec.pivot[0], py = (y - s.spec.pivot[1]) * aspect;
            dx += (px * (s.cos - 1) - py * s.sin + s.dx) * w;
            dy += ((px * s.sin + py * (s.cos - 1)) / aspect + s.dy) * w;
        }
        return { x: x + dx, y: y + dy };
    }
    function reset() {
        for (const s of states) {
            s.x = s.y = s.rotation = s.dx = s.dy = s.sin = 0;
            s.cos = 1;
        }
    }
    return { states, update, bind, apply, reset };
}
//# sourceMappingURL=pointer-groups.js.map