import type { AnimationClip, AnimationCurve, AnimationSnapshot, AnimationTrack } from './types.js'
const limits = { lookX: [-30,30], lookY: [-30,30], bodyX: [-10,10], wave: [0,1], strength:[0,1], weight:[0,1] } as const
export function validateAnimation(clip: AnimationClip, face = false) {
  if (!clip || typeof clip.id !== 'string' || !clip.id || !Number.isFinite(clip.duration) || clip.duration <= 0 || clip.duration > 600000) throw new Error('Invalid animation duration/id')
  if (clip.loop !== undefined && typeof clip.loop !== 'boolean') throw new Error('Invalid loop flag')
  if (!Array.isArray(clip.tracks) || !clip.tracks.length || clip.tracks.length > 32) throw new Error('Invalid animation tracks')
  const seen = new Set<string>()
  for (const track of clip.tracks) {
    if ((track.target as string) === 'expression') throw new Error('Expression tracks were removed in 0.2.0; migrate expression.gaze to gaze.strength')
    const names = track.target === 'parameter' ? ['lookX','lookY','bodyX','wave'] : track.target === 'motion' ? ['weight'] : track.target === 'gaze' && face ? ['strength'] : []
    if (!names.includes(track.name) || seen.has(track.target+track.name)) throw new Error('Unsupported or duplicate animation channel')
    seen.add(track.target+track.name)
    if (!Array.isArray(track.keys) || !track.keys.length || track.keys.length > 2048) throw new Error('Invalid animation keys')
    let previous = -1
    for (const key of track.keys) {
      const range = limits[track.name]
      if (!key || !Number.isFinite(key.time) || key.time < 0 || key.time > clip.duration || key.time <= previous || !Number.isFinite(key.value) || key.value < range[0] || key.value > range[1]) throw new Error('Animation keys must be ordered, bounded and finite')
      previous = key.time
      const c = key.curve
      if (c !== undefined && c !== 'linear' && c !== 'step' && (!Array.isArray(c) || c.length !== 4 || c.some(v => !Number.isFinite(v) || v < 0 || v > 1))) throw new Error('Invalid Bezier curve; control points must be 0…1')
    }
  }
}
/** Invert Bezier X before sampling Y: control-point time is not linear t. */
export function sampleCurve(progress: number, curve: AnimationCurve = 'linear') {
  const x = Math.max(0, Math.min(1, progress))
  if(x===0||x===1)return x
  if (curve === 'linear') return x
  if (curve === 'step') return x === 1 ? 1 : 0
  const bezier = (t:number,a:number,b:number) => 3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t
  let low=0,high=1
  for(let i=0;i<24;i++){const mid=(low+high)/2;if(bezier(mid,curve[0],curve[2])<x)low=mid;else high=mid}
  return bezier((low+high)/2,curve[1],curve[3])
}
export function sampleTrack(track: AnimationTrack, time: number) {
  const keys=track.keys
  if(time<=keys[0].time)return keys[0].value
  for(let i=1;i<keys.length;i++)if(time<=keys[i].time){const a=keys[i-1],b=keys[i];return a.value+(b.value-a.value)*sampleCurve((time-a.time)/(b.time-a.time),a.curve)}
  return keys.at(-1)!.value
}
export function createTimeline(apply: (track: AnimationTrack, value: number) => void, face: boolean) {
  let clip:AnimationClip|undefined,time=0,running=false
  function sample(){if(clip)for(const track of clip.tracks)apply(track,sampleTrack(track,time))}
  return {
    play(next:AnimationClip){validateAnimation(next,face);clip=structuredClone(next);time=0;running=true;sample()},
    pause(){running=false},
    stop(){clip=undefined;time=0;running=false},
    seek(next:number){if(!Number.isFinite(next))throw new Error('Animation time must be finite');if(!clip)throw new Error('No active animation');time=Math.max(0,Math.min(clip.duration,next));sample()},
    update(dt:number){if(!clip||!running)return;time+=Math.max(0,dt);if(time>=clip.duration){if(clip.loop)time%=clip.duration;else{time=clip.duration;running=false}}sample()},
    snapshot():AnimationSnapshot|undefined{return clip?{id:clip.id,time,duration:clip.duration,playing:running}:undefined},
  }
}
