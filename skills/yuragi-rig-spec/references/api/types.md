# Public types and constants

## CANVAS_PADDING

Import: `@yuragi/rig`

Canvas overscan on each edge: 0.12 (12%).

```ts
export const CANVAS_PADDING: 0.12
```

## Vec2

Import: `@yuragi/rig`



```ts
export type Vec2 = [number, number]
```

## ParameterName

Import: `@yuragi/rig`



```ts
export type ParameterName = 'lookX' | 'lookY' | 'bodyX' | 'wave'
```

## EyeFeature

Import: `@yuragi/rig`

Reviewed source-image geometry for bounded pupil translation.

```ts
export interface EyeFeature {
  id: 'left' | 'right'
  center: Vec2
  radius: Vec2
  iris: Vec2
  irisRadius: Vec2
  travel: Vec2
  angle: number
  sclera: [number, number, number]
}
```

## FaceFeatures

Import: `@yuragi/rig`



```ts
export interface FaceFeatures { eyes: [EyeFeature, EyeFeature] }
```

## AnimationCurve

Import: `@yuragi/rig`



```ts
export type AnimationCurve = 'linear' | 'step' | [number, number, number, number]
```

## Keyframe

Import: `@yuragi/rig`



```ts
export interface Keyframe { time: number; value: number; curve?: AnimationCurve }
```

## AnimationTrack

Import: `@yuragi/rig`



```ts
export type AnimationTrack = { target: 'parameter'; name: ParameterName; keys: Keyframe[] }
  | { target: 'gaze'; name: 'strength'; keys: Keyframe[] }
  | { target: 'motion'; name: 'weight'; keys: Keyframe[] }
```

## AnimationClip

Import: `@yuragi/rig`



```ts
export interface AnimationClip { id: string; duration: number; loop?: boolean; tracks: AnimationTrack[] }
```

## AnimationSnapshot

Import: `@yuragi/rig`



```ts
export interface AnimationSnapshot { id: string; time: number; duration: number; playing: boolean }
```

## PinSpec

Import: `@yuragi/rig`



```ts
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
```

## RigPin

Import: `@yuragi/rig`



```ts
export interface RigPin extends PinSpec { px: number; py: number; vx: number; vy: number }
```

## HairChain

Import: `@yuragi/rig`



```ts
export interface HairChain { id: string; points: [Vec2, Vec2, Vec2]; phase: number; radius: number; gain: number }
```

## AccessoryChain

Import: `@yuragi/rig`



```ts
export interface AccessoryChain {
  id: string; root: Vec2; tip: Vec2; radius: number; angle: number
  stiffness: number; damping: number; phase: number
}
```

## MotionSettings

Import: `@yuragi/rig`



```ts
export interface MotionSettings {
  /** Blend the complete geometry from the original artwork (0) to full motion (1). Defaults to 1. */
  weight?: number
  sway: number
  speed: number
  hair: number
  accessories: number
  follow: number
  /** Optional strength for polygon-bound parts; defaults to 1. */
  parts?: number
  /** Gain for authored pointer motion groups; defaults to 1. Applied before rotation. */
  layers?: number
}
```

## DeformationPart

Import: `@yuragi/rig`

A local deformation region on the shared artwork, not an independent image layer.

```ts
export interface DeformationPart {
  id: string
  name?: string
  kind: 'hair' | 'cloth' | 'ribbon' | 'accessory'
  /** Optional additional motion gain, for migrating legacy hair/accessory controls. */
  channel?: 'hair' | 'accessories'
  polygon: Vec2[]
  /** Protected source areas such as visible skin or a held prop. */
  exclusions?: Vec2[][]
  root: Vec2
  tip: Vec2
  /** Feather distance in units of source image width, aspect corrected. */
  feather: number
  /** Maximum spring rotation, in radians. */
  rotation: number
  stiffness: number
  damping: number
  phase: number
  wind: number
  follow: number
  /** Signed response to vertical gaze/inertia; omitted keeps the original X-only flow. */
  followY?: number
}
```

