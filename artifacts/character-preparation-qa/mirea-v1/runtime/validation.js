const object = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
function fail(message) { throw new Error('Invalid rig model: ' + message); }
function finite(value, name, min, max) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
        fail(name + ' must be within ' + min + '…' + max);
}
function pair(value, name, min = 0, max = 1) {
    if (!Array.isArray(value) || value.length !== 2)
        fail(name + ' must contain two numbers');
    value.forEach(v => finite(v, name, min, max));
}
/** Validate all externally editable fields before allocating buffers or updating live state. */
export function validateModel(value) {
    if (!object(value) || value.version !== 1)
        fail('version must be 1');
    if (typeof value.id !== 'string' || !value.id || typeof value.name !== 'string')
        fail('id and name are required');
    if (!object(value.texture) || typeof value.texture.src !== 'string' || !value.texture.src)
        fail('texture.src is required');
    if (!/^(?:https?:|blob:|data:image\/(?:png|webp|jpeg);|\.?\.?\/|\/|[\w-])/i.test(value.texture.src) || /^javascript:/i.test(value.texture.src))
        fail('unsupported texture source');
    finite(value.texture.width, 'texture.width', 1, 8192);
    finite(value.texture.height, 'texture.height', 1, 8192);
    if (!object(value.mesh))
        fail('mesh is required');
    finite(value.mesh.columns, 'mesh.columns', 2, 200);
    finite(value.mesh.rows, 'mesh.rows', 2, 200);
    if (!Number.isInteger(value.mesh.columns) || !Number.isInteger(value.mesh.rows) || (value.mesh.columns + 1) * (value.mesh.rows + 1) > 65535)
        fail('invalid mesh dimensions');
    if (!Array.isArray(value.pins) || !value.pins.length || value.pins.length > 256)
        fail('pins must contain 1…256 items');
    const names = new Set();
    for (const p of value.pins) {
        if (!object(p) || typeof p.name !== 'string' || !p.name || names.has(p.name))
            fail('pin names must be unique');
        names.add(p.name);
        if (!['fixed', 'joint', 'spring'].includes(String(p.type)))
            fail('invalid pin type');
        finite(p.x, 'pin.x', 0, 1);
        finite(p.y, 'pin.y', 0, 1);
        finite(p.radius, 'pin.radius', .005, .5);
        for (const field of ['stiffness', 'damping', 'wind'])
            if (p[field] !== undefined)
                finite(p[field], 'pin.' + field, 0, 1);
    }
    for (const p of value.pins) {
        if (p.parent !== undefined && (typeof p.parent !== 'string' || !names.has(p.parent)))
            fail('unknown pin parent');
        const seen = new Set([p.name]);
        let parent = p.parent;
        while (parent) {
            if (seen.has(parent))
                fail('cyclic pin hierarchy');
            seen.add(parent);
            parent = value.pins.find(q => q.name === parent)?.parent;
        }
    }
    if (!Array.isArray(value.hair) || value.hair.length > 128)
        fail('invalid hair chains');
    const hairNames = new Set();
    for (const h of value.hair) {
        if (!object(h) || typeof h.id !== 'string' || hairNames.has(h.id) || !Array.isArray(h.points) || h.points.length !== 3)
            fail('invalid hair chain');
        hairNames.add(h.id);
        h.points.forEach(p => pair(p, 'hair point'));
        for (const [field, min, max] of [['phase', -100, 100], ['radius', .005, .5], ['gain', 0, 3]])
            finite(h[field], 'hair.' + field, min, max);
        const points = h.points;
        if (points.some((p, i) => i > 0 && p[0] === points[i - 1][0] && p[1] === points[i - 1][1]))
            fail('hair segments must have length');
    }
    if (!Array.isArray(value.accessories) || value.accessories.length > 128)
        fail('invalid accessories');
    for (const a of value.accessories) {
        if (!object(a) || typeof a.id !== 'string')
            fail('invalid accessory');
        pair(a.root, 'accessory.root');
        pair(a.tip, 'accessory.tip');
        if (a.root[0] === a.tip[0] && a.root[1] === a.tip[1])
            fail('accessory must have length');
        for (const [field, min, max] of [['radius', .005, .5], ['angle', 0, 1], ['stiffness', 0, 1], ['damping', 0, 1], ['phase', -100, 100]])
            finite(a[field], 'accessory.' + field, min, max);
    }
    if (!object(value.motion))
        fail('motion is required');
    for (const field of ['sway', 'hair', 'accessories', 'follow'])
        finite(value.motion[field], 'motion.' + field, 0, 2);
    finite(value.motion.speed, 'motion.speed', .25, 2);
    if (!Array.isArray(value.faceClearance))
        fail('faceClearance is required');
    for (const area of value.faceClearance) {
        if (!Array.isArray(area) || area.length !== 4)
            fail('invalid face clearance');
        area.forEach((n, i) => finite(n, 'faceClearance', i < 2 ? 0 : .001, 1));
    }
    if (!object(value.pose))
        fail('pose is required');
    finite(value.pose.headCenter, 'headCenter', 0, 1);
    for (const field of ['headBounds', 'headHorizontal', 'bodyBounds']) {
        pair(value.pose[field], field);
        const values = value.pose[field];
        if (values[0] >= values[1])
            fail(field + ' must be increasing');
    }
    if (value.pose.headWarpBounds !== undefined) {
        pair(value.pose.headWarpBounds, 'headWarpBounds');
        const bounds = value.pose.headWarpBounds;
        if (bounds[0] >= bounds[1])
            fail('headWarpBounds must be increasing');
    }
    pair(value.pose.bodyPivot, 'bodyPivot');
    pair(value.pose.swayPivot, 'swayPivot');
}
//# sourceMappingURL=validation.js.map