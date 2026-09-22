import type { AttentionRelation, AttentionTrial, Point } from "./trial";

export type AttentionStage =
  | "ready"
  | "fixation"
  | "stimulus"
  | "mask"
  | "response"
  | "feedback";

export const ATTENTION_DONOR_TIMING = Object.freeze({
  readyDelayMs: 350,
  fixationMs: 420,
  maskMs: 380,
  responseTimeoutMs: 2400,
  feedbackMs: 260,
});

const CENTER = 50;
const APERTURE_RADIUS = 9.4;
const DOTS_PER_APERTURE = 16;
const MASK_DOTS_PER_APERTURE = 24;

interface OpticFlowDot {
  x: number;
  y: number;
  r: number;
  opacity: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delayMs: number;
  durationMs: number;
  color: string;
}

interface OpticFlowAperture {
  index: number;
  x: number;
  y: number;
  radius: number;
  dots: OpticFlowDot[];
}

interface OpticMaskDot {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

interface OpticMaskAperture {
  index: number;
  x: number;
  y: number;
  radius: number;
  dots: OpticMaskDot[];
}

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalise(dx: number, dy: number): Point {
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function relationUnitVector(
  relation: AttentionRelation,
  x: number,
  y: number,
): Point {
  if (relation === "left") return { x: -1, y: 0 };
  if (relation === "right") return { x: 1, y: 0 };
  const radial = normalise(x - CENTER, y - CENTER);
  return relation === "out" ? radial : { x: -radial.x, y: -radial.y };
}

function positionInAperture(
  random: () => number,
  centerX: number,
  centerY: number,
): Point {
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(random()) * (APERTURE_RADIUS * 0.78);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

function opticFlowAperturesForTrial(trial: AttentionTrial): OpticFlowAperture[] {
  const random = mulberry32(hashSeed(`${trial.seed}:optic-flow:dots`));
  return trial.items.map((item, apertureIndex) => {
    const centerX = item.position.x;
    const centerY = item.position.y;
    const dots = Array.from({ length: DOTS_PER_APERTURE }, (_, dotIndex) => {
      const position = positionInAperture(random, centerX, centerY);
      const vector = relationUnitVector(item.relation, position.x, position.y);
      const travel = trial.frame === "absolute" ? 5.8 + random() * 1.6 : 5.2 + random() * 1.8;
      const halfTravel = travel / 2;
      return {
        x: position.x,
        y: position.y,
        r: 0.62 + random() * 0.38,
        opacity: 0.46 + random() * 0.34,
        fromX: clamp(position.x - vector.x * halfTravel, 1, 99),
        fromY: clamp(position.y - vector.y * halfTravel, 1, 99),
        toX: clamp(position.x + vector.x * halfTravel, 1, 99),
        toY: clamp(position.y + vector.y * halfTravel, 1, 99),
        delayMs: -Math.round((dotIndex % 8) * 92 + random() * 70),
        durationMs: trial.frame === "absolute" ? 780 : 900,
        color: "#1d56d8",
      };
    });
    return {
      index: apertureIndex,
      x: centerX,
      y: centerY,
      radius: APERTURE_RADIUS,
      dots,
    };
  });
}

function opticFlowMaskAperturesForTrial(trial: AttentionTrial): OpticMaskAperture[] {
  const random = mulberry32(hashSeed(`${trial.seed}:optic-flow:mask`));
  return trial.items.map((item, apertureIndex) => {
    const centerX = item.position.x;
    const centerY = item.position.y;
    const dots = shuffle(
      random,
      Array.from({ length: MASK_DOTS_PER_APERTURE }, () => {
        const position = positionInAperture(random, centerX, centerY);
        return {
          x: position.x,
          y: position.y,
          r: 0.8 + random() * 0.9,
          opacity: 0.38 + random() * 0.44,
        };
      }),
    );
    return {
      index: apertureIndex,
      x: centerX,
      y: centerY,
      radius: APERTURE_RADIUS,
      dots,
    };
  });
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function renderFixation(): string {
  return `<g class="fixation"><line x1="46.5" y1="50" x2="53.5" y2="50"/><line x1="50" y1="46.5" x2="50" y2="53.5"/></g>`;
}

function arrowPolygonPoints(): string {
  return "-5,-4 5,0 -5,4 -2,0";
}

function vectorAngleDegrees(vector: Point): number {
  return (Math.atan2(vector.y, vector.x) * 180) / Math.PI;
}

function diamondPolygonPoints(position: Point): string {
  const size = 7.2;
  return `${position.x},${position.y - size} ${position.x + size},${position.y} ${position.x},${position.y + size} ${position.x - size},${position.y}`;
}

function renderArrowStimulus(trial: AttentionTrial, stage: AttentionStage): string {
  const showFixation = stage === "ready" || stage === "fixation" || stage === "stimulus";
  const showArrows = stage === "stimulus";
  const showMasks = stage === "mask";
  const arrows = trial.items
    .map((item) => {
      const angle = vectorAngleDegrees(item.vector);
      return `<g transform="translate(${item.position.x} ${item.position.y}) rotate(${angle})"><polygon points="${arrowPolygonPoints()}" fill="currentColor" /></g>`;
    })
    .join("");
  const masks = trial.items
    .map((item) => `<polygon points="${diamondPolygonPoints(item.position)}" />`)
    .join("");

  return `<div class="stimulus-wrap" aria-label="Brief arrow display">
    <svg class="stimulus-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
      <circle cx="50" cy="50" r="34" class="orbit-line" />
      ${showArrows ? `<g class="stimulus-arrows">${arrows}</g>` : ""}
      ${showMasks ? `<g class="stimulus-masks">${masks}</g>` : ""}
      ${showFixation || trial.frame === "relational" ? renderFixation() : ""}
    </svg>
  </div>`;
}

function renderOpticFlowApertures(trial: AttentionTrial, clipRootId: string): string {
  return opticFlowAperturesForTrial(trial)
    .map((aperture) => {
      const clipId = `${clipRootId}-ap-${aperture.index}`;
      const dots = aperture.dots
        .map(
          (dot) => `<circle class="optic-dot" cx="${formatNumber(dot.x)}" cy="${formatNumber(dot.y)}" r="${formatNumber(dot.r)}" fill="${dot.color}" opacity="${formatNumber(dot.opacity)}">
            <animate attributeName="cx" values="${formatNumber(dot.fromX)};${formatNumber(dot.toX)}" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
            <animate attributeName="cy" values="${formatNumber(dot.fromY)};${formatNumber(dot.toY)}" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.14;${formatNumber(dot.opacity)};0.16" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
          </circle>`,
        )
        .join("");
      return `<defs><clipPath id="${clipId}"><circle cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" /></clipPath></defs>
        <circle class="optic-aperture-bg" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
        <g clip-path="url(#${clipId})"><g class="optic-dot-group">${dots}</g></g>`;
    })
    .join("");
}

function renderOpticFlowMaskApertures(trial: AttentionTrial, clipRootId: string): string {
  return opticFlowMaskAperturesForTrial(trial)
    .map((aperture) => {
      const clipId = `${clipRootId}-mask-${aperture.index}`;
      const dots = aperture.dots
        .map((dot) => {
          const size = dot.r * 1.75;
          const points = `${formatNumber(dot.x)},${formatNumber(dot.y - size)} ${formatNumber(dot.x + size)},${formatNumber(dot.y)} ${formatNumber(dot.x)},${formatNumber(dot.y + size)} ${formatNumber(dot.x - size)},${formatNumber(dot.y)}`;
          return `<polygon class="optic-mask-dot" points="${points}" opacity="${formatNumber(dot.opacity)}" />`;
        })
        .join("");
      return `<defs><clipPath id="${clipId}"><circle cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" /></clipPath></defs>
        <circle class="optic-aperture-bg" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
        <g clip-path="url(#${clipId})"><g class="optic-mask-field">${dots}</g></g>`;
    })
    .join("");
}

function emotionalFaceForTrial(trial: AttentionTrial): { emotion: "neutral" | "angry" | "afraid"; url: string } {
  const sequence = ["neutral", "angry", "neutral", "afraid"] as const;
  const emotion = sequence[trial.trialIndex % sequence.length];
  const identity = (trial.trialIndex % 4) + 1;
  const base = "https://www.iqmindware.com/synergy-iq/assets/stimuli/emotional-faces";
  return { emotion, url: `${base}/${emotion}_${identity}.png` };
}

function renderEmotionStimulus(trial: AttentionTrial, stage: AttentionStage): string {
  const showFixation = stage === "ready" || stage === "fixation" || stage === "stimulus";
  const showArrows = stage === "stimulus";
  const showMasks = stage === "mask";
  const face = emotionalFaceForTrial(trial);
  const arrows = trial.items
    .map((item) => {
      const angle = vectorAngleDegrees(item.vector);
      return `<g transform="translate(${item.position.x} ${item.position.y}) rotate(${angle})"><polygon points="${arrowPolygonPoints()}" fill="currentColor" /></g>`;
    })
    .join("");
  const masks = trial.items
    .map((item) => `<polygon points="${diamondPolygonPoints(item.position)}" />`)
    .join("");

  return `<div class="stimulus-wrap is-emotion" aria-label="Brief arrow display with irrelevant emotional face">
    ${stage === "stimulus" ? `<img class="emotion-face" src="${face.url}" alt="" aria-hidden="true" data-emotion="${face.emotion}" />` : ""}
    <svg class="stimulus-svg emotion-task-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
      <circle cx="50" cy="50" r="34" class="orbit-line" />
      ${showArrows ? `<g class="stimulus-arrows emotion-arrows">${arrows}</g>` : ""}
      ${showMasks ? `<g class="stimulus-masks">${masks}</g>` : ""}
      ${showFixation || trial.frame === "relational" ? renderFixation() : ""}
    </svg>
  </div>`;
}

function renderFlowStimulus(trial: AttentionTrial, stage: AttentionStage): string {
  const showFixation = stage === "ready" || stage === "fixation" || stage === "stimulus";
  const clipId = `optic-clip-${safeSvgId(trial.id)}`;
  return `<div class="stimulus-wrap is-flow" aria-label="Brief optic-flow display">
    <svg class="stimulus-svg optic-task-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
      <circle cx="50" cy="50" r="34" class="orbit-line" />
      ${stage === "stimulus" ? `<g class="optic-apertures">${renderOpticFlowApertures(trial, clipId)}</g>` : ""}
      ${stage === "mask" ? `<g class="optic-apertures is-mask">${renderOpticFlowMaskApertures(trial, clipId)}</g>` : ""}
      ${showFixation ? renderFixation() : ""}
    </svg>
  </div>`;
}

export function renderAttentionStimulus(
  trial: AttentionTrial,
  stage: AttentionStage,
): string {
  if (trial.carrier === "flow") return renderFlowStimulus(trial, stage);
  if (trial.carrier === "emotion") return renderEmotionStimulus(trial, stage);
  return renderArrowStimulus(trial, stage);
}
