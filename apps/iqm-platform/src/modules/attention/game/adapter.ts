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

interface AttentionResult {
  correct: boolean;
  rtMs: number | null;
  wrapper: "A" | "B";
  level: number;
}

const TRIALS_PER_SESSION = 20;

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

export class AttentionGameAdapter implements GameAdapter {
  private session: GameSession | null = null;
  private container: HTMLElement | null = null;
  private wrapper: "A" | "B" = "A";
  private trialIndex = 0;
  private results: AttentionResult[] = [];
  private stageTimer: number | null = null;
  private responseStartedAt = 0;
  private paused = false;
  private activeTrial: AttentionTrial | null = null;
  private activeLevel = INITIAL_ATTENTION_LEVEL;
  private stage: AttentionStage = "ready";
  private feedback: "correct" | "incorrect" | "" = "";
  private levels: Record<"A" | "B", number> = {
    A: INITIAL_ATTENTION_LEVEL,
    B: INITIAL_ATTENTION_LEVEL,
  };
  private completeHandler: GameCompleteHandler | null = null;

  createSession(config: SessionConfig): GameSession {
    if (config.nodeId !== "attention") {
      throw new Error("AttentionGameAdapter only accepts the attention node.");
    }
    this.session = { id: config.sessionId, config };
    this.wrapper = config.wrapperMode === "B" ? "B" : "A";
    return this.session;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.container.classList.add("attention-game");
    this.renderIdle();
  }

  start(): void {
    if (!this.session || !this.container) {
      throw new Error("Create and mount an Attention session before starting.");
    }
    this.clearTimer();
    this.trialIndex = 0;
    this.results = [];
    this.levels = { A: INITIAL_ATTENTION_LEVEL, B: INITIAL_ATTENTION_LEVEL };
    this.activeTrial = null;
    this.feedback = "";
    this.paused = false;
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
    // Restart the current deterministic trial from the donor ready/fixation sequence.
    this.activeTrial = null;
    this.beginTrial();
  }

  destroy(): void {
    this.clearTimer();
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

  setWrapper(wrapper: "A" | "B"): void {
    this.wrapper = wrapper;
  }

  onComplete(handler: GameCompleteHandler | null): void {
    this.completeHandler = handler;
  }

  getTrainingSummary(): TrainingSummary {
    const validTrials = this.results.length;
    const correct = this.results.filter((result) => result.correct).length;
    const accuracy = validTrials ? correct / validTrials : 0;
    const responseTimes = this.results
      .map((result) => result.rtMs)
      .filter((value): value is number => value !== null);
    const medianRt = median(responseTimes);
    const averageLevel = mean(this.results.map((result) => result.level));
    const progressionScore = Math.max(
      0,
      Math.min(1, accuracy * 0.65 + normalisedAttentionLevel(averageLevel) * 0.35),
    );

    return {
      progressionScore,
      validTrials,
      accuracy,
      level: Number(averageLevel.toFixed(1)),
      displayMetrics: [
        { label: "Accuracy", value: `${Math.round(accuracy * 100)}%` },
        { label: "Difficulty", value: validTrials ? Number(averageLevel.toFixed(1)) : "—" },
        { label: "Median response", value: responseTimes.length ? `${Math.round(medianRt)} ms` : "—" },
      ],
    };
  }

  private renderIdle(): void {
    if (!this.container) return;
    this.container.innerHTML = `<div class="attention-message"><strong>Attention Control</strong><span>Majority extraction under interference. Binding/working-memory components are not part of this node.</span></div>`;
  }

  private currentWrapper(): "A" | "B" {
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

    const wrapper = this.currentWrapper();
    this.activeLevel = this.levels[wrapper];
    const condition = attentionConditionForLevel(this.activeLevel);
    this.activeTrial = generateAttentionTrial({
      sessionId: this.session.id,
      trialIndex: this.trialIndex,
      wrapper,
      // The Phase-1 Attention node preserves the clean ACC absolute-majority task.
      // Relational ACC can be added later; the BSE binding task remains excluded.
      frame: "absolute",
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
    const wrapperLabel = this.activeTrial.wrapper === "A" ? "Static directions" : "Motion directions";
    const responseButtons = this.stage === "response"
      ? `<div class="attention-response" role="group" aria-label="Choose majority direction">
          ${this.activeTrial.responseOptions
            .map((relation) => `<button type="button" data-relation="${relation}">${relationLabel(relation)}</button>`)
            .join("")}
        </div>`
      : "";
    const feedback = this.stage === "feedback"
      ? `<div class="attention-feedback is-${this.feedback}">${this.feedback === "correct" ? "Correct" : "Not this time"}</div>`
      : "";

    this.container.innerHTML = `
      <div class="attention-head">
        <span>${wrapperLabel}</span>
        <span>${this.trialIndex + 1} / ${TRIALS_PER_SESSION}</span>
      </div>
      <div class="attention-task-stage is-${this.stage}">
        <p class="attention-hint">Find the majority direction.</p>
        ${renderAttentionStimulus(this.activeTrial, this.stage)}
        ${feedback}
        ${responseButtons}
      </div>
    `;

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
    this.results.push({
      correct,
      rtMs: response === null ? null : responseAt - this.responseStartedAt,
      wrapper: this.activeTrial.wrapper,
      level: this.activeLevel,
    });
    this.levels[this.activeTrial.wrapper] = nextAttentionLevel(this.activeLevel, correct);
    this.feedback = correct ? "correct" : "incorrect";
    this.setStage("feedback");
    this.schedule(ATTENTION_DONOR_TIMING.feedbackMs, () => {
      this.trialIndex += 1;
      this.activeTrial = null;
      this.beginTrial();
    });
  }

  private renderComplete(): void {
    if (!this.container) return;
    const summary = this.getTrainingSummary();
    this.container.innerHTML = `
      <div class="attention-message">
        <strong>Session complete</strong>
        <span>${summary.displayMetrics?.map((metric) => `${metric.label}: ${metric.value}`).join(" · ")}</span>
      </div>
    `;
    this.completeHandler?.(summary);
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
