import { createLayeredFace } from './layered-face.js';
import { validateLayeredModel } from './layered-validation.js';
/** DOM-free runtime. Affine matrices use image-width units, correcting source aspect. */
export function createLayeredSimulation(input) {
    validateLayeredModel(input);
    const model = structuredClone(input), aspect = model.source.height / model.source.width;
    const face = createLayeredFace(model);
    const mouthLayers = new Map(model.attachments.filter(a => a.id !== model.face?.mouth?.shapes.closed && Object.values(model.face?.mouth?.shapes ?? {}).includes(a.id)).map(a => [a.id, (a.bounds[1] + a.bounds[3]) / 2]));
    const nodeIndex = new Map(model.nodes.map((node, index) => [node.id, index]));
    const joints = new Map(model.joints.map(joint => [joint.id, joint]));
    const parents = new Int16Array(model.nodes.map(node => node.parent ? nodeIndex.get(node.parent) : -1));
    const matrices = new Float64Array(model.nodes.length * 6);
    const angles = new Float64Array(model.nodes.length);
    const rotations = new Float64Array(model.nodes.length), velocities = rotations.slice(), followX = rotations.slice(), followY = rotations.slice();
    const count = model.attachments.reduce((sum, a) => sum + a.vertices.length, 0);
    const rest = new Float32Array(count * 2), positions = rest.slice(), uvs = rest.slice(), maskUVs = rest.slice();
    const offsets = new Uint32Array(count + 1), bindingIndices = [], bindingWeights = [], indices = [];
    const batches = [];
    const vertexLayers = [];
    let vertexOffset = 0;
    for (const layer of model.attachments) {
        const atlasIndex = model.atlases.findIndex(a => a.id === layer.atlas), atlas = model.atlases[atlasIndex];
        const opacity = layer.opacity ?? 1, mask = !!layer.mask;
        const facial = !!face.eyeFor(layer.id) || !!model.face?.mouth && Object.values(model.face.mouth.shapes).includes(layer.id);
        const previous = batches.at(-1);
        if (!facial && previous && !previous.attachment && previous.atlas === atlasIndex && previous.mask === mask && previous.opacity === opacity)
            previous.count += layer.triangles.length;
        else
            batches.push({ atlas: atlasIndex, mask, opacity, start: indices.length, count: layer.triangles.length, ...(facial ? { attachment: layer.id } : {}) });
        for (let i = 0; i < layer.vertices.length; i++) {
            const authored = layer.vertices[i];
            const vertex = authored.joint ? joints.get(authored.joint) : authored, v = vertexOffset + i;
            vertexLayers[v] = layer.id;
            rest.set(vertex.position, v * 2);
            const x = (vertex.position[0] - layer.bounds[0]) / (layer.bounds[2] - layer.bounds[0]);
            const y = (vertex.position[1] - layer.bounds[1]) / (layer.bounds[3] - layer.bounds[1]);
            uvs.set([(layer.rect[0] + x * layer.rect[2]) / atlas.width, (layer.rect[1] + y * layer.rect[3]) / atlas.height], v * 2);
            const r = layer.mask ?? layer.rect;
            maskUVs.set([(r[0] + x * r[2]) / atlas.width, (r[1] + y * r[3]) / atlas.height], v * 2);
            for (const weight of vertex.weights) {
                bindingIndices.push(nodeIndex.get(weight.node));
                bindingWeights.push(weight.weight);
            }
            offsets[v + 1] = bindingIndices.length;
        }
        for (const index of layer.triangles)
            indices.push(index + vertexOffset);
        vertexOffset += layer.vertices.length;
    }
    const binding = { offsets, indices: new Uint16Array(bindingIndices), weights: new Float32Array(bindingWeights) };
    const mesh = { rest, positions, uvs, maskUVs, indices: new Uint16Array(indices), binding };
    let targetX = 0, targetY = 0, dirty = true;
    function setPointer(x, y) {
        if (!Number.isFinite(x) || !Number.isFinite(y))
            throw new Error('Pointer coordinates must be finite');
        targetX = Math.max(-1, Math.min(1, x * 2));
        targetY = Math.max(-1, Math.min(1, y * 2));
    }
    function reset() { face.reset(); targetX = targetY = 0; rotations.fill(0); velocities.fill(0); followX.fill(0); followY.fill(0); dirty = true; }
    function update(time, delta, reduced = false) {
        if (!Number.isFinite(time) || !Number.isFinite(delta) || delta < 0)
            throw new Error('Invalid frame time');
        const dt = Math.min(delta, 50);
        let changed = dirty;
        for (let i = 0; i < model.nodes.length; i++) {
            const node = model.nodes[i], old = rotations[i], oldX = followX[i], oldY = followY[i];
            if (reduced) {
                rotations[i] = followX[i] = followY[i] = velocities[i] = 0;
            }
            else {
                const alpha = 1 - Math.exp(-dt / node.response);
                followX[i] += (targetX - followX[i]) * alpha;
                followY[i] += (targetY - followY[i]) * alpha;
                if (node.spring) {
                    const s = node.spring, steps = Math.max(1, Math.ceil(dt / 8.335)), step = dt / 16.67 / steps;
                    const goal = s.rotation * Math.tanh(Math.sin(time * .001 + s.phase) * s.wind + followX[i] * .22);
                    for (let j = 0; j < steps; j++) {
                        velocities[i] = (velocities[i] + (goal - rotations[i]) * s.stiffness * step) * Math.pow(s.damping, step);
                        rotations[i] = Math.max(-s.rotation, Math.min(s.rotation, rotations[i] + velocities[i] * step));
                    }
                }
            }
            changed ||= old !== rotations[i] || oldX !== followX[i] || oldY !== followY[i];
        }
        if (!reduced)
            for (const group of model.hairGroups ?? []) {
                const ids = group.nodes.map(id => nodeIndex.get(id));
                const average = ids.reduce((sum, id) => sum + rotations[id], 0) / ids.length;
                for (const id of ids) {
                    const limit = model.nodes[id].spring.rotation;
                    rotations[id] = Math.max(-limit, Math.min(limit, rotations[id] + (average - rotations[id]) * (1 - Math.pow(1 - group.coupling, dt / 16.67))));
                    changed ||= dt > 0;
                }
            }
        for (let i = 0; i < model.nodes.length; i++) {
            const node = model.nodes[i];
            const angle = reduced ? 0 : node.rotation * followX[i] + rotations[i], c = Math.cos(angle), s = Math.sin(angle);
            angles[i] = angle;
            const px = node.pivot[0], py = node.pivot[1] * aspect;
            const tx = px - c * px + s * py + node.translation[0] * followX[i];
            const ty = py - s * px - c * py + node.translation[1] * aspect * followY[i];
            const k = i * 6, parent = parents[i] * 6;
            if (parents[i] < 0) {
                matrices[k] = c;
                matrices[k + 1] = s;
                matrices[k + 2] = -s;
                matrices[k + 3] = c;
                matrices[k + 4] = tx;
                matrices[k + 5] = ty;
            }
            else {
                const a = matrices[parent], b = matrices[parent + 1], d = matrices[parent + 2], e = matrices[parent + 3];
                matrices[k] = a * c + d * s;
                matrices[k + 1] = b * c + e * s;
                matrices[k + 2] = -a * s + d * c;
                matrices[k + 3] = -b * s + e * c;
                matrices[k + 4] = a * tx + d * ty + matrices[parent + 4];
                matrices[k + 5] = b * tx + e * ty + matrices[parent + 5];
            }
        }
        if (changed) {
            const mouthOpen = Math.max(.16, face.snapshot().mouthOpen);
            for (let v = 0; v < count; v++) {
                const x = rest[v * 2];
                let sourceY = rest[v * 2 + 1];
                if (!reduced && mouthLayers.has(vertexLayers[v])) {
                    const center = mouthLayers.get(vertexLayers[v]);
                    sourceY = center + (sourceY - center) * mouthOpen;
                }
                const y = sourceY * aspect;
                // Sum displacement so neutral positions are bit-identical even with Float32 weights.
                let dx = 0, dy = 0;
                for (let j = offsets[v]; j < offsets[v + 1]; j++) {
                    const k = binding.indices[j] * 6, w = binding.weights[j];
                    dx += ((matrices[k] - 1) * x + matrices[k + 2] * y + matrices[k + 4]) * w;
                    dy += (matrices[k + 1] * x + (matrices[k + 3] - 1) * y + matrices[k + 5]) * w;
                }
                positions[v * 2] = x + dx;
                positions[v * 2 + 1] = sourceY + dy / aspect;
            }
        }
        dirty = false;
        return changed;
    }
    update(0, 0);
    return { model, mesh, batches, face: { ...face, setFace(pose) { face.setFace(pose); dirty = true; }, reset() { face.reset(); dirty = true; } },
        setFace(pose) { face.setFace(pose); dirty = true; }, matrices, rotations, angles, setPointer, reset, update,
        getPointer: () => [targetX / 2, targetY / 2] };
}
//# sourceMappingURL=layered.js.map