import "./styles.css";
import type {
  GameAdapter,
  GameCompleteHandler,
  GameSession,
  SessionConfig,
  TrainingSummary,
} from "../../../types/game";
import {
  promptsForSession,
  type GenerativePrompt,
} from "./prompts";
import {
  trainingSummaryFromGenerativeRounds,
  type GenerativeResponse,
  type GenerativeRoundResult,
} from "./scoring";

const ROUND_DURATION_MS = 90_000;
const EXTRA_SEARCH_MS = 20_000;

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function wrapperForRound(
  mode: SessionConfig["wrapperMode"],
  seed: string,
  roundIndex: number,
): "A" | "B" {
  if (mode === "A" || mode === "B") return mode;
  return hashSeed(`${seed}:wrapper:${roundIndex}`) % 2 === 0 ? "A" : "B";
}

function formatFamily(family: GenerativePrompt["family"]): string {
  if (family === "FLUENCY_EXTENSION") return "Extend the search";
  if (family === "CATEGORY_OR_PERSPECTIVE_SWITCHING") return "Switch perspective";
  return "Reframe the constraint";
}

function promptMarkup(prompt: GenerativePrompt, wrapper: "A" | "B"): string {
  if (wrapper === "A") {
    return `<div class="generative-prose-prompt"><p>${prompt.prose}</p></div>`;
  }
  return `<div class="generative-board">
    <div class="generative-board-card"><span>Situation</span><p>${prompt.situation}</p></div>
    <div class="generative-board-card"><span>Goal</span><p>${prompt.goal}</p></div>
    ${prompt.constraint ? `<div class="generative-board-card"><span>Constraint</span><p>${prompt.constraint}</p></div>` : ""}
    ${prompt.switchCue ? `<div class="generative-board-card"><span>Later cue</span><p>${prompt.switchCue.cue}</p></div>` : ""}
  </div>`;
}

interface ActiveRound {
  prompt: GenerativePrompt;
  wrapper: "A" | "B";
  startedAt: number;
  responses: GenerativeResponse[];
  switchCueShownAtMs?: number;
  continuedOnce: boolean;
  deadlineAt: number;
}

export class GenerativeSearchGameAdapter implements GameAdapter {
  private session: GameSession | null = null;
  private container: HTMLElement | null = null;
  private prompts: GenerativePrompt[] = [];
  private roundIndex = 0;
  private round: ActiveRound | null = null;
  private results: GenerativeRoundResult[] = [];
  private intervalId: number | null = null;
  private completeHandler: GameCompleteHandler | null = null;
  private paused = false;
  private pausedAt: number | null = null;
  private forcedWrapper: "A" | "B" = "A";

  createSession(config: SessionConfig): GameSession {
    if (config.nodeId !== "generative-search") {
      throw new Error("GenerativeSearchGameAdapter only accepts the generative-search node.");
    }
    this.session = { id: config.sessionId, config };
    this.prompts = promptsForSession(config.seed ?? config.sessionId, 6);
    this.forcedWrapper = config.wrapperMode === "B" ? "B" : "A";
    return this.session;
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.container.classList.add("generative-game");
    this.container.innerHTML = `<div class="generative-message"><strong>Generative Search</strong><span>Generate distinct plausible alternatives before evaluation closes the search.</span></div>`;
  }

  start(): void {
    if (!this.session || !this.container) {
      throw new Error("Create and mount a Generative Search session before starting.");
    }
    this.results = [];
    this.roundIndex = 0;
    this.paused = false;
    this.startRound();
  }

  pause(): void {
    if (!this.round || this.paused) return;
    this.paused = true;
    this.pausedAt = performance.now();
    this.clearInterval();
    if (this.container) {
      this.container.innerHTML = `<div class="generative-message"><strong>Paused</strong><span>Your current responses are preserved.</span></div>`;
    }
  }

  resume(): void {
    if (!this.round || !this.paused) return;
    const now = performance.now();
    if (this.pausedAt !== null) {
      this.round.deadlineAt += now - this.pausedAt;
    }
    this.paused = false;
    this.pausedAt = null;
    this.renderRound();
    this.startCountdown();
  }

  destroy(): void {
    this.clearInterval();
    if (this.container) {
      this.container.innerHTML = "";
      this.container.classList.remove("generative-game");
    }
    this.container = null;
    this.session = null;
    this.round = null;
    this.prompts = [];
    this.results = [];
    this.roundIndex = 0;
    this.completeHandler = null;
  }

  setWrapper(wrapper: "A" | "B"): void {
    this.forcedWrapper = wrapper;
  }

  onComplete(handler: GameCompleteHandler | null): void {
    this.completeHandler = handler;
  }

  getTrainingSummary(): TrainingSummary {
    return trainingSummaryFromGenerativeRounds(this.results);
  }

  private currentWrapper(): "A" | "B" {
    if (!this.session) return this.forcedWrapper;
    return wrapperForRound(
      this.session.config.wrapperMode,
      this.session.config.seed ?? this.session.id,
      this.roundIndex,
    );
  }

  private startRound(): void {
    if (!this.session || !this.container) return;
    if (this.roundIndex >= this.prompts.length) {
      this.finishSession();
      return;
    }
    const now = performance.now();
    this.round = {
      prompt: this.prompts[this.roundIndex],
      wrapper: this.currentWrapper(),
      startedAt: now,
      responses: [],
      continuedOnce: false,
      deadlineAt: now + ROUND_DURATION_MS,
    };
    this.renderRound();
    this.startCountdown();
  }

