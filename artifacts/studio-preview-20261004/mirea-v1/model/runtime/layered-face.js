export function createLayeredFace(model) {
    let pose = { eyeOpenLeft: 1, eyeOpenRight: 1, mouthOpen: 0, mouthShape: 'closed' };
    let gaze = [0, 0];
    function setFace(next) {
        if (!model.face)
            throw new Error('This model has no authored face attachments');
        for (const key of ['eyeOpenLeft', 'eyeOpenRight', 'mouthOpen'])
            if (next[key] !== undefined && (!Number.isFinite(next[key]) || next[key] < 0 || next[key] > 1))
                throw new Error('Face openness must be 0…1');
        if (next.mouthShape !== undefined && !['closed', 'a', 'i', 'u', 'e', 'o'].includes(next.mouthShape))
            throw new Error('Unknown mouth shape');
        if (next.mouthShape && !model.face.mouth?.shapes[next.mouthShape])
            throw new Error('Missing mouth artwork: ' + next.mouthShape);
        if ((next.eyeOpenLeft !== undefined && !model.face.eyes?.some(e => e.side === 'left')) || (next.eyeOpenRight !== undefined && !model.face.eyes?.some(e => e.side === 'right')))
            throw new Error('Missing authored eye');
        if (next.mouthOpen !== undefined && !model.face.mouth)
            throw new Error('Missing authored mouth');
        pose = { ...pose, ...next };
    }
    function eyeFor(id) { return model.face?.eyes?.find(e => [e.ball, e.iris, e.half, e.closed, ...e.lines].includes(id)); }
    function layer(id, reduced = false) {
        const eye = eyeFor(id), open = reduced ? 1 : eye?.side === 'left' ? pose.eyeOpenLeft : pose.eyeOpenRight;
        let opacity = 1;
        if (eye) {
            const variant = open < .3 ? eye.closed : open < .75 ? eye.half : undefined;
            opacity = variant ? +(id === variant) : +(![eye.half, eye.closed].includes(id));
        }
        const mouth = model.face?.mouth;
        if (mouth && Object.values(mouth.shapes).includes(id)) {
            const shape = reduced || pose.mouthOpen < .16 ? 'closed' : pose.mouthShape;
            opacity = +(mouth.shapes[shape] === id);
        }
        return { opacity, eye, open, clip: eye && (id === eye.ball || id === eye.iris), shift: !reduced && eye?.iris === id ? [gaze[0] * eye.travel[0], gaze[1] * eye.travel[1]] : [0, 0] };
    }
    return { setFace, layer, eyeFor, setGaze(x, y) {
            if (!model.face?.eyes?.some(e => e.iris))
                throw new Error('This model has no authored iris');
            if (![x, y].every(Number.isFinite))
                throw new Error('Gaze must be finite');
            gaze = [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
        }, reset() { pose = { eyeOpenLeft: 1, eyeOpenRight: 1, mouthOpen: 0, mouthShape: 'closed' }; gaze = [0, 0]; },
        snapshot(reduced = false) { return reduced ? { eyeOpenLeft: 1, eyeOpenRight: 1, mouthOpen: 0, mouthShape: 'closed', gaze: [0, 0] } : { ...pose, gaze: [...gaze] }; } };
}
//# sourceMappingURL=layered-face.js.map