# Attention instructional-image accuracy audit

Date: 22 September 2026  
Scope: shared Synergy IQ app, `feature/attention-apr-qa3`, draft PR #6.

## Finding

The active training briefing in `src/app/studio.ts` used five manually placed Unicode compass arrows (`st-signal-orbit`). Their directions did not all lie on the radius from the task centre. The same generic illustration appeared for static, motion and emotional wrappers. A caption describing it as illustrative did not make it an accurate explanation of the task.

## Correction

`src/modules/attention/instruction.ts` now obtains teaching examples from the actual `generateAttentionTrial` function with `frame: 'relational'` and renders them through the actual `renderAttentionStimulus` function. The scored generator, renderer, timing, staircase, trial counts and response controls are unchanged.

- Static/Polar: five arrows in five distinct positions on the game's eight-position layout; every arrow is radial IN or OUT.
- Optic Flow: five actual animated dot patches, not a static arrow illustration.
- Emotional Distractor: the real radial-arrow renderer and the existing irrelevant-face layer; the face does not determine the answer.
- Mixed practice: previews both A and B, with copy naming arrows or motion.
- Future/non-Attention modules do not inherit an Attention arrow illustration.

The worked-example captions are calculated from the same trial objects as the images. Examples use a 4:1 majority, with both IN-majority and OUT-majority examples covered by tests. “Every arrow is IN or OUT” does not require all five arrows to agree; the task remains a majority judgement.

The examples are explicitly untimed, independent of scored sessions and never stored as performance. Their deterministic seeds do not modify the participant's trial stream.

## Surfaces checked

The active controller, legacy bootstrap, Attention module/content/wrappers and trial renderer, AI/context practice, network/brand icons and local public illustration assets were reviewed. The invalid task diagram was in the shared briefing. Network, navigation and chapter icons are navigation metaphors, not trial examples. The public artwork contains landscapes and abstract motifs, not additional scored-trial screenshots.

Generated concept-board mock-ups are design references, not instructional truth. Do not copy their illustrative compass arrows into the app. Any future illustration claiming to show this task must use the shared teaching renderer or an exported image of it.

## Regression coverage

- Twelve additional unit tests check deterministic examples, five unique positions, radial direction vectors, 4:1 counts, polygon rotations, caption agreement, actual-renderer parity, motion/face carrier selection, mixed previews and isolation from scored trials.
- `scripts/verify-attention-illustrations.mjs` checks all four briefing modes at eight viewport sizes. It inspects the final rendered SVG transforms, dot-motion directions, aspect ratio, captions and action reachability.
- The browser audit runs alongside the existing full-journey/persistent-controls suite through `npm run test:browser`.
- Browser fixtures exist only in the test. External face-image requests are blocked there; the emotional-face layer is checked structurally rather than presented as a fully loaded artwork screenshot.

No production merge is part of this correction.
