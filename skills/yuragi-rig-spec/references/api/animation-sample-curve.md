# animation / sampleCurve

Sample a linear, step or cubic-bezier animation curve.

Import: `@yuragi/rig`

## Signature

```ts
(progress: number, curve?: AnimationCurve): number
```

## Parameters

- `progress: number` — Normalized curve progress.
- `curve?: AnimationCurve` (default: `'linear'`) — linear, step, or cubic-bezier [x1,y1,x2,y2].

## Returns

number

## Behavior, defaults and limits

Validate externally supplied clips first. Curve evaluation is not animation validation.

## Example

```ts
const eased = sampleCurve(.5, [.42, 0, .58, 1]);
```

## Related

- [animation/validate-animation](animation-validate-animation.md)
- [animation/sample-track](animation-sample-track.md)

- [Types and constants](types.md)
- [API index](index.md)
