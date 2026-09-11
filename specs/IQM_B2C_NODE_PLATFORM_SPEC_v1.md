# IQ Mindware B2C Node Platform Specification v1

## Common production framework for six Trident-G / Personal CSI cognitive-node apps

**Status:** Canonical implementation specification v1.0  
**Date:** 11 September 2026  
**Repository:** `Mindware-Lab/IQ-Coach`  
**Canonical path:** `specs/IQM_B2C_NODE_PLATFORM_SPEC_v1.md`  
**Applies to:** Attention Control, Relational Memory, Binding Memory, Predictive Mapping, Generative Search and Reasoning B2C modules  
**Primary implementation stack:** Vite + TypeScript + Supabase  
**Scientific companions:**  
- `Mindware-Lab/trident-g-ground-truth/protocols/IQ_Coach/TRIDENT_G_TRANSFER_MECHANISMS_v1.md`
- `Mindware-Lab/trident-g-ground-truth/protocols/IQ_Coach/TRIDENT_G_NODE_APP_TEMPLATE_v1.md`
- `Mindware-Lab/trident-g-ground-truth/July_2026/explorer_specs/IQM_PERSONAL_EXPLORER_SPEC.md`

---

# 1. Purpose

The purpose of this specification is to make new IQ Mindware B2C cognitive apps cheap and fast to release without cloning the Cognitive Control Coach architecture six times.

The production model is:

```text
ONE IQ MINDWARE PLATFORM SHELL

    ├── shared dashboard
    ├── shared authentication
    ├── shared entitlement / purchase logic
    ├── shared session shell
    ├── shared A→B→A→AB construct-transfer engine
    ├── shared strategy engine
    ├── shared mission / niche-design engine
    ├── shared mission check-ins
    ├── shared G Track surface
    ├── shared persistence / Supabase layer
    ├── shared IQ Mindware visual system
    │
    └── SIX INTERCHANGEABLE NODE MODULES
         ├── Attention Control
         ├── Relational Memory
         ├── Binding Memory
         ├── Predictive Mapping
         ├── Generative Search
         └── Reasoning
```

A new commercial node should therefore require mainly:

```text
game / task mechanics
+ Wrapper A definition
+ Wrapper B definition
+ node-specific strategy content
+ node-specific mission examples
+ entitlement / product key
```

It should **not** require rebuilding authentication, payments, dashboard, transfer progression, mission screens, CSS, database access or navigation.

The target release cadence is approximately **one new node every two weeks** once the common shell is stable.

---

# 2. Governing product principle

## 2.1 One platform, separate commercial entitlements

The six cognitive products remain separately purchasable, but technically they are modules inside one application.

```text
purchase Attention Control
→ entitlement.attention = active

purchase Relational Memory
→ entitlement.relational_memory = active
```

Purchasing a module should unlock its node in the common dashboard. It should not require a separate installation, login or duplicated application shell.

The dashboard is therefore the user's persistent IQ Mindware home.

## 2.2 Six-node Personal CSI / Trident-G network

The Phase-1 node set is:

```text
attention
relational-memory
binding-memory
predictive-mapping
generative-search
reasoning
```

These are intervention-process nodes. They must not be presented as six exhaustive psychometric factors or as a measured causal network for the individual.

Each node implements the same intervention chassis:

```text
CAPACITY
→ STRATEGY
→ NICHE / IMPLEMENTATION
```

User-facing language should usually be simpler:

```text
TRAIN
→ USE
→ APPLY
```

## 2.3 Phase-1 science boundary

Phase 1 implements the intervention architecture but deliberately avoids building a scientific transfer-testing platform.

Phase 1 includes:

```text
adaptive game training
A→B→A re-entry → A/B mixing
strategy teaching
cue / anti-cue recognition
real-life missions
environment / niche redesign
brief mission check-ins
external G Track results
common node dashboard
raw event logging sufficient for later analysis
```

Phase 1 explicitly excludes:

```text
independent construct-transfer tests
counterbalanced wrapper cohorts
random assignment to initial wrappers
displayed internal transfer indices
mutualist causal estimates
dynamic causal network edges
network-centrality scores
synergy scores
partner-node learning-slope experiments
independent scientific outcome batteries inside each training app
```

