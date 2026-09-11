import {
  currentPlatformUser,
  isPlatformAuthConfigured,
  onPlatformAuthChange,
  sendPlatformSignInLink,
  signOutPlatformUser,
  type PlatformAuthUser,
} from "../core/auth/client";
import { loadCurrentUserEntitlements } from "../core/entitlements/repository";
import {
  unlockedNodeIds,
  type EntitlementRecord,
} from "../core/entitlements/store";
import {
  loadBrowserMissions,
  saveBrowserMission,
} from "../core/persistence/missions";
import {
  loadBrowserNodeProgress,
  saveBrowserNodeProgress,
} from "../core/persistence/progress";
import {
  loadBrowserStrategyStatus,
  saveBrowserStrategyStatus,
} from "../core/persistence/strategy";
import { recordProgressionSession } from "../core/progression/engine";
import {
  PHASE_PUBLIC_LABELS,
  wrapperModeForPhase,
} from "../core/progression/session";
import { NODE_CATALOGUE } from "../modules/catalogue";
import {
  getNodeModule,
  isNodeModuleRegistered,
} from "../modules/registry";
import type { Mission } from "../types/mission";
import type { NodeId } from "../types/node";
import type { ProgressionDecision } from "../types/progression";
import type { TrainingSummary } from "../types/game";

type Screen = "dashboard" | "node" | "training" | "strategy" | "missions";