## SurfaceRegion

Import: `@yuragi/rig`

Ownership on the shared source texture. Later regions take precedence at overlaps.

```ts
export interface SurfaceRegion {
  id: string
  polygon: Vec2[]
  /** Blend OUTSIDE the polygon; its interior is fully protected. */
  feather: number
  mode: 'weighted' | 'rigid'
  /** Weighted regions receive displacement only from these pins. */
  pins?: string[]
  /** Rigid regions translate with this pin; omit for a stationary local object. */
  anchor?: string
  /** Rigid rotation about the anchor, before whole-character sway. */
  rotation?: 'none' | 'head' | 'body'
  /** Weighted regions can opt out of hair, accessory and part flow. */
  secondary?: boolean
}
```

## TrackingSettings

Import: `@yuragi/rig`



```ts
export interface TrackingSettings {
  response: number
  damping: number
  maxVelocity: number
  bodyFollow?: number
  /** Equal X/Y travel for the complete artwork at look ±30; never local stretching. */
  translation?: Vec2
}
```

## PointerMotionGroup

Import: `@yuragi/rig`

Several visible source regions share one rigid pointer-driven transform.

```ts
export interface PointerMotionGroup {
  id: string
  name?: string
  pivot: Vec2
  regions: { polygon: Vec2[]; feather: number }[]
  /** Source-normalized travel at look ±30, before whole-character translation. */
  translation: Vec2
  /** Signed horizontal follow rotation, in radians. */
  rotation: number
  /** Exponential settling time in milliseconds; independent of frame rate. */
  response: number
}
```

## RigModel

Import: `@yuragi/rig`



```ts
export interface RigModel {
  version: 1
  id: string
  name: string
  texture: { src: string; width: number; height: number }
  mesh: { columns: number; rows: number }
  pins: PinSpec[]
  hair: HairChain[]
  accessories: AccessoryChain[]
  parts?: DeformationPart[]
  surfaceRegions?: SurfaceRegion[]
  /** Shared transforms applied after local detail. Later interiors own overlaps. */
  pointerGroups?: PointerMotionGroup[]
  /** Opt-in bounded pointer spring. Omit to preserve the original legacy response. */
  tracking?: TrackingSettings
  /** Opt-in face compositing; neutral and reduced motion preserve original pixels. */
  face?: FaceFeatures
  faceClearance: [number, number, number, number][]
  motion: MotionSettings
  pose: {
    headCenter: number
    headBounds: [number, number]
    headHorizontal: [number, number]
    /** Optional original-image Y bounds for custom head warping; absent preserves legacy. */
    headWarpBounds?: [number, number]
    /** Optional aspect-correct head pose; absence preserves the legacy original warp. */
    headFollow?: {
      rotation: number; translation: Vec2
      /** Reviewed skull/bangs ownership; replaces Gaussian head-pin warping. */
      region?: Vec2[]
      feather?: number
      /** Body-attached base blending to head-root; no separate neck spring. */
      neck?: { polygon: Vec2[]; base: Vec2; feather: number }
    }
    bodyBounds: [number, number]
    bodyPivot: Vec2
    swayPivot: Vec2
  }
}
```

## Binding

Import: `@yuragi/rig`



```ts
export interface Binding { offsets: Uint32Array; indices: Uint16Array; weights: Float32Array }
```

## MeshSpec

Import: `@yuragi/rig`



```ts
export interface MeshSpec { x: number; y: number; width: number; height: number }
```

## RigMesh

Import: `@yuragi/rig`



```ts
export interface RigMesh extends MeshSpec {
  rest: Float32Array; positions: Float32Array; uvs: Float32Array
  indices: Uint16Array; weights: Float32Array
  hairBinding: Binding; accessoryBinding: Binding
  partBinding?: Binding
  regionBinding?: Binding
  pointerBinding?: Binding
  headBinding?: { head: Float32Array; neck: Float32Array; neckProgress: Float32Array }
}
```