Older counterbalanced / wrapper-measurement specifications may remain as Phase-2 research references, but they do not govern the commercial Phase-1 progression.

---

# 3. The common user journey

Each owned node uses the same high-level product journey:

```text
GOAL / RELEVANCE
What should this help with?

        ↓

TRAIN
Capacity game
A → B → A re-entry → A/B mixed

        ↓

USE
Explicit strategy
What is the operation?
When should I use it?
When should I not?

        ↓

APPLY
Mission
Choose a real context
Choose an environmental support / redesign
Use the policy

        ↓

CHECK-IN
Did the opportunity occur?
Was the strategy used?
Did it help?
Did the environmental change help?

        ↓

CONTINUE
Return to training / strategy / mission as appropriate
```

The order does not require every strategy and mission element to occur only after all capacity training is complete. Strategy and missions may be introduced during the programme while capacity training continues. However, the underlying construct must remain aligned across all three tiers.

---

# 4. Principle 1 in production: construct portability

## 4.1 Production objective

The commercial wrapper engine should implement the current Trident-G construct-transfer logic without turning it into a scientific transfer test.

The production sequence is:

```text
A0 — initial A baseline
↓
A_TRAIN — adaptive Wrapper A training
↓
A_PLATEAU — local flattening / stable no-change
↓
B_INTRO — first controlled Wrapper B exposure
↓
B_RECOVERY — one or more B-focused sessions
↓
A_RETURN — protected A-only re-entry block
↓
A_REOPEN — one or more A-focused blocks/sessions
             to allow reopened learning on the original task
↓
AB_MIXED — unpredictable Wrapper A / Wrapper B switching
↓
AB_MAINTENANCE — continued mixed adaptive training
```

The important change relative to the earlier simplified commercial flow is that the platform must **not move directly from B recovery to A/B mixing**.

The A-return stage has two purposes:

```text
1. test immediate re-entry into the original task;
2. allow the original task to resume learning beyond its earlier local plateau
   before random A/B mixing begins.
```

The Trident-G hypothesis is that successful reconstruction under B may reopen learning under A. The product should create room for this possibility while not presenting it as an established causal effect.

## 4.2 Internal phase enum

```ts
export type WrapperPhase =
  | "A_BASELINE"
  | "A_TRAIN"
  | "B_INTRO"
  | "B_RECOVERY"
  | "A_RETURN"
  | "A_REOPEN"
  | "AB_MIXED"
  | "AB_MAINTENANCE";
```

No user-facing "transfer score" is required.

User-facing labels can be:

```text
A_BASELINE      Getting your starting level
A_TRAIN         Building the skill
B_INTRO         New format
B_RECOVERY      Rebuilding the skill
A_RETURN        Back to the original
A_REOPEN        Building further
AB_MIXED        Flexible practice
AB_MAINTENANCE  Keep it flexible
```

## 4.3 Wrapper design rule

Wrapper B is not cosmetic variety.

Wrapper B should satisfy:

```text
same target cognitive operation
+
meaningfully changed representational surface
+
reduced usefulness of Wrapper-A-specific shortcuts
```

Good B:

```text
same latent relation / operation
but a changed efficient representation is required
```

Too weak:

```text
blue arrows → green arrows
```

Too strong / construct-changing:

```text
attention-majority judgement
→ unrelated working-memory task
```

Each node definition must explicitly state:

```text
target construct
Wrapper A
Wrapper B
invariant preserved across A and B
surface routine disrupted by B
potential construct confounds introduced by B
```

## 4.4 Simple progression logic

The Phase-1 engine needs progression control, not scientific inference.

Every GameAdapter must return an internal normalised progression score plus optional user-facing metrics.

```ts
export interface TrainingSummary {
  progressionScore: number; // 0..1, internal only
  validTrials: number;
  accuracy?: number;
  level?: number;
  displayMetrics?: Array<{
    label: string;
    value: string | number;
  }>;
}
```

The progression engine should preserve:

