import "./styles.css";
import type {
  GameAdapter,
  GameCompleteHandler,
  GameSession,
  SessionConfig,
  TrainingSummary,
} from "../../../types/game";
import {
  generateAttentionTrial,
  wrapperForTrial,
  type AttentionRelation,
  type AttentionTrial,
} from "./trial";
import {
  INITIAL_ATTENTION_LEVEL,
  attentionConditionForLevel,
  nextAttentionLevel,
  normalisedAttentionLevel,
} from "./staircase";
import {
  ATTENTION_DONOR_TIMING,
  renderAttentionStimulus,
  type AttentionStage,
} from "./stimulus";

type AttentionWrapper = "A" | "B" | "C";
type PayoffRegime = "CAPACITY" | "PRECISION" | "BALANCED" | "SPEED";
type EmotionCategory = "neutral" | "angry" | "afraid" | null;

interface AttentionResult {
  correct: boolean;
  rtMs: number | null;
  wrapper: AttentionWrapper;
  level: number;
  emotion: EmotionCategory;
}

const BLOCKS_PER_SESSION = 12;
const TRIALS_PER_BLOCK = 2;
const TRIALS_PER_SESSION = BLOCKS_PER_SESSION * TRIALS_PER_BLOCK;
const SFX_STORAGE_KEY = "iqm-platform:attention-sfx:v1";
function sfxBasePath(): string {
  if (typeof window === "undefined") return "/assets/sfx/attention-control";
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "https://www.iqmindware.com/assets/sfx/attention-control"
    : "/assets/sfx/attention-control";
}

const SFX: Record<string, { file: string; gain: number }> = {
  correct: { file: "correct.mp3", gain: 0.85 },
  incorrect: { file: "incorrect.mp3", gain: 0.85 },
  streak: { file: "streak.mp3", gain: 1.0 },
  capacity: { file: "capacity_advance.mp3", gain: 1.0 },
  regime: { file: "regime_change.mp3", gain: 0.95 },
  breakout: { file: "breakout.mp3", gain: 1.0 },
  complete: { file: "session_complete.mp3", gain: 1.0 },
};

function relationLabel(relation: AttentionRelation): string {
  if (relation === "left") return "Left";
  if (relation === "right") return "Right";
  if (relation === "out") return "Out";
  return "In";
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}

function accuracyOf(results: AttentionResult[]): number {
  return results.length ? results.filter((result) => result.correct).length / results.length : 0;
}

function emotionForTrialIndex(index: number): EmotionCategory {
  const sequence: Exclude<EmotionCategory, null>[] = ["neutral", "angry", "neutral", "afraid"];
  return sequence[index % sequence.length];
}

function blockNumberForTrial(trialIndex: number): number {
  return Math.floor(trialIndex / TRIALS_PER_BLOCK) + 1;
}

function regimeForBlock(blockNumber: number): PayoffRegime {
  if (blockNumber <= 6) return "CAPACITY";
  if (blockNumber <= 8) return "PRECISION";
  if (blockNumber <= 10) return "BALANCED";
  return "SPEED";
}

function regimeCopy(regime: PayoffRegime): string {
  if (regime === "CAPACITY") return "Build capacity";
  if (regime === "PRECISION") return "Precision";
  if (regime === "SPEED") return "Speed";
  return "Balanced";
}

export class AttentionGameAdapter implements GameAdapter {
  private session: GameSession | null = null;
  private container: HTMLElement | null = null;
  private wrapper: AttentionWrapper = "A";
  private trialIndex = 0;
  private results: AttentionResult[] = [];
  private stageTimer: number | null = null;
  private responseStartedAt = 0;
  private paused = false;
  private activeTrial: AttentionTrial | null = null;
  private activeLevel = INITIAL_ATTENTION_LEVEL;
  private lockedPolicyLevel: number | null = null;
  private stage: AttentionStage = "ready";
  private feedback: "correct" | "incorrect" | "" = "";
  private streak = 0;
  private lastAnnouncedRegime: PayoffRegime | null = null;
  private levels: Record<AttentionWrapper, number> = {
    A: INITIAL_ATTENTION_LEVEL,
    B: INITIAL_ATTENTION_LEVEL,
    C: INITIAL_ATTENTION_LEVEL,
  };
  private completeHandler: GameCompleteHandler | null = null;
  private sfxEnabled = true;
  private sfxMasterGain = 0.75;

