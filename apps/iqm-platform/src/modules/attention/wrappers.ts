import type { WrapperConfig } from "../../types/node";

export const ATTENTION_WRAPPERS: { A: WrapperConfig; B: WrapperConfig } = {
  A: {
    id: "attention-arrow-absolute-v1",
    publicName: "Static directions",
    description: "Brief static arrow patterns requiring rapid extraction of the majority direction.",
    invariant: "Identify the response-relevant majority relation while resisting competing items.",
    surfaceChange: "Static arrow carriers with a simple left/right response frame.",
    instructions: "Find the direction shown by most of the arrows.",
  },
  B: {
    id: "attention-flow-absolute-v1",
    publicName: "Motion directions",
    description: "Local optic-flow apertures carrying the same majority-direction decision in motion.",
    invariant: "Identify the response-relevant majority relation while resisting competing items.",
    surfaceChange: "Motion-dot carriers replace static arrows while preserving the majority-direction operation.",
    instructions: "Find the direction shown by most of the moving patterns.",
  },
};
