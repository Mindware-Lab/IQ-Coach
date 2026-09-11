import { describe, expect, it } from "vitest";
import {
  PHASE_PUBLIC_LABELS,
  wrapperModeForPhase,
} from "../../src/core/progression/session";
import type { WrapperPhase } from "../../src/types/progression";

const expected: Record<WrapperPhase, "A" | "B" | "AB_MIXED"> = {
  A_BASELINE: "A",
  A_TRAIN: "A",
  B_INTRO: "B",
  B_RECOVERY: "B",
  A_RETURN: "A",
  A_REOPEN: "A",
  AB_MIXED: "AB_MIXED",
  AB_MAINTENANCE: "AB_MIXED",
};

describe("shared phase-to-wrapper contract", () => {
  it("protects A return/reopen before mixed practice", () => {
    for (const [phase, wrapper] of Object.entries(expected)) {
      expect(wrapperModeForPhase(phase as WrapperPhase)).toBe(wrapper);
      expect(PHASE_PUBLIC_LABELS[phase as WrapperPhase]).toBeTruthy();
    }
    expect(wrapperModeForPhase("A_RETURN")).toBe("A");
    expect(wrapperModeForPhase("A_REOPEN")).toBe("A");
  });
});
