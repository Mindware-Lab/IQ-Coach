import type { WrapperConfig } from "../../types/node";

export const GENERATIVE_SEARCH_WRAPPERS: { A: WrapperConfig; B: WrapperConfig } = {
  A: {
    id: "generative-search-prose-v1",
    publicName: "Prompt",
    description: "A compact natural-language prompt states the situation, goal and any constraint in one short instruction.",
    invariant: "Generate multiple distinct plausible alternatives under the stated goal and constraints without premature closure.",
    surfaceChange: "Information is presented as a single prose prompt.",
    instructions: "Read the prompt, then keep adding distinct alternatives until you deliberately decide to stop.",
  },
  B: {
    id: "generative-search-board-v1",
    publicName: "Prompt board",
    description: "The same situation, goal, constraint and switch cue are separated into a structured prompt board.",
    invariant: "Generate multiple distinct plausible alternatives under the stated goal and constraints without premature closure.",
    surfaceChange: "Equivalent prompt information is decomposed into labelled situation, goal, constraint and cue cards.",
    instructions: "Use the board to keep the goal and constraint visible while generating distinct alternatives.",
  },
};