interface RuntimeState {
  screen: Screen;
  selectedNodeId: NodeId | null;
  user: PlatformAuthUser | null;
  entitlements: EntitlementRecord[];
  unlocked: Set<NodeId>;
  authMessage: string;
  notice: string;
}

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
    screen: "dashboard",
    selectedNodeId: null,
    user: null,
    entitlements: [],
    unlocked: localPreview ? new Set<NodeId>(["attention"]) : new Set<NodeId>(),
    authMessage: "",
    notice: "",
  };

  function userKey(): string {
    return state.user?.id ?? "local-preview";
  }

  function accountMarkup(): string {
    if (localPreview) {
      return `<div class="phase-pill">Local preview · Attention unlocked</div>`;
    }
    if (!isPlatformAuthConfigured) {
      return `<div class="phase-pill">Auth configuration missing</div>`;
    }
    if (!state.user) return "";
    return `
      <div class="account-chip">
        <span>${escapeHtml(state.user.email ?? "Signed in")}</span>
        <button type="button" class="text-button" data-action="sign-out">Sign out</button>
      </div>
    `;
  }

  function shell(body: string): string {
    return `
      <div class="app-shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">IQ MINDWARE</p>
            <h1>Your cognitive training network</h1>
            <p class="lede">One login, one dashboard and a shared Train → Use → Apply architecture across the cognitive-node ecology.</p>
          </div>
          ${accountMarkup()}
        </header>
        ${state.notice ? `<div class="notice">${escapeHtml(state.notice)}</div>` : ""}
        <main>${body}</main>
      </div>
    `;
  }

  function renderConfigurationError(): void {
    root.innerHTML = shell(`
      <section class="panel">
        <p class="section-kicker">PLATFORM CONFIGURATION</p>
        <h2>Authentication is not configured</h2>
        <p>The production platform requires the shared Supabase URL and anonymous key. Node modules are not allowed to create their own login flow.</p>
      </section>
    `);
  }

  function renderSignIn(): void {
    root.innerHTML = shell(`
      <section class="panel auth-panel">
        <p class="section-kicker">ONE IQ MINDWARE ACCOUNT</p>
        <h2>Sign in to your training network</h2>
        <p>Use the same email-link sign-in for every node you own.</p>
        <form id="platform-auth-form" class="auth-form">
          <label for="auth-email">Email</label>
          <input id="auth-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com" />
          <button type="submit" class="platform-button">Email me a sign-in link</button>
        </form>
        ${state.authMessage ? `<p class="auth-message">${escapeHtml(state.authMessage)}</p>` : ""}
      </section>
    `);
    root.querySelector<HTMLFormElement>("#platform-auth-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email") ?? "");
      state.authMessage = "Sending sign-in link…";
      renderSignIn();
      void sendPlatformSignInLink(email)
        .then(() => {
          state.authMessage = "Check your email and follow the secure sign-in link.";
          renderSignIn();
        })
        .catch((error: unknown) => {
          state.authMessage = error instanceof Error ? error.message : "Unable to send the sign-in link.";
          renderSignIn();
        });
    });
  }

  function nodeCard(nodeId: NodeId, title: string, description: string): string {
    const registered = isNodeModuleRegistered(nodeId);
    const unlocked = state.unlocked.has(nodeId);
    const status = !registered ? "Coming later" : unlocked ? "Unlocked" : "Locked";
    const button = registered && unlocked
      ? `<button type="button" class="platform-button compact-button" data-open-node="${nodeId}">Open</button>`
      : "";
    return `
      <article class="node-card ${unlocked ? "node-card-unlocked" : ""}" aria-disabled="${unlocked ? "false" : "true"}">
        <div class="node-dot" aria-hidden="true"></div>
        <div class="node-card-body">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(description)}</p>
          <div class="node-card-footer">
            <span class="node-state">${status}</span>
            ${button}
          </div>
        </div>
      </article>
    `;
  }

  function renderDashboard(): void {
    const attentionReady = state.unlocked.has("attention") && isNodeModuleRegistered("attention");
    const attentionProgress = loadBrowserNodeProgress(userKey(), "attention");
    root.innerHTML = shell(`
      <section class="panel today-panel">
        <p class="section-kicker">TODAY</p>
        <h2>${attentionReady ? "Attention Control" : "Your next useful action"}</h2>
        ${attentionReady ? `
          <p>${escapeHtml(PHASE_PUBLIC_LABELS[attentionProgress.phase])} · ${attentionProgress.totalSessions} sessions completed</p>
          <button type="button" class="platform-button" data-open-node="attention">Continue Attention</button>
        ` : `<p>Unlock a node to begin training inside the shared platform.</p>`}
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <p class="section-kicker">MY NETWORK</p>
            <h2>Six-node mutualist ecology</h2>
          </div>
          <p class="boundary-note">The network is a navigation and developmental framework. Phase 1 does not display personalised causal edges, synergy scores or predicted IQ change.</p>
        </div>
        <div class="node-grid">
          ${NODE_CATALOGUE.map((node) => nodeCard(node.id, node.title, node.shortDescription)).join("")}
        </div>
      </section>

      <section class="panel gtrack-panel">
        <p class="section-kicker">G TRACK</p>
        <h2>Independent measurement surface</h2>
        <p>Training performance stays separate from independent G Track measurement. No node-level training change is automatically attributed to a change in general intelligence.</p>
      </section>
    `);
    bindSharedActions();
    root.querySelectorAll<HTMLButtonElement>("[data-open-node]").forEach((button) => {
      button.addEventListener("click", () => {
        const nodeId = button.dataset.openNode as NodeId;
        openNode(nodeId);
      });
    });
  }

  function openNode(nodeId: NodeId): void {
    if (!isNodeModuleRegistered(nodeId) || !state.unlocked.has(nodeId)) return;
    state.selectedNodeId = nodeId;
    state.screen = "node";
    state.notice = "";
    renderNodeHome(nodeId);
  }

  function renderNodeHome(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const progress = loadBrowserNodeProgress(userKey(), nodeId);
    const strategyStatus = loadBrowserStrategyStatus(userKey(), nodeId);
    const missions = loadBrowserMissions(userKey(), nodeId);
    const capacityStatus = progress.totalSessions > 0 ? "active" : "not-started";
    const nicheStatus = missions.some((mission) => mission.status === "planned") ? "planned" : missions.length ? "checked-in" : "none";

    root.innerHTML = shell(`
      <section class="panel node-hero">
        <button type="button" class="text-button" data-action="dashboard">← Back to network</button>
        <p class="section-kicker">${escapeHtml(module.shortTitle.toUpperCase())}</p>
        <h2>${escapeHtml(module.title)}</h2>
        <p>${escapeHtml(module.shortDescription)}</p>
        <div class="csn-row" aria-label="Capacity Strategy Niche progress">
          <span><strong>C</strong> ${escapeHtml(capacityStatus)}</span>
          <span><strong>S</strong> ${escapeHtml(strategyStatus)}</span>
          <span><strong>N</strong> ${escapeHtml(nicheStatus)}</span>
        </div>
      </section>

      <section class="journey-grid">
        <article class="panel journey-card">
          <p class="section-kicker">TRAIN</p>
          <h3>Capacity</h3>
          <p>${escapeHtml(PHASE_PUBLIC_LABELS[progress.phase])}</p>
          <p>${progress.totalSessions} / ${module.programmeSessions ?? "—"} sessions</p>
          <button type="button" class="platform-button" data-action="train">Train now</button>
        </article>
        <article class="panel journey-card">
          <p class="section-kicker">USE</p>
          <h3>Strategy</h3>
          <blockquote>${escapeHtml(module.strategy.handle)}</blockquote>
          <p>Learn when this operation should — and should not — be deliberately recruited.</p>
          <button type="button" class="platform-button secondary-button" data-action="strategy">Open strategy</button>
        </article>
        <article class="panel journey-card">
          <p class="section-kicker">APPLY</p>
          <h3>Niche mission</h3>
          <p>${missions.filter((mission) => mission.status === "planned").length} planned · ${missions.length} total</p>
          <p>Choose a real context and make the environment easier to use the policy in.</p>
          <button type="button" class="platform-button secondary-button" data-action="missions">Open missions</button>
        </article>
      </section>
    `);
    bindSharedActions();
    root.querySelector<HTMLButtonElement>("[data-action='train']")?.addEventListener("click", () => renderTraining(nodeId));
    root.querySelector<HTMLButtonElement>("[data-action='strategy']")?.addEventListener("click", () => renderStrategy(nodeId));
    root.querySelector<HTMLButtonElement>("[data-action='missions']")?.addEventListener("click", () => renderMissions(nodeId));
  }

  function renderStrategy(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const status = loadBrowserStrategyStatus(userKey(), nodeId);
    root.innerHTML = shell(`
      <section class="panel">
        <button type="button" class="text-button" data-action="node-home">← Back to ${escapeHtml(module.shortTitle)}</button>
        <p class="section-kicker">USE</p>
        <h2>${escapeHtml(module.strategy.handle)}</h2>
        <p>${escapeHtml(module.strategy.explanation)}</p>
        <div class="strategy-grid">
          <div>
            <h3>Use it when…</h3>
            ${listItems(module.strategy.targetCues)}
          </div>
          <div>
            <h3>Do not force it when…</h3>
            ${listItems(module.strategy.antiCues)}
          </div>
        </div>
        <h3>Worked examples</h3>
        <div class="example-grid">
          ${[...module.strategy.workedExamples, ...module.strategy.changedExamples].map((example) => `
            <article class="example-card">
              <strong>${escapeHtml(example.title)}</strong>
              <p>${escapeHtml(example.situation)}</p>
              <span>${example.usePolicy ? "Use this policy" : "Use a different policy"}</span>
              <p>${escapeHtml(example.explanation)}</p>
            </article>
          `).join("")}
        </div>
        <div class="button-row">
          <button type="button" class="platform-button" data-strategy-status="learned">${status === "learned" ? "Learned ✓" : "Mark as learned"}</button>
          <button type="button" class="platform-button secondary-button" data-strategy-status="practising">${status === "practising" ? "Practising ✓" : "Set as practising"}</button>
        </div>
      </section>
    `);
    bindSharedActions();
    root.querySelectorAll<HTMLButtonElement>("[data-strategy-status]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.strategyStatus === "practising" ? "practising" : "learned";
        saveBrowserStrategyStatus(userKey(), nodeId, next);
        state.notice = `Strategy status updated: ${next}.`;
        renderStrategy(nodeId);
      });
    });
  }

  function renderMissions(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const missions = loadBrowserMissions(userKey(), nodeId);
    root.innerHTML = shell(`
      <section class="panel">
        <button type="button" class="text-button" data-action="node-home">← Back to ${escapeHtml(module.shortTitle)}</button>
        <p class="section-kicker">APPLY</p>
        <h2>Choose a small real-life mission</h2>
        <p>A mission connects the trained operation to a real cue, action and environmental support. These check-ins are implementation feedback, not scientific proof of far transfer.</p>
        <div class="mission-grid">
          ${module.missions.map((mission) => `
            <article class="mission-card">
              <h3>${escapeHtml(mission.title)}</h3>
              <p><strong>Where:</strong> ${escapeHtml(mission.contextExample)}</p>
              <p><strong>When:</strong> ${escapeHtml(mission.targetCue)}</p>
              <p><strong>Use:</strong> ${escapeHtml(mission.intendedPolicy)}</p>
              <button type="button" class="platform-button secondary-button" data-plan-mission="${escapeHtml(mission.id)}">Plan this mission</button>
            </article>
          `).join("")}
        </div>
        <h3>Planned missions</h3>
        ${missions.length ? `<div class="planned-list">${missions.map((mission) => `<p><strong>${escapeHtml(mission.context)}</strong><br>${escapeHtml(mission.intendedPolicy)}</p>`).join("")}</div>` : `<p class="muted-copy">No missions planned yet.</p>`}
      </section>
    `);
    bindSharedActions();
    root.querySelectorAll<HTMLButtonElement>("[data-plan-mission]").forEach((button) => {
      button.addEventListener("click", () => {
        const template = module.missions.find((mission) => mission.id === button.dataset.planMission);
        if (!template) return;
        const mission: Mission = {
          id: randomId("mission"),
          nodeId,
          context: template.contextExample,
          targetCue: template.targetCue,
          intendedPolicy: template.intendedPolicy,
          nicheChangeType: template.suggestedNicheChanges?.[0] ?? "none",
          status: "planned",
          createdAt: new Date().toISOString(),
        };
        saveBrowserMission(userKey(), mission);
        state.notice = "Mission planned. You can refine context and reminders in the next platform slice.";
        renderMissions(nodeId);
      });
    });
  }

  function renderTraining(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const progress = loadBrowserNodeProgress(userKey(), nodeId);
    const wrapperMode = wrapperModeForPhase(progress.phase);
    const sessionId = randomId(`${nodeId}-session`);

    state.screen = "training";
    root.innerHTML = shell(`
      <section class="panel training-shell">
        <div class="session-heading">
          <div>
            <button type="button" class="text-button" data-action="node-home">← Exit session</button>
            <p class="section-kicker">TRAIN · ${escapeHtml(PHASE_PUBLIC_LABELS[progress.phase].toUpperCase())}</p>
            <h2>${escapeHtml(module.title)}</h2>
          </div>
          <button type="button" class="text-button" data-action="pause">Pause</button>
        </div>
        <div id="game-host"></div>
      </section>
    `);
    bindSharedActions();

    const host = root.querySelector<HTMLElement>("#game-host");
    if (!host) throw new Error("Missing game host.");

    let paused = false;
    root.querySelector<HTMLButtonElement>("[data-action='pause']")?.addEventListener("click", (event) => {
      const button = event.currentTarget;
      paused = !paused;
      if (paused) module.game.pause?.();
      else module.game.resume?.();
      button.textContent = paused ? "Resume" : "Pause";
    });

    module.game.onComplete?.((summary) => {
      const current = loadBrowserNodeProgress(userKey(), nodeId);
      const decision = recordProgressionSession(
        current,
        {
          summary,
          wrapperMode,
          dataQualityAdequate: summary.validTrials >= 10,
        },
        module.progression,
      );
      saveBrowserNodeProgress(userKey(), nodeId, decision.state);
      module.game.destroy();
      renderSessionSummary(nodeId, summary, decision);
    });

    module.game.createSession({
      nodeId,
      sessionId,
      phase: progress.phase,
      wrapperMode,
      targetMinutes: module.estimatedSessionMinutes,
      seed: sessionId,
    });
    module.game.mount(host);
    module.game.start();
  }

  function renderSessionSummary(
    nodeId: NodeId,
    summary: TrainingSummary,
    decision: ProgressionDecision,
  ): void {
    const module = getNodeModule(nodeId);
    root.innerHTML = shell(`
      <section class="panel session-complete-panel">
        <p class="section-kicker">SESSION COMPLETE</p>
        <h2>${escapeHtml(module.title)}</h2>
        <div class="metric-row">
          ${(summary.displayMetrics ?? []).map((metric) => `<span><strong>${escapeHtml(metric.label)}</strong><br>${escapeHtml(metric.value)}</span>`).join("")}
        </div>
        <p><strong>Next training state:</strong> ${escapeHtml(PHASE_PUBLIC_LABELS[decision.state.phase])}</p>
        <p class="muted-copy">${escapeHtml(decision.reason)}</p>
        <p class="boundary-note">Progression logic guides product practice. It is not a displayed scientific transfer score.</p>
        <div class="button-row">
          <button type="button" class="platform-button" data-action="node-home">Back to ${escapeHtml(module.shortTitle)}</button>
          <button type="button" class="platform-button secondary-button" data-action="strategy">Use the strategy</button>
        </div>
      </section>
    `);
    bindSharedActions();
    root.querySelector<HTMLButtonElement>("[data-action='strategy']")?.addEventListener("click", () => renderStrategy(nodeId));
  }

  function bindSharedActions(): void {
    root.querySelector<HTMLButtonElement>("[data-action='sign-out']")?.addEventListener("click", () => {
      void signOutPlatformUser();
    });
    root.querySelector<HTMLButtonElement>("[data-action='dashboard']")?.addEventListener("click", () => {
      state.screen = "dashboard";
      state.selectedNodeId = null;
      state.notice = "";
      renderDashboard();
    });
    root.querySelector<HTMLButtonElement>("[data-action='node-home']")?.addEventListener("click", () => {
      if (!state.selectedNodeId) return;
      if (state.screen === "training") {
        getNodeModule(state.selectedNodeId).game.destroy();
      }
      state.screen = "node";
      state.notice = "";
      renderNodeHome(state.selectedNodeId);
    });
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
      state.notice = error instanceof Error ? `Could not load entitlements: ${error.message}` : "Could not load entitlements.";
    }
  }

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
      state.screen = "dashboard";
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
