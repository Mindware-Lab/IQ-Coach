import {
  currentPlatformUser,
  isPlatformAuthConfigured,
  onPlatformAuthChange,
  sendPlatformSignInLink,
  signOutPlatformUser,
  type PlatformAuthUser,
} from "../core/auth/client";
import { loadCurrentUserEntitlements } from "../core/entitlements/repository";
import { unlockedNodeIds, type EntitlementRecord } from "../core/entitlements/store";
import { loadBrowserMissions, saveBrowserMission } from "../core/persistence/missions";
import { loadBrowserNodeProgress, saveBrowserNodeProgress } from "../core/persistence/progress";
import { loadBrowserStrategyStatus, saveBrowserStrategyStatus } from "../core/persistence/strategy";
import { recordProgressionSession } from "../core/progression/engine";
import { PHASE_PUBLIC_LABELS, wrapperModeForPhase } from "../core/progression/session";
import { NODE_CATALOGUE } from "../modules/catalogue";
import { getNodeModule, isNodeModuleRegistered } from "../modules/registry";
import type { TrainingSummary } from "../types/game";
import type { Mission } from "../types/mission";
import type { NodeId } from "../types/node";
import type { ProgressionDecision } from "../types/progression";

interface RuntimeState {
  selectedNodeId: NodeId | null;
  user: PlatformAuthUser | null;
  entitlements: EntitlementRecord[];
  unlocked: Set<NodeId>;
  authMessage: string;
  notice: string;
  gamePaused: boolean;
}

interface NetworkNodeUi {
  label: string;
  shortLabel: string;
  x: number;
  y: number;
}