```text
A plateau reference
B current performance
A return performance
A reopened-learning status
current phase
sessions in phase
```

It should not compute or display a composite transfer index.

### A → B gate

Move from `A_TRAIN` to `B_INTRO` when:

```text
minimum A exposure is met
AND
recent A performance is stable / flattening
AND
data quality is adequate
```

A game may define its own thresholds through configuration.

### B → A-return gate

B should normally receive at least one full focused session and commonly one to two sessions before A return.

Move from `B_RECOVERY` to `A_RETURN` when:

```text
minimum B exposure is met
AND
B is clearly learnable / recovering
```

Use a maximum-session fallback so a user cannot become trapped in B indefinitely.

### A-return behaviour

The first A-return session begins with an A-only block before any mixing.

Store:

```text
A plateau reference from pre-B period
A first-return score
A within-return progression
```

Then move to `A_REOPEN`.

### A-reopen gate

The product should allow approximately one to two A-focused re-entry sessions or the node-configured equivalent.

Advance to `AB_MIXED` when any of the following is true:

```text
A clearly exceeds its previous local plateau;
OR
A shows a renewed positive learning trend after return;
OR
the maximum A-reopen exposure is reached.
```

The first two conditions are the preferred progression signal. The third prevents indefinite blocking.

The system may retain these raw values for future research, but the commercial UI should not label them as proof of transfer.

### Mixing

Only after A re-entry / reopened training should the engine start unpredictable A/B mixing.

Mixed practice should:

```text
select A or B at the trial/block granularity defined by the node;
avoid long predictable runs unless the game requires them;
preserve the same target operation;
continue normal adaptive difficulty within each wrapper.
```

## 4.5 Configurable progression contract

```ts
export interface WrapperProgressionConfig {
  minASessions: number;
  maxASessionsBeforeProbe: number;

  minBSessions: number;
  maxBSessions: number;

  minAReturnBlocks: number;
  maxAReopenSessions: number;

  plateauWindow: number;
  plateauTolerance: number;

  reopenDelta?: number;
  reopenSlopeMin?: number;

  mixedSelection: "trial" | "mini-block" | "block";
}
```

The defaults should be deliberately simple. Do not build a Bayesian transfer engine for Phase 1.

---

# 5. Principle 2 in production: Capacity → Strategy → Niche

Every node implements the same three-tier developmental structure.

```text
C_i = capacity / operation
S_i = strategy accessibility
N_i = niche implementation and environmental support
```

The node must keep the construct aligned across all three.

## 5.1 Capacity layer

The module supplies:

```text
game mechanics
adaptive rules
Wrapper A
Wrapper B
progression score
game-specific display metrics
```

The common platform supplies:

```text
session shell
wrapper progression
session persistence
pause / resume
completion screen
programme progress
```

## 5.2 Strategy layer

Each module supplies a compact strategy object:

```ts
export interface StrategyConfig {
  handle: string;
  explanation: string;

  targetCues: string[];
  antiCues: string[];

  workedExamples: StrategyExample[];
  changedExamples: StrategyExample[];
}
```

Example — Attention Control:

```text
HANDLE
"What information actually matters here?"

TARGET CUE
Several plausible details are competing for attention.

ANTI-CUE
The task requires broad exploration before any evidence can be prioritised.
```

The shared strategy engine supports:

```text
full explanation
→ compact handle
→ cue / anti-cue discrimination
→ reduced prompting
```

For Phase 1, strategy status may be limited to:

```text
not_started
learned
practising
```

No validated strategy-transfer score is required.

## 5.3 Niche / implementation layer

The niche is an active intervention target.

A mission should ask:

```text
Where will this matter?
What cue should trigger the strategy?
What will you actually do?
What environmental change could make this easier to use consistently?
```

The common niche-design options are:

```text
add a cue or reminder
change the workflow / order
protect some time
reduce competing information / interruptions
put the needed resource where it is visible
change the timing / schedule
improve feedback
change a tool / interface / default
no environmental change needed
```

A node may supply tailored examples, but the category list and UI are shared.

## 5.4 Circular developmental niche multiplier

The product architecture should support the intended circular loop:

