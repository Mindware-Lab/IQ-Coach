export type GenerativeFamily =
  | "FLUENCY_EXTENSION"
  | "CATEGORY_OR_PERSPECTIVE_SWITCHING"
  | "CONSTRAINT_INVERSION_OR_REFRAMING";

export interface GenerativePrompt {
  id: string;
  family: GenerativeFamily;
  situation: string;
  goal: string;
  constraint?: string;
  switchCue?: {
    afterResponses: number;
    cue: string;
  };
  prose: string;
}

export const GENERATIVE_PROMPTS: readonly GenerativePrompt[] = [
  {
    id: "box-reuse",
    family: "FLUENCY_EXTENSION",
    situation: "You have an empty cardboard box after moving house.",
    goal: "Generate useful new uses for it.",
    constraint: "Do not use it simply for storage.",
    prose: "You have an empty cardboard box after moving house. Generate as many useful new uses as you can, but do not use it simply for storage.",
  },
  {
    id: "waiting-time",
    family: "FLUENCY_EXTENSION",
    situation: "A service has a recurring ten-minute waiting period that cannot currently be removed.",
    goal: "Generate useful ways the waiting period could be used or experienced differently.",
    constraint: "Do not solve it by pretending the delay disappears.",
    prose: "A service has a recurring ten-minute waiting period that cannot currently be removed. Generate useful ways it could be used or experienced differently without pretending the delay disappears.",
  },
  {
    id: "focus-interruptions",
    family: "CATEGORY_OR_PERSPECTIVE_SWITCHING",
    situation: "Focused work is repeatedly interrupted.",
    goal: "Generate ways to reduce the cost of interruptions.",
    constraint: "The first responses may change behaviour or scheduling.",
    switchCue: {
      afterResponses: 3,
      cue: "Now switch perspective: generate alternatives that change the physical or digital environment rather than the person's behaviour.",
    },
    prose: "Focused work is repeatedly interrupted. Generate ways to reduce the cost of interruptions. After three responses, switch perspective and generate alternatives that change the physical or digital environment rather than the person's behaviour.",
  },
  {
    id: "study-stuck",
    family: "CATEGORY_OR_PERSPECTIVE_SWITCHING",
    situation: "A learner keeps rereading difficult material but understanding is not improving.",
    goal: "Generate alternative study approaches.",
    constraint: "Begin with changes the learner can make directly.",
    switchCue: {
      afterResponses: 3,
      cue: "Now switch perspective: generate alternatives that redesign the materials, environment or feedback rather than asking the learner to try harder.",
    },
    prose: "A learner keeps rereading difficult material but understanding is not improving. Generate alternative study approaches. After three responses, switch perspective and generate alternatives that redesign the materials, environment or feedback rather than asking the learner to try harder.",
  },
  {
    id: "meeting-assumption",
    family: "CONSTRAINT_INVERSION_OR_REFRAMING",
    situation: "A distributed team assumes an important coordination meeting must happen synchronously every week.",
    goal: "Preserve reliable coordination.",
    constraint: "Remove or reverse the assumption that the core coordination event must be a synchronous meeting.",
    prose: "A distributed team assumes an important coordination meeting must happen synchronously every week. Generate alternatives that preserve reliable coordination while removing or reversing the assumption that the core event must be a synchronous meeting.",
  },
  {
    id: "budget-assumption",
    family: "CONSTRAINT_INVERSION_OR_REFRAMING",
    situation: "A project is stuck because the team assumes progress requires a larger budget first.",
    goal: "Generate routes that create useful progress or information now.",
    constraint: "Invert the assumption that additional money must arrive before anything valuable can happen.",
    prose: "A project is stuck because the team assumes progress requires a larger budget first. Generate routes that create useful progress or information now by inverting the assumption that additional money must arrive before anything valuable can happen.",
  },
] as const;

export function promptsForSession(seed: string, count = 6): GenerativePrompt[] {
  const hash = Array.from(seed).reduce((value, character) => ((value * 31) ^ character.charCodeAt(0)) >>> 0, 2166136261);
  const offset = hash % GENERATIVE_PROMPTS.length;
  return Array.from({ length: Math.min(count, GENERATIVE_PROMPTS.length) }, (_, index) =>
    GENERATIVE_PROMPTS[(offset + index) % GENERATIVE_PROMPTS.length],
  );
}