const NETWORK_NODE_UI: Record<NodeId, NetworkNodeUi> = {
  attention: { label: "Attention", shortLabel: "Attention", x: 50, y: 8 },
  "relational-memory": { label: "Relations", shortLabel: "Relations", x: 82, y: 28 },
  "binding-memory": { label: "Binding", shortLabel: "Binding", x: 82, y: 72 },
  reasoning: { label: "Reasoning", shortLabel: "Reasoning", x: 50, y: 92 },
  "generative-search": { label: "Ideas", shortLabel: "Ideas", x: 18, y: 72 },
  "predictive-mapping": { label: "Prediction", shortLabel: "Prediction", x: 18, y: 28 },
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function listItems(items: readonly string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export async function bootstrap(root: HTMLElement): Promise<void> {
  const localPreview =
    !isPlatformAuthConfigured &&
    (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");

  const state: RuntimeState = {
    selectedNodeId: null,
    user: null,
    entitlements: [],
    unlocked: localPreview ? new Set<NodeId>(["attention"]) : new Set<NodeId>(),
    authMessage: "",
    notice: "",
    gamePaused: false,
  };

  const userKey = (): string => state.user?.id ?? "local-preview";

  function accountMarkup(): string {
    if (localPreview) return `<div class="phase-pill">Preview</div>`;
    if (!isPlatformAuthConfigured) return `<div class="phase-pill">Setup needed</div>`;
    if (!state.user) return "";
    return `<div class="account-chip"><span>${escapeHtml(state.user.email ?? "Signed in")}</span><button type="button" class="text-button" data-action="sign-out">Sign out</button></div>`;
  }

  function shell(body: string): string {
    return `<div class="app-shell">
      <header class="topbar">
        <div><p class="eyebrow">IQ MINDWARE</p><h1>Build a stronger thinking network</h1><p class="lede">Train skills. Learn when to use them. Put them to work in real life.</p></div>
        ${accountMarkup()}
      </header>
      ${state.notice ? `<div class="notice">${escapeHtml(state.notice)}</div>` : ""}
      <main>${body}</main>
    </div>`;
  }

  function renderConfigurationError(): void {
    root.innerHTML = shell(`<section class="panel"><p class="section-kicker">SETUP</p><h2>Sign-in is not ready yet</h2><p>Add the platform Supabase settings to enable accounts.</p></section>`);
  }

  function renderSignIn(): void {
    root.innerHTML = shell(`<section class="panel auth-panel">
      <p class="section-kicker">YOUR ACCOUNT</p><h2>Sign in once</h2>
      <p>One account gives you access to every coach you own.</p>
      <form id="platform-auth-form" class="auth-form">
        <label for="auth-email">Email</label><input id="auth-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com" />
        <button type="submit" class="platform-button">Send sign-in link</button>
      </form>
      ${state.authMessage ? `<p class="auth-message">${escapeHtml(state.authMessage)}</p>` : ""}
    </section>`);
    const form = root.querySelector<HTMLFormElement>("#platform-auth-form");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const submittedForm = event.currentTarget as HTMLFormElement;
      const data = new FormData(submittedForm);
      const email = String(data.get("email") ?? "");
      state.authMessage = "Sending your link…";
      renderSignIn();
      void sendPlatformSignInLink(email)
        .then(() => {
          state.authMessage = "Check your email to continue.";
          renderSignIn();
        })
        .catch((error: unknown) => {
          state.authMessage = error instanceof Error ? error.message : "Unable to send the sign-in link.";
          renderSignIn();
        });
    });
  }

  function networkNode(nodeId: NodeId): string {
    const ui = NETWORK_NODE_UI[nodeId];
    const registered = isNodeModuleRegistered(nodeId);
    const unlocked = state.unlocked.has(nodeId);
    const interactive = registered && unlocked;
    const status = interactive ? "Ready" : registered ? "Locked" : "Soon";
    const tag = interactive ? "button" : "div";
    const action = interactive ? ` data-open-node="${nodeId}"` : "";
    const disabled = interactive ? "" : ` aria-disabled="true"`;
    return `<${tag} class="network-node network-node-${nodeId} ${interactive ? "is-ready" : "is-muted"}" style="--node-x:${ui.x}%;--node-y:${ui.y}%"${action}${disabled} aria-label="${escapeHtml(ui.label)}: ${status}">
      <span class="network-node-orb" aria-hidden="true"></span>
      <strong>${escapeHtml(ui.shortLabel)}</strong>
      <span class="network-node-status">${status}</span>
    </${tag}>`;
  }

  function networkMap(): string {
    return `<div class="network-map" aria-label="Your six-part thinking network">
      <svg class="network-map-lines" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="36" class="network-ring" />
        ${Object.values(NETWORK_NODE_UI).map((ui) => `<line x1="50" y1="50" x2="${ui.x}" y2="${ui.y}" />`).join("")}
      </svg>
      <div class="network-hub"><strong>Your</strong><span>Network</span></div>
      ${NODE_CATALOGUE.map((node) => networkNode(node.id)).join("")}
    </div>`;
  }

  function renderDashboard(): void {
    state.selectedNodeId = null;
    const attentionReady = state.unlocked.has("attention") && isNodeModuleRegistered("attention");
    const attentionProgress = loadBrowserNodeProgress(userKey(), "attention");
    root.innerHTML = shell(`
      <section class="panel today-panel">
        <div class="today-copy"><p class="section-kicker">TODAY</p><h2>${attentionReady ? "Train Attention" : "Choose your first coach"}</h2>
          ${attentionReady ? `<p>${escapeHtml(PHASE_PUBLIC_LABELS[attentionProgress.phase])} · Session ${attentionProgress.totalSessions + 1}</p>` : `<p>Start with one skill and build from there.</p>`}
        </div>
        ${attentionReady ? `<button type="button" class="platform-button today-button" data-open-node="attention">Continue</button>` : ""}
      </section>
      <section class="panel network-panel">
        <div class="section-heading"><div><p class="section-kicker">YOUR NETWORK</p><h2>Six skills. One system.</h2></div></div>
        ${networkMap()}
        <p class="network-note">Tap a coloured node to open it. Links show your training map, not a score.</p>
      </section>
      <section class="panel gtrack-panel"><div class="gtrack-mark" aria-hidden="true">G</div><div><p class="section-kicker">G TRACK</p><h2>Check your progress</h2><p>Independent check-ins stay separate from your training scores.</p></div></section>
    `);
  }

  function renderNodeHome(nodeId: NodeId): void {
    if (!isNodeModuleRegistered(nodeId) || !state.unlocked.has(nodeId)) return;
    state.selectedNodeId = nodeId;
    const module = getNodeModule(nodeId);
    const progress = loadBrowserNodeProgress(userKey(), nodeId);
    const strategyStatus = loadBrowserStrategyStatus(userKey(), nodeId);
    const missions = loadBrowserMissions(userKey(), nodeId);
    const capacityStatus = progress.totalSessions > 0 ? "In progress" : "Ready";
    const nicheStatus = missions.some((mission) => mission.status === "planned") ? "Planned" : missions.length ? "Started" : "Ready";
    const strategyLabel = strategyStatus === "not-started" ? "Ready" : strategyStatus === "practising" ? "Practising" : "Learned";
    root.innerHTML = shell(`
      <section class="panel node-hero node-hero-${nodeId}"><button type="button" class="text-button" data-action="dashboard">← Network</button><p class="section-kicker">${escapeHtml(module.shortTitle.toUpperCase())}</p><h2>${escapeHtml(module.title)}</h2><p>${escapeHtml(module.shortDescription)}</p>
        <div class="csn-row"><span><strong>Train</strong>${escapeHtml(capacityStatus)}</span><span><strong>Use</strong>${escapeHtml(strategyLabel)}</span><span><strong>Apply</strong>${escapeHtml(nicheStatus)}</span></div></section>
      <section class="journey-grid">
        <article class="panel journey-card journey-train"><p class="section-kicker">TRAIN</p><h3>Build the skill</h3><p>${escapeHtml(PHASE_PUBLIC_LABELS[progress.phase])}</p><button type="button" class="platform-button" data-action="train">Train now</button></article>
        <article class="panel journey-card journey-use"><p class="section-kicker">USE</p><h3>Make it portable</h3><blockquote>${escapeHtml(module.strategy.handle)}</blockquote><button type="button" class="platform-button secondary-button" data-action="strategy">Learn the cue</button></article>
        <article class="panel journey-card journey-apply"><p class="section-kicker">APPLY</p><h3>Try it for real</h3><p>${missions.filter((mission) => mission.status === "planned").length ? "Mission ready" : "Choose one small mission"}</p><button type="button" class="platform-button secondary-button" data-action="missions">Pick a mission</button></article>
      </section>`);
  }

  function renderStrategy(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const status = loadBrowserStrategyStatus(userKey(), nodeId);
    root.innerHTML = shell(`<section class="panel"><button type="button" class="text-button" data-action="node-home">← ${escapeHtml(module.shortTitle)}</button><p class="section-kicker">USE</p><h2>${escapeHtml(module.strategy.handle)}</h2><p>${escapeHtml(module.strategy.explanation)}</p>
      <div class="strategy-grid"><div><h3>Use it when…</h3>${listItems(module.strategy.targetCues)}</div><div><h3>Skip it when…</h3>${listItems(module.strategy.antiCues)}</div></div>
      <h3>Try these examples</h3><div class="example-grid">${[...module.strategy.workedExamples, ...module.strategy.changedExamples].map((example) => `<article class="example-card"><strong>${escapeHtml(example.title)}</strong><p>${escapeHtml(example.situation)}</p><span>${example.usePolicy ? "Use it" : "Try something else"}</span><p>${escapeHtml(example.explanation)}</p></article>`).join("")}</div>
      <div class="button-row"><button type="button" class="platform-button" data-strategy-status="learned">${status === "learned" ? "Got it ✓" : "I get it"}</button><button type="button" class="platform-button secondary-button" data-strategy-status="practising">${status === "practising" ? "Practising ✓" : "I’m practising"}</button></div>
    </section>`);
  }

  function renderMissions(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const missions = loadBrowserMissions(userKey(), nodeId);
    root.innerHTML = shell(`<section class="panel"><button type="button" class="text-button" data-action="node-home">← ${escapeHtml(module.shortTitle)}</button><p class="section-kicker">APPLY</p><h2>Pick one small real-life mission</h2><p>Choose something easy to notice and easy to try.</p>
      <div class="mission-grid">${module.missions.map((mission) => `<article class="mission-card"><h3>${escapeHtml(mission.title)}</h3><p>${escapeHtml(mission.contextExample)}</p><button type="button" class="platform-button secondary-button" data-plan-mission="${escapeHtml(mission.id)}">Choose this</button></article>`).join("")}</div>
      <h3>Your missions</h3>${missions.length ? `<div class="planned-list">${missions.map((mission) => `<p><strong>${escapeHtml(mission.context)}</strong><br>${escapeHtml(mission.intendedPolicy)}</p>`).join("")}</div>` : `<p class="muted-copy">Nothing planned yet.</p>`}
    </section>`);
  }

  function renderTraining(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const progress = loadBrowserNodeProgress(userKey(), nodeId);
    const wrapperMode = wrapperModeForPhase(progress.phase);
    const sessionId = randomId(`${nodeId}-session`);
    state.gamePaused = false;
    root.innerHTML = shell(`<section class="panel training-shell"><div class="session-heading"><div><button type="button" class="text-button" data-action="node-home">← Exit</button><p class="section-kicker">TRAIN</p><h2>${escapeHtml(module.title)}</h2></div><button type="button" class="text-button" data-action="pause">Pause</button></div><div id="game-host"></div></section>`);
    const host = root.querySelector<HTMLElement>("#game-host");
    if (!host) throw new Error("Missing game host.");
    module.game.onComplete?.((summary) => {
      const current = loadBrowserNodeProgress(userKey(), nodeId);
      const decision = recordProgressionSession(current, { summary, wrapperMode, dataQualityAdequate: summary.validTrials >= 10 }, module.progression);
      saveBrowserNodeProgress(userKey(), nodeId, decision.state);
      module.game.destroy();
      renderSessionSummary(nodeId, summary, decision);
    });
    module.game.createSession({ nodeId, sessionId, phase: progress.phase, wrapperMode, targetMinutes: module.estimatedSessionMinutes, seed: sessionId });
    module.game.mount(host);
    module.game.start();
  }

  function renderSessionSummary(nodeId: NodeId, summary: TrainingSummary, decision: ProgressionDecision): void {
    const module = getNodeModule(nodeId);
    root.innerHTML = shell(`<section class="panel session-complete-panel"><p class="section-kicker">DONE</p><h2>Nice work</h2>
      <div class="metric-row">${(summary.displayMetrics ?? []).map((metric) => `<span><strong>${escapeHtml(metric.label)}</strong><br>${escapeHtml(metric.value)}</span>`).join("")}</div>
      <p><strong>Next:</strong> ${escapeHtml(PHASE_PUBLIC_LABELS[decision.state.phase])}</p><p class="muted-copy">Your training path adapts as you go.</p>
      <div class="button-row"><button type="button" class="platform-button" data-action="node-home">Back to ${escapeHtml(module.shortTitle)}</button><button type="button" class="platform-button secondary-button" data-action="strategy">Use it in real life</button></div></section>`);
  }

  async function loadEntitlementsForUser(): Promise<void> {
    if (!state.user) {
      state.entitlements = [];
      state.unlocked = new Set<NodeId>();
      return;
    }
    try {
      state.entitlements = await loadCurrentUserEntitlements();
      state.unlocked = unlockedNodeIds(state.entitlements);
    } catch (error) {
      state.entitlements = [];
      state.unlocked = new Set<NodeId>();
      state.notice = error instanceof Error ? `Could not load access: ${error.message}` : "Could not load access.";
    }
  }

  root.addEventListener("click", (event) => {
    const rawTarget = event.target;
    if (!(rawTarget instanceof Element)) return;
    const target = rawTarget.closest<HTMLElement>("[data-action], [data-open-node], [data-plan-mission], [data-strategy-status]");
    if (!target) return;

    const openNodeId = target.dataset.openNode as NodeId | undefined;
    if (openNodeId) {
      renderNodeHome(openNodeId);
      return;
    }

    const action = target.dataset.action;
    if (action === "sign-out") {
      void signOutPlatformUser();
      return;
    }
    if (action === "dashboard") {
      state.notice = "";
      renderDashboard();
      return;
    }
    if (action === "node-home" && state.selectedNodeId) {
      getNodeModule(state.selectedNodeId).game.destroy();
      state.notice = "";
      renderNodeHome(state.selectedNodeId);
      return;
    }
    if (action === "train" && state.selectedNodeId) {
      renderTraining(state.selectedNodeId);
      return;
    }
    if (action === "strategy" && state.selectedNodeId) {
      renderStrategy(state.selectedNodeId);
      return;
    }
    if (action === "missions" && state.selectedNodeId) {
      renderMissions(state.selectedNodeId);
      return;
    }
    if (action === "pause" && state.selectedNodeId) {
      const module = getNodeModule(state.selectedNodeId);
      state.gamePaused = !state.gamePaused;
      if (state.gamePaused) module.game.pause?.();
      else module.game.resume?.();
      target.textContent = state.gamePaused ? "Resume" : "Pause";
      return;
    }

    const strategyStatus = target.dataset.strategyStatus;
    if (strategyStatus && state.selectedNodeId) {
      const next = strategyStatus === "practising" ? "practising" : "learned";
      saveBrowserStrategyStatus(userKey(), state.selectedNodeId, next);
      state.notice = next === "learned" ? "Strategy saved." : "Practice mode on.";
      renderStrategy(state.selectedNodeId);
      return;
    }

    const missionId = target.dataset.planMission;
    if (missionId && state.selectedNodeId) {
      const module = getNodeModule(state.selectedNodeId);
      const template = module.missions.find((mission) => mission.id === missionId);
      if (!template) return;
      const mission: Mission = {
        id: randomId("mission"),
        nodeId: state.selectedNodeId,
        context: template.contextExample,
        targetCue: template.targetCue,
        intendedPolicy: template.intendedPolicy,
        nicheChangeType: template.suggestedNicheChanges?.[0] ?? "none",
        status: "planned",
        createdAt: new Date().toISOString(),
      };
      saveBrowserMission(userKey(), mission);
      state.notice = "Mission added.";
      renderMissions(state.selectedNodeId);
    }
  });

  async function hydrate(): Promise<void> {
    if (localPreview) {
      renderDashboard();
      return;
    }
    if (!isPlatformAuthConfigured) {
      renderConfigurationError();
      return;
    }
    state.user = await currentPlatformUser();
    if (!state.user) {
      renderSignIn();
      return;
    }
    await loadEntitlementsForUser();
    renderDashboard();
  }

  onPlatformAuthChange((user) => {
    void (async () => {
      state.user = user;
      state.selectedNodeId = null;
      state.notice = "";
      if (!user) {
        state.entitlements = [];
        state.unlocked = new Set<NodeId>();
        renderSignIn();
        return;
      }
      await loadEntitlementsForUser();
      renderDashboard();
    })();
  });

  await hydrate();
}
