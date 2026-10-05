import type { Vec2 } from './types.js'
import type { LayeredFacePose } from './layered-types.js'

export const REVIEW_STEP = 1000 / 60
/** Fixed steps are shared by manual playback, Studio and exported pose reviews. */
export function fixedSteps(milliseconds: number, step: (delta: number) => void) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 60000) throw new Error('Advance must be finite, 0…60000 ms')
  const count = Math.floor(milliseconds / REVIEW_STEP + 1e-10)
  for (let i = 0; i < count; i++) step(REVIEW_STEP)
  const remainder = milliseconds - count * REVIEW_STEP
  if (remainder > 1e-8) step(remainder)
}
export interface ReviewPose { id: string; sequence: { pointer: Vec2; milliseconds: number; face?: LayeredFacePose; gaze?: Vec2 }[] }
export const reviewPoses: ReviewPose[] = [
  { id: 'neutral', sequence: [] },
  ...([['up', 0, -.5], ['right', .5, 0], ['down', 0, .5], ['left', -.5, 0],
    ['top-left', -.5, -.5], ['top-right', .5, -.5], ['bottom-left', -.5, .5], ['bottom-right', .5, .5]] as const)
    .map(([id, x, y]) => ({ id, sequence: [{ pointer: [x, y] as Vec2, milliseconds: 1500 }] })),
  { id: 'reversal', sequence: [{ pointer: [-.5, 0], milliseconds: 900 }, { pointer: [.5, 0], milliseconds: 180 }] },
  ...[50, 150, 350, 700].map(milliseconds => ({ id: 'hair-return-' + milliseconds, sequence: [{ pointer: [.5, 0] as Vec2, milliseconds: 900 }, { pointer: [0, 0] as Vec2, milliseconds }] })),
]
export function faceReviewPoses(): ReviewPose[] {
  return [
    ...[.5, 0].map(open => ({ id: open ? 'eyes-half' : 'eyes-closed', sequence: [{ pointer: [0, 0] as Vec2, milliseconds: 0, face: { eyeOpenLeft: open, eyeOpenRight: open } }] })),
    ...(['a', 'i', 'u', 'e', 'o'] as const).map(mouthShape => ({ id: 'mouth-' + mouthShape, sequence: [{ pointer: [0, 0] as Vec2, milliseconds: 0, face: { mouthShape, mouthOpen: 1 } }] })),
  ]
}