## SwayPose

Import: `@yuragi/rig`



```ts
export interface SwayPose { rotation: number; sin: number; cos: number; x: number; y: number; followVelocity: number }
```

## RigMeshSnapshot

Import: `@yuragi/rig`

On-demand copy of the mesh last submitted to the renderer; full-source 0–1 coordinates.

```ts
export interface RigMeshSnapshot {
  rest: Float32Array
  positions: Float32Array
  indices: Uint16Array
  /** Base pin weights, vertex-major. Region/head/part ownership can override their effect. */
  weights: Float32Array
  pinNames: string[]
}
```

## Diagnostics

Import: `@yuragi/rig`



```ts
export interface Diagnostics { motionScale: number; maxDisplacementGradient: number }
```

## RigSnapshot

Import: `@yuragi/rig`



```ts
export interface RigSnapshot {
  /** Effective overall geometry weight; independent from gaze strength. */
  motionWeight?: number
  parameters: Record<ParameterName, number>
  pins: { name: string; parent?: string; type: PinSpec['type']; x: number; y: number }[]
  diagnostics: Diagnostics
  sway: SwayPose
  playing: boolean
  /** Full-source normalized travel; zero in reduced motion. */
  trackingOffset?: Vec2
  parts?: { id: string; rotation: number }[]
  pointerGroups?: { id: string; offset: Vec2; rotation: number }[]
  face?: { gaze: Vec2; strength: number }
  animation?: AnimationSnapshot
}
```

## PlayerOptions

Import: `@yuragi/rig`



```ts
export interface PlayerOptions {
  canvas: HTMLCanvasElement
  model: RigModel
  autoplay?: boolean
  reducedMotion?: 'respect' | 'ignore'
  pixelRatio?: number
  onFrame?: (snapshot: RigSnapshot) => void
  onError?: (error: Error) => void
}
```

## RigPlayer

Import: `@yuragi/rig`



```ts
export interface RigPlayer {
  play(): void
  pause(): void
  setPointer(x: number, y: number): void
  /** Eye-only direction in -1…1; does not deform the head or body. */
  setGaze(x: number, y: number): void
  setParameter(name: ParameterName, value: number): void
  setMotion(settings: Partial<MotionSettings>): void
  setTracking(settings: Partial<TrackingSettings>): void
  /** Reviewed eyes required; finite 0…1, defaults to 1. */
  setGazeStrength(value: number): void
  playAnimation(clip: AnimationClip): void
  pauseAnimation(): void
  seekAnimation(time: number): void
  stopAnimation(): void
  setPin(name: string, patch: Partial<Omit<PinSpec, 'name' | 'parent' | 'type'>>): void
  setPart(id: string, patch: Partial<Omit<DeformationPart, 'id'>>): void
  wave(): void
  reset(): void
  getModel(): RigModel
  getSnapshot(): RigSnapshot
  /** Copies only when requested; inspect at UI frequency, never as an animation clock. */
  getMeshSnapshot(): RigMeshSnapshot
  destroy(): void
}
```

## LayeredModel

Import: `@yuragi/rig`

Separate from RigModel v1; extracted PNGs are never implicitly playable.

```ts
export interface LayeredModel {
    version: 2;
    renderer: 'layered';
    id: string;
    name: string;
    source: {
        width: number;
        height: number;
        fallback: string;
        sha256: string;
    };
    atlases: {
        id: string;
        src: string;
        width: number;
        height: number;
    }[];
    /** Parent precedes child. Pivots and translations use full-source coordinates. */
    nodes: LayerNode[];
    /** Authoritative seam vertices, reused by any number of attachments. */
    joints: {
        id: string;
        position: Vec2;
        weights: LayerWeight[];
    }[];
    /** Array order IS draw order. Only consecutive compatible attachments batch. */
    attachments: LayerAttachment[];
}
```

## LayerWeight

Import: `@yuragi/rig`



```ts
export interface LayerWeight {
    node: string;
    weight: number;
}
```

