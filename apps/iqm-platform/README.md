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
