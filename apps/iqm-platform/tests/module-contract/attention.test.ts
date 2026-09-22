import { describe, expect, it } from "vitest";
import { ATTENTION_QA_SEQUENCE, attentionModule } from "../../src/modules/attention/module";
import {
  ATTENTION_DONOR_MIGRATION,
  donorConstructBelongsInAttention,
} from "../../src/modules/attention/migration";
import { generateAttentionTrial } from "../../src/modules/attention/game/trial";
import {
  ATTENTION_STAIRCASE,
  nextAttentionLevel,
} from "../../src/modules/attention/game/staircase";

describe("Attention node contract", () => {
  it("is a clean ACC-only node with distinct A/B wrappers", () => {
    expect(attentionModule.id).toBe("attention");
    expect(ATTENTION_DONOR_MIGRATION.includedConstruct).toBe("ACC");
    expect(donorConstructBelongsInAttention("ACC")).toBe(true);
    expect(donorConstructBelongsInAttention("BSE")).toBe(false);
    expect(attentionModule.wrappers.A.id).not.toBe(attentionModule.wrappers.B.id);
    expect(attentionModule.wrappers.A.invariant).toBe(attentionModule.wrappers.B.invariant);
    expect(attentionModule.wrappers.C?.invariant).toBe(attentionModule.wrappers.A.invariant);
    expect(ATTENTION_QA_SEQUENCE).toEqual(["A", "B", "A", "C", "A"]);
  });

  it("never generates binding fields in the Attention trial type", () => {
    const trial = generateAttentionTrial({
      sessionId: "attention-contract",
      trialIndex: 0,
      wrapper: "A",
      frame: "absolute",
      ratio: "4:1",
      exposureMs: 500,
    });
    expect(trial.construct).toBe("ACC");
    expect(trial.items.every((item) => !("color" in item))).toBe(true);
  });

  it("preserves adaptive difficulty and the C-S-N content contract", () => {
    expect(ATTENTION_STAIRCASE.length).toBeGreaterThan(5);
    expect(nextAttentionLevel(ATTENTION_STAIRCASE.length - 1, true)).toBe(ATTENTION_STAIRCASE.length - 1);
    expect(nextAttentionLevel(0, false)).toBe(0);
    expect(attentionModule.strategy.handle).toContain("information");
    expect(attentionModule.strategy.targetCues.length).toBeGreaterThan(0);
    expect(attentionModule.strategy.antiCues.length).toBeGreaterThan(0);
    expect(attentionModule.missions.length).toBeGreaterThanOrEqual(3);
  });
});