```text
capacity develops
→ strategy becomes easier to select
→ niche is modified to support use
→ deployment becomes more frequent / reliable
→ real activity creates repeated structured practice
→ feedback refines strategy and capacity
↺
```

Phase 1 does **not** attempt to estimate this multiplier quantitatively.

It simply creates the conditions for the loop and records enough raw activity to support later analysis.

---

# 6. Mission engine

## 6.1 Mission creation

A mission is deliberately small.

```ts
export interface Mission {
  id: string;
  nodeId: NodeId;

  context: string;
  targetCue: string;
  intendedPolicy: string;

  nicheChangeType?: NicheChangeType;
  nicheChangeNote?: string;

  status: "planned" | "done" | "expired" | "reschedule";
  createdAt: string;
  dueAt?: string;
}
```

Suggested mission screen:

```text
TRY THIS IN REAL LIFE

Where?
[ During tomorrow's research session ]

When?
[ When several plausible claims compete for attention ]

Use:
"What information actually matters here?"

Make it easier:
[ Reduce interruptions ]

[ Save mission ]
```

## 6.2 Environmental redesign taxonomy

```ts
export type NicheChangeType =
  | "cue"
  | "workflow"
  | "protected-time"
  | "reduce-interference"
  | "resource-visibility"
  | "scheduling"
  | "feedback"
  | "tool-interface"
  | "none";
```

## 6.3 Mission check-in

Mission verification must remain brief.

When a mission is due, show:

```text
HOW DID IT GO?

1. Did the opportunity occur?
   Yes / No

2. Did you use the strategy?
   Yes / Partly / No

3. What was the effect?
   Helped
   No clear difference
   Made it harder
   Not sure

4. Did the environmental change help you use it?
   Yes
   No
   Didn't make one

Optional:
Anything worth remembering?
[ one-line note ]
```

If the opportunity did not occur:

```text
do not score failure;
offer Reschedule / Choose another context.
```

If the opportunity occurred but the strategy was not used, ask one extra item:

```text
What got in the way?

Forgot
Didn't notice the cue
Too busy / under pressure
Environment got in the way
Strategy didn't fit
Other
```

This can drive the next implementation recommendation:

```text
Forgot
→ stronger reminder / cue

Didn't notice the cue
→ sharpen cue definition

Environment got in the way
→ redesign niche support

Strategy didn't fit
→ revisit anti-cues / choose different context
```

Mission records are implementation feedback, not scientific proof of far transfer.

Call the table / object `mission_checkins`, not `transfer_outcomes`.

---

# 7. Principle 3 in Phase 1: mutualist network UI without causal measurement

The dashboard should expose the six nodes as one conceptual network while avoiding pseudo-scientific personalised network metrics.

## 7.1 Dashboard sections

The MVP dashboard contains three main areas:

```text
TODAY
MY NETWORK
G TRACK
```

### TODAY

Answers:

> What is the most useful next action?

Priority logic:

```text
1. due mission check-in
2. due / unfinished training session
3. current active node
4. user chooses any other unlocked node
```

Phase 1 should not use a mutualist optimisation algorithm to choose the next node.

Example:

```text
TODAY

Relational Memory
Continue training · ~15 min
[ Start ]

Attention Control
Mission check-in due
[ Check in ]
```

### MY NETWORK

Show the six nodes in a compact, fixed network.

Example layout:

```text
                 ATTENTION
                    ●

          RELATIONAL     BINDING
              ●             ○

        GENERATIVE       PREDICTIVE
             ○               ●

                 REASONING
                    ○
```

Legend:

```text
● owned / unlocked
○ locked
```

Neutral connecting lines may be shown to express the mutualist network concept. In Phase 1:

```text
edges have no thickness score;
edges have no personal causal interpretation;
edges do not imply measured M_ij;
edges should not animate as "stronger" after training.
```

Locked nodes remain visible as future parts of the network.

### G TRACK

G Track is the central external measurement surface.

Individual node apps show training progress. The dashboard shows independent G Track results.

```text
training performance ≠ external measurement
```

Example:

