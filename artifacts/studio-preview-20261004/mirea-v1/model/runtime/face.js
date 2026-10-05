/** Eye state is independent of mesh motion. Neutral and reduced motion preserve source pixels. */
export function createFaceState(features) {
    let targetStrength = 1, strength = 1;
    let target, gaze = [0, 0];
    return {
        setStrength(value) {
            if (!features)
                throw new Error('This model has no reviewed face features');
            if (!Number.isFinite(value) || value < 0 || value > 1)
                throw new Error('Gaze strength must be finite and within 0…1');
            targetStrength = value;
        },
        setGaze(x, y) {
            if (!Number.isFinite(x) || !Number.isFinite(y))
                throw new Error('Gaze must be finite');
            if (features)
                target = [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
        },
        followHead() { target = undefined; },
        update(dt) {
            const gain = 1 - Math.exp(-Math.max(0, dt) / 55);
            strength += (targetStrength - strength) * gain;
            if (target)
                for (const axis of [0, 1])
                    gaze[axis] += (target[axis] - gaze[axis]) * gain;
        },
        settle() { strength = targetStrength; if (target)
            gaze = [...target]; },
        reset() { targetStrength = strength = 1; target = undefined; gaze = [0, 0]; },
        snapshot(lookX, lookY, reduced = false) {
            if (!features)
                return undefined;
            if (reduced)
                return { gaze: [0, 0], strength: 0 };
            return { gaze: [(target ? gaze[0] : Math.max(-1, Math.min(1, lookX / 30))) * strength,
                    (target ? gaze[1] : Math.max(-1, Math.min(1, lookY / 30))) * strength], strength };
        },
    };
}
//# sourceMappingURL=face.js.map