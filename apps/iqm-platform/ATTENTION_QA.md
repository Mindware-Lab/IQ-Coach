# Attention Control — local Phase-1 QA

This checklist tests the **new** Attention Control node inside `apps/iqm-platform`.
It does not modify or replace the legacy `apps/attention-coach` / CCC application.

## Local preview

```bash
cd apps/iqm-platform
npm install
npm test
npm run build
npm run dev
```

Open the local Vite URL (normally `http://127.0.0.1:5173/`).

When Supabase environment variables are absent, localhost uses a deliberately limited preview mode:

- Attention is unlocked;
- the other five nodes remain visible but unavailable;
- no production authentication, entitlement or database writes occur;
- progress, strategy status and planned missions are stored only in this browser's local storage.

## Acceptance walk-through

1. **Network shell**
   - Six nodes are visible.
   - Attention is the only openable node in local preview.
   - The G Track area is visibly separate from training performance.
   - No causal edge weights, synergy scores or predicted IQ/g change are shown.

2. **Attention node boundary**
   - The node journey is `TRAIN / USE / APPLY`.
   - No Binding Focus, colour-binding or working-memory/n-back task appears.
   - The legacy CCC remains a separate unchanged application.

3. **Capacity / TRAIN**
   - First session uses static majority-direction arrows (Wrapper A).
   - There are 20 ACC-only trials in the current migration slice.
   - Correct responses make the donor staircase harder; errors make it easier.
   - The session reports Accuracy, Difficulty and Median response time.
   - Completion returns a product-progression state, not a scientific transfer score.

4. **A → B → A-return/reopen → A/B progression**
   - A baseline is followed by A training.
   - B is motion/optic-flow majority direction.
   - B cannot jump directly into mixed practice.
   - A return and A reopen occur before A/B mixing.
   - Maximum-exposure fallbacks prevent indefinite blocking.

5. **Strategy / USE**
   - Portable handle: `What information actually matters here?`
   - Target cues and anti-cues are both shown.
   - Worked examples include research/AI/meeting contexts and an exploration anti-cue.
   - Strategy can be marked `learned` or `practising`.

6. **Niche / APPLY**
   - Three mission templates are available.
   - A mission stores context, trigger cue, intended policy and an environmental-support category.
   - Mission records are described as implementation feedback, not proof of far transfer.

## Not yet a production release gate

Before public deployment we still need:

- human visual/playability QA;
- production Supabase migration review/application;
- remote progress/mission persistence wiring and validation;
- full mission check-in UI;
- current approved public claims profile;
- entitlement/Stripe mapping for the final product keys;
- browser/mobile QA.

The intended first mutualist-platform release is **Attention Control + Generative Search / Divergent Thinking** under the same platform shell.
