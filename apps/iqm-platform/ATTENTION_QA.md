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
- the other six nodes remain visible but unavailable;
- no production authentication, entitlement or database writes occur;
- progress, strategy status and planned missions are stored only in this browser's local storage.

## Acceptance walk-through

1. **Adaptive orientation + network shell**
   - First use shows "Navigate possibility. Build intelligence." before the dashboard.
   - Seven nodes are visible: Attention, Relational Memory, Binding Memory, Path Horizon, Knowledge Access, Generative Search and Reasoning.
   - Attention is the only openable node in local Attention QA preview.
   - The G Track area is visibly separate from training performance.
   - No causal edge weights, synergy scores or predicted IQ/g change are shown.

2. **Attention chapter boundary**
   - Attention opens as **Chapter 01 · Signal** with the question "What matters now?"
   - The portable move is **Pause. Find the signal. Commit.**
   - The primary UI shows one next journey action before secondary tools.
   - No Binding Focus, colour-binding or working-memory/n-back task appears.
   - The legacy CCC remains a separate unchanged application.

3. **Capacity / TRAIN**
   - First session uses static majority-direction arrows (Wrapper A).
   - There are 20 ACC-only trials in the current migration slice.
   - Correct responses make the donor staircase harder; errors make it easier.
   - The session reports Accuracy, Difficulty and Median response time.
   - Completion returns a product-progression state, not a scientific transfer score.

4. **Narrated Anchor → Perturb → Return journey**
   - Session 1: Find the signal.
   - Optic Flow: Same skill. Different world.
   - Static return: Can you recover it?
   - Emotional Distractor: Salience is not relevance.
   - Final static return: Bank the skill.
   - Underlying APR/progression mechanics remain unchanged by the narrative layer.

5. **Strategy / USE**
   - Portable handle: `What information actually matters here?`
   - Target cues and anti-cues are both shown.
   - Worked examples include research/AI/meeting contexts and an exploration anti-cue.
   - Strategy can be marked `learned` or `practising`.

6. **Reality / APPLY**
   - Three mission templates are available.
   - A mission stores context, trigger cue, intended policy and an environmental-support category.
   - The guided journey asks for mission feedback before continuing.
   - No-opportunity check-ins reschedule rather than count as failure.
   - Mission records are described as implementation feedback, not proof of far transfer.

7. **BANK**
   - Completed mission feedback can be converted to a reusable WHEN / I WILL / BECAUSE rule.
   - Banked rules are shown on the node home.
   - Banked rules are personal learning artefacts, not psychometric or causal scores.

8. **AI niche challenge**
   - Human judgement comes before the simulated AI shortlist.
   - The user corrects omissions / false positives.
   - A fresh unaided case follows.
   - Copy explicitly distinguishes supported performance from retained capability.

## Not yet a production release gate

Before public deployment we still need:

- human visual/playability QA;
- production Supabase migration review/application;
- remote progress/mission persistence wiring and validation;
- current approved public claims profile;
- entitlement/Stripe mapping for the final product keys;
- browser/mobile QA.

The intended first mutualist-platform release is **Attention Control + Generative Search / Divergent Thinking** under the same platform shell.
