import "./aiPractice.css";
import {
  ATTENTION_AI_CHECK_CASE,
  ATTENTION_AI_PRACTICE_CASE,
  signalSelectionScore,
  type SignalCase,
} from "./aiPractice";

type Stage = "human" | "ai-review" | "ai-result" | "check" | "result";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cards(signalCase: SignalCase, selection: ReadonlySet<string>, listId: string): string {
  return `<div class="signal-grid">${signalCase.items.map((item) => `
    <button type="button" class="signal-card ${selection.has(item.id) ? "is-selected" : ""}" data-signal-id="${item.id}" data-list="${listId}" aria-pressed="${selection.has(item.id)}">
      <span class="signal-marker" aria-hidden="true">${selection.has(item.id) ? "✓" : "+"}</span>
      <span>${escapeHtml(item.text)}</span>
    </button>`).join("")}</div>`;
}

export function mountAttentionAiPractice(host: HTMLElement): () => void {
  let stage: Stage = "human";
  const human = new Set<string>();
  const review = new Set<string>(ATTENTION_AI_PRACTICE_CASE.aiSuggestion ?? []);
  const check = new Set<string>();

  function render(): void {
    if (stage === "human") {
      host.innerHTML = `
        <p class="section-kicker">HUMAN FIRST</p>
        <h2>Find the signal</h2>
        <p><strong>Goal:</strong> ${escapeHtml(ATTENTION_AI_PRACTICE_CASE.goal)}</p>
        <p class="muted-copy">Select only the information that directly matters. Make your judgement before seeing the AI shortlist.</p>
        ${cards(ATTENTION_AI_PRACTICE_CASE, human, "human")}
        <button type="button" class="platform-button ai-next" data-ai-action="show-ai">See the AI shortlist</button>`;
      return;
    }

    if (stage === "ai-review") {
      host.innerHTML = `
        <p class="section-kicker">CHALLENGE THE AI</p>
        <h2>Check the shortlist</h2>
        <p class="muted-copy">This simulated AI suggestion contains both useful evidence and a mistake. Correct omissions and false positives rather than accepting or rejecting it wholesale.</p>
        ${cards(ATTENTION_AI_PRACTICE_CASE, review, "review")}
        <button type="button" class="platform-button ai-next" data-ai-action="review">Check my corrections</button>`;
      return;
    }

    if (stage === "ai-result") {
      const score = signalSelectionScore(ATTENTION_AI_PRACTICE_CASE, review);
      host.innerHTML = `
        <p class="section-kicker">FEEDBACK</p>
        <h2>${score.exact ? "Signal recovered" : "Useful miss — check the goal again"}</h2>
        <div class="metric-row">
          <span><strong>Relevant found</strong><br>${score.hits}</span>
          <span><strong>Noise kept</strong><br>${score.falsePositives}</span>
          <span><strong>Relevant missed</strong><br>${score.misses}</span>
        </div>
        <p class="muted-copy">The target is appropriate reliance: neither automatic trust nor automatic scepticism.</p>
        <button type="button" class="platform-button ai-next" data-ai-action="start-check">Fresh unaided check</button>`;
      return;
    }

    if (stage === "check") {
      host.innerHTML = `
        <p class="section-kicker">CHECK WHAT STAYS · NO AI</p>
        <h2>Fresh case</h2>
        <p><strong>Goal:</strong> ${escapeHtml(ATTENTION_AI_CHECK_CASE.goal)}</p>
        <p class="muted-copy">Select the evidence yourself. This independent check remains separate from your training-game score.</p>
        ${cards(ATTENTION_AI_CHECK_CASE, check, "check")}
        <button type="button" class="platform-button ai-next" data-ai-action="finish">Finish check</button>`;
      return;
    }

    const score = signalSelectionScore(ATTENTION_AI_CHECK_CASE, check);
    host.innerHTML = `
      <p class="section-kicker">INDEPENDENT CHECK</p>
      <h2>${score.exact ? "You kept the signal" : "Useful diagnostic"}</h2>
      <div class="metric-row">
        <span><strong>Relevant found</strong><br>${score.hits}</span>
        <span><strong>Noise selected</strong><br>${score.falsePositives}</span>
        <span><strong>Relevant missed</strong><br>${score.misses}</span>
      </div>
      <p class="muted-copy">QA simulation only: this is not a live-model benchmark and does not contribute to Attention Capacity or general-IQ claims.</p>
      <button type="button" class="platform-button ai-next" data-ai-action="restart">Try again</button>`;
  }

  const clickHandler = (event: Event): void => {
    const raw = event.target;
    if (!(raw instanceof Element)) return;
    const signal = raw.closest<HTMLElement>("[data-signal-id]");
    if (signal) {
      const id = signal.dataset.signalId;
      if (!id) return;
      const listId = signal.dataset.list;
      const selection = listId === "review" ? review : listId === "check" ? check : human;
      if (selection.has(id)) selection.delete(id);
      else selection.add(id);
      render();
      return;
    }

    const action = raw.closest<HTMLElement>("[data-ai-action]")?.dataset.aiAction;
    if (!action) return;
    if (action === "show-ai") stage = "ai-review";
    else if (action === "review") stage = "ai-result";
    else if (action === "start-check") stage = "check";
    else if (action === "finish") stage = "result";
    else if (action === "restart") {
      human.clear();
      review.clear();
      for (const id of ATTENTION_AI_PRACTICE_CASE.aiSuggestion ?? []) review.add(id);
      check.clear();
      stage = "human";
    }
    render();
  };

  host.addEventListener("click", clickHandler);
  render();
  return () => host.removeEventListener("click", clickHandler);
}