## LayerNode

Import: `@yuragi/rig`



```ts
export interface LayerNode {
    id: string;
    parent?: string;
    pivot: Vec2;
    rotation: number;
    translation: Vec2;
    response: number;
    /** Bounded local secondary rotation; root vertices bind to the parent. */
    spring?: {
        rotation: number;
        stiffness: number;
        damping: number;
        wind: number;
        phase: number;
    };
}
```

## LayerVertex

Import: `@yuragi/rig`



```ts
export interface LayerVertex {
    position: Vec2;
    weights: LayerWeight[];
    joint?: string;
}
```

## LayerAttachment

Import: `@yuragi/rig`



```ts
export interface LayerAttachment {
    id: string;
    atlas: string;
    /** Atlas pixel rectangle, excluding extruded gutters. */
    rect: [
        number,
        number,
        number,
        number
    ];
    /** Source-normalized rectangle corresponding to the cropped image. */
    bounds: [
        number,
        number,
        number,
        number
    ];
    vertices: LayerVertex[];
    triangles: number[];
    opacity?: number;
    /** Optional static alpha mask in the SAME atlas, aligned to attachment bounds. */
    mask?: [
        number,
        number,
        number,
        number
    ];
    coverage: 'complete' | 'visible-only';
    provenance: string;
}
```

## LayeredSnapshot

Import: `@yuragi/rig`



```ts
export interface LayeredSnapshot {
    playing: boolean;
    reducedMotion: boolean;
    pointer: Vec2;
    nodes: {
        id: string;
        rotation: number;
    }[];
    diagnostics: {
        drawCalls: number;
        vertices: number;
        triangles: number;
        atlasBytes: number;
        cpuMilliseconds: number;
    };
}
```

## LayeredPlayerOptions

Import: `@yuragi/rig`



```ts
export interface LayeredPlayerOptions {
    canvas: HTMLCanvasElement;
    model: LayeredModel;
    autoplay?: boolean;
    reducedMotion?: 'respect' | 'ignore';
    pixelRatio?: number;
    signal?: AbortSignal;
    onFrame?: (snapshot: LayeredSnapshot) => void;
    onError?: (error: Error) => void;
}
```

## LayeredPlayer

Import: `@yuragi/rig`



```ts
export interface LayeredPlayer {
    play(): void;
    pause(): void;
    setPointer(x: number, y: number): void;
    reset(): void;
    getModel(): LayeredModel;
    getSnapshot(): LayeredSnapshot;
    getMeshSnapshot(): {
        rest: Float32Array;
        positions: Float32Array;
        indices: Uint16Array;
    };
    destroy(): void;
}
```

## YuragiCharacterProps

Import: `@yuragi/rig/react`



```ts
export interface YuragiCharacterProps {
  model: RigModel
  autoplay?: boolean
  reducedMotion?: 'respect' | 'ignore'
  alt?: string
  className?: string
  style?: CSSProperties
  onReady?: (player: RigPlayer) => void
  onError?: (error: Error) => void
  onFrame?: (snapshot: RigSnapshot) => void
}
```

## YuragiCharacterHandle

Import: `@yuragi/rig/react`



```ts
export interface YuragiCharacterHandle { getPlayer(): RigPlayer | undefined }
```

## YuragiLayeredCharacterProps

Import: `@yuragi/rig/react`



```ts
export interface YuragiLayeredCharacterProps {
    model: LayeredModel;
    autoplay?: boolean;
    reducedMotion?: 'respect' | 'ignore';
    alt?: string;
    className?: string;
    style?: CSSProperties;
    onReady?: (player: LayeredPlayer) => void;
    onError?: (error: Error) => void;
    onFrame?: (snapshot: LayeredSnapshot) => void;
}
```

## YuragiLayeredCharacterHandle

Import: `@yuragi/rig/react`



```ts
export interface YuragiLayeredCharacterHandle {
    getPlayer(): LayeredPlayer | undefined;
}
```

[API index](index.md)
