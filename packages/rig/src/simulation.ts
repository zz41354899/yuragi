import type { RigModel, RigPin, ParameterName, PinSpec, MeshSpec, RigMesh, MotionSettings, DeformationPart, TrackingSettings, Vec2 } from './types.js'
import { validateModel } from './validation.js'
import { createHairDynamics } from './hair.js'
import { createAccessoryDynamics } from './accessories.js'
import { createPartDynamics } from './parts.js'
import { bindSurfaceRegions } from './regions.js'
import { bindHead } from './head.js'
import { createPointerGroups } from './pointer-groups.js'
import { sampleSway, applySway } from './sway.js'

export function createSimulation(input: RigModel) {
  validateModel(input)
  const model: RigModel = structuredClone(input)
  const parameters = { lookX: 0, lookY: 0, bodyX: 0, wave: 0 }
  const targets = { lookX: 0, lookY: 0, bodyX: 0 }
  const velocity = { lookX: 0, lookY: 0 }
  let pointer: Vec2 | undefined
  let trackingRemainder = 0
  const textureSize = model.texture
  const hair = createHairDynamics(model)
  const accessories = createAccessoryDynamics(model)
  const parts = createPartDynamics(model)
  const pointerGroups = createPointerGroups(model)
  let swayTime = 0
  let sway = sampleSway(0, model)

  const pinSpecs = model.pins

  const pins: RigPin[] = pinSpecs.map((pin) => ({ ...pin, px: pin.x, py: pin.y, vx: 0, vy: 0 }))
  const pinsByName = new Map(pins.map((pin) => [pin.name, pin]))


  let waveStartedAt = -1
  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
  }

  function setPointer(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Pointer coordinates must be finite')
    pointer = [x, y]
    targets.lookX = clamp(x * 60 * model.motion.follow, -30, 30)
    targets.lookY = clamp(y * 60 * model.motion.follow, -30, 30)
    targets.bodyX = clamp(x * 20 * model.motion.follow * (model.tracking?.bodyFollow ?? 1), -10, 10)
  }

  function setParameter(name: ParameterName, value: number) {
    const next = Number(value) || 0
    if (name === 'wave') {
      waveStartedAt = -1
      parameters.wave = clamp(next, 0, 1)
      return true
    }
    if (name !== 'lookX' && name !== 'lookY' && name !== 'bodyX') return false
    pointer = undefined
    const limits = { lookX: 30, lookY: 30, bodyX: 10 }
    targets[name] = clamp(next, -limits[name], limits[name])
    return true
  }

  function reset() {
    pointer = undefined
    trackingRemainder = 0
    targets.lookX = 0
    targets.lookY = 0
    targets.bodyX = 0
    parameters.wave = 0
    waveStartedAt = -1
    parts.reset()
    pointerGroups.reset()
  }

  function wave(time = performance.now()) {
    waveStartedAt = time
    return true
  }



  function rotateAround(point: { x: number; y: number }, pivot: { px: number; py: number } | undefined, angle: number) {
    if (!pivot) return point
    const x = point.x - pivot.px
    const y = point.y - pivot.py
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return { x: pivot.px + x * cos - y * sin, y: pivot.py + x * sin + y * cos }
  }

  function updateParameters(delta: number) {
    const { response = .018, damping = .75, maxVelocity = 2.4 } = model.tracking ?? {}
    // Preserve the original legacy tick. Opt-in tracking integrates fixed half ticks
    // so 30/60/120 Hz produce the same follow timing, with bounded stall catch-up.
    const duration = model.tracking ? (delta === 0 ? 1 : clamp(Number.isFinite(delta) ? delta / 16.67 : 0, 0, 3)) : 1
    const dt = model.tracking ? .5 : 1
    trackingRemainder += duration
    const steps = Math.floor((trackingRemainder + 1e-9) / dt)
    trackingRemainder -= steps * dt
    for (let i = 0; i < steps; i++) {
      for (const key of ['lookX', 'lookY'] as const) {
        velocity[key] = clamp((velocity[key] + (targets[key] - parameters[key]) * response * dt) * Math.pow(damping, dt), -maxVelocity, maxVelocity)
        parameters[key] += velocity[key] * dt
        if (!model.tracking) continue
        const bounded = clamp(parameters[key], -30, 30)
        if (parameters[key] !== bounded) velocity[key] = 0
        parameters[key] = bounded
      }
      parameters.bodyX += (targets.bodyX - parameters.bodyX) * (model.tracking ? 1 - Math.pow(.925, dt) : .075)
    }
  }

  function pinTarget(pin: RigPin, time: number) {
    const wind = Math.sin(time * .00055 + pin.x * 8) + Math.sin(time * .00091 + pin.y * 7) * .45
    const breath = Math.sin(time * .00115) * .0015
    let x = pin.x
    let y = pin.y

    if (pin.name === 'waist') {
      x += parameters.bodyX / 10 * .008
      y += breath
    }
    if (pin.name === 'head-root') {
      x += parameters.lookX / 30 * (model.pose.headFollow?.region ? model.pose.headFollow.translation[0] : .012) + parameters.bodyX / 10 * .004
      y += parameters.lookY / 30 * (model.pose.headFollow?.region ? model.pose.headFollow.translation[1] : .007) + breath
    }
    if (pin.name === 'head-top') {
      const root = pinsByName.get('head-root')
      if (model.pose.headFollow?.region && root) {
        // The custom profile replaces the legacy skull pose; do not stack both.
        const aspect = model.texture.height / model.texture.width
        const dx = x - root.x, dy = (y - root.y) * aspect
        const angle = parameters.lookX / 30 * model.pose.headFollow.rotation
        x = root.px + dx * Math.cos(angle) - dy * Math.sin(angle)
        y = root.py + (dx * Math.sin(angle) + dy * Math.cos(angle)) / aspect
      } else {
        const turned = rotateAround({ x, y }, root, parameters.lookX / 30 * .105 - parameters.lookY / 30 * .025)
        x = turned.x + parameters.lookX / 30 * .008
        y = turned.y + parameters.lookY / 30 * .005
      }
    }
    if (['shoulder-left', 'shoulder-right', 'hip-raised', 'hip-standing'].includes(pin.name)) {
      x += parameters.bodyX / 10 * .003
      y += breath
    }
    if (pin.name === 'shoulder-right') {
      const envelope = Math.sin(parameters.wave * Math.PI)
      x -= envelope * .006
      y -= envelope * .007
    }
    if (pin.name === 'elbow-right') {
      const shoulder = pinsByName.get('shoulder-right')
      const envelope = Math.sin(parameters.wave * Math.PI)
      const oscillation = Math.sin(parameters.wave * Math.PI * 6)
      const turned = rotateAround({ x, y }, shoulder, envelope * (-.23 + oscillation * .04))
      x = turned.x
      y = turned.y
    }
    if (pin.name === 'wrist-right') {
      const shoulder = pinsByName.get('shoulder-right')
      const envelope = Math.sin(parameters.wave * Math.PI)
      const oscillation = Math.sin(parameters.wave * Math.PI * 6)
      const turned = rotateAround({ x, y }, shoulder, envelope * (-.33 + oscillation * .10))
      x = turned.x
      y = turned.y
    }
    if (pin.name === 'wrist-left') {
      const shoulder = pinsByName.get('shoulder-left')
      const turned = rotateAround({ x, y }, shoulder, Math.sin(parameters.wave * Math.PI) * .035)
      x = turned.x
      y = turned.y
    }
    if (pin.type === 'spring') {
      const parent = pinsByName.get(pin.parent ?? '')
      if (parent) {
        x += parent.px - parent.x
        y += parent.py - parent.y
      }
      x += wind * (pin.wind ?? 0) - velocity.lookX * (pin.wind ?? 0) * .1
      y += Math.cos(time * .00072 + pin.x * 5) * (pin.wind ?? 0) * .55
      const hairChain = pin.name.includes('hair-')
        ? pin.name.includes('-tip') ? 1 : pin.name.includes('-mid') || pin.name.includes('-inner') ? .62 : .28
        : 0
      if (hairChain) {
        x -= clamp(velocity.lookX * .008 * hairChain, -.025, .025)
        y += clamp(Math.abs(velocity.lookX) * .0018 * hairChain, 0, .006)
      }
    }
    return { x, y }
  }

  function updatePins(time: number, deltaTime: number) {
    updateParameters(deltaTime)
    pointerGroups.update(deltaTime, parameters.lookX, parameters.lookY)
    // Advance only while rendered; tab suspension must not jump to a new pose.
    swayTime += clamp(Number.isFinite(deltaTime) ? deltaTime : 0, 0, 50)
    sway = sampleSway(swayTime, model)
    const followVelocity = clamp(velocity.lookX + sway.followVelocity, -2.4, 2.4)
    hair.update(time, deltaTime, parameters.lookX, followVelocity)
    if (waveStartedAt >= 0) {
      parameters.wave = Math.min(1, (time - waveStartedAt) / 1150)
      if (parameters.wave >= 1) {
        waveStartedAt = -1
        parameters.wave = 0
      }
    }
    accessories.update(time, deltaTime, followVelocity, parameters.wave)
    parts.update(time, deltaTime, parameters.lookX, followVelocity, parameters.lookY, clamp(velocity.lookY, -2.4, 2.4))
    const frameScale = clamp(deltaTime / 16.67, .5, 2)
    for (const pin of pins) {
      const target = pinTarget(pin, time)
      const stiffness = (pin.stiffness ?? (pin.type === 'fixed' ? .18 : .11)) * frameScale
      const damping = pin.damping ?? (pin.type === 'fixed' ? .66 : .78)
      pin.vx = clamp((pin.vx + (target.x - pin.px) * stiffness) * damping, -.016, .016)
      pin.vy = clamp((pin.vy + (target.y - pin.py) * stiffness) * damping, -.016, .016)
      let nextX = pin.px + pin.vx
      let nextY = pin.py + pin.vy
      const maxOffset = /(?:elbow|wrist)/.test(pin.name)
        ? .11
        : pin.name.startsWith('ribbon-')
          ? .045
          : pin.name.includes('hair-') || pin.name.startsWith('pom-')
          ? .085
          : pin.type === 'spring' ? .065 : .05
      const offsetX = nextX - pin.x
      const offsetY = nextY - pin.y
      const offsetLength = Math.hypot(offsetX, offsetY)
      if (offsetLength > maxOffset) {
        const scale = maxOffset / offsetLength
        nextX = pin.x + offsetX * scale
        nextY = pin.y + offsetY * scale
        pin.vx *= .35
        pin.vy *= .35
      }
      pin.px = nextX
      pin.py = nextY
    }
  }

  function bindPinWeights(x: number, y: number, weights: Float32Array, vertex: number) {
    const start = vertex * pins.length
    let sum = 0, maxLog = -Infinity
    for (let index = 0; index < pins.length; index++) {
      const pin = pins[index]
      const distance = (x - pin.x) ** 2 + ((y - pin.y) * .72) ** 2
      const logWeight = -distance / (2 * pin.radius ** 2)
      const weight = Math.exp(logWeight)
      weights[start + index] = weight; sum += weight
      maxLog = Math.max(maxLog, logWeight)
    }
    // Very small radii can underflow every Gaussian. Rescale only in that case
    // so ordinary/default bindings retain their original arithmetic.
    if (sum < 1e-30) {
      sum = 0
      for (let index = 0; index < pins.length; index++) {
        const pin = pins[index]
        const distance = (x - pin.x) ** 2 + ((y - pin.y) * .72) ** 2
        const weight = Math.exp(-distance / (2 * pin.radius ** 2) - maxLog)
        weights[start + index] = weight; sum += weight
      }
    }
    for (let index = 0; index < pins.length; index++) weights[start + index] /= sum
  }

  function buildContinuousMesh(spec: MeshSpec = { x: 0, y: 0, width: textureSize.width, height: textureSize.height }, columns = model.mesh.columns, rowCount = model.mesh.rows): RigMesh {
    const cols = columns
    const rows = rowCount
    const vertexCount = (cols + 1) * (rows + 1)
    const rest = new Float32Array(vertexCount * 2)
    const positions = new Float32Array(vertexCount * 2)
    const uvs = new Float32Array(vertexCount * 2)
    const indices = new Uint16Array(cols * rows * 6)
    const weights = new Float32Array(vertexCount * pins.length)
    let offset = 0

    for (let row = 0; row <= rows; row += 1) {
      for (let col = 0; col <= cols; col += 1) {
        const u = col / cols
        const v = row / rows
        const x = (spec.x + u * spec.width) / textureSize.width
        const y = (spec.y + v * spec.height) / textureSize.height
        rest[offset] = positions[offset] = x
        rest[offset + 1] = positions[offset + 1] = y
        uvs[offset] = u
        uvs[offset + 1] = v
        bindPinWeights(x, y, weights, offset / 2)
        offset += 2
      }
    }

    let indexOffset = 0
    const stride = cols + 1
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const a = row * stride + col
        const b = a + 1
        const c = a + stride
        const d = c + 1
        indices[indexOffset++] = a
        indices[indexOffset++] = b
        indices[indexOffset++] = d
        indices[indexOffset++] = a
        indices[indexOffset++] = d
        indices[indexOffset++] = c
      }
    }
    return { ...spec, rest, positions, uvs, indices, weights, hairBinding: hair.bind(rest, cols + 1), accessoryBinding: accessories.bind(rest),
      ...(parts.states.length ? { partBinding: parts.bind(rest) } : {}),
      ...(model.surfaceRegions?.length ? { regionBinding: bindSurfaceRegions(model, rest) } : {}),
      ...(model.pointerGroups?.length ? { pointerBinding: pointerGroups.bind(rest) } : {}),
      ...(model.pose.headFollow?.region ? { headBinding: bindHead(model, rest) } : {}) }
  }

  /** Pin edits do not change the source geometry or polygon ownership. */
  function rebindPin(mesh: RigMesh, name: string, patch: Partial<PinSpec>) {
    if (!['x', 'y', 'radius'].some(key => key in patch)) return
    for (let vertex = 0; vertex < mesh.rest.length / 2; vertex++) {
      bindPinWeights(mesh.rest[vertex * 2], mesh.rest[vertex * 2 + 1], mesh.weights, vertex)
    }
    if (name === 'head-root' && ('x' in patch || 'y' in patch)) mesh.headBinding = bindHead(model, mesh.rest)
  }

  function smoothstep(edge0: number, edge1: number, value: number) {
    const x = clamp((value - edge0) / (edge1 - edge0), 0, 1)
    return x * x * (3 - 2 * x)
  }

  function basePoint(restX: number, restY: number, weights?: Float32Array, allowed?: string[]) {
    const turn = parameters.lookX / 30
    const tilt = parameters.lookY / 30
    let x = restX
    let y = restY
    let sum = 0
    const ownedHead = !!model.pose.headFollow?.region
    for (let index = 0; index < pins.length; index += 1) {
      const pin = pins[index]
      if (ownedHead && (pin.name === 'head-root' || pin.name === 'head-top')) continue
      if (allowed && !allowed.includes(pin.name)) continue
      const distance = (restX - pin.x) ** 2 + ((restY - pin.y) * .72) ** 2
      const weight = weights?.[index] ?? Math.exp(-distance / (2 * pin.radius ** 2))
      x += (pin.px - pin.x) * weight
      y += (pin.py - pin.y) * weight
      sum += weights && !allowed && !ownedHead ? 0 : weight
    }
    if ((!weights || allowed || ownedHead) && sum) {
      x = restX + (x - restX) / sum
      y = restY + (y - restY) / sum
    }

    const bodyWeight = 1 - smoothstep(...model.pose.bodyBounds, restY)
    if (bodyWeight > 0) {
      const bodyAngle = parameters.bodyX / 10 * .05 * bodyWeight
      const leaned = rotateAround({ x, y }, { px: model.pose.bodyPivot[0], py: model.pose.bodyPivot[1] }, bodyAngle)
      x = leaned.x + parameters.bodyX / 10 * .006 * bodyWeight
      y = leaned.y
    }

    const verticalHead = 1 - smoothstep(...model.pose.headBounds, restY)
    const horizontalHead = 1 - smoothstep(...model.pose.headHorizontal, Math.abs(restX - model.pose.headCenter))
    const topBounds = model.pose.headWarpBounds
    const upperHead = model.pose.headFollow && topBounds ? smoothstep(Math.max(0, topBounds[0] - .10), topBounds[0], restY) : 1
    const headWeight = verticalHead * horizontalHead * upperHead
    if (headWeight > 0 && !ownedHead) {
      const localX = restX - model.pose.headCenter
      const warp = model.pose.headWarpBounds
      const localY = warp ? clamp((warp[1] - restY) / (warp[1] - warp[0]), 0, 1) : clamp((.40 - restY) / .38, 0, 1)
      const pose = (angle: number) => ({
        x: model.pose.headCenter + (x - model.pose.headCenter) * (1 - Math.abs(angle) * .09 * localY) + angle * .016 * localY,
        y: y + angle * localX * .055 * localY + tilt * .009 * localY,
      })
      const leftPose = pose(-1)
      const centerPose = pose(0)
      const rightPose = pose(1)
      const leftWeight = Math.max(0, -turn)
      const rightWeight = Math.max(0, turn)
      const centerWeight = 1 - leftWeight - rightWeight
      const poseX = leftPose.x * leftWeight + centerPose.x * centerWeight + rightPose.x * rightWeight
      const poseY = leftPose.y * leftWeight + centerPose.y * centerWeight + rightPose.y * rightWeight
      const custom = model.pose.headFollow
      if (custom) {
        const aspect = model.texture.height / model.texture.width
        const cx = model.pose.headCenter, cy = model.pose.headBounds[0]
        const dx = x - cx, dy = (y - cy) * aspect, angle = turn * custom.rotation
        const tx = cx + dx * Math.cos(angle) - dy * Math.sin(angle) + turn * custom.translation[0]
        const ty = cy + (dx * Math.sin(angle) + dy * Math.cos(angle)) / aspect + tilt * custom.translation[1]
        x += (tx - x) * headWeight; y += (ty - y) * headWeight
      } else {
        x += (poseX - x) * headWeight; y += (poseY - y) * headWeight
      }
    }
    return { x, y }
  }


  function updateVertices(surface: RigMesh, time: number, neutral = false) {
    const head = model.pose.headFollow, root = pinsByName.get('head-root')
    const aspect = model.texture.height / model.texture.width
    const pivot = head?.region && root ? basePoint(root.x, root.y) : undefined
    const angle = parameters.lookX / 30 * (head?.rotation ?? 0), cos = Math.cos(angle), sin = Math.sin(angle)
    const headPoint = (x: number, y: number) => {
      const dx = x - root!.x, dy = (y - root!.y) * aspect
      return { x: pivot!.x + dx * cos - dy * sin + parameters.lookX / 30 * head!.translation[0],
        y: pivot!.y + (dx * sin + dy * cos) / aspect + parameters.lookY / 30 * head!.translation[1] }
    }
    for (let vertex = 0; vertex < surface.rest.length / 2; vertex += 1) {
      const offset = vertex * 2
      const x = surface.rest[offset], y = surface.rest[offset + 1]
      const weightOffset = vertex * pins.length
      const point = neutral ? { x, y } : basePoint(x, y, surface.weights.subarray(weightOffset, weightOffset + pins.length))
      const flow = neutral ? { x: 0, y: 0 } : hair.displacement(surface.hairBinding, vertex)
      const secondary = neutral ? { x: 0, y: 0 } : accessories.displacement(surface.accessoryBinding, vertex, x, y)
      const local = neutral ? { x: 0, y: 0 } : parts.displacement(surface.partBinding, vertex, x, y)
      let px = point.x + flow.x + secondary.x + local.x, py = point.y + flow.y + secondary.y + local.y
      const binding = surface.regionBinding
      if (!neutral && binding) {
        let ownedX = 0, ownedY = 0, total = 0
        for (let i = binding.offsets[vertex]; i < binding.offsets[vertex + 1]; i++) {
          const region = model.surfaceRegions![binding.indices[i]], weight = binding.weights[i]
          if (weight === 0) continue
          let rx: number, ry: number
          if (region.mode === 'rigid') {
            const anchor = pinsByName.get(region.anchor ?? '')
            const cx = anchor?.x ?? model.pose.bodyPivot[0], cy = anchor?.y ?? model.pose.bodyPivot[1]
            const aspect = model.texture.height / model.texture.width
            const angle = region.rotation === 'head' ? parameters.lookX / 30 * (model.pose.headFollow?.rotation ?? .08)
              : region.rotation === 'body' ? parameters.bodyX / 10 * .05 : 0
            const dx = x - cx, dy = (y - cy) * aspect
            const pivot = region.rotation === 'head' && model.pose.headFollow?.region && anchor ? { x: anchor.px, y: anchor.py }
              : region.rotation === 'head' || region.rotation === 'body' ? basePoint(cx, cy)
              : { x: anchor?.px ?? cx, y: anchor?.py ?? cy }
            rx = pivot.x + dx * Math.cos(angle) - dy * Math.sin(angle)
            ry = pivot.y + (dx * Math.sin(angle) + dy * Math.cos(angle)) / aspect
          } else {
            const owned = basePoint(x, y, surface.weights.subarray(weightOffset, weightOffset + pins.length), region.pins)
            rx = owned.x; ry = owned.y
            if (region.secondary !== false) { rx += flow.x + secondary.x + local.x; ry += flow.y + secondary.y + local.y }
          }
          ownedX += rx * weight; ownedY += ry * weight; total += weight
        }
        px = px * Math.max(0,1-total) + ownedX; py = py * Math.max(0,1-total) + ownedY
      }
      if (!neutral && surface.headBinding && pivot) {
        const binding = surface.headBinding, n = binding.neck[vertex], h = binding.head[vertex] * (1 - n)
        // One shared matrix for skull/bangs; only reviewed local hair flow is added.
        const rigid = headPoint(x, y), detail = headPoint(x + flow.x + secondary.x + local.x, y + flow.y + secondary.y + local.y)
        const progress = binding.neckProgress[vertex]
        const nx = point.x + (rigid.x - point.x) * progress, ny = point.y + (rigid.y - point.y) * progress
        px = px * (1 - h - n) + detail.x * h + nx * n
        py = py * (1 - h - n) + detail.y * h + ny * n
      }
      const grouped = neutral ? point : pointerGroups.apply(surface.pointerBinding, vertex, px, py)
      const posed = neutral ? point : applySway(grouped.x, grouped.y, sway, model)
      surface.positions[offset] = posed.x
      surface.positions[offset + 1] = posed.y
    }
    const diagnostics = constrainSharedSurface(surface)
    if (!neutral && model.tracking?.translation) {
      // Translate the complete guarded surface equally: this cannot change local proportions,
      // and the fold limiter must not attenuate this separate whole-character travel.
      const dx = parameters.lookX / 30 * model.tracking.translation[0]
      const dy = parameters.lookY / 30 * model.tracking.translation[1]
      for (let offset = 0; offset < surface.positions.length; offset += 2) {
        surface.positions[offset] += dx; surface.positions[offset + 1] += dy
      }
    }
    const weight = neutral ? 0 : model.motion.weight ?? 1
    if (weight !== 1) {
      for (let offset = 0; offset < surface.positions.length; offset++) {
        surface.positions[offset] = surface.rest[offset] + (surface.positions[offset] - surface.rest[offset]) * weight
      }
      diagnostics.maxDisplacementGradient *= weight
    }
    return diagnostics
  }

  function setMotion(settings: Partial<MotionSettings>) {
    const next = { ...model.motion, ...settings }
    validateModel({ ...model, motion: next })
    Object.assign(model.motion, next)
    if (pointer) setPointer(...pointer)
  }
  function setTracking(settings: Partial<TrackingSettings>) {
    const next = structuredClone({ response: .018, damping: .75, maxVelocity: 2.4, ...model.tracking, ...settings })
    validateModel({ ...model, tracking: next })
    model.tracking = next
    trackingRemainder = 0
    for (const key of ['lookX', 'lookY'] as const) velocity[key] = clamp(velocity[key], -next.maxVelocity, next.maxVelocity)
    if (pointer) setPointer(...pointer)
  }
  function setPin(name: string, patch: Partial<Omit<PinSpec, 'name' | 'parent' | 'type'>>) {
    const pin = pinsByName.get(name)
    if (!pin) throw new Error('Unknown pin: ' + name)
    const spec = model.pins.find(p => p.name === name)!
    const next = { ...spec, ...patch }
    validateModel({ ...model, pins: model.pins.map(p => p.name === name ? next : p) })
    Object.assign(spec, next)
    Object.assign(pin, next, { px: next.x, py: next.y, vx: 0, vy: 0 })
  }

  function setPart(id: string, patch: Partial<Omit<DeformationPart, 'id'>>) {
    const spec = model.parts?.find(p => p.id === id)
    if (!spec) throw new Error('Unknown part: ' + id)
    const next = { ...spec, ...structuredClone(patch), id }
    validateModel({ ...model, parts: model.parts!.map(p => p.id === id ? next : p) })
    Object.assign(spec, next)
    const state = parts.states.find(p => p.spec.id === id)!
    state.rotation = 0; state.velocity = 0
  }

  return { model, setMotion, setTracking, setPin, setPart, rebindPin, pins, hair, accessories, parts, pointerGroups, parameters, velocity, textureSize, get sway() { return sway }, setPointer, setParameter, reset, wave, updatePins, buildContinuousMesh, updateVertices }
}

