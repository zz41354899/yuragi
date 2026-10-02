# Character design workbook

Help a beginner start with a concrete, editable proposal. These prompts are examples, not mandatory forms. Accept other languages and preserve the user's wording.

## Start without an idea

```text
$yuragi-character
I cannot draw and do not know what character to make.
Use everyday preferences to help me start. Ask one useful question or propose an editable concept.
First deliver identity, fixed appearance, a signature line and an illustration brief.
Do not add backgrounds or code yet.
```

Possible starting directions: a sleepy star singer that offers reassurance; a fox messenger sharing encouragement; a small robot host with dry humor. Connect visual details to identity and behavior. A beginner can say "calm, likes cats, no pink"; the agent should turn that into a proposal, not ask for a completed design sheet.

## Establish the baseline

```text
$yuragi-character
Use my approved concept to make one transparent full-body illustration.
Keep the silhouette, accessories and anatomy complete. Inspect it and provide its file path and character brief.
Only make the character this time.
```

If image generation is not requested, provide the drawing brief and clearly state that no image was generated.

## Extend an existing character

```text
$yuragi-character
Here are the approved artwork and brief. Preserve the hairstyle, outfit and signature accessory.
Make the requested expression variants as separate reusable images.
Change only expression, gaze and the minimal gesture needed for each emotion.
```

For backgrounds, supply the actual image again in a new conversation. Derive a location from identity/activity, retain compatible art style and light, and reserve character and text space. Request an independent background, a composite or both explicitly.

## Optional design sheet

Record name, one-sentence positioning, audience, desired feeling, identity/world, activity, personality/contrast, daily preferences, signature lines, fixed silhouette/palette/accessories, actual anatomy, baseline pose/transparency, allowed changes, available artwork, first use, intended interaction, and current deliverables. The agent may populate this from the conversation.

## Exercises

1. Turn a vague adjective into a specific identity and behavior. Can a reader recall both?
2. Compare expression thumbnails for consistent face, silhouette, accessories and switching anchors.
3. Write trigger → response → recovery, then test repeat use, keyboard, touch and reduced motion if implementing it.
4. Design one meaningful extension and explain what stays recognizable.

When ready to animate, hand the image and `character-brief.md` to `$yuragi-rig-spec`. Planning an idol or animating a web illustration does not produce a Live2D/VRM broadcast model.
