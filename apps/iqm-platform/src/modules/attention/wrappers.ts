import type { WrapperConfig } from "../../types/node";

export const ATTENTION_WRAPPERS: { A: WrapperConfig; B: WrapperConfig; C: WrapperConfig } = {
  A: {
    id: "attention-arrow-absolute-v1",
    publicName: "Static directions",
    description: "Brief static arrow patterns requiring rapid extraction of the majority direction.",
    invariant: "Identify the response-relevant majority relation while resisting competing items.",
    surfaceChange: "Static arrow carriers with a simple left/right response frame.",
    instructions: "Find the direction shown by most of the arrows.",
  },
  B: {
    id: "attention-flow-polar-v1",
    publicName: "Motion directions",
    description: "Local optic-flow apertures carrying the same majority-direction decision in motion.",
    invariant: "Identify the response-relevant majority relation while resisting competing items.",
    surfaceChange: "Motion-dot carriers replace static arrows while preserving the majority relation.",
    instructions: "Find whether most of the moving patterns travel IN or OUT.",
  },
  C: {
    id: "attention-emotion-polar-v1",
    publicName: "Emotional distraction",
    description: "The same polar majority task with a task-irrelevant emotional face competing for attention.",
    invariant: "Identify the response-relevant majority relation while resisting competing items.",
    surfaceChange: "A neutral, angry or afraid face is added as irrelevant visual salience; it never predicts the correct answer.",
    instructions: "Ignore the face. Use the arrows to decide whether the majority point IN or OUT.",
  },
};
