import { createMireaModel } from '@yuragi/rig/mirea'
import { validateModel } from '@yuragi/rig'
/** Website URL wrapper for the same reviewed Mirea model included in the local package. */
export function createMireaDemoModel(texture = '/images/home/mirea-base-v1.png') {
  const model = createMireaModel(texture)
  validateModel(model)
  return model
}