```text
G TRACK
Latest assessment: 8 Sep 2026

Attention               72
Relational Memory       64
Binding                  68
Predictive / Pattern     71
Reasoning                75

[ View full results ]
[ Take / retake G Track ]
```

Only display scores actually supported by the current G Track battery.

Do not manufacture a node score for a construct without a corresponding G Track measure.

## 7.2 Node card: minimal statistics

Clicking an unlocked node opens a compact status panel:

```text
RELATIONAL MEMORY

Programme
7 / 20 sessions

Training
Back to the original
or
Flexible practice

Strategy
Practising

Mission
1 pending

Last trained
Yesterday

[ Train now ]
```

Recommended Phase-1 node statistics:

```text
sessions completed
current wrapper phase
strategy status
mission status
last trained date
optional game-specific training metric
```

Do not show:

```text
transfer index
mutualist score
network centrality
synergy score
predicted g improvement
capacity multiplier
```

## 7.3 C / S / N node marker

A small three-part node status indicator may show:

```text
C  Capacity training state
S  Strategy state
N  Niche / mission state
```

This is a progress indicator, not a psychometric profile.

Candidate values:

```text
C: not-started / active / flexible-practice
S: not-started / learned / practising
N: none / planned / checked-in
```

---

# 8. G Track integration contract

G Track data belong to the platform-level measurement service rather than each training module.

A node manifest may provide zero or more G Track keys:

```ts
gTrackKeys?: string[];
```

The platform can then:

```text
show latest relevant external score on the central G Track panel;
link from a node to the relevant G Track details;
suggest a retest when the product schedule requires it.
```

Phase 1 should not automatically claim that a G Track change was caused by a training module.

The data model should preserve:

```text
assessment date
test / construct key
score
score metadata / scale version
source
```

---

# 9. Common module contract

## 9.1 Node IDs

```ts
export type NodeId =
  | "attention"
  | "relational-memory"
  | "binding-memory"
  | "predictive-mapping"
  | "generative-search"
  | "reasoning";
```

## 9.2 Node manifest

```ts
export interface IQMNodeModule {
  id: NodeId;

  title: string;
  shortTitle: string;
  shortDescription: string;

  estimatedSessionMinutes: number;
  programmeSessions?: number;

  game: GameAdapter;

  wrappers: {
    A: WrapperConfig;
    B: WrapperConfig;
  };

  progression: WrapperProgressionConfig;

  strategy: StrategyConfig;

  missions: MissionTemplate[];

  nicheExamples?: Partial<
    Record<NicheChangeType, string[]>
  >;

  gTrackKeys?: string[];

  entitlement: {
    productKey: string;
  };
}
```

## 9.3 Game adapter

Only game mechanics should need to vary substantially between nodes.

```ts
export interface GameAdapter {
  createSession(config: SessionConfig): GameSession;

  mount(container: HTMLElement): Promise<void> | void;
  start(): Promise<void> | void;
  pause?(): void;
  resume?(): void;
  destroy(): void;

  setWrapper(wrapper: "A" | "B"): void;

  getTrainingSummary(): TrainingSummary;
}
```

The game must not:

```text
own authentication
own purchase state
own dashboard routing
own mission persistence
own G Track storage
implement its own global theme
compute cross-node mutualism
```

## 9.4 Wrapper config

```ts
export interface WrapperConfig {
  id: string;
  publicName: string;
  description: string;

  invariant: string;
  surfaceChange: string;

  instructions: string;
}
```

## 9.5 Session config

```ts
export interface SessionConfig {
  nodeId: NodeId;
  sessionId: string;

  phase: WrapperPhase;

  wrapperMode:
    | "A"
    | "B"
    | "AB_MIXED";

  targetMinutes: number;
  seed?: string;
}
```

---

# 10. Recommended code structure

To minimise development overhead, use **one Vite application**, not a new Vite app for every node.

