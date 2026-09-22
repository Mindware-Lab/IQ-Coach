import { describe, expect, it } from "vitest";
import { generateAttentionTrial } from "../../src/modules/attention/game/trial";
import {
  ATTENTION_DONOR_TIMING,
  renderAttentionStimulus,
} from "../../src/modules/attention/game/stimulus";

describe("Attention donor stimulus fidelity", () => {
  it("keeps five unique locations on the donor eight-position octagon", () => {
    const trial = generateAttentionTrial({
      sessionId: "geometry-a",
      trialIndex: 0,
      wrapper: "A",
      frame: "absolute",
      ratio: "4:1",
      exposureMs: 500,
    });
    const ids = trial.items.map((item) => item.positionIndex);
    expect(trial.items).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(ids.every((id) => id >= 0 && id <= 7)).toBe(true);
  });

  it("renders the donor orbit, polygon arrows, fixation and five-item mask", () => {
    const trial = generateAttentionTrial({
      sessionId: "render-a",
      trialIndex: 1,
      wrapper: "A",
      frame: "absolute",
      ratio: "5:0",
      exposureMs: 700,
    });
    const stimulus = renderAttentionStimulus(trial, "stimulus");
    const mask = renderAttentionStimulus(trial, "mask");
    expect(stimulus).toContain('cx="50" cy="50" r="34" class="orbit-line"');
    expect(stimulus.match(/points="-5,-4 5,0 -5,4 -2,0"/g)?.length).toBe(5);
    expect(stimulus).toContain('class="fixation"');
    expect(mask.match(/<polygon points=/g)?.length).toBe(5);
  });

  it("renders five donor optic-flow apertures with 16 dots each and 24-dot masks", () => {
    const trial = generateAttentionTrial({
      sessionId: "render-b",
      trialIndex: 2,
      wrapper: "B",
      frame: "absolute",
      ratio: "3:2",
      exposureMs: 500,
    });
    const stimulus = renderAttentionStimulus(trial, "stimulus");
    const mask = renderAttentionStimulus(trial, "mask");
    expect(stimulus.match(/class="optic-aperture-bg"/g)?.length).toBe(5);
    expect(stimulus.match(/class="optic-dot"/g)?.length).toBe(80);
    expect(stimulus).toContain('<animate attributeName="cx"');
    expect(mask.match(/class="optic-mask-dot"/g)?.length).toBe(120);
  });

  it("renders an irrelevant emotional face while preserving the polar arrow task", () => {
    const trial = generateAttentionTrial({
      sessionId: "render-c",
      trialIndex: 3,
      wrapper: "C",
      frame: "relational",
      ratio: "4:1",
      exposureMs: 500,
    });
    const stimulus = renderAttentionStimulus(trial, "stimulus");
    expect(trial.responseOptions).toEqual(["out", "in"]);
    expect(stimulus).toContain('class="emotion-face"');
    expect(stimulus.match(/points="-5,-4 5,0 -5,4 -2,0"/g)?.length).toBe(5);
    expect(stimulus).toContain('data-emotion="afraid"');
  });

  it("locks the donor presentation timings", () => {
    expect(ATTENTION_DONOR_TIMING).toEqual({
      readyDelayMs: 350,
      fixationMs: 420,
      maskMs: 380,
      responseTimeoutMs: 2400,
      feedbackMs: 260,
    });
  });
});
