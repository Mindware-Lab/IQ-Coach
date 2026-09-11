import type { MissionTemplate, NicheChangeType } from "../../types/mission";
import type { StrategyConfig } from "../../types/node";

export const GENERATIVE_SEARCH_STRATEGY: StrategyConfig = {
  handle: "What plausible alternative have I not yet considered?",
  explanation:
    "Generative Search is the deliberate expansion of a candidate set before evaluation closes it down. The portable policy is to notice when one explanation, option or route is dominating too early, deliberately generate structurally different alternatives, and only then move into evidence-based constraint and choice.",
  targetCues: [
    "You have only one plausible explanation for an uncertain outcome.",
    "You are stuck on one solution even though the problem is not solved.",
    "A high-stakes decision has a narrow option set.",
    "A familiar assumption is silently defining what counts as possible.",
  ],
  antiCues: [
    "The decision deadline has arrived and adequate alternatives have already been tested.",
    "The next step is evidence evaluation rather than further option generation.",
    "Generating more options would add material cost or risk without a plausible information benefit.",
  ],
  workedExamples: [
    {
      title: "Research interpretation",
      situation: "A result fits your preferred explanation, but several mechanisms could plausibly generate the same pattern.",
      usePolicy: true,
      explanation: "Generate at least two structurally different explanations before deciding what evidence would discriminate between them.",
    },
    {
      title: "Enough alternatives",
      situation: "Three options have already been compared against the relevant evidence and a decision deadline has arrived.",
      usePolicy: false,
      explanation: "More generation can become avoidance. Move from search to evaluation and commitment.",
    },
  ],
  changedExamples: [
    {
      title: "AI critique",
      situation: "An AI system proposes one polished plan and the presentation makes it feel inevitable.",
      usePolicy: true,
      explanation: "Generate alternatives that change the underlying assumption, resource allocation or sequence before comparing plans.",
    },
    {
      title: "Problem diagnosis",
      situation: "A recurring work problem is repeatedly attributed to the same person or cause.",
      usePolicy: true,
      explanation: "Generate alternative causal classes such as workflow, incentives, information, timing and interface before intervening.",
    },
  ],
};

export const GENERATIVE_SEARCH_MISSIONS: MissionTemplate[] = [
  {
    id: "generative-mission-two-alternatives",
    title: "Add two different alternatives",
    contextExample: "Use this during one real decision, diagnosis or planning task this week.",
    targetCue: "You notice that only one explanation or solution currently feels plausible.",
    intendedPolicy: "What plausible alternative have I not yet considered? Generate at least two structurally different alternatives before evaluating them.",
    suggestedNicheChanges: ["cue", "workflow", "protected-time"],
  },
  {
    id: "generative-mission-invert-assumption",
    title: "Invert one hidden assumption",
    contextExample: "Use this when a plan or process feels constrained by 'the way we have to do it'.",
    targetCue: "A rule or assumption is being treated as fixed without being tested.",
    intendedPolicy: "Name the assumption, reverse or remove it, and generate at least two workable alternatives under the new frame.",
    suggestedNicheChanges: ["resource-visibility", "workflow", "feedback"],
  },
  {
    id: "generative-mission-ai-alternatives",
    title: "Make AI widen the option set",
    contextExample: "Use this in one AI-assisted work, research or study task.",
    targetCue: "The first AI answer provides one confident route and you are tempted to accept it as the search space.",
    intendedPolicy: "Before evaluating the first answer, require at least three genuinely different candidate approaches or explanations.",
    suggestedNicheChanges: ["tool-interface", "cue", "workflow"],
  },
];

export const GENERATIVE_SEARCH_NICHE_EXAMPLES: Record<NicheChangeType, string[]> = {
  cue: ["Add 'What alternative am I missing?' to a decision template or notebook."],
  workflow: ["Separate option generation from option evaluation into two explicit steps."],
  "protected-time": ["Protect five minutes for alternative generation before a high-stakes commitment."],
  "reduce-interference": ["Hide rankings or preferred options until an initial candidate set has been generated."],
  "resource-visibility": ["Keep the current assumption and at least two alternative frames visible side by side."],
  scheduling: ["Generate alternatives before the meeting or deadline pressure narrows attention."],
  feedback: ["After the decision, note whether the chosen route came from the first idea or a later alternative."],
  "tool-interface": ["Use an AI prompt or worksheet that requires multiple candidate classes before recommendation."],
  none: ["No environmental change needed for this mission."],
};