```text
apps/
  iqm-platform/
    index.html
    package.json
    vite.config.ts
    tsconfig.json

    src/
      app/
        bootstrap.ts
        router.ts
        dashboardController.ts

      core/
        auth/
        entitlements/
        progression/
        strategy/
        missions/
        gtrack/
        persistence/
        telemetry/

      modules/
        attention/
          module.ts
          content.ts
          wrappers.ts
          game/

        relational-memory/
          module.ts
          content.ts
          wrappers.ts
          game/

        binding-memory/
          module.ts
          content.ts
          wrappers.ts
          game/

        predictive-mapping/
          module.ts
          content.ts
          wrappers.ts
          game/

        generative-search/
          module.ts
          content.ts
          wrappers.ts
          game/

        reasoning/
          module.ts
          content.ts
          wrappers.ts
          game/

      ui/
        dashboard/
        network/
        game-shell/
        strategy/
        missions/
        gtrack/
        common/

      theme/
        tokens.css
        base.css
        components.css
        dashboard.css
        game-shell.css

      types/
        node.ts
        game.ts
        mission.ts
        progression.ts

    supabase/
      functions/
      migrations/

    tests/
      progression/
      module-contract/
      missions/
      entitlements/
      dashboard/
```

Existing games can initially remain in their current directories while being adapted into this contract. New node development should target `apps/iqm-platform/src/modules/...`.

---

# 11. Shared visual system

The common platform should preserve the current Cognitive Control / Cognitive Bandwidth visual language.

Canonical theme tokens should be extracted from the current CSS into `theme/tokens.css`.

Initial token set:

```css
:root {
  --iqm-cyan: #22aaff;
  --iqm-cyan-dark: #0086e6;
  --iqm-blue: #2764b7;
  --iqm-lime: #ccff66;

  --iqm-success: #83cf16;
  --iqm-error: #e94b55;

  --iqm-ink: #0d1730;
  --iqm-muted: #66788d;

  --iqm-soft: #f4f9fd;
  --iqm-border: #dce8f1;
  --iqm-surface: #ffffff;

  --iqm-shadow:
    0 16px 42px rgba(13, 23, 48, 0.09);
}
```

The shared shell owns:

```text
typography
page background
cards
buttons
progress bars
navigation
modals
dashboard layout
mission cards
network nodes
G Track cards
```

A node game may style its stimulus canvas / task-specific objects but should not redefine the global product visual language.

---

# 12. Entitlement model

The dashboard should be available as soon as the user has an IQ Mindware platform account / qualifying purchase.

Recommended entitlement record:

```text
user_id
node_id
status
source
product_key
activated_at
expires_at nullable
```

Candidate states:

```text
active
inactive
refunded
admin-granted
```

Purchases should map deterministically:

```text
Stripe product / price
→ product_key
→ node_id
→ entitlement.active
```

The dashboard reads entitlements and renders:

```text
unlocked node
locked node
```

Do not embed product entitlement rules inside game code.

---

# 13. Phase-1 data model

Keep the production schema small.

## 13.1 `profiles`

```text
user_id
created_at
display_name nullable
```

## 13.2 `entitlements`

```text
id
user_id
node_id
status
source
product_key
activated_at
expires_at nullable
```

## 13.3 `node_progress`

One row per user/node.

```text
user_id
node_id

sessions_completed

wrapper_phase
sessions_in_phase

a_plateau_reference nullable
b_current_reference nullable
a_return_reference nullable

strategy_status
mission_status

last_session_at
next_action

updated_at
```

The A/B reference values are product progression state, not displayed scientific transfer measures.

## 13.4 `training_sessions`

```text
id
user_id
node_id

game_version
protocol_version

wrapper_phase
wrapper_mode

started_at
completed_at

progression_score
valid_trials
display_metrics_json

raw_summary_json
```

Future-proof fields that should always be retained:

```text
node_id
session_id
game_version
wrapper / wrapper_mode
phase
timestamp
```

These make Phase-2 retrospective work possible without complicating the current product.

## 13.5 `missions`

```text
id
user_id
node_id

context
target_cue
intended_policy

niche_change_type
niche_change_note

status
created_at
due_at
completed_at
```

## 13.6 `mission_checkins`

```text
id
mission_id
user_id
node_id

opportunity_occurred
strategy_use
effect
environment_help

barrier nullable
note nullable

created_at
```

