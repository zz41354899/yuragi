import type { RigModel, SwayPose } from './types.js'
// A slow whole-character sway, shared by every vertex. Local hair/accessory
// springs receive its velocity so they trail the body instead of moving rigidly.
export function sampleSway(elapsed: number, model: RigModel): SwayPose {
  const phase = elapsed * (Math.PI * 2 / (7200 / model.motion.speed))
  const ramp = Math.min(1, Math.max(0, elapsed / 1200))
  const envelope = ramp * ramp * (3 - 2 * ramp)
  const rotation = model.motion.sway * (Math.sin(phase) * .038 + Math.sin(phase * .47) * .006) * envelope
  return {
    rotation,
    sin: Math.sin(rotation), cos: Math.cos(rotation),
    x: model.motion.sway * Math.sin(phase * .83) * .010 * envelope,
    y: model.motion.sway * Math.sin(phase * .71) * .009 * envelope,
    // Feed the changing body direction into the existing secondary springs.
    followVelocity: model.motion.sway * (Math.cos(phase) * .82 + Math.cos(phase * .47) * .07) * envelope,
  }
}

export function applySway(x: number, y: number, sway: SwayPose, model: RigModel) {
  const [cx, cy] = model.pose.swayPivot
  const aspect = model.texture.height / model.texture.width
  const px = x - cx, py = (y - cy) * aspect
  return {
    x: cx + px * sway.cos - py * sway.sin + sway.x,
    y: cy + (px * sway.sin + py * sway.cos) / aspect + sway.y,
  }
}
