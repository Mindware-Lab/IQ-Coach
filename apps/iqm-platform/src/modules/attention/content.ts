import type { MissionTemplate, NicheChangeType } from "../../types/mission";
import type { NodeJourneyConfig, StrategyConfig } from "../../types/node";



export const ATTENTION_JOURNEY: NodeJourneyConfig = {
  chapterNumber: "01",
  chapterTitle: "Signal",
  humanQuestion: "What matters now?",
  worldviewHook:
    "The world is very good at making things feel important. Attention Control is the ability to distinguish what is salient from what is relevant to the goal you actually own.",
  portableMove: "Pause. Find the signal. Commit.",
  abstractRationale:
    "The game is abstract on purpose. First train the operation without feeds, meetings, messages or AI output getting in the way; then carry the same move into changed surfaces and real situations.",
  beats: {
    anchor: {
      id: "anchor",
      shortLabel: "Find the signal",
      title: "Find the signal",
      copy:
        "Learn the core operation cleanly: identify the majority relation, resist the competitors and commit once the relevant signal is clear.",
      debriefTitle: "You trained signal selection",
      debriefCopy:
        "The useful move was not staring harder. You identified which information determined the answer, resisted competing signals and committed to a response.",
    },
    perturb: {
      id: "perturb",
      shortLabel: "New surface",
      title: "Same skill. Different world.",
      copy:
        "The surface changes from static arrows to optic flow. Your job is not to learn a new trick; it is to recover the same relevant relation in a changed environment.",
      debriefTitle: "The surface changed. The relation survived.",
      debriefCopy:
        "Adaptive intelligence has to carry useful structure across change. Motion changed the carrier, but the IN / OUT majority relation remained the thing that mattered.",
    },
    return: {
      id: "return",
      shortLabel: "Recover",
      title: "Can you recover it?",
      copy:
        "Change is only half the test. Return to the stable task and recover the same operation without treating the detour as a completely new problem.",
      debriefTitle: "You practised recovery",
      debriefCopy:
        "You returned to the original surface after a perturbation. Recovery matters because useful cognition has to remain available after conditions change.",
    },
    salience: {
      id: "salience",
      shortLabel: "Relevance",
      title: "What grabs attention is not always what deserves it.",
      copy:
        "Faces will compete for processing, but they contain no information needed for the decision. Salience is not the same thing as relevance.",
      debriefTitle: "You separated salience from relevance",
      debriefCopy:
        "Something can be vivid, emotional or compelling without changing the answer. The adaptive move is to keep the goal-owned signal in control.",
    },
    bank: {
      id: "bank",
      shortLabel: "Bank",
      title: "Bank the skill",
      copy:
        "Return once more to the stable task. The aim is not just to perform again, but to leave with a portable rule you can recognise outside the game.",
      debriefTitle: "Now take the operation outside",
      debriefCopy:
        "A training score is only one layer. The next step is to use the same signal-selection rule in a real setting, let the world answer and keep what proves useful.",
    },
  },
  realityPrompt:
    "Choose one real situation where competing information could pull you away from the goal. Name the signal you need to protect and one environmental change that will make the move easier to use.",
  bankPrompt:
    "Turn what survived into a reusable rule: when this cue appears, what will you do, and why is that the useful move?",
};

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
