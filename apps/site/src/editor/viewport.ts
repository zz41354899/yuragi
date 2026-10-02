export interface Point { x: number; y: number }
export interface Rect { left: number; top: number; width: number; height: number }
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 3
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// Read the transformed artwork rect: this remains correct after pan and zoom.
export function imagePoint(client: Point, rect: Rect): Point | undefined {
  if (!(rect.width > 0 && rect.height > 0)) return
  return {
    x: clamp((client.x - rect.left) / rect.width, 0, 1),
    y: clamp((client.y - rect.top) / rect.height, 0, 1),
  }
}
export function zoomAtPoint(zoom: number, next: number, pan: Point, anchor: Point) {
  const scale = clamp(next, MIN_ZOOM, MAX_ZOOM)
  const ratio = scale / zoom
  return {
    zoom: scale,
    pan: { x: anchor.x - (anchor.x - pan.x) * ratio, y: anchor.y - (anchor.y - pan.y) * ratio },
  }
}
export function movePin(point: Point, key: string, large = false): Point | undefined {
  const step = large ? 0.01 : 0.001
  const delta: Record<string, Point> = {
    ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 },
    ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step },
  }
  if (!delta[key]) return
  return { x: clamp(point.x + delta[key].x, 0, 1), y: clamp(point.y + delta[key].y, 0, 1) }
}
