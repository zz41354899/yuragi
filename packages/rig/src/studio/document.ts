import type { RigModel } from '../types.js'
import type { LayeredModel } from '../layered-types.js'
import { validateModel } from '../validation.js'
import { validateLayeredModel } from '../layered-validation.js'

export type StudioModel = RigModel | LayeredModel
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
export type Path = (string | number)[]
export const reviewChecks = ['neutral', 'directions', 'corners', 'reversal', 'eyes', 'seams', 'hair', 'clipping', 'contacts', 'reduced-motion', 'fallback'] as const
export type ReviewCheck = typeof reviewChecks[number]
export interface StudioReview { fingerprint: string; checks: Partial<Record<ReviewCheck, boolean>>; notes: string }
export interface Change { label: string; at: string }
export interface StudioDraft { version: 1; model: unknown; changes: Change[]; review?: StudioReview }
export function validateStudioModel(model: unknown): asserts model is StudioModel {
  if (model && typeof model === 'object' && 'version' in model && model.version === 2) validateLayeredModel(model)
  else validateModel(model)
}
export function readPath(value: unknown, path: Path): Json | undefined {
  let current = value as Json | undefined
  for (const key of path) {
    if (!current || typeof current !== 'object') return
    current = (current as Record<string | number, Json>)[key]
  }
  return current
}
export function writePath(value: unknown, path: Path, next: Json | undefined): unknown {
  const copy = structuredClone(value) as Json
  if (!path.length) return next
  let parent = copy as Record<string | number, Json>
  for (const key of path.slice(0, -1)) parent = parent[key] as Record<string | number, Json>
  const key = path[path.length - 1]
  if (next === undefined) {
    if (Array.isArray(parent)) parent.splice(Number(key), 1)
    else delete parent[key]
  } else parent[key] = structuredClone(next)
  return copy
}
/** Invalid edits remain in the draft; the last valid model remains playable. */
export class StudioDocument {
  draft: unknown
  valid: StudioModel
  error = ''
  changes: Change[] = []
  review?: StudioReview
  private past: unknown[] = []
  private future: unknown[] = []
  constructor(model: StudioModel) { validateStudioModel(model); this.draft = structuredClone(model); this.valid = structuredClone(model) }
  get canUndo() { return this.past.length > 0 }
  get canRedo() { return this.future.length > 0 }
  private accept(label: string) {
    this.review = undefined
    this.changes.push({ label, at: new Date().toISOString() })
    try { validateStudioModel(this.draft); this.valid = structuredClone(this.draft); this.error = '' }
    catch (error) { this.error = error instanceof Error ? error.message : String(error) }
  }
  edit(next: unknown, label: string) {
    if (this.valid.version === 2) throw new Error('Layered models are inspection-only in Studio v1')
    this.past.push(structuredClone(this.draft)); if (this.past.length > 100) this.past.shift()
    this.future = []; this.draft = structuredClone(next); this.accept(label)
  }
  undo() {
    if (!this.past.length) return
    this.future.push(structuredClone(this.draft)); this.draft = this.past.pop(); this.accept('Undo')
  }
  redo() {
    if (!this.future.length) return
    this.past.push(structuredClone(this.draft)); this.draft = this.future.pop(); this.accept('Redo')
  }
  restore(draft: StudioDraft) {
    if (this.valid.version === 2 && JSON.stringify(draft.model) !== JSON.stringify(this.valid)) throw new Error('Layered draft cannot edit a model')
    this.draft = structuredClone(draft.model); this.accept('Restore draft'); this.changes = draft.changes ?? []
    // Review is deliberately not restored: source assets may have changed since saving.
  }
  save(): StudioDraft { return { version: 1, model: structuredClone(this.draft), changes: structuredClone(this.changes), review: this.review } }
}
