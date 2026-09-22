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
        <p class="section-kicker">NICHE CHALLENGE · HUMAN FIRST</p>
        <h2>Can you find the signal before the tool does?</h2>
        <p class="muted-copy">AI can make another explanation or shortlist cheap to generate. Own the goal first, then decide what evidence actually matters.</p>
        <p><strong>Goal:</strong> ${escapeHtml(ATTENTION_AI_PRACTICE_CASE.goal)}</p>
        <p class="muted-copy"><strong>The move:</strong> Pause. Find the signal. Commit. Make your judgement before seeing the AI shortlist.</p>
        ${cards(ATTENTION_AI_PRACTICE_CASE, human, "human")}
        <button type="button" class="platform-button ai-next" data-ai-action="show-ai">See the AI shortlist</button>`;
      return;
    }

    if (stage === "ai-review") {
      host.innerHTML = `
        <p class="section-kicker">GENERATIVE NICHE · KEEP JUDGEMENT</p>
        <h2>AI expands the search. You keep the goal.</h2>
        <p class="muted-copy">This simulated AI suggestion contains useful evidence, an omission and a false positive. Correct it rather than accepting or rejecting the whole output.</p>
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
        <p class="muted-copy"><strong>Supported performance is not the same as retained capability.</strong> The next case removes the AI so you can see what stays with you.</p>
        <button type="button" class="platform-button ai-next" data-ai-action="start-check">Fresh unaided check →</button>`;
      return;
    }

    if (stage === "check") {
      host.innerHTML = `
        <p class="section-kicker">CHECK WHAT STAYS · NO AI</p>
        <h2>What remains without the scaffold?</h2>
        <p><strong>Goal:</strong> ${escapeHtml(ATTENTION_AI_CHECK_CASE.goal)}</p>
        <p class="muted-copy">Select the evidence yourself. This independent check remains separate from your training-game score.</p>
        ${cards(ATTENTION_AI_CHECK_CASE, check, "check")}
        <button type="button" class="platform-button ai-next" data-ai-action="finish">Finish check</button>`;
      return;
    }

    const score = signalSelectionScore(ATTENTION_AI_CHECK_CASE, check);
    host.innerHTML = `
      <p class="section-kicker">INDEPENDENT CHECK · BANK THE LESSON</p>
      <h2>${score.exact ? "The signal survived the scaffold" : "Useful diagnostic"}</h2>
      <div class="metric-row">
        <span><strong>Relevant found</strong><br>${score.hits}</span>
        <span><strong>Noise selected</strong><br>${score.falsePositives}</span>
        <span><strong>Relevant missed</strong><br>${score.misses}</span>
      </div>
      <p class="muted-copy">The point is not to prove that AI helped or harmed you from one exercise. It is to practise a division of labour in which the tool can expand possibilities while you retain the goal, evidence judgement and final selection. QA simulation only; not a live-model benchmark.</p>
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
