export interface SignalItem {
  id: string;
  text: string;
  relevant: boolean;
}

export interface SignalCase {
  id: string;
  title: string;
  goal: string;
  items: SignalItem[];
  aiSuggestion?: string[];
}

export const ATTENTION_AI_PRACTICE_CASE: SignalCase = {
  id: "attention-find-signal-practice-v1",
  title: "Find the signal",
  goal: "Decide whether the project-planning tool improved the pilot enough to justify extending it.",
  items: [
    { id: "a", text: "Median task-completion time fell by 12% during the pilot.", relevant: true },
    { id: "b", text: "The vendor changed the colour of its logo during the pilot.", relevant: false },
    { id: "c", text: "Rework caused by planning errors rose by 8% during the pilot.", relevant: true },
    { id: "d", text: "The vendor was founded in 2014.", relevant: false },
    { id: "e", text: "Staff spent 18 extra minutes per case checking the tool's output.", relevant: true },
  ],
  // Deliberately contains one false positive (b) and one omission (c).
  aiSuggestion: ["a", "b", "e"],
};

export const ATTENTION_AI_CHECK_CASE: SignalCase = {
  id: "attention-find-signal-check-v1",
  title: "Fresh independent check",
  goal: "Decide whether AI drafting reduced the total human effort needed to produce an acceptable report.",
  items: [
    { id: "a", text: "First-draft writing time fell by 22 minutes per report.", relevant: true },
    { id: "b", text: "The model used in the pilot was released in March.", relevant: false },
    { id: "c", text: "Verification added 11 minutes per report.", relevant: true },
    { id: "d", text: "Downstream corrections added 7 minutes per report.", relevant: true },
    { id: "e", text: "The report template used a new heading font.", relevant: false },
  ],
};

export function signalSelectionScore(signalCase: SignalCase, selection: ReadonlySet<string>): {
  hits: number;
  falsePositives: number;
  misses: number;
  exact: boolean;
} {
  let hits = 0;
  let falsePositives = 0;
  let misses = 0;
  for (const item of signalCase.items) {
    const selected = selection.has(item.id);
    if (item.relevant && selected) hits += 1;
    if (!item.relevant && selected) falsePositives += 1;
    if (item.relevant && !selected) misses += 1;
  }
  return { hits, falsePositives, misses, exact: falsePositives === 0 && misses === 0 };
}
