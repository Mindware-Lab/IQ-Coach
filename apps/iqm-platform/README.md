# IQ Mindware shared B2C platform

This directory implements the Phase-1 shared node platform defined by:

`specs/IQM_B2C_NODE_PLATFORM_SPEC_v1.md`

Production target:

```text
one platform shell
+ six interchangeable node modules
+ shared A → B → A-return/reopen → A/B progression
+ shared Capacity → Strategy → Niche machinery
+ shared missions/check-ins
+ shared entitlement, dashboard and G Track surfaces
```

## Current implementation slice

The first scaffold contains:

- canonical TypeScript contracts for nodes, games, missions and progression;
- a deterministic Phase-1 wrapper progression engine;
- mission/check-in follow-up logic;
- an entitlement helper;
- a module registry that refuses duplicate node registrations;
- a neutral six-node dashboard shell;
- IQ Mindware theme tokens;
- unit tests for progression and mission logic.

It deliberately does **not** implement or display scientific transfer indices, mutualist causal estimates, synergy scores or personalised network edges.

## Local development

```bash
cd apps/iqm-platform
npm install
npm test
npm run build
npm run dev
```

New node implementation belongs under:

`src/modules/<node>/`

Complex architecture and coding is managed with ChatGPT GPT-5.6 Sol. Qwen is reserved for bounded lower-risk operating work such as content drafts, scheduling, sales/CRM support and repetitive transformations.


## Attention Control QA walkthrough

The Attention QA branch supports a deliberately accelerated five-session product-test sequence:

```text
1. Static/Polar core
2. Optic Flow perturbation
3. Static/Polar return
4. Emotional Distractor perturbation
5. Static/Polar return
```

Transitions are forced for QA and must not be interpreted as learning-curve or plateau evidence.

For a no-payment local test:

```bash
cd apps/iqm-platform
npm install
npm run dev
```

Then open the local URL with:

```text
?attention-qa=1
```

The QA query flag unlocks Attention and activates the five-session forced sequence without requiring a Stripe-derived entitlement. It is intended only for this test branch and should not be preserved as a production entitlement path.

The Attention node also exposes a curated **Find the Signal** human-AI practice. This is a disclosed simulation with deliberate AI omissions/false positives followed by a fresh unaided case; it is not a live-model benchmark.
