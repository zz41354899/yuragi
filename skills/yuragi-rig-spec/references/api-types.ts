export type Vec2 = [number, number]
export type ParameterName = 'lookX' | 'lookY' | 'bodyX' | 'wave'
export interface PinSpec {
  name: string
  type: 'fixed' | 'joint' | 'spring'
  parent?: string
  x: number
  y: number
  radius: number
  stiffness?: number
  damping?: number
  wind?: number
}
export interface RigPin extends PinSpec { px: number; py: number; vx: number; vy: number }
export interface HairChain { id: string; points: [Vec2, Vec2, Vec2]; phase: number; radius: number; gain: number }
export interface AccessoryChain {
  id: string; root: Vec2; tip: Vec2; radius: number; angle: number
  stiffness: number; damping: number; phase: number
}
export interface MotionSettings {
  sway: number
  speed: number
  hair: number
  accessories: number
  follow: number
}
export interface RigModel {
  version: 1
  id: string
  name: string
  texture: { src: string; width: number; height: number }
  mesh: { columns: number; rows: number }
  pins: PinSpec[]
  hair: HairChain[]
  accessories: AccessoryChain[]
  faceClearance: [number, number, number, number][]
  motion: MotionSettings
  pose: {
    headCenter: number
    headBounds: [number, number]
    headHorizontal: [number, number]
    /** Optional original-image Y bounds for custom head warping; absent preserves Momo. */
    headWarpBounds?: [number, number]
    bodyBounds: [number, number]
    bodyPivot: Vec2
    swayPivot: Vec2
  }
}
export interface Binding { offsets: Uint32Array; indices: Uint16Array; weights: Float32Array }
export interface MeshSpec { x: number; y: number; width: number; height: number }
export interface RigMesh extends MeshSpec {
  rest: Float32Array; positions: Float32Array; uvs: Float32Array
  indices: Uint16Array; weights: Float32Array
  hairBinding: Binding; accessoryBinding: Binding
}
export interface SwayPose { rotation: number; sin: number; cos: number; x: number; y: number; followVelocity: number }
export interface Diagnostics { motionScale: number; maxDisplacementGradient: number }
export interface RigSnapshot {
  parameters: Record<ParameterName, number>
  pins: { name: string; parent?: string; type: PinSpec['type']; x: number; y: number }[]
  diagnostics: Diagnostics
  sway: SwayPose
  playing: boolean
}
export interface PlayerOptions {
  canvas: HTMLCanvasElement
  model: RigModel
  autoplay?: boolean
  reducedMotion?: 'respect' | 'ignore'
  pixelRatio?: number
  onFrame?: (snapshot: RigSnapshot) => void
  onError?: (error: Error) => void
}
export interface RigPlayer {
  play(): void
  pause(): void
  setPointer(x: number, y: number): void
  setParameter(name: ParameterName, value: number): void
  setMotion(settings: Partial<MotionSettings>): void
  setPin(name: string, patch: Partial<Omit<PinSpec, 'name' | 'parent' | 'type'>>): void
  wave(): void
  reset(): void
  getModel(): RigModel
  getSnapshot(): RigSnapshot
  destroy(): void
}
