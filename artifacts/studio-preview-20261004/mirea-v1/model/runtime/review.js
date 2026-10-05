export const REVIEW_STEP = 1000 / 60;
/** Fixed steps are shared by manual playback, Studio and exported pose reviews. */
export function fixedSteps(milliseconds, step) {
    if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 60000)
        throw new Error('Advance must be finite, 0…60000 ms');
    const count = Math.floor(milliseconds / REVIEW_STEP + 1e-10);
    for (let i = 0; i < count; i++)
        step(REVIEW_STEP);
    const remainder = milliseconds - count * REVIEW_STEP;
    if (remainder > 1e-8)
        step(remainder);
}
export const reviewPoses = [
    { id: 'neutral', sequence: [] },
    ...[['up', 0, -.5], ['right', .5, 0], ['down', 0, .5], ['left', -.5, 0],
        ['top-left', -.5, -.5], ['top-right', .5, -.5], ['bottom-left', -.5, .5], ['bottom-right', .5, .5]]
        .map(([id, x, y]) => ({ id, sequence: [{ pointer: [x, y], milliseconds: 1500 }] })),
    { id: 'reversal', sequence: [{ pointer: [-.5, 0], milliseconds: 900 }, { pointer: [.5, 0], milliseconds: 180 }] },
    ...[50, 150, 350, 700].map(milliseconds => ({ id: 'hair-return-' + milliseconds, sequence: [{ pointer: [.5, 0], milliseconds: 900 }, { pointer: [0, 0], milliseconds }] })),
];
export function faceReviewPoses() {
    return [
        ...[.5, 0].map(open => ({ id: open ? 'eyes-half' : 'eyes-closed', sequence: [{ pointer: [0, 0], milliseconds: 0, face: { eyeOpenLeft: open, eyeOpenRight: open } }] })),
        ...['a', 'i', 'u', 'e', 'o'].map(mouthShape => ({ id: 'mouth-' + mouthShape, sequence: [{ pointer: [0, 0], milliseconds: 0, face: { mouthShape, mouthOpen: 1 } }] })),
    ];
}
//# sourceMappingURL=review.js.map