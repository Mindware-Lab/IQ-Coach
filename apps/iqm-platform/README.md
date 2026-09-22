# IQ Mindware shared B2C platform

This directory implements the Phase-1 shared node platform defined by:

`specs/IQM_B2C_NODE_PLATFORM_SPEC_v1.md`

Production target:

```text
one platform shell
+ seven interchangeable node modules
+ shared A → B → A-return/reopen → A/B progression
+ shared Capacity → Strategy → Niche machinery
+ shared missions/check-ins
+ shared entitlement, dashboard and G Track surfaces
```

## Current implementation slice

The current scaffold contains:

- canonical TypeScript contracts for nodes, games, missions, progression and guided journeys;
- a deterministic Phase-1 wrapper progression engine;
- a seven-node network map aligned with the public Synergy IQ architecture;
- first-time adaptive-intelligence orientation;
- chapter-level narrative guidance and event-based APR explanations;
- portable strategy teaching;
- Reality Missions with check-ins and banked reusable rules;
- mission/check-in follow-up logic;
- a human-first → AI review → fresh unaided Attention niche challenge;
- an entitlement helper;
- a module registry that refuses duplicate node registrations;
- IQ Mindware theme tokens;
- unit tests for progression, mission logic and journey orchestration.

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

## Adaptive journey

The shared narrative/product contract is:

`../../specs/IQM_ADAPTIVE_JOURNEY_SPEC_v0.1.md`

The default Attention journey is now:

```text
understand Chapter 01 · Signal
→ train the abstract operation
→ extract "Pause. Find the signal. Commit."
→ take one Reality Mission outside the app
→ check what actually happened
→ bank a WHEN / I WILL / BECAUSE rule
→ continue through perturbation / return
→ optional AI niche challenge
```

The scored game, mission feedback and G Track measurement remain separate evidence layers.
