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
function polygon(value) {
    if (!Array.isArray(value) || value.length < 3 || value.length > 32)
        fail('part polygon must contain 3…32 vertices');
    value.forEach(p => pair(p, 'part polygon point'));
    const points = value;
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-8)
            fail('part polygon edges must have length');
        area += a[0] * b[1] - b[0] * a[1];
        for (let j = i + 2; j < points.length; j++) {
            if (i === 0 && j === points.length - 1)
                continue;
            const c = points[j], d = points[(j + 1) % points.length];
            const overlaps = Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0])) <= Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0])) &&
                Math.max(Math.min(a[1], b[1]), Math.min(c[1], d[1])) <= Math.min(Math.max(a[1], b[1]), Math.max(c[1], d[1]));
            if (overlaps && cross(a, b, c) * cross(a, b, d) <= 0 && cross(c, d, a) * cross(c, d, b) <= 0)
                fail('part polygon must not self-intersect');
        }
    }
    if (Math.abs(area) < 1e-8)
        fail('part polygon must have area');
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
    if (value.parts !== undefined) {
        if (!Array.isArray(value.parts) || value.parts.length > 64)
            fail('parts must contain at most 64 regions');
        const ids = new Set();
        for (const p of value.parts) {
            if (!object(p) || typeof p.id !== 'string' || !p.id || ids.has(p.id))
                fail('part IDs must be unique');
            ids.add(p.id);
            if (p.name !== undefined && typeof p.name !== 'string')
                fail('invalid part name');
            if (!['hair', 'cloth', 'ribbon', 'accessory'].includes(String(p.kind)))
                fail('invalid part kind');
            if (p.channel !== undefined && !['hair', 'accessories'].includes(String(p.channel)))
                fail('invalid part channel');
            polygon(p.polygon);
            pair(p.root, 'part.root');
            pair(p.tip, 'part.tip');
            if (p.exclusions !== undefined) {
                if (!Array.isArray(p.exclusions) || p.exclusions.length > 16)
                    fail('part exclusions must contain at most 16 polygons');
                p.exclusions.forEach(polygon);
            }
            const root = p.root, tip = p.tip;
            if (Math.hypot(tip[0] - root[0], tip[1] - root[1]) < 1e-8)
                fail('part root and tip must differ');
            for (const [field, min, max] of [['feather', .002, .2], ['rotation', 0, .35], ['stiffness', .001, 1], ['damping', .001, 1], ['phase', -100, 100], ['wind', 0, 2], ['follow', -2, 2]])
                finite(p[field], 'part.' + field, min, max);
            if (p.followY !== undefined)
                finite(p.followY, 'part.followY', -2, 2);
        }
    }
    if (value.surfaceRegions !== undefined) {
        if (!Array.isArray(value.surfaceRegions) || value.surfaceRegions.length > 64)
            fail('surfaceRegions must contain at most 64 regions');
        const ids = new Set();
        for (const r of value.surfaceRegions) {
            if (!object(r) || typeof r.id !== 'string' || !r.id || ids.has(r.id))
                fail('surface region IDs must be unique');
            ids.add(r.id);
            polygon(r.polygon);
            finite(r.feather, 'region.feather', .002, .2);
            if (!['weighted', 'rigid'].includes(String(r.mode)))
                fail('invalid surface region mode');
            if (r.mode === 'weighted' && (!Array.isArray(r.pins) || !r.pins.length || r.pins.length > 256 || new Set(r.pins).size !== r.pins.length || r.pins.some(p => typeof p !== 'string' || !names.has(p))))
                fail('weighted region needs unique known pins');
            if (r.mode === 'rigid' && r.pins !== undefined)
                fail('rigid regions use an anchor, not pin weights');
            if (r.anchor !== undefined && (typeof r.anchor !== 'string' || !names.has(r.anchor)))
                fail('unknown region anchor');
            if (r.rotation !== undefined && !['none', 'head', 'body'].includes(String(r.rotation)))
                fail('invalid region rotation');
            if (r.secondary !== undefined && typeof r.secondary !== 'boolean')
                fail('invalid region secondary flag');
            if (r.mode === 'weighted' && (r.anchor !== undefined || r.rotation !== undefined))
                fail('weighted regions cannot specify rigid transforms');
        }
    }
    if (value.pointerGroups !== undefined) {
        if (!Array.isArray(value.pointerGroups) || value.pointerGroups.length > 16)
            fail('pointerGroups must contain at most 16 groups');
        const ids = new Set();
        for (const g of value.pointerGroups) {
            if (!object(g) || typeof g.id !== 'string' || !g.id || ids.has(g.id))
                fail('pointer group IDs must be unique');
            ids.add(g.id);
            if (g.name !== undefined && typeof g.name !== 'string')
                fail('invalid pointer group name');
            pair(g.pivot, 'pointer group pivot');
            pair(g.translation, 'pointer group translation', -.03, .03);
            finite(g.rotation, 'pointer group rotation', -.08, .08);
            finite(g.response, 'pointer group response', 16, 1000);
            if (!Array.isArray(g.regions) || !g.regions.length || g.regions.length > 8)
                fail('pointer group needs 1…8 regions');
            for (const r of g.regions) {
                if (!object(r))
                    fail('invalid pointer group region');
                polygon(r.polygon);
                finite(r.feather, 'pointer group feather', .002, .2);
            }
        }
    }
    if (!object(value.motion))
        fail('motion is required');
    if (value.tracking !== undefined) {
        if (!object(value.tracking))
            fail('invalid tracking');
        finite(value.tracking.response, 'tracking.response', .001, .2);
        finite(value.tracking.damping, 'tracking.damping', .1, .98);
        finite(value.tracking.maxVelocity, 'tracking.maxVelocity', .1, 5);
        if (value.tracking.bodyFollow !== undefined)
            finite(value.tracking.bodyFollow, 'tracking.bodyFollow', 0, 1);
        if (value.tracking.translation !== undefined) {
            pair(value.tracking.translation, 'tracking.translation');
            for (const v of value.tracking.translation)
                finite(v, 'tracking.translation', 0, .08);
        }
    }
    for (const field of ['sway', 'hair', 'accessories', 'follow'])
        finite(value.motion[field], 'motion.' + field, 0, 2);
    finite(value.motion.speed, 'motion.speed', .25, 2);
    if (value.motion.parts !== undefined)
        finite(value.motion.parts, 'motion.parts', 0, 2);
    if (value.motion.weight !== undefined)
        finite(value.motion.weight, 'motion.weight', 0, 1);
    if (value.motion.layers !== undefined)
        finite(value.motion.layers, 'motion.layers', 0, 1);
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
    if (value.pose.headFollow !== undefined) {
        if (!object(value.pose.headFollow))
            fail('invalid headFollow');
        finite(value.pose.headFollow.rotation, 'headFollow.rotation', 0, .3);
        pair(value.pose.headFollow.translation, 'headFollow.translation', 0, .08);
        const head = value.pose.headFollow;
        if (head.region !== undefined) {
            polygon(head.region);
            finite(head.feather, 'headFollow.feather', .002, .2);
            if (!names.has('head-root'))
                fail('headFollow.region requires head-root');
        }
        else if (head.feather !== undefined || head.neck !== undefined)
            fail('headFollow feather/neck requires a region');
        if (head.neck !== undefined) {
            if (!object(head.neck))
                fail('invalid headFollow.neck');
            polygon(head.neck.polygon);
            pair(head.neck.base, 'neck.base');
            finite(head.neck.feather, 'neck.feather', .002, .2);
            const root = value.pins.find(p => object(p) && p.name === 'head-root');
            const base = head.neck.base;
            if (Math.hypot(base[0] - Number(root.x), base[1] - Number(root.y)) < 1e-8)
                fail('neck base must differ from head-root');
        }
    }
    pair(value.pose.bodyPivot, 'bodyPivot');
    pair(value.pose.swayPivot, 'swayPivot');
    if (value.face !== undefined) {
        const f = value.face;
        if (!object(f) || !Array.isArray(f.eyes) || f.eyes.length !== 2)
            fail('face needs two reviewed eyes');
        if (Object.keys(f).some(k => k !== 'eyes'))
            fail('Legacy or unknown face fields: run migrate_gaze.py for 0.2.0');
        if (!object(value.pose.headFollow) || !value.pose.headFollow.region)
            fail('face features require owned head geometry');
        const ids = new Set();
        for (const e of f.eyes) {
            if (!object(e) || !['left', 'right'].includes(String(e.id)) || ids.has(String(e.id)))
                fail('face needs unique left/right eyes');
            ids.add(String(e.id));
            pair(e.center, 'eye.center');
            pair(e.iris, 'eye.iris');
            pair(e.radius, 'eye.radius', .001, .06);
            pair(e.irisRadius, 'eye.irisRadius', .001, .03);
            pair(e.travel, 'eye.travel', 0, .01);
            finite(e.angle, 'eye.angle', -1, 1);
            if (Object.keys(e).some(k => !['id', 'center', 'radius', 'iris', 'irisRadius', 'travel', 'angle', 'sclera'].includes(k)))
                fail('Legacy or unknown eye fields: run migrate_gaze.py for 0.2.0');
            for (const color of [e.sclera]) {
                if (!Array.isArray(color) || color.length !== 3)
                    fail('face colors need three channels');
                color.forEach(v => finite(v, 'face color', 0, 1));
            }
            const radius = e.radius, iris = e.irisRadius, travel = e.travel;
            for (let axis = 0; axis < 2; axis++) {
                if (iris[axis] >= radius[axis] || travel[axis] > (radius[axis] - iris[axis]) * .45)
                    fail('pupil travel must stay within the eye');
                const center = e.center[axis];
                if (center - radius[axis] < 0 || center + radius[axis] > 1)
                    fail('eye must stay inside the source image');
                if (Math.abs(e.iris[axis] - center) + iris[axis] + travel[axis] > radius[axis])
                    fail('iris and travel exceed reviewed eye bounds');
            }
        }
    }
}
//# sourceMappingURL=validation.js.map