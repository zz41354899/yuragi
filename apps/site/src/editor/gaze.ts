import type { FaceFeatures, Vec2 } from '@z7589xxz758/yuragi'

/** Shared source-space pointer mapping for the website and local Studio. */
export function pointerGaze(pointer: Vec2, box: {left:number;top:number;width:number;height:number}, face: FaceFeatures, offset: Vec2 = [0,0]): Vec2 {
  if (!(box.width>0 && box.height>0)) return [0,0]
  const center: Vec2 = [(face.eyes[0].center[0]+face.eyes[1].center[0])/2+offset[0],(face.eyes[0].center[1]+face.eyes[1].center[1])/2+offset[1]]
  const x=(pointer[0]-box.left-box.width*center[0])/(box.width*.2)
  const y=(pointer[1]-box.top-box.height*center[1])/(box.height*.13)
  // Smooth saturation keeps a nearby pointer responsive without abrupt extremes.
  return [x/Math.sqrt(1+x*x), y/Math.sqrt(1+y*y)]
}
