import { createTestModel } from './model.js'
import type {FaceFeatures} from '../../src/types.js'
export const features:FaceFeatures={eyes:[
 {id:'left',center:[.45,.2],radius:[.02,.013],iris:[.45,.2],irisRadius:[.008,.006],travel:[.003,.001],angle:-.2,sclera:[.98,.95,.97]},
 {id:'right',center:[.55,.19],radius:[.02,.013],iris:[.55,.19],irisRadius:[.008,.006],travel:[.003,.001],angle:-.2,sclera:[.98,.95,.97]},
]}
export function faceModel(){const m=createTestModel();m.pose.headFollow={rotation:.015,translation:[.002,.002],region:[[.3,.05],[.7,.05],[.7,.3],[.3,.3]],feather:.06};m.face=structuredClone(features);return m}
