import { describe, expect, it } from "vitest";
import {
  createInitialProgressionState,
  recordProgressionSession,
} from "../../src/core/progression/engine";
import type { WrapperProgressionConfig } from "../../src/types/progression";

const config: WrapperProgressionConfig = {
  minASessions: 3,
  maxASessionsBeforeProbe: 5,
  minBSessions: 2,
  maxBSessions: 2,
  minAReturnBlocks: 1,
  maxAReopenSessions: 2,
  plateauWindow: 3,
  plateauTolerance: 0.01,
  reopenDelta: 0.05,
  reopenSlopeMin: 0.02,
  mixedSelection: "mini-block",
};

function observation(score: number, wrapperMode: "A" | "B" | "AB_MIXED") {
  return {
    summary: { progressionScore: score, validTrials: 20 },
    wrapperMode,
    dataQualityAdequate: true,
  } as const;
}

describe("Phase-1 wrapper progression", () => {
  it("protects A return/reopen before mixed practice", () => {
    let state = createInitialProgressionState();

    state = recordProgressionSession(state, observation(0.55, "A"), config).state;
    expect(state.phase).toBe("A_TRAIN");

    for (const score of [0.62, 0.621, 0.619]) {
      state = recordProgressionSession(state, observation(score, "A"), config).state;
    }
    expect(state.phase).toBe("B_INTRO");

    state = recordProgressionSession(state, observation(0.4, "B"), config).state;
    expect(state.phase).toBe("B_RECOVERY");

    state = recordProgressionSession(state, observation(0.45, "B"), config).state;
    expect(state.phase).toBe("B_RECOVERY");

    state = recordProgressionSession(state, observation(0.52, "B"), config).state;
    expect(state.phase).toBe("A_RETURN");

    state = recordProgressionSession(state, observation(0.61, "A"), config).state;
    expect(state.phase).toBe("A_REOPEN");

    state = recordProgressionSession(state, observation(0.69, "A"), config).state;
    expect(state.phase).toBe("AB_MIXED");

    state = recordProgressionSession(state, observation(0.7, "AB_MIXED"), config).state;
    expect(state.phase).toBe("AB_MAINTENANCE");
  });

  it("uses maximum-exposure fallbacks without labelling them transfer", () => {
    const fallbackConfig = { ...config, plateauWindow: 4, maxASessionsBeforeProbe: 2 };
    let state = createInitialProgressionState();
    state = recordProgressionSession(state, observation(0.4, "A"), fallbackConfig).state;
    state = recordProgressionSession(state, observation(0.5, "A"), fallbackConfig).state;
    state = recordProgressionSession(state, observation(0.6, "A"), fallbackConfig).state;
    expect(state.phase).toBe("B_INTRO");
  });
});
