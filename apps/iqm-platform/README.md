# IQ Mindware shared B2C platform

The shared platform implements `specs/IQM_B2C_NODE_PLATFORM_SPEC_v1.md` and the guided learning contract in `specs/IQM_ADAPTIVE_JOURNEY_SPEC_v0.1.md`.

## Illustrated Synergy IQ studio

The active entry point is now `src/app/studio.ts`, imported by `src/main.ts`. The earlier `bootstrap.ts` is retained for history but is not the active UI.

The approved screen plan is `../../specs/SYNERGY_IQ_VISUAL_SCREEN_PLAN_v1.md`.

One application has two deliberate compositions:

- a centred 760 × 760 reference square on desktop, constrained proportionally by available space;
- a full-height portrait interface on mobile, with safe-area support and independently composed artwork, content and actions.

Welcome and chapter screens use illustration-led layouts. Learning and reflection screens use light, readable surfaces. The scored Attention game remains stimulus-led with no decorative artwork behind the evidence.

The seven-node network is colour-indexed: Attention blue, Relational violet, Binding rose, Path Horizon apricot, Knowledge Access gold, Generative Search jade and Reasoning teal. Unavailable nodes are clearly labelled previews, not working games or fabricated personal progress.

## Implementation map

| File | Responsibility |
| --- | --- |
| `src/app/studio.ts` | Presentation controller, navigation, account integration and complete Attention journey |
| `src/app/studioModel.ts` | Seven palette/world definitions, actual-wrapper narrative, due-mission scheduling and contextual practice cases |
| `src/theme/studio.css` | Square desktop and portrait mobile composition |
| `src/theme/studio-art.css` | Local wave artwork, responsive crop and control-size refinements |
| `public/art/` | Artwork and provenance; no Big Health assets |
| `src/modules/attention/game/` | Unchanged Attention task, timing, scoring and stimulus runtime |
| `scripts/verify-studio.mjs` | Real-browser journey, responsive assertions and screenshots |
| `tests/journey/studio.test.ts` | Pure model and scheduling checks |

The shared module registry, entitlements, authentication and existing local progress/mission/rule storage remain in use. No new remote research collection or automatic causal network inference is introduced.

## Local development

```bash
cd apps/iqm-platform
npm install
npm test
npm run build
npm run dev
```

Use the URL printed by Vite with `?attention-qa=1`, normally:

```text
http://127.0.0.1:5173/?attention-qa=1
```

This existing QA flag unlocks Attention and activates the accelerated five-session walkthrough without a Stripe-derived entitlement. It remains a test-branch facility, not a production entitlement path. PR #6 remains draft.

First entry shows the illustrated welcome; returning users resume their journey. To revisit the chapter without deleting saved progress, use **More → Replay this chapter**.

## Attention Control QA walkthrough

```text
Static/Polar anchor
→ Optic Flow perturbation
→ Static/Polar return
→ Emotional Distractor perturbation
→ Static/Polar return
```

Transitions are forced for QA and must not be interpreted as plateau or transfer evidence. The narrative describes the actual current wrapper; outside QA, it is not inferred simply from session number.

## Adaptive learning journey

```text
Chapter 01 · Signal — What matters now?
→ train the abstract operation
→ extract: Pause. Find the signal. Commit.
→ recognise the move in a feed, workspace or optional AI exercise
→ choose a real context, action, prediction and review point
→ return for feedback when an opportunity actually occurs
→ keep, revise or skip a WHEN / I WILL / BECAUSE learning note
→ continue training and application
```

A future-dated mission does not force an immediate check-in. Users may continue training while waiting for reality to return information. A no-opportunity response reschedules rather than counting as failure. Banked rules remain tentative personal learning notes, not proof of transfer.

The AI exercise is a disclosed simulation: human judgement → AI shortlist → corrections → a fresh unaided case. It is not a live-model benchmark. Training performance, mission feedback and G Track measurement remain separate evidence layers.

## Browser review

```bash
npm run build
npx playwright install chromium
npm run test:browser
```

The script serves the actual built app, completes an accelerated QA session through the real runtime, exercises strategy/context/mission/check-in/banking and verifies desktop square and portrait phone layouts. It writes screenshots and `qa-results.json` to `studio-review/`.

GitHub Actions runs the unit tests, TypeScript/Vite build and browser review, then uploads `synergy-iq-visual-review` and `synergy-iq-screen-review` artefacts for seven days. Test clock acceleration and responses are confined to the test script; they are not shipped as user behaviour or efficacy evidence.

See `DESIGN_REVIEW_2026-09-22.md` for the verified scope and remaining release work.
