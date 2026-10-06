# core / createSimulation

Create a framework-independent shared-surface simulation; the caller owns time and rendering.

Import: `@z7589xxz758/yuragi`

## Signature

```ts
(input: RigModel): { model: RigModel; setMotion: (settings: Partial<MotionSettings>) => void; setTracking: (settings: Partial<TrackingSettings>) => void; setPin: (name: string, patch: Partial<Omit<PinSpec, "name" | "parent" | "type">>) => void; setPart: (id: string, patch: Partial<Omit<DeformationPart, "id">>) => void; rebindPin: (mesh: RigMesh, name: string, patch: Partial<PinSpec>) => void; pins: RigPin[]; hair: { pins: { name: string; parent: string; x: number; y: number; depth: number; dx: number; dy: number; vx: number; vy: number; phase: number; gain: number; maximum: number; front: boolean; stiffness: number; damping: number; }[]; chains: HairChain[]; update: (time: number, deltaTime: number, lookX: number, lookVelocity: number) => void; bind: (rest: Float32Array, columns?: number) => Binding; displacement: (binding: Binding, vertex: number) => { x: number; y: number; }; }; accessories: { pins: { rotation: number; velocity: number; id: string; root: Vec2; tip: Vec2; radius: number; angle: number; stiffness: number; damping: number; phase: number; }[]; update: (time: number, deltaTime: number, lookVelocity: number, wave: number) => void; bind: (rest: Float32Array) => Binding; displacement: (binding: Binding, vertex: number, x: number, y: number) => { x: number; y: number; }; }; parts: { states: { spec: DeformationPart; rotation: number; velocity: number; }[]; update: (time: number, delta: number, lookX: number, lookVelocity: number, lookY?: number, verticalVelocity?: number) => void; bind: (rest: Float32Array) => Binding; displacement: (binding: Binding | undefined, vertex: number, x: number, y: number) => { x: number; y: number; }; reset: () => void; }; pointerGroups: { states: { spec: PointerMotionGroup; x: number; y: number; rotation: number; dx: number; dy: number; sin: number; cos: number; }[]; update: (delta: number, lookX: number, lookY: number) => void; bind: (rest: Float32Array) => Binding; apply: (binding: Binding | undefined, vertex: number, x: number, y: number) => { x: number; y: number; }; reset: () => void; }; parameters: { lookX: number; lookY: number; bodyX: number; wave: number; }; velocity: { lookX: number; lookY: number; }; textureSize: { src: string; width: number; height: number; }; readonly sway: SwayPose; setPointer: (x: number, y: number) => void; setParameter: (name: ParameterName, value: number) => boolean; reset: () => void; wave: (time?: number) => boolean; updatePins: (time: number, deltaTime: number) => void; buildContinuousMesh: (spec?: MeshSpec, columns?: number, rowCount?: number) => RigMesh; updateVertices: (surface: RigMesh, time: number, neutral?: boolean) => { motionScale: number; maxDisplacementGradient: number; }; }
```

## Parameters

- `input: RigModel` — A validated model; the constructor clones it. Model v1 and layered v2 are separate formats.

## Returns

{ model: RigModel; setMotion: (settings: Partial<MotionSettings>) => void; setTracking: (settings: Partial<TrackingSettings>) => void; setPin: (name: string, patch: Partial<Omit<PinSpec, "name" | "parent" | "type">>) => void; setPart: (id: string, patch: Partial<Omit<DeformationPart, "id">>) => void; rebindPin: (mesh: RigMesh, name: string, patch: Partial<PinSpec>) => void; pins: RigPin[]; hair: { pins: { name: string; parent: string; x: number; y: number; depth: number; dx: number; dy: number; vx: number; vy: number; phase: number; gain: number; maximum: number; front: boolean; stiffness: number; damping: number; }[]; chains: HairChain[]; update: (time: number, deltaTime: number, lookX: number, lookVelocity: number) => void; bind: (rest: Float32Array, columns?: number) => Binding; displacement: (binding: Binding, vertex: number) => { x: number; y: number; }; }; accessories: { pins: { rotation: number; velocity: number; id: string; root: Vec2; tip: Vec2; radius: number; angle: number; stiffness: number; damping: number; phase: number; }[]; update: (time: number, deltaTime: number, lookVelocity: number, wave: number) => void; bind: (rest: Float32Array) => Binding; displacement: (binding: Binding, vertex: number, x: number, y: number) => { x: number; y: number; }; }; parts: { states: { spec: DeformationPart; rotation: number; velocity: number; }[]; update: (time: number, delta: number, lookX: number, lookVelocity: number, lookY?: number, verticalVelocity?: number) => void; bind: (rest: Float32Array) => Binding; displacement: (binding: Binding | undefined, vertex: number, x: number, y: number) => { x: number; y: number; }; reset: () => void; }; pointerGroups: { states: { spec: PointerMotionGroup; x: number; y: number; rotation: number; dx: number; dy: number; sin: number; cos: number; }[]; update: (delta: number, lookX: number, lookY: number) => void; bind: (rest: Float32Array) => Binding; apply: (binding: Binding | undefined, vertex: number, x: number, y: number) => { x: number; y: number; }; reset: () => void; }; parameters: { lookX: number; lookY: number; bodyX: number; wave: number; }; velocity: { lookX: number; lookY: number; }; textureSize: { src: string; width: number; height: number; }; readonly sway: SwayPose; setPointer: (x: number, y: number) => void; setParameter: (name: ParameterName, value: number) => boolean; reset: () => void; wave: (time?: number) => boolean; updatePins: (time: number, deltaTime: number) => void; buildContinuousMesh: (spec?: MeshSpec, columns?: number, rowCount?: number) => RigMesh; updateVertices: (surface: RigMesh, time: number, neutral?: boolean) => { motionScale: number; maxDisplacementGradient: number; }; }

## Behavior, defaults and limits

Validates and clones the model; invalid models throw. Does not load artwork or allocate a GPU. The caller owns millisecond timing and mesh rendering. Source-normalized coordinates include image margins.

## Example

```ts
const simulation = createSimulation(model);
const mesh = simulation.buildContinuousMesh();
simulation.updatePins(16.67, 16.67);
simulation.updateVertices(mesh, 16.67);
```

## Related

- [core/create-player](core-create-player.md)
- [core/to-canvas](core-to-canvas.md)
- [core/constrain-shared-surface](core-constrain-shared-surface.md)
- [core/validate-model](core-validate-model.md)
- [core/fixed-steps](core-fixed-steps.md)
- [core/face-review-poses](core-face-review-poses.md)

- [Types and constants](types.md)
- [API index](index.md)
