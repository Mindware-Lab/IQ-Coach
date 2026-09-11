import type { WrapperMode } from "../../../types/game";

export type AttentionFrame = "absolute" | "relational";
export type AttentionCarrier = "arrow" | "flow";
export type AttentionRelation = "left" | "right" | "out" | "in";
export type AttentionRatio = "5:0" | "4:1" | "3:2";

export interface Point {
  x: number;
  y: number;
}

export interface AttentionStimulusItem {
  positionIndex: number;
  position: Point;
  relation: AttentionRelation;
  vector: Point;
}

export interface AttentionTrial {
  construct: "ACC";
  id: string;
  sessionId: string;
  trialIndex: number;
  wrapper: "A" | "B";
  carrier: AttentionCarrier;
  frame: AttentionFrame;
  ratio: AttentionRatio;
  exposureMs: number;
  majorityCount: 3 | 4 | 5;
  responseOptions: AttentionRelation[];
  correctResponse: AttentionRelation;
  items: AttentionStimulusItem[];
  seed: string;
}

const OCTAGON_POSITIONS: Point[] = [
  { x: 50, y: 12 },
  { x: 77, y: 23 },
  { x: 88, y: 50 },
  { x: 77, y: 77 },
  { x: 50, y: 88 },
  { x: 23, y: 77 },
  { x: 12, y: 50 },
  { x: 23, y: 23 },
];

const EXPOSURE_GRID_MS = [100, 150, 200, 300, 400, 500, 700, 1000, 1500] as const;
const RATIOS: AttentionRatio[] = ["5:0", "4:1", "3:2"];
const RATIO_COUNTS: Record<AttentionRatio, 3 | 4 | 5> = {
  "5:0": 5,
  "4:1": 4,
  "3:2": 3,
};

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(random: () => number, values: readonly T[]): T[] {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function radialVector(position: Point): Point {
  const dx = position.x - 50;
  const dy = position.y - 50;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function vectorForRelation(relation: AttentionRelation, position: Point): Point {
  if (relation === "left") return { x: -1, y: 0 };
  if (relation === "right") return { x: 1, y: 0 };
  const radial = radialVector(position);
  return relation === "out" ? radial : { x: -radial.x, y: -radial.y };
}

function relationOptions(frame: AttentionFrame): AttentionRelation[] {
  return frame === "absolute" ? ["left", "right"] : ["out", "in"];
}

function carrierForWrapper(wrapper: "A" | "B"): AttentionCarrier {
  return wrapper === "A" ? "arrow" : "flow";
}

export function wrapperForTrial(
  wrapperMode: WrapperMode,
  sessionSeed: string,
  trialIndex: number,
): "A" | "B" {
  if (wrapperMode === "A" || wrapperMode === "B") return wrapperMode;
  const random = mulberry32(hashSeed(`${sessionSeed}:wrapper:${trialIndex}`));
  return random() < 0.5 ? "A" : "B";
}

/**
 * ACC-only port of the donor Attention Coach majority-extraction generator.
 * There is deliberately no colour/binding field or BSE construct in this type.
 */
export function generateAttentionTrial(input: {
  sessionId: string;
  trialIndex: number;
  wrapper: "A" | "B";
  frame?: AttentionFrame;
  ratio?: AttentionRatio;
  exposureMs?: number;
}): AttentionTrial {
  const frame = input.frame ?? "absolute";
  const seed = `${input.sessionId}:${input.trialIndex}:ACC:${input.wrapper}:${frame}`;
  const random = mulberry32(hashSeed(seed));
  const ratio = input.ratio ?? RATIOS[Math.floor(random() * RATIOS.length)];
  const exposureMs = input.exposureMs ?? EXPOSURE_GRID_MS[Math.floor(random() * EXPOSURE_GRID_MS.length)];
  const majorityCount = RATIO_COUNTS[ratio];
  const options = relationOptions(frame);
  const majorityRelation = options[Math.floor(random() * options.length)];
  const minorityRelation = options.find((value) => value !== majorityRelation) ?? majorityRelation;
  const relations = shuffle(random, [
    ...Array<AttentionRelation>(majorityCount).fill(majorityRelation),
    ...Array<AttentionRelation>(5 - majorityCount).fill(minorityRelation),
  ]);
  const positions = shuffle(random, Array.from({ length: 8 }, (_, index) => index)).slice(0, 5);
  const items = positions.map((positionIndex, itemIndex) => {
    const position = OCTAGON_POSITIONS[positionIndex];
    const relation = relations[itemIndex];
    return {
      positionIndex,
      position,
      relation,
      vector: vectorForRelation(relation, position),
    };
  });

  return {
    construct: "ACC",
    id: `${input.sessionId}-${input.trialIndex}`,
    sessionId: input.sessionId,
    trialIndex: input.trialIndex,
    wrapper: input.wrapper,
    carrier: carrierForWrapper(input.wrapper),
    frame,
    ratio,
    exposureMs,
    majorityCount,
    responseOptions: options,
    correctResponse: majorityRelation,
    items,
    seed,
  };
}