  private readonly keyHandler = (event: KeyboardEvent): void => {
    if (this.stage !== "response" || !this.activeTrial) return;
    const key = event.key.toLowerCase();
    if (key === "f" || key === "1") {
      event.preventDefault();
      this.answerTrial(this.activeTrial.responseOptions[0] ?? null);
    } else if (key === "j" || key === "2") {
      event.preventDefault();
      this.answerTrial(this.activeTrial.responseOptions[1] ?? null);
    }
  };

  createSession(config: SessionConfig): GameSession {
    if (config.nodeId !== "attention") {
      throw new Error("AttentionGameAdapter only accepts the attention node.");
    }
    this.session = { id: config.sessionId, config };
    this.wrapper = config.wrapperMode === "B" ? "B" : config.wrapperMode === "C" ? "C" : "A";
    return this.session;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.container.classList.add("attention-game");
    this.loadSoundPreference();
    window.addEventListener("keydown", this.keyHandler);
    this.preloadSfx();
    this.renderIdle();
  }

  start(): void {
    if (!this.session || !this.container) {
      throw new Error("Create and mount an Attention session before starting.");
    }
    this.clearTimer();
    this.trialIndex = 0;
    this.results = [];
    this.levels = { A: INITIAL_ATTENTION_LEVEL, B: INITIAL_ATTENTION_LEVEL, C: INITIAL_ATTENTION_LEVEL };
    this.activeTrial = null;
    this.lockedPolicyLevel = null;
    this.feedback = "";
    this.streak = 0;
    this.lastAnnouncedRegime = null;
    this.paused = false;
    if (this.wrapper === "B" || this.wrapper === "C") this.playSfx("breakout");
    this.beginTrial();
  }

  pause(): void {
    this.paused = true;
    this.clearTimer();
    if (this.container) {
      this.container.innerHTML = `<div class="attention-message"><strong>Paused</strong><span>Resume when you are ready.</span></div>`;
    }
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.activeTrial = null;
    this.beginTrial();
  }

  destroy(): void {
    this.clearTimer();
    window.removeEventListener("keydown", this.keyHandler);
    if (this.container) {
      this.container.innerHTML = "";
      this.container.classList.remove("attention-game");
    }
    this.container = null;
    this.session = null;
    this.results = [];
    this.trialIndex = 0;
    this.activeTrial = null;
    this.completeHandler = null;
  }

  setWrapper(wrapper: AttentionWrapper): void {
    this.wrapper = wrapper;
  }

  onComplete(handler: GameCompleteHandler | null): void {
    this.completeHandler = handler;
  }

  getTrainingSummary(): TrainingSummary {
    const validTrials = this.results.length;
    const accuracy = accuracyOf(this.results);
    const responseTimes = this.results
      .map((result) => result.rtMs)
      .filter((value): value is number => value !== null);
    const medianRt = median(responseTimes);
    const averageLevel = mean(this.results.map((result) => result.level));
    const progressionScore = Math.max(
      0,
      Math.min(1, accuracy * 0.65 + normalisedAttentionLevel(averageLevel) * 0.35),
    );

    const displayMetrics = [
      { label: "Accuracy", value: `${Math.round(accuracy * 100)}%` },
      { label: "Difficulty", value: validTrials ? Number(averageLevel.toFixed(1)) : "—" },
      { label: "Median response", value: responseTimes.length ? `${Math.round(medianRt)} ms` : "—" },
    ];

    if (this.wrapper === "C") {
      const neutral = this.results.filter((result) => result.emotion === "neutral");
      const emotional = this.results.filter((result) => result.emotion === "angry" || result.emotion === "afraid");
      const cost = Math.round((accuracyOf(neutral) - accuracyOf(emotional)) * 100);
      displayMetrics[1] = { label: "Emotion cost", value: `${cost >= 0 ? "+" : ""}${cost} pp` };
    }

    return {
      progressionScore,
      validTrials,
      accuracy,
      level: Number(averageLevel.toFixed(1)),
      displayMetrics,
    };
  }

  private renderIdle(): void {
    if (!this.container) return;
    this.container.innerHTML = `<div class="attention-message"><strong>Attention Control</strong><span>Find the majority relation. Ignore anything that does not determine the answer.</span></div>`;
  }

  private currentWrapper(): AttentionWrapper {
    if (!this.session) return this.wrapper;
    if (this.session.config.wrapperMode === "AB_MIXED") {
      return wrapperForTrial(
        this.session.config.wrapperMode,
        this.session.config.seed ?? this.session.id,
        this.trialIndex,
      );
    }
    return this.wrapper;
  }

