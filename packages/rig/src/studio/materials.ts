import type { StudioModel } from './document.js'

export interface MissingAsset {
  id: string
  partId: string
  reason: string
  nextAction: 'extract' | 'revise-annotation' | 'provide-artwork'
  required: boolean
  sourceRegion?: string
}
export interface MissingAssetsReport {
  version: 1
  producer: 'studio' | 'python'
  sourceSha256: string
  modelFingerprint?: string
  assetFingerprint?: string
  versionId?: string
  items: MissingAsset[]
}

/** Report material availability; this never infers or synthesizes hidden pixels. */
export function missingAssets(model: StudioModel): MissingAsset[] {
  const result: MissingAsset[] = []
  if (model.version === 2) for (const part of model.attachments) if (part.coverage === 'visible-only') result.push({
    id: `${part.id}-completion`, partId: part.id, required: false,
    reason: 'Only visible source pixels are available; hidden coverage requires supplied artwork.', nextAction: 'provide-artwork',
  })
  return result
}
