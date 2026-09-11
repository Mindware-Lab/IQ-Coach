# IQ Mindware Game Instructions and Practice Chassis v1

**Status:** Phase-1 shared platform requirement  
**Date:** 11 September 2026  
**Applies to:** every IQ Mindware node game inside `apps/iqm-platform`  
**Companion:** `specs/IQM_B2C_NODE_PLATFORM_SPEC_v1.md`

## 1. Principle

A user must never be dropped directly into a scored/adaptive cognitive task without first being shown what to do and being given a short opportunity to practise the response rule.

The shared Train journey is therefore:

```text
TRAIN
→ TASK BRIEFING
→ CLEAR INSTRUCTIONS
→ GUIDED EXAMPLE
→ SHORT PRACTICE BLOCK
→ READY CHECK
→ FORMAL TRAINING BLOCKS
→ INTER-BLOCK FEEDBACK / BREAK
→ SESSION SUMMARY
```

This pattern is inherited from the original Cognitive Control Coach, which separated pre-task instructions, practice introduction and the scored task.

## 2. Instruction screen

Before the first formal block, show one fixed, non-scrolling instruction screen containing only the information required to perform the task.

Required content:

- the task goal in one sentence;
- what the user should look for / generate / remember / predict;
- the response rule;
- one clear visual or worked example where useful;
- what changes with difficulty;
- what does **not** matter;
- whether speed matters, accuracy matters, or both;
- a clear `Practice` action.

Avoid theoretical explanation on this screen. Strategy / transfer teaching belongs in the separate **Use** layer.

## 3. Practice block

Practice is a distinct mode from formal training.

Default pattern:

```text
4–6 easy trials
or
one short guided micro-round for open-response tasks
```

Node modules may override the count where task mechanics require it, but practice should normally last well under two minutes.

Practice must:

- use deliberately easy / legible conditions;
- provide immediate explanatory feedback;
- verify that the response mapping is understood;
- allow a repeat when performance suggests misunderstanding;
- use the same physical task window as formal training;
- not affect the user's persistent adaptive level;
- not contribute to progression, G Track, scientific claims, or commercial outcome metrics;
- be logged separately, if logged at all, as `practice` rather than `training`.

A suggested comprehension rule for forced-choice tasks is approximately 3 correct responses out of 4 very-easy practice trials before recommending formal training. This is a UX safeguard, not a psychometric threshold, and node-specific implementations may use a different rule.

## 4. When practice is required

Practice should be mandatory when:

- the user encounters a node for the first time;
- Wrapper B / a materially different task representation is introduced for the first time;
- response controls or rules change;
- a long gap makes the task unfamiliar enough that a refresher is warranted;
- the user explicitly chooses `Practise first`.

Practice need not be mandatory before every routine session. Returning users should normally see a compact reminder with:

```text
Start session
Practise first
Instructions
```

The platform may remember that a user has completed practice for a given version of a wrapper/rule set.

## 5. Wrapper changes

Horizontal-transfer engineering must not create avoidable instruction errors.

When a wrapper changes surface form but preserves an invariant operation:

```text
show what changed
→ restate what stays the same
→ provide a short wrapper-specific practice block
→ start formal recovery training
```

Example for Attention Control:

```text
Wrapper A: static direction carriers
Wrapper B: optic-flow direction carriers
Invariant: identify the majority direction while resisting irrelevant competitors
```

The wrapper-B practice block confirms that the user understands the new carrier before any dip/recovery interpretation is made.

## 6. Formal training blocks

Formal sessions should be decomposed into short blocks rather than one uninterrupted long task where the node mechanics allow it.

Default UX target:

```text
brief block
→ concise feedback
→ short pause / continue
→ next block
```

The exact trial count and duration are node-specific. Short blocks serve three purposes:

1. reduce avoidable fatigue and loss of task set;
2. provide natural places for adaptive updates and wrapper transitions;
3. make the session feel bounded and comprehensible.

Inter-block feedback should be concise and operational. It may report current task performance or the next challenge but should not make far-transfer, IQ or mutualist claims.

## 7. Fixed task geometry

Instructions, practice, stimulus presentation, response and feedback must all respect the shared fixed-viewport rule.

Within a game:

- practice and formal task windows use the same outer geometry;
- stimulus → mask → response → feedback must not resize the game frame;
- controls occupy reserved regions rather than pushing the task canvas around;
- long explanations are paged before the game, not inserted into the task window;
- no game state should require document scrolling.

## 8. Node-module contract extension

Each `IQMNodeModule` should eventually expose versioned instruction/practice metadata such as:

```ts
interface TaskInstructionConfig {
  goal: string;
  lookFor: string;
  responseRule: string;
  speedAccuracyNote: string;
  difficultyNote?: string;
  ignoreNote?: string;
  example?: TaskInstructionExample;
}

interface PracticeConfig {
  version: string;
  requiredOnFirstUse: boolean;
  requiredOnFirstWrapperB: boolean;
  defaultTrialCount?: number;
  estimatedSeconds?: number;
}
```

The game adapter may implement node-specific practice mechanics, but the platform shell owns the common instruction → practice → formal-session navigation.

## 9. Attention Control instantiation

Before formal Attention training, the user should be told clearly:

```text
Goal: identify the direction shown by the majority.
Ignore: the minority items pointing elsewhere.
Respond: choose the majority direction after the display disappears.
Priority: be accurate; respond promptly once the choices appear.
```

Practice should use an easy majority ratio and generous exposure. Immediate feedback should identify the correct majority direction.

When optic flow is first introduced, show a fresh instruction screen explaining that the visual carrier has changed from static arrows to motion, while the underlying operation remains the same, followed by a short optic-flow practice block.

## 10. Generative Search instantiation

Before formal Generative Search, explain:

```text
Goal: generate several distinct plausible alternatives before evaluating them.
Do: enter one alternative at a time.
Do not: spend the round defending or ranking the first idea.
When a switch cue appears: deliberately change category, perspective or framing.
```

Practice should be a short guided prompt rather than a long 90-second scored round. It should demonstrate:

- what counts as another response;
- what an obvious duplicate looks like;
- how a switch cue changes the requested search direction;
- how to submit an answer and continue.

Practice responses are not included in the formal component profile.

## 11. Acceptance criterion

A node is not ready for human playability QA if clicking `Train` immediately launches the formal task without a clear instruction screen and a short practice route for first use / new wrappers.