  private beginTrial(): void {
    if (this.paused || !this.container || !this.session) return;
    if (this.trialIndex >= TRIALS_PER_SESSION) {
      this.renderComplete();
      return;
    }

    const blockNumber = blockNumberForTrial(this.trialIndex);
    const regime = regimeForBlock(blockNumber);
    if (regime !== this.lastAnnouncedRegime) {
      if (this.lastAnnouncedRegime !== null) this.playSfx("regime");
      this.lastAnnouncedRegime = regime;
    }

    const wrapper = this.currentWrapper();
    if (blockNumber === 7 && this.lockedPolicyLevel === null) {
      this.lockedPolicyLevel = this.levels[wrapper];
    }
    this.activeLevel = blockNumber <= 6
      ? this.levels[wrapper]
      : (this.lockedPolicyLevel ?? this.levels[wrapper]);

    const condition = attentionConditionForLevel(this.activeLevel);
    this.activeTrial = generateAttentionTrial({
      sessionId: this.session.id,
      trialIndex: this.trialIndex,
      wrapper,
      frame: "relational",
      ratio: condition.ratio,
      exposureMs: condition.exposureMs,
    });
    this.feedback = "";
    this.setStage("ready");
    this.schedule(ATTENTION_DONOR_TIMING.readyDelayMs, () => {
      this.setStage("fixation");
      this.schedule(ATTENTION_DONOR_TIMING.fixationMs, () => {
        this.setStage("stimulus");
        this.schedule(this.activeTrial?.exposureMs ?? condition.exposureMs, () => {
          this.setStage("mask");
          this.schedule(ATTENTION_DONOR_TIMING.maskMs, () => this.beginResponse());
        });
      });
    });
  }

  private setStage(stage: AttentionStage): void {
    this.stage = stage;
    this.renderStage();
  }

  private renderStage(): void {
    if (!this.container || !this.activeTrial) return;
    const wrapperLabel = this.activeTrial.wrapper === "A"
      ? "Core · Static/Polar"
      : this.activeTrial.wrapper === "B"
        ? "Perturb · Optic Flow"
        : "Perturb · Emotional";
    const blockNumber = blockNumberForTrial(this.trialIndex);
    const regime = regimeForBlock(blockNumber);
    const responseButtons = this.stage === "response"
      ? `<div class="attention-response" role="group" aria-label="Choose majority relation">
          ${this.activeTrial.responseOptions
            .map((relation, index) => `<button type="button" data-relation="${relation}"><span class="attention-key">${index === 0 ? "F" : "J"}</span>${relationLabel(relation)}</button>`)
            .join("")}
        </div>`
      : "";
    const feedback = this.stage === "feedback"
      ? `<div class="attention-feedback is-${this.feedback}" role="status" aria-label="${this.feedback === "correct" ? "Correct" : "Incorrect"}">${this.feedback === "correct" ? "✓" : "×"}</div>`
      : "";

    this.container.innerHTML = `
      <div class="attention-head">
        <span>${wrapperLabel}</span>
        <span class="attention-regime">Block ${blockNumber}/12 · ${regimeCopy(regime)}</span>
        <span>${this.trialIndex + 1}/${TRIALS_PER_SESSION}</span>
        <span class="attention-audio-controls">
          <button type="button" class="attention-sound-toggle" data-sound-toggle aria-pressed="${this.sfxEnabled}">${this.sfxEnabled ? "Sound on" : "Sound off"}</button>
          <input data-sound-volume aria-label="Sound volume" type="range" min="0" max="1" step="0.05" value="${this.sfxMasterGain}" />
        </span>
      </div>
      <div class="attention-task-stage is-${this.stage}">
        <p class="attention-hint">${this.activeTrial.wrapper === "C" ? "Ignore the face. Find the majority relation." : "Do most signals point IN or OUT?"}</p>
        ${renderAttentionStimulus(this.activeTrial, this.stage)}
        ${feedback}
        ${responseButtons}
      </div>
    `;

    this.bindSoundControls();

    if (this.stage === "response") {
      this.container.querySelectorAll<HTMLButtonElement>("[data-relation]").forEach((button) => {
        button.addEventListener("click", () => {
          const response = button.dataset.relation as AttentionRelation;
          this.answerTrial(response);
        }, { once: true });
      });
    }
  }

  private beginResponse(): void {
    if (!this.activeTrial || this.paused) return;
    this.responseStartedAt = performance.now();
    this.setStage("response");
    this.schedule(ATTENTION_DONOR_TIMING.responseTimeoutMs, () => this.answerTrial(null));
  }