// Bound the displacement gradient over EVERY triangle, rather than only clamping
// pin travel. A Lipschitz displacement below 1 cannot fold or self-intersect on
// this connected rectangular domain. Scaling is shared by every vertex.
export function constrainSharedSurface(surface: Pick<RigMesh, 'rest' | 'positions' | 'indices'>, limit = .65) {
  const { rest, positions, indices } = surface
  let maximum = 0
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 2, b = indices[i + 1] * 2, c = indices[i + 2] * 2
    const rx1 = rest[b] - rest[a], ry1 = rest[b + 1] - rest[a + 1]
    const rx2 = rest[c] - rest[a], ry2 = rest[c + 1] - rest[a + 1]
    const determinant = rx1 * ry2 - ry1 * rx2
    const ux1 = positions[b] - positions[a] - rx1, uy1 = positions[b + 1] - positions[a + 1] - ry1
    const ux2 = positions[c] - positions[a] - rx2, uy2 = positions[c + 1] - positions[a + 1] - ry2
    const xx = (ux1 * ry2 - ux2 * ry1) / determinant
    const xy = (ux2 * rx1 - ux1 * rx2) / determinant
    const yx = (uy1 * ry2 - uy2 * ry1) / determinant
    const yy = (uy2 * rx1 - uy1 * rx2) / determinant
    const norm = Math.sqrt(xx * xx + xy * xy + yx * yx + yy * yy)
    maximum = Math.max(maximum, Number.isFinite(norm) ? norm : Infinity)
  }
  const scale = maximum > limit ? limit / maximum : 1
  if (scale < 1) {
    for (let i = 0; i < positions.length; i += 1) {
      positions[i] = scale === 0 ? rest[i] : rest[i] + (positions[i] - rest[i]) * scale
    }
  }
  return { motionScale: scale, maxDisplacementGradient: Number.isFinite(maximum) ? maximum * scale : 0 }
}
