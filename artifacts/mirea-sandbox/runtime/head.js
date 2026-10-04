import { regionInfluence } from './regions.js';
/** Source ownership is precomputed. Props keep their own transform at overlaps. */
export function bindHead(model, rest) {
    const spec = model.pose.headFollow;
    if (!spec?.region)
        return undefined;
    const count = rest.length / 2, aspect = model.texture.height / model.texture.width;
    const head = new Float32Array(count), neck = new Float32Array(count), neckProgress = new Float32Array(count);
    const root = model.pins.find(p => p.name === 'head-root');
    const base = spec.neck?.base;
    const dx = base ? root.x - base[0] : 0, dy = base ? (root.y - base[1]) * aspect : 0;
    for (let v = 0; v < count; v++) {
        const x = rest[v * 2], y = rest[v * 2 + 1];
        // Fade head ownership at the prop edge, rather than switching from 0 to 1
        // across a single triangle. Keep the transition narrow to preserve the face.
        const protectedObject = Math.max(0, ...(model.surfaceRegions ?? []).filter(r => r.mode === 'rigid' && r.rotation !== 'head')
            .map(r => regionInfluence(r.polygon, Math.min(.02, r.feather), aspect, x, y)));
        head[v] = regionInfluence(spec.region, spec.feather, aspect, x, y) * (1 - protectedObject);
        if (spec.neck && base) {
            neck[v] = regionInfluence(spec.neck.polygon, spec.neck.feather, aspect, x, y) * (1 - protectedObject);
            const t = Math.max(0, Math.min(1, ((x - base[0]) * dx + (y - base[1]) * aspect * dy) / (dx * dx + dy * dy)));
            neckProgress[v] = t * t * (3 - 2 * t);
        }
    }
    return { head, neck, neckProgress };
}
//# sourceMappingURL=head.js.map