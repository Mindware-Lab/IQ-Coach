import type { WrapperConfig } from "../../types/node";

export const ATTENTION_WRAPPERS: { A: WrapperConfig; B: WrapperConfig; C: WrapperConfig } = {
  A: {
    // Retain the legacy identifier; this edit corrects display copy, not stored history.
    id: "attention-arrow-absolute-v1",
    publicName: "Static / Polar",
    description: "Brief radial arrow patterns requiring rapid extraction of the IN / OUT majority.",
    invariant: "Identify the response-relevant majority relation while resisting competing items.",
    surfaceChange: "Static arrows point towards or away from the centre. The response frame is IN / OUT, not left/right.",
    instructions: "Find whether most arrows point IN towards the centre or OUT away from it.",
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
