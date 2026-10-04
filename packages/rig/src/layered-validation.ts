import type { LayeredModel, LayerWeight } from './layered-types.js';
export function validateLayeredModel(input: unknown): asserts input is LayeredModel {
    const fail = (message: string): never => { throw new Error('Layered model: ' + message); };
    const object = (value: unknown): Record<string, any> => {
        if (!value || typeof value !== 'object' || Array.isArray(value))
            fail('expected object');
        return value as Record<string, any>;
    };
    const array = (value: unknown, max: number, min = 0): any[] => {
        if (!Array.isArray(value) || value.length < min || value.length > max)
            fail('invalid array length');
        return value as any[];
    };
    const number = (value: unknown, low: number, high: number): number => {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high)
            fail('invalid number');
        return value as number;
    };
    const str = (value: unknown): string => { if (typeof value !== 'string' || !value.trim())
        fail('expected nonempty string'); return value as string; };
    const point = (value: unknown, low = 0, high = 1) => array(value, 2, 2).forEach(v => number(v, low, high));
    const unique = (values: any[], label: string) => {
        const ids = new Set<string>();
        for (const value of values) {
            object(value);
            const id = str(value.id);
            if (ids.has(id))
                fail('duplicate ' + label);
            ids.add(id);
        }
        return ids;
    };
    const model = object(input);
    if (model.version !== 2 || model.renderer !== 'layered')
        fail('requires version 2 / layered');
    str(model.id);
    str(model.name);
    const source = object(model.source);
    for (const size of [source.width, source.height]) {
        number(size, 1, 8192);
        if (!Number.isInteger(size))
            fail('integer source dimensions required');
    }
    str(source.fallback);
    if (typeof source.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(source.sha256))
        fail('source fingerprint required');
    const atlases = array(model.atlases, 8, 1), nodes = array(model.nodes, 256, 1), joints = array(model.joints, 4096), attachments = array(model.attachments, 128, 1);
    unique(atlases, 'atlas');
    const nodeIds = unique(nodes, 'node');
    unique(joints, 'joint');
    unique(attachments, 'attachment');
    let bytes = 0;
    for (const atlas of atlases) {
        str(atlas.src);
        for (const size of [atlas.width, atlas.height]) {
            number(size, 1, 4096);
            if (!Number.isInteger(size))
                fail('integer atlas dimensions required');
        }
        bytes += atlas.width * atlas.height * 4;
    }
    if (bytes > 128 * 1024 * 1024)
        fail('atlas memory budget exceeded');
    const preceding = new Set<string>();
    for (const node of nodes) {
        point(node.pivot);
        point(node.translation, -.25, .25);
        number(node.rotation, -Math.PI, Math.PI);
        number(node.response, 1, 5000);
        if (node.parent !== undefined && !preceding.has(node.parent))
            fail('parent must precede child');
        preceding.add(node.id);
        if (node.spring !== undefined) {
            const spring = object(node.spring);
            number(spring.rotation, 0, .5);
            number(spring.stiffness, .001, 1);
            number(spring.damping, 0, .9999);
            number(spring.wind, -5, 5);
            number(spring.phase, -100, 100);
        }
    }
    const weights = (value: unknown) => {
        const entries = array(value, 4, 1), used = new Set<string>();
        let sum = 0;
        for (const entry of entries) {
            object(entry);
            if (!nodeIds.has(entry.node) || used.has(entry.node))
                fail('invalid binding node');
            used.add(entry.node);
            sum += number(entry.weight, .000001, 1);
        }
        if (Math.abs(sum - 1) > .00001)
            fail('weights must sum to one');
    };
    for (const joint of joints) {
        point(joint.position);
        weights(joint.weights);
    }
    let vertices = 0, triangles = 0;
    for (const layer of attachments) {
        const atlas = atlases.find(a => a.id === layer.atlas);
        if (!atlas)
            fail('unknown atlas');
        const rect = (value: unknown) => {
            const r = array(value, 4, 4);
            r.forEach(v => { number(v, 0, 4096); if (!Number.isInteger(v))
                fail('integer atlas rect required'); });
            if (r[2] < 1 || r[3] < 1 || r[0] + r[2] > atlas.width || r[1] + r[3] > atlas.height)
                fail('atlas rect out of bounds');
        };
        rect(layer.rect);
        if (layer.mask !== undefined)
            rect(layer.mask);
        const b = array(layer.bounds, 4, 4);
        b.forEach(v => number(v, 0, 1));
        if (b[0] >= b[2] || b[1] >= b[3])
            fail('empty source bounds');
        if (layer.coverage !== 'complete' && layer.coverage !== 'visible-only')
            fail('coverage must be explicit');
        str(layer.provenance);
        if (layer.opacity !== undefined)
            number(layer.opacity, 0, 1);
        const mesh = array(layer.vertices, 65535, 3);
        vertices += mesh.length;
        if (vertices > 65535) fail('mesh vertex budget exceeded');
        for (const vertex of mesh) {
            object(vertex);
            point(vertex.position);
            weights(vertex.weights);
            if (vertex.position[0] < b[0] - 1e-8 || vertex.position[0] > b[2] + 1e-8 || vertex.position[1] < b[1] - 1e-8 || vertex.position[1] > b[3] + 1e-8)
                fail('vertex outside attachment bounds');
            if (vertex.joint !== undefined) {
                const joint = joints.find(j => j.id === vertex.joint);
                if (!joint || JSON.stringify(joint.position) !== JSON.stringify(vertex.position))
                    fail('invalid joint position');
                const canonical = (w: LayerWeight[]) => JSON.stringify([...w].sort((a, b) => a.node.localeCompare(b.node)));
                if (canonical(joint.weights) !== canonical(vertex.weights))
                    fail('shared joint weights differ');
            }
        }
        const indices = array(layer.triangles, 393210, 3);
        if (indices.length % 3)
            fail('triangle list required');
        triangles += indices.length / 3;
        if (triangles > 131070) fail('triangle budget exceeded');
        for (const i of indices) {
            number(i, 0, mesh.length - 1);
            if (!Number.isInteger(i))
                fail('integer index required');
        }
        for (let i = 0; i < indices.length; i += 3) {
            const [a, b, c] = indices.slice(i, i + 3).map(index => mesh[index].position);
            if (Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) < 1e-12)
                fail('degenerate triangle');
        }
    }
    if (model.hairGroups !== undefined) {
        const groups = array(model.hairGroups, 32); unique(groups, 'hair group');
        const assigned = new Set<string>();
        for (const group of groups) {
            number(group.coupling, 0, 1);
            const members = array(group.nodes, 32, 2); const parent = nodes.find(n => n.id === members[0])?.parent;
            for (const id of members) {
                const node = nodes.find(n => n.id === id);
                if (!node?.spring || node.parent !== parent || assigned.has(id)) fail('hair group needs distinct spring siblings');
                assigned.add(id);
            }
        }
    }
    if (model.face !== undefined) {
        const face = object(model.face), used = new Set<string>();
        const attachment = (id: unknown, node: string) => {
            const layer = attachments.find(a => a.id === id);
            if (!layer || used.has(layer.id)) fail('unknown or reused face attachment');
            used.add(layer.id);
            if (layer.coverage !== 'complete' || layer.vertices.some((v: any) => v.weights.length !== 1 || v.weights[0].node !== node)) fail('face attachments must completely cover artwork and share one head node');
            return layer;
        };
        if (face.eyes !== undefined) {
            const sides = new Set<string>();
            for (const eye of array(face.eyes, 2, 1)) {
                object(eye);
                if (!['left', 'right'].includes(eye.side) || sides.has(eye.side)) fail('invalid eye side');
                sides.add(eye.side); if (!nodeIds.has(eye.node)) fail('unknown face node');
                attachment(eye.ball, eye.node); if (eye.iris !== undefined) attachment(eye.iris, eye.node);
                for (const id of array(eye.lines, 8, 1)) attachment(id, eye.node);
                attachment(eye.half, eye.node); attachment(eye.closed, eye.node); point(eye.travel, 0, .1);
                const top = array(eye.top, 24, 2), bottom = array(eye.bottom, 24, 2);
                if (top.length !== bottom.length) fail('eye curves must have matching samples');
                for (let i = 0; i < top.length; i++) {
                    point(top[i]); point(bottom[i]);
                    if (top[i][0] !== bottom[i][0] || top[i][1] > bottom[i][1] || i && top[i][0] <= top[i - 1][0]) fail('invalid eye curves');
                }
            }
        }
        if (face.mouth !== undefined) {
            const mouth = object(face.mouth), shapes = object(mouth.shapes);
            if (!nodeIds.has(mouth.node) || !shapes.closed) fail('mouth needs closed artwork and head node');
            for (const [shape, id] of Object.entries(shapes)) {
                if (!['closed','a','i','u','e','o'].includes(shape)) fail('unknown mouth shape');
                attachment(id, mouth.node);
            }
        }
        if (!face.eyes && !face.mouth) fail('empty face configuration');
    }
    if (vertices > 65535 || triangles > 131070)
        fail('mesh budget exceeded');
}
