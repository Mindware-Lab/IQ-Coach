import type { IQMNodeModule } from "../../types/node";
import { attentionGameAdapter } from "./game/adapter";
import {
  ATTENTION_MISSIONS,
  ATTENTION_NICHE_EXAMPLES,
  ATTENTION_STRATEGY,
} from "./content";
import { ATTENTION_WRAPPERS } from "./wrappers";

export const ATTENTION_QA_SEQUENCE = ["A", "B", "A", "C", "A"] as const;

export const attentionModule: IQMNodeModule = {
  id: "attention",
  title: "Attention Control",
  shortTitle: "Attention",
  shortDescription: "Protect relevant information while resisting competing signals.",
  estimatedSessionMinutes: 5,
  programmeSessions: 5,
  game: attentionGameAdapter,
  wrappers: ATTENTION_WRAPPERS,
  progression: {
    minASessions: 3,
    maxASessionsBeforeProbe: 5,
    minBSessions: 1,
    maxBSessions: 2,
    minAReturnBlocks: 1,
    maxAReopenSessions: 2,
    plateauWindow: 3,
    plateauTolerance: 0.01,
    reopenDelta: 0.05,
    reopenSlopeMin: 0.02,
    mixedSelection: "mini-block",
  },
  strategy: ATTENTION_STRATEGY,
  missions: ATTENTION_MISSIONS,
  nicheExamples: ATTENTION_NICHE_EXAMPLES,
  entitlement: {
    productKey: "iqm_attention_control_v1",
  },
};
