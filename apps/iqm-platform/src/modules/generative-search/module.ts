import type { IQMNodeModule } from "../../types/node";
import {
  GENERATIVE_SEARCH_MISSIONS,
  GENERATIVE_SEARCH_NICHE_EXAMPLES,
  GENERATIVE_SEARCH_STRATEGY,
} from "./content";
import { generativeSearchGameAdapter } from "./game/adapter";
import { GENERATIVE_SEARCH_WRAPPERS } from "./wrappers";

export const generativeSearchModule: IQMNodeModule = {
  id: "generative-search",
  title: "Generative Search",
  shortTitle: "Generative",
  shortDescription: "Generate distinct plausible alternatives before premature closure.",
  estimatedSessionMinutes: 15,
  programmeSessions: 20,
  game: generativeSearchGameAdapter,
  wrappers: GENERATIVE_SEARCH_WRAPPERS,
  progression: {
    minASessions: 3,
    maxASessionsBeforeProbe: 5,
    minBSessions: 1,
    maxBSessions: 2,
    minAReturnBlocks: 1,
    maxAReopenSessions: 2,
    plateauWindow: 3,
    plateauTolerance: 0.03,
    reopenDelta: 0.08,
    reopenSlopeMin: 0.04,
    mixedSelection: "block",
  },
  strategy: GENERATIVE_SEARCH_STRATEGY,
  missions: GENERATIVE_SEARCH_MISSIONS,
  nicheExamples: GENERATIVE_SEARCH_NICHE_EXAMPLES,
  entitlement: {
    productKey: "iqm_generative_search_v1",
  },
};
