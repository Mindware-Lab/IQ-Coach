import type { MissionTemplate, NicheChangeType } from "../../types/mission";
import type { StrategyConfig } from "../../types/node";

export const ATTENTION_STRATEGY: StrategyConfig = {
  handle: "What information actually matters here?",
  explanation:
    "Attention Control is the ability to protect the signal or relation that matters while competing information is present. The portable policy is to identify the decision-relevant feature first, then resist being pulled toward fluent but irrelevant detail.",
  targetCues: [
    "Several plausible details are competing for attention.",
    "You are losing the main decision or question inside a large amount of information.",
    "A fluent explanation contains many details but only some bear on the conclusion.",
    "The relevant feature stays the same while the presentation format changes.",
  ],
  antiCues: [
    "The task requires broad exploration before evidence should be prioritised.",
    "You do not yet know which variables are relevant and narrowing early would create premature closure.",
    "The goal is deliberate idea generation rather than signal selection.",
  ],
  workedExamples: [
    {
      title: "Research appraisal",
      situation: "A paper reports many correlations, but only one variable directly tests the hypothesis you are evaluating.",
      usePolicy: true,
      explanation: "Identify the diagnostic variable first and keep the remaining findings in a supporting role.",
    },
    {
      title: "Idea generation",
      situation: "You are deliberately trying to generate as many plausible explanations as possible before evaluating them.",
      usePolicy: false,
      explanation: "This is an exploration phase. Narrow signal selection would be premature; Generative Search is the better policy.",
    },
  ],
  changedExamples: [
    {
      title: "AI output",
      situation: "An AI answer is polished and detailed, but you need to decide whether the central claim is actually supported.",
      usePolicy: true,
      explanation: "Separate the evidence-bearing claim and source from fluent filler before judging the answer.",
    },
    {
      title: "Meeting",
      situation: "Discussion branches into several side issues while one decision must be made before the meeting ends.",
      usePolicy: true,
      explanation: "Recover the decision-relevant relation and use it to organise the remaining discussion.",
    },
  ],
};

export const ATTENTION_MISSIONS: MissionTemplate[] = [
  {
    id: "attention-mission-ai-evidence",
    title: "Find the evidence-bearing claim",
    contextExample: "Use this during one AI-assisted research, writing or planning task.",
    targetCue: "A fluent answer contains several claims or details and you need to decide what is actually supported.",
    intendedPolicy: "What information actually matters here? Identify the evidence-bearing claim before evaluating the rest.",
    suggestedNicheChanges: ["reduce-interference", "resource-visibility", "feedback"],
  },
  {
    id: "attention-mission-decision",
    title: "Protect the central decision",
    contextExample: "Use this in one meeting, email thread or planning session.",
    targetCue: "Competing details begin to obscure the decision you actually need to make.",
    intendedPolicy: "State the single decision-relevant relation or evidence source before processing the surrounding detail.",
    suggestedNicheChanges: ["cue", "workflow", "reduce-interference"],
  },
  {
    id: "attention-mission-research",
    title: "Identify the diagnostic variable",
    contextExample: "Use this while reading one research paper, report or data summary.",
    targetCue: "Several results are interesting but only some directly bear on your question.",
    intendedPolicy: "Identify the variable or comparison that is diagnostic for the question before following secondary findings.",
    suggestedNicheChanges: ["protected-time", "resource-visibility", "tool-interface"],
  },
];

export const ATTENTION_NICHE_EXAMPLES: Record<NicheChangeType, string[]> = {
  cue: ["Put the current decision question at the top of the document or task view."],
  workflow: ["Write the target question before opening supporting sources."],
  "protected-time": ["Create a short interruption-free evidence-triage block."],
  "reduce-interference": ["Close unrelated tabs or mute notifications while identifying the relevant signal."],
  "resource-visibility": ["Keep the key criterion, hypothesis or decision rule visible while working."],
  scheduling: ["Do high-interference appraisal work when you are least fragmented."],
  feedback: ["After the decision, check whether the evidence you prioritised was actually diagnostic."],
  "tool-interface": ["Use highlighting or a two-column evidence/not-evidence layout."],
  none: ["No environment change needed for this mission."],
};
