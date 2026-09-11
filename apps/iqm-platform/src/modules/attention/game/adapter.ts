import "./styles.css";
import type {
  GameAdapter,
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

interface AttentionResult {
  correct: boolean;
  rtMs: number;
  wrapper: "A" | "B";
}

const TRIALS_PER_BRIDGE_SESSION = 20;

function relationLabel(relation: AttentionRelation): string {
  if (relation === "left") return "Left";
  if (relation === "right") return "Right";
  if (relation === "out") return "Out";
  return "In";
}

function angleForVector(x: number, y: number): number {
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function arrowStimulus(trial: AttentionTrial): string {
  return trial.items
    .map((item) => {
      const angle = angleForVector(item.vector.x, item.vector.y);
      return `<span class="attention-arrow" style="left:${item.position.x}%;top:${item.position.y}%;transform:translate(-50%,-50%) rotate(${angle}deg)">➜</span>`;
    })
    .join("");
}

function flowStimulus(trial: AttentionTrial): string {
  return trial.items
    .map((item, itemIndex) => {
      const dx = Math.round(item.vector.x * 13);
      const dy = Math.round(item.vector.y * 13);
      const dots = Array.from({ length: 12 }, (_, dotIndex) => {
        const left = 12 + ((dotIndex * 29 + itemIndex * 11) % 76);
        const top = 12 + ((dotIndex * 43 + itemIndex * 17) % 76);
        const delay = -((dotIndex % 6) * 110);
        return `<span class="attention-flow-dot" style="left:${left}%;top:${top}%;--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}ms"></span>`;
      }).join("");
      return `<span class="attention-aperture" style="left:${item.position.x}%;top:${item.position.y}%">${dots}</span>`;
    })
    .join("");
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
    this.paused = false;
    this.renderTrial();
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
    this.renderTrial();
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
  }

  setWrapper(wrapper: "A" | "B"): void {
    this.wrapper = wrapper;
  }

  getTrainingSummary(): TrainingSummary {
    const validTrials = this.results.length;
    const correct = this.results.filter((result) => result.correct).length;
    const accuracy = validTrials ? correct / validTrials : 0;
    const medianRt = validTrials
      ? [...this.results].sort((a, b) => a.rtMs - b.rtMs)[Math.floor(validTrials / 2)].rtMs
      : 0;
    return {
      progressionScore: accuracy,
      validTrials,
      accuracy,
      displayMetrics: [
        { label: "Accuracy", value: `${Math.round(accuracy * 100)}%` },
        { label: "Median response", value: validTrials ? `${Math.round(medianRt)} ms` : "—" },
      ],
    };
  }

  private renderIdle(): void {
    if (!this.container) return;
    this.container.innerHTML = `<div class="attention-message"><strong>Attention Control</strong><span>ACC-only donor bridge ready.</span></div>`;
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

  private renderTrial(): void {
    if (this.paused || !this.container || !this.session) return;
    if (this.trialIndex >= TRIALS_PER_BRIDGE_SESSION) {
      this.renderComplete();
      return;
    }

    const wrapper = this.currentWrapper();
    const trial = generateAttentionTrial({
      sessionId: this.session.id,
      trialIndex: this.trialIndex,
      wrapper,
      // First donor bridge proves the clean A/B carrier contract using ACC only.
      // Relational ACC cells remain Attention-owned and are migrated next; BSE is excluded.
      frame: "absolute",
    });

    this.container.innerHTML = `
      <div class="attention-head">
        <span>${wrapper === "A" ? "Static arrows" : "Motion flow"}</span>
        <span>${this.trialIndex + 1} / ${TRIALS_PER_BRIDGE_SESSION}</span>
      </div>
      <div class="attention-stage" aria-label="Attention stimulus">
        ${trial.carrier === "arrow" ? arrowStimulus(trial) : flowStimulus(trial)}
      </div>
      <p class="attention-hint">Find the majority direction.</p>
    `;

    this.clearTimer();
    this.stageTimer = window.setTimeout(() => this.renderResponse(trial), trial.exposureMs);
  }

  private renderResponse(trial: AttentionTrial): void {
    if (!this.container || this.paused) return;
    this.responseStartedAt = performance.now();
    this.container.innerHTML = `
      <div class="attention-head"><span>Respond</span><span>${this.trialIndex + 1} / ${TRIALS_PER_BRIDGE_SESSION}</span></div>
      <div class="attention-response" role="group" aria-label="Choose majority direction">
        ${trial.responseOptions.map((relation) => `<button type="button" data-relation="${relation}">${relationLabel(relation)}</button>`).join("")}
      </div>
    `;
    this.container.querySelectorAll<HTMLButtonElement>("[data-relation]").forEach((button) => {
      button.addEventListener("click", () => {
        const response = button.dataset.relation as AttentionRelation;
        this.results.push({
          correct: response === trial.correctResponse,
          rtMs: performance.now() - this.responseStartedAt,
          wrapper: trial.wrapper,
        });
        this.trialIndex += 1;
        this.stageTimer = window.setTimeout(() => this.renderTrial(), 180);
      }, { once: true });
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
  }

  private clearTimer(): void {
    if (this.stageTimer !== null) {
      window.clearTimeout(this.stageTimer);
      this.stageTimer = null;
    }
  }
}

export const attentionGameAdapter = new AttentionGameAdapter();