  private elapsedMs(): number {
    if (!this.round) return 0;
    return Math.max(0, performance.now() - this.round.startedAt);
  }

  private renderRound(): void {
    if (!this.container || !this.round || this.paused) return;
    const { prompt, wrapper, responses } = this.round;
    const switchReady = prompt.switchCue && responses.length >= prompt.switchCue.afterResponses;
    if (switchReady && this.round.switchCueShownAtMs === undefined) {
      this.round.switchCueShownAtMs = this.elapsedMs();
    }
    this.container.innerHTML = `
      <div class="generative-head">
        <div><span>${formatFamily(prompt.family)}</span><small>${wrapper === "A" ? "Prompt" : "Prompt board"}</small></div>
        <div><strong>${this.roundIndex + 1} / ${this.prompts.length}</strong><span id="generative-countdown">90s</span></div>
      </div>
      ${promptMarkup(prompt, wrapper)}
      ${switchReady ? `<div class="generative-switch-cue"><strong>Switch</strong><span>${prompt.switchCue?.cue}</span></div>` : ""}
      <div class="generative-entry">
        <label for="generative-response">Add one distinct alternative</label>
        <div class="generative-input-row">
          <input id="generative-response" type="text" autocomplete="off" maxlength="280" placeholder="Type an alternative…" />
          <button type="button" class="platform-button" data-gen-action="add">Add</button>
        </div>
        <div class="generative-response-meta"><span>${responses.length} responses</span><span>Semantic originality is not scored in v1.</span></div>
        ${responses.length ? `<ol class="generative-response-list">${responses.slice(-5).map((response) => `<li>${response.text}</li>`).join("")}</ol>` : ""}
      </div>
      <div class="generative-round-actions"><button type="button" class="text-button" data-gen-action="finish">I think I’m done</button></div>
    `;

    const input = this.container.querySelector<HTMLInputElement>("#generative-response");
    input?.focus();
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.addResponse(input.value);
      }
    });
    this.container.querySelector<HTMLButtonElement>("[data-gen-action='add']")?.addEventListener("click", () => {
      this.addResponse(input?.value ?? "");
    });
    this.container.querySelector<HTMLButtonElement>("[data-gen-action='finish']")?.addEventListener("click", () => this.renderCommitChoice());
    this.updateCountdown();
  }

  private addResponse(text: string): void {
    if (!this.round) return;
    const clean = text.trim();
    if (!clean) return;
    const afterSwitchCue = this.round.switchCueShownAtMs !== undefined;
    this.round.responses.push({
      text: clean,
      submittedAtMs: this.elapsedMs(),
      afterSwitchCue,
    });
    this.renderRound();
  }

  private renderCommitChoice(): void {
    if (!this.container || !this.round) return;
    this.clearInterval();
    this.container.innerHTML = `<div class="generative-commit">
      <p class="section-kicker">COMMITMENT CHECK</p>
      <h3>Are you finished searching this possibility space?</h3>
      <p>You have ${this.round.responses.length} responses. This choice records search persistence; it is not a score.</p>
      <div class="button-row">
        <button type="button" class="platform-button" data-gen-commit="done">I’m done</button>
        <button type="button" class="platform-button secondary-button" data-gen-commit="continue">Keep searching</button>
      </div>
    </div>`;
    this.container.querySelector<HTMLButtonElement>("[data-gen-commit='done']")?.addEventListener("click", () => this.finishRound());
    this.container.querySelector<HTMLButtonElement>("[data-gen-commit='continue']")?.addEventListener("click", () => {
      if (!this.round) return;
      this.round.continuedOnce = true;
      this.round.deadlineAt = performance.now() + EXTRA_SEARCH_MS;
      this.renderRound();
      this.startCountdown();
    });
  }

  private finishRound(): void {
    if (!this.round) return;
    this.clearInterval();
    const endedAt = this.elapsedMs();
    this.results.push({
      promptId: this.round.prompt.id,
      family: this.round.prompt.family,
      wrapper: this.round.wrapper,
      startedAtMs: 0,
      endedAtMs: endedAt,
      switchCueShownAtMs: this.round.switchCueShownAtMs,
      responses: [...this.round.responses],
      commitment: this.round.continuedOnce ? "CONTINUE_THEN_DONE" : "DONE",
      commitmentAtMs: endedAt,
    });
    this.roundIndex += 1;
    this.round = null;
    window.setTimeout(() => this.startRound(), 180);
  }

  private finishSession(): void {
    if (!this.container) return;
    this.clearInterval();
    const summary = this.getTrainingSummary();
    this.container.innerHTML = `<div class="generative-message"><strong>Session complete</strong><span>${summary.displayMetrics?.map((metric) => `${metric.label}: ${metric.value}`).join(" · ")}</span><small>Component profile only — no omnibus creativity score.</small></div>`;
    this.completeHandler?.(summary);
  }

  private startCountdown(): void {
    this.clearInterval();
    this.updateCountdown();
    this.intervalId = window.setInterval(() => {
      if (!this.round || this.paused) return;
      if (performance.now() >= this.round.deadlineAt) {
        this.renderCommitChoice();
        return;
      }
      this.updateCountdown();
    }, 250);
  }

  private updateCountdown(): void {
    if (!this.container || !this.round) return;
    const remaining = Math.max(0, this.round.deadlineAt - performance.now());
    const element = this.container.querySelector<HTMLElement>("#generative-countdown");
    if (element) element.textContent = `${Math.ceil(remaining / 1000)}s`;
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const generativeSearchGameAdapter = new GenerativeSearchGameAdapter();