## 13.7 `gtrack_results`

If the G Track system remains in a separate database/service, this may instead be a read model / API integration.

Logical contract:

```text
user_id
assessment_id
test_key
construct_key
score
score_scale_version
taken_at
source
```

---

# 14. Common scheduler

The dashboard scheduler should remain simple.

For each user:

```text
IF mission check-in due
  surface check-in

ELSE IF active node has an unfinished / due session
  recommend that session

ELSE
  recommend last active unlocked node
```

If several nodes are unlocked:

```text
show one recommended action
+
allow user to open any unlocked node
```

Do not attempt Phase-1 automatic sequencing based on inferred network bottlenecks or mutualist leverage.

That can become a Personal CSI / Phase-2 feature later.

---

# 15. Common session shell

A game session should be rendered inside the same shared shell.

Candidate structure:

```text
HEADER
node title
session number
phase-friendly label

MAIN
game canvas / task

FOOTER
pause / quit where appropriate
minimal progress indicator
```

Post-session:

```text
training summary
next-step message

optionally:
strategy micro-lesson
mission prompt
mission check-in

return to dashboard
```

The shell should not expose scientific transfer terminology unless explicitly approved for consumer copy.

Prefer:

```text
New format
Back to the original
Building further
Flexible practice
```

over:

```text
entropy perturbation
construct-transfer probe
A-return uplift
mutualist multiplier
```

---

# 16. Strategy and mission cadence

A default 20-session product may use the following pattern, but progression remains adaptive.

```text
early programme
capacity emphasis + first strategy introduction

middle programme
A/B/A-reopen progression
strategy cue practice
first mission

later programme
A/B mixed practice
mission check-ins
second / refined niche mission
strategy reinforcement
```

The platform must allow each node to configure:

```text
strategy-introduction session range
mission-introduction session range
mission frequency
```

Do not hard-code one exact session number across all games if the game mechanics require different progression speeds.

---

# 17. Phase-1 statistics contract

## 17.1 Dashboard-level

Show:

```text
owned / locked nodes
sessions completed per node
current training phase
strategy status
mission status
last activity
latest G Track profile
```

## 17.2 Node-level

Show:

```text
programme progress
current phase
last training date
one or two meaningful game-specific metrics
strategy status
mission status
```

## 17.3 Do not show

```text
internal transfer composite
A-return causal claim
mutualism index
synergy index
causal network weight
developmental multiplier estimate
predicted IQ gain
```

---

# 18. Network visualisation rules

The network graphic is a product/navigation surface.

It is not a personalised scientific network model.

Rules:

```text
fixed node positions
neutral edges
owned nodes prominent
locked nodes ghosted
C/S/N progress visible if useful
click owned node → open module
click locked node → product information / purchase route
```

Avoid:

```text
thicker edges implying measured coupling
green/red causal arrows
network centrality rankings
"your bottleneck" labels based only on training
```

A later Phase-2 Personal CSI layer may replace neutral edges with evidence-qualified personalised relationships, but that is explicitly outside v1.

---

# 19. New-node release recipe

Once the shell exists, adding a node should follow this repeatable workflow.

## Step 1 — create module folder

```text
src/modules/<node>/
  module.ts
  content.ts
  wrappers.ts
  game/
```

## Step 2 — implement `GameAdapter`

Required:

```text
mount
start
destroy
setWrapper
getTrainingSummary
```

## Step 3 — define A and B

Document:

```text
same invariant
different surface representation
why A-specific shortcut should not solve B
```

## Step 4 — define progression config

Set:

```text
minimum A exposure
plateau tolerance
minimum / maximum B exposure
A-reopen allowance
mixed-selection granularity
```

## Step 5 — define strategy

Provide:

```text
handle
explanation
target cues
anti-cues
worked examples
changed examples
```

## Step 6 — define missions

Provide at least:

```text
3 generic mission templates
niche-design examples
1 low-friction default mission
```

## Step 7 — configure external measurement link

```text
gTrackKeys
```

where available.

## Step 8 — configure entitlement

```text
productKey
```

## Step 9 — run common contract tests

