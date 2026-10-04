# react / getPlayer

Get the ready player; undefined before loading or after cleanup.

Import: `@yuragi/rig/react`

## Signature

```ts
getPlayer(): RigPlayer | undefined
```

## Parameters

No positional parameters.

## Returns

RigPlayer | undefined

## Behavior, defaults and limits

Vue: call through a component template ref after mount. React: use the typed forwarded ref. Readiness may change while loading a replacement model.

## Example

```ts
const player = handle.getPlayer();
player?.pause();
```

## Related

- [vue/yuragi-character-get-player](vue-yuragi-character-get-player.md)
- [vue/yuragi-layered-character-get-player](vue-yuragi-layered-character-get-player.md)
- [react/yuragi-character](react-yuragi-character.md)
- [react/yuragi-layered-character](react-yuragi-layered-character.md)
- [react/yuragi-layered-character-get-player](react-yuragi-layered-character-get-player.md)

- [Types and constants](types.md)
- [API index](index.md)
