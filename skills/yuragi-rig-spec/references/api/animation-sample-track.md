# animation / sampleTrack

Sample a validated animation track at a time in milliseconds.

Import: `@yuragi/rig`

## Signature

```ts
(track: AnimationTrack, time: number): number
```

## Parameters

- `track: AnimationTrack` — An animation track from a previously validated clip.
- `time: number` — Milliseconds from the start of the simulation or clip, according to the method.

## Returns

number

## Behavior, defaults and limits

Times are milliseconds. Validate the clip first. Values before/after the keyed range use the endpoint keys.

## Example

```ts
validateAnimation(clip);
const value = sampleTrack(clip.tracks[0], 500);
```

## Related

- [animation/validate-animation](animation-validate-animation.md)
- [animation/sample-curve](animation-sample-curve.md)

- [Types and constants](types.md)
- [API index](index.md)