  private answerTrial(response: AttentionRelation | null): void {
    if (this.stage !== "response" || !this.activeTrial) return;
    this.clearTimer();
    const responseAt = performance.now();
    const correct = response === this.activeTrial.correctResponse;
    const blockNumber = blockNumberForTrial(this.trialIndex);
    const priorLevel = this.activeLevel;
    const emotion = this.activeTrial.wrapper === "C" ? emotionForTrialIndex(this.trialIndex) : null;

    this.results.push({
      correct,
      rtMs: response === null ? null : responseAt - this.responseStartedAt,
      wrapper: this.activeTrial.wrapper,
      level: this.activeLevel,
      emotion,
    });

    let capacityAdvanced = false;
    if (blockNumber <= 6) {
      const nextLevel = nextAttentionLevel(this.activeLevel, correct);
      this.levels[this.activeTrial.wrapper] = nextLevel;
      capacityAdvanced = nextLevel > priorLevel;
    }

    this.streak = correct ? this.streak + 1 : 0;
    this.feedback = correct ? "correct" : "incorrect";
    this.setStage("feedback");

    if (capacityAdvanced) this.playSfx("capacity");
    else if (correct && this.streak > 0 && this.streak % 5 === 0) this.playSfx("streak");
    else this.playSfx(correct ? "correct" : "incorrect");

    this.schedule(ATTENTION_DONOR_TIMING.feedbackMs, () => {
      this.trialIndex += 1;
      this.activeTrial = null;
      this.beginTrial();
    });
  }

  private renderComplete(): void {
    if (!this.container) return;
    const summary = this.getTrainingSummary();
    this.playSfx("complete");
    this.container.innerHTML = `
      <div class="attention-message">
        <strong>Session complete</strong>
        <span>${summary.displayMetrics?.map((metric) => `${metric.label}: ${metric.value}`).join(" · ")}</span>
      </div>
    `;
    this.completeHandler?.(summary);
  }

  private bindSoundControls(): void {
    if (!this.container) return;
    this.container.querySelector<HTMLButtonElement>("[data-sound-toggle]")?.addEventListener("click", () => {
      this.sfxEnabled = !this.sfxEnabled;
      this.saveSoundPreference();
      this.renderStage();
    });
    this.container.querySelector<HTMLInputElement>("[data-sound-volume]")?.addEventListener("input", (event) => {
      const input = event.currentTarget as HTMLInputElement;
      this.sfxMasterGain = Math.max(0, Math.min(1, Number(input.value)));
      this.sfxEnabled = this.sfxMasterGain > 0;
      this.saveSoundPreference();
    });
  }

  private loadSoundPreference(): void {
    try {
      const raw = window.localStorage.getItem(SFX_STORAGE_KEY);
      if (!raw) return;
      const value = JSON.parse(raw) as { enabled?: boolean; gain?: number };
      if (typeof value.enabled === "boolean") this.sfxEnabled = value.enabled;
      if (typeof value.gain === "number") this.sfxMasterGain = Math.max(0, Math.min(1, value.gain));
    } catch {
      // Audio preference failure must never block training.
    }
  }

  private saveSoundPreference(): void {
    try {
      window.localStorage.setItem(SFX_STORAGE_KEY, JSON.stringify({
        enabled: this.sfxEnabled,
        gain: this.sfxMasterGain,
      }));
    } catch {
      // Audio preference failure must never block training.
    }
  }

  private preloadSfx(): void {
    for (const event of Object.values(SFX)) {
      const audio = new Audio(`${sfxBasePath()}/${event.file}`);
      audio.preload = "auto";
    }
  }

  private playSfx(eventId: keyof typeof SFX): void {
    if (!this.sfxEnabled || this.sfxMasterGain <= 0) return;
    const event = SFX[eventId];
    const audio = new Audio(`${sfxBasePath()}/${event.file}`);
    audio.volume = Math.max(0, Math.min(1, this.sfxMasterGain * event.gain));
    void audio.play().catch(() => {
      // Missing/blocked audio must never delay or invalidate a trial.
    });
  }

  private schedule(delayMs: number, action: () => void): void {
    this.clearTimer();
    this.stageTimer = window.setTimeout(action, delayMs);
  }

  private clearTimer(): void {
    if (this.stageTimer !== null) {
      window.clearTimeout(this.stageTimer);
      this.stageTimer = null;
    }
  }
}

export const attentionGameAdapter = new AttentionGameAdapter();
