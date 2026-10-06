# vue / getPlayer

Get the ready player; undefined before loading or after cleanup.

Import: `@z7589xxz758/yuragi/vue`

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

- [vue/yuragi-character](vue-yuragi-character.md)
- [vue/yuragi-layered-character](vue-yuragi-layered-character.md)
- [vue/yuragi-layered-character-get-player](vue-yuragi-layered-character-get-player.md)
- [react/yuragi-character-get-player](react-yuragi-character-get-player.md)
- [react/yuragi-layered-character-get-player](react-yuragi-layered-character-get-player.md)

- [Types and constants](types.md)
- [API index](index.md)