## Step 10 — release

No shared shell code should need to be rewritten for an ordinary new node.

---

# 20. Tests required before each node release

## Game contract

```text
mounts cleanly
starts and ends cleanly
destroys listeners/timers
Wrapper A works
Wrapper B works
summary is returned
progressionScore is bounded 0..1
```

## Progression

```text
A cannot jump straight to AB mixed
B precedes A return
A return precedes A reopen
A reopen precedes AB mixed
max-session fallbacks work
phase persists across login/device refresh
```

## Strategy

```text
handle loads
cue / anti-cue items render
status persists
```

## Mission

```text
mission can be created
environment option can be selected
check-in can be completed
no-opportunity path reschedules rather than fails
barrier branch works
```

## Entitlement

```text
locked node cannot launch game
active entitlement unlocks node
refund/inactive removes launch access safely
```

## Dashboard

```text
network renders six nodes
locked / unlocked state correct
Today card selects correct next action
G Track panel tolerates missing constructs
```

---

# 21. Migration from the current Cognitive Control / Cognitive Bandwidth app

Do not rewrite the existing working game mechanics first.

Use them as the donor implementation.

Recommended sequence:

```text
1. extract global CSS tokens and common UI primitives;
2. extract Supabase client / auth / persistence from game-specific code;
3. wrap the existing attention task in GameAdapter;
4. implement the shared progression engine;
5. map existing arrow and optic-flow / alternative wrapper mechanics into A and B;
6. implement A_RETURN and A_REOPEN before A/B mixing;
7. add strategy and mission engines;
8. create dashboard / entitlement shell;
9. migrate relational-memory game next;
10. add the remaining four nodes one at a time.
```

The current separate app directories may remain temporarily during migration.

The target end state is that new B2C node work happens inside `apps/iqm-platform`.

---

# 22. Phase-2 hooks — log now, analyse later

Phase 1 should make later research possible without burdening the product.

Therefore always preserve:

```text
node ID
game version
session ID
wrapper
phase
progression score
raw game summary
mission context
niche support selected
mission check-in
G Track assessment timestamps
```

Do not yet build:

```text
construct-transfer scoring engine
counterbalanced cohorts
held-out independent transfer battery
M_ij matrix
causal sequence experiments
```

A later research layer can consume the raw data under appropriate governance.

---

# 23. Precedence

For **commercial Phase-1 B2C implementation**, this specification governs common app architecture and progression.

It operationalises the scientific transfer framework in:

`Mindware-Lab/trident-g-ground-truth/protocols/IQ_Coach/TRIDENT_G_TRANSFER_MECHANISMS_v1.md`

Where older IQ-Coach implementation documents prescribe:

```text
random assignment to starting wrapper
percentage-based optic-flow starting cohorts
counterbalanced wrapper testing
displayed transfer composites
direct B → A/B mixing without an A-reopen stage
```

those behaviours are **not part of the Phase-1 common platform** unless explicitly reintroduced for a separate research build.

The commercial sequence is:

```text
A learn
→ B reconstruct
→ A return
→ A reopen / build further
→ A/B flexibilise
```

---

# 24. Phase-1 definition of done for the common platform

The common platform is ready to become the production base when:

```text
[ ] one shared Vite + TypeScript platform app exists
[ ] Supabase auth/persistence is shared
[ ] entitlement gating works
[ ] six node manifests can register with the dashboard
[ ] shared Cognitive Control Coach visual theme is extracted
[ ] dashboard has Today / My Network / G Track
[ ] network shows locked / unlocked nodes
[ ] generic GameAdapter contract works
[ ] A→B→A_RETURN→A_REOPEN→AB state machine works
[ ] strategy screens are generic
[ ] niche-design options are generic
[ ] mission creation is generic
[ ] mission check-in is generic
[ ] G Track results can be displayed centrally
[ ] one existing game has been migrated successfully
[ ] common contract tests pass
```

After that point, a new node should normally require only:

```text
task mechanics
+
A/B wrappers
+
strategy content
+
mission content
+
manifest / entitlement config
```

That is the operational definition of a reusable two-week-release framework.
