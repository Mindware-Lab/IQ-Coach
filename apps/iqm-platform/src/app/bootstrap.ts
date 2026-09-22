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
import {
  loadBrowserMissionCheckins,
  loadBrowserMissions,
  saveBrowserMission,
  saveBrowserMissionCheckin,
} from "../core/persistence/missions";
import {
  hasBankedMissionRule,
  hasSeenNodeChapter,
  hasSeenPlatformOrientation,
  loadBrowserBankedRules,
  markNodeChapterSeen,
  markPlatformOrientationSeen,
  saveBrowserBankedRule,
} from "../core/persistence/journey";
import { clearBrowserNodeProgress, loadBrowserNodeProgress, saveBrowserNodeProgress } from "../core/persistence/progress";
import { loadBrowserStrategyStatus, saveBrowserStrategyStatus } from "../core/persistence/strategy";
import { journeyStageStatuses, nextJourneyStage } from "../core/journey/engine";
import { isMissionCheckinComplete, recommendMissionFollowUp } from "../core/missions/engine";
import { recordProgressionSession } from "../core/progression/engine";
import { PHASE_PUBLIC_LABELS, wrapperModeForPhase } from "../core/progression/session";
import { NODE_CATALOGUE } from "../modules/catalogue";
import { getNodeModule, isNodeModuleRegistered } from "../modules/registry";
import { ATTENTION_QA_SEQUENCE } from "../modules/attention/module";
import { mountAttentionAiPractice } from "../modules/attention/aiPracticeView";
import type { TrainingSummary, WrapperMode } from "../types/game";
import type { BankedRule } from "../types/learning";
import type { Mission, MissionCheckin, MissionEffect, StrategyUse, EnvironmentHelp, MissionBarrier } from "../types/mission";
import type { JourneyBeat, JourneyBeatId, NodeId } from "../types/node";
import type { ProgressionDecision } from "../types/progression";

interface RuntimeState {
  selectedNodeId: NodeId | null;
  user: PlatformAuthUser | null;
  entitlements: EntitlementRecord[];
  unlocked: Set<NodeId>;
  authMessage: string;
  notice: string;
  gamePaused: boolean;
  strategyPage: number;
  missionPage: number;
}

interface NetworkNodeUi {
  label: string;
  shortLabel: string;
  x: number;
  y: number;
}

const NETWORK_NODE_UI: Record<NodeId, NetworkNodeUi> = {
  attention: { label: "Attention Control", shortLabel: "Attention", x: 50, y: 12 },
  "relational-memory": { label: "Relational Memory", shortLabel: "Relations", x: 79, y: 27 },
  "binding-memory": { label: "Binding Memory", shortLabel: "Binding", x: 86, y: 58 },
  "path-horizon": { label: "Path Horizon", shortLabel: "Path", x: 66, y: 83 },
  "knowledge-access": { label: "Knowledge Access", shortLabel: "Knowledge", x: 34, y: 83 },
  "generative-search": { label: "Generative Search", shortLabel: "Ideas", x: 14, y: 58 },
  reasoning: { label: "Reasoning", shortLabel: "Reasoning", x: 21, y: 27 },
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

function pagerMarkup(currentPage: number, totalPages: number): string {
  if (totalPages <= 1) return "";
  if (totalPages > 6) {
    return `<div class="screen-pager" aria-label="Page ${currentPage + 1} of ${totalPages}">Page ${currentPage + 1} of ${totalPages}</div>`;
  }
  return `<div class="screen-pager" aria-label="Page ${currentPage + 1} of ${totalPages}">
    ${Array.from({ length: totalPages }, (_, index) => `<span class="screen-pager-dot ${index === currentPage ? "is-active" : ""}" aria-hidden="true"></span>`).join("")}
    <span>${currentPage + 1}/${totalPages}</span>
  </div>`;
}

export async function bootstrap(root: HTMLElement): Promise<void> {
  const qaQuery = new URLSearchParams(window.location.search).has("attention-qa");
  const attentionQa = import.meta.env.VITE_IQM_ATTENTION_QA === "true" || qaQuery;
  const qaAccess = import.meta.env.VITE_IQM_QA_ACCESS === "true" || qaQuery;
  const localPreview =
    qaAccess ||
    (!isPlatformAuthConfigured &&
      (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"));

  const state: RuntimeState = {
    selectedNodeId: null,
    user: null,
    entitlements: [],
    unlocked: localPreview ? new Set<NodeId>(["attention"]) : new Set<NodeId>(),
    authMessage: "",
    notice: "",
    gamePaused: false,
    strategyPage: 0,
    missionPage: 0,
  };

  const userKey = (): string => state.user?.id ?? (qaAccess ? "qa-preview" : "local-preview");

  function accountMarkup(): string {
    if (localPreview) return `<div class="phase-pill">${qaAccess ? "QA access" : "Preview"}</div>`;
    if (!isPlatformAuthConfigured) return `<div class="phase-pill">Setup needed</div>`;
    if (!state.user) return "";
    return `<div class="account-chip"><span>${escapeHtml(state.user.email ?? "Signed in")}</span><button type="button" class="text-button" data-action="sign-out">Sign out</button></div>`;
  }

  function shell(body: string): string {
    return `<div class="app-shell">
      <header class="topbar">
        <div><p class="eyebrow">IQ MINDWARE</p><h1>Navigate possibility. Build intelligence.</h1><p class="lede">Turn possibility into agency.</p></div>
        ${accountMarkup()}
      </header>
      ${state.notice ? `<div class="notice">${escapeHtml(state.notice)}</div>` : ""}
      <main>${body}</main>
    </div>`;
  }

  function renderConfigurationError(): void {
    root.innerHTML = shell(`<section class="panel screen-panel"><p class="section-kicker">SETUP</p><h2>Sign-in is not ready yet</h2><p>Add the platform Supabase settings to enable accounts.</p></section>`);
  }

  function renderSignIn(): void {
    root.innerHTML = shell(`<section class="panel screen-panel auth-panel">
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

  function attentionQaStep(totalSessions: number): { wrapperMode: WrapperMode; label: string } | null {
    const wrapperMode = ATTENTION_QA_SEQUENCE[totalSessions] as WrapperMode | undefined;
    if (!wrapperMode) return null;
    if (wrapperMode === "B") return { wrapperMode, label: "Optic Flow perturbation" };
    if (wrapperMode === "C") return { wrapperMode, label: "Emotional Distractor perturbation" };
    return { wrapperMode, label: totalSessions === 0 ? "Core anchor" : "Core return" };
  }

  function recordAttentionQaSession(
    current: ReturnType<typeof loadBrowserNodeProgress>,
    summary: TrainingSummary,
    wrapperMode: WrapperMode,
  ): ProgressionDecision {
    const next = {
      ...current,
      phase: "A_TRAIN" as const,
      sessionsInPhase: 0,
      totalSessions: current.totalSessions + 1,
      aScores: [...current.aScores],
      bScores: [...current.bScores],
      aReopenScores: [...current.aReopenScores],
    };
    if (wrapperMode === "A") next.aScores.push(summary.progressionScore);
    if (wrapperMode === "B") next.bScores.push(summary.progressionScore);
    return {
      previousPhase: current.phase,
      nextPhase: next.phase,
      phaseChanged: current.phase !== next.phase,
      reason: "Forced APR QA sequence. Transition is for product testing, not plateau evidence.",
      state: next,
    };
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
    return `<div class="network-map" aria-label="Your seven-part adaptive intelligence network">
      <svg class="network-map-lines" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="36" class="network-ring" />
        ${Object.values(NETWORK_NODE_UI).map((ui) => `<line x1="50" y1="50" x2="${ui.x}" y2="${ui.y}" />`).join("")}
      </svg>
      <div class="network-hub"><strong>Adaptive</strong><span>IQ</span></div>
      ${NODE_CATALOGUE.map((node) => networkNode(node.id)).join("")}
    </div>`;
  }


  const ATTENTION_BEAT_ORDER: readonly JourneyBeatId[] = ["anchor", "perturb", "return", "salience", "bank"];

  function attentionJourneyBeat(sessionIndex: number): JourneyBeat | null {
    const journey = getNodeModule("attention").journey;
    if (!journey) return null;
    const id = ATTENTION_BEAT_ORDER[Math.max(0, Math.min(sessionIndex, ATTENTION_BEAT_ORDER.length - 1))];
    return journey.beats[id];
  }

  function journeySnapshot(nodeId: NodeId) {
    const progress = loadBrowserNodeProgress(userKey(), nodeId);
    const strategyStatus = loadBrowserStrategyStatus(userKey(), nodeId);
    const missions = loadBrowserMissions(userKey(), nodeId);
    const checkins = loadBrowserMissionCheckins(userKey(), nodeId);
    const bankedRules = loadBrowserBankedRules(userKey(), nodeId);
    const pendingMission = [...missions].reverse().find((mission) =>
      (mission.status === "planned" || mission.status === "reschedule") &&
      !checkins.some((checkin) => checkin.missionId === mission.id),
    );
    const unbankedMission = [...missions].reverse().find((mission) =>
      checkins.some((checkin) => checkin.missionId === mission.id) &&
      !hasBankedMissionRule(userKey(), nodeId, mission.id),
    );
    const input = {
      chapterSeen: hasSeenNodeChapter(userKey(), nodeId),
      sessionsCompleted: progress.totalSessions,
      strategyStarted: strategyStatus !== "not-started",
      missionsPlanned: missions.length,
      missionCheckins: checkins.length,
      bankedRules: bankedRules.length,
    };
    let nextStage = nextJourneyStage(input);
    if (pendingMission) nextStage = "review";
    else if (unbankedMission) nextStage = "bank";
    return { progress, strategyStatus, missions, checkins, bankedRules, pendingMission, unbankedMission, input, nextStage };
  }

  function journeyAction(nodeId: NodeId) {
    const module = getNodeModule(nodeId);
    const snapshot = journeySnapshot(nodeId);
    const chapter = module.journey;
    if (snapshot.nextStage === "understand") {
      return { kicker: "UNDERSTAND", title: chapter ? `Chapter ${chapter.chapterNumber} · ${chapter.chapterTitle}` : "Understand the skill", copy: chapter?.humanQuestion ?? module.shortDescription, label: "Start the chapter", attrs: 'data-action="chapter"' };
    }
    if (snapshot.nextStage === "train") {
      const beat = nodeId === "attention" ? attentionJourneyBeat(snapshot.progress.totalSessions) : null;
      return { kicker: "TRAIN", title: beat?.title ?? "Build the skill", copy: beat?.copy ?? module.shortDescription, label: "Train now", attrs: 'data-action="train"' };
    }
    if (snapshot.nextStage === "use") {
      return { kicker: "USE", title: "Turn the game into a portable move", copy: chapter?.portableMove ?? module.strategy.handle, label: "Learn the move", attrs: 'data-action="strategy"' };
    }
    if (snapshot.nextStage === "apply") {
      return { kicker: "REALITY", title: "Cross the reality boundary", copy: chapter?.realityPrompt ?? "Choose one small real situation where this skill matters.", label: "Choose a mission", attrs: 'data-action="missions"' };
    }
    if (snapshot.nextStage === "review" && snapshot.pendingMission) {
      return { kicker: "FEEDBACK", title: "What did reality say?", copy: `Review your mission: ${snapshot.pendingMission.context}`, label: "Check in", attrs: `data-mission-checkin="${escapeHtml(snapshot.pendingMission.id)}"` };
    }
    if (snapshot.nextStage === "bank" && snapshot.unbankedMission) {
      return { kicker: "BANK", title: "Keep what survived", copy: chapter?.bankPrompt ?? "Turn useful feedback into a reusable rule.", label: "Bank the learning", attrs: `data-bank-mission="${escapeHtml(snapshot.unbankedMission.id)}"` };
    }
    if (attentionQa && nodeId === "attention" && snapshot.progress.totalSessions >= ATTENTION_QA_SEQUENCE.length) {
      return { kicker: "CHAPTER COMPLETE", title: "Signal is now a portable idea", copy: "You have moved from an abstract Attention task through changed surfaces and back again. Use the AI niche challenge or another real mission to keep testing the rule.", label: "Try the AI niche challenge", attrs: 'data-action="ai-practice"' };
    }
    const beat = nodeId === "attention" ? attentionJourneyBeat(snapshot.progress.totalSessions) : null;
    return { kicker: "CONTINUE", title: beat?.title ?? "Continue the journey", copy: beat?.copy ?? "Return to training from a richer starting point.", label: "Continue training", attrs: 'data-action="train"' };
  }

  function journeyProgressMarkup(nodeId: NodeId): string {
    const snapshot = journeySnapshot(nodeId);
    const labels: Record<string, string> = {
      understand: "Understand",
      train: "Train",
      use: "Use",
      apply: "Apply",
      review: "Review",
    };
    return `<div class="journey-progress" aria-label="Adaptive journey progress">${journeyStageStatuses(snapshot.input).map((stage) =>
      `<span class="${stage.complete ? "is-complete" : ""} ${stage.current ? "is-current" : ""}"><b>${stage.complete ? "✓" : "•"}</b>${labels[stage.id]}</span>`
    ).join("")}</div>`;
  }

  function renderOrientation(): void {
    const attentionReady = state.unlocked.has("attention") && isNodeModuleRegistered("attention");
    root.innerHTML = shell(`<section class="panel screen-panel orientation-screen">
      <div class="orientation-copy">
        <p class="section-kicker">ADAPTIVE INTELLIGENCE</p>
        <h2>Navigate possibility.<br>Build intelligence.</h2>
        <p class="orientation-agency">Turn possibility into agency.</p>
        <p>Modern life gives us more information, tools, connections and possible paths than ever before. Synergy IQ trains the capacities that help you navigate that abundance — then teaches you how to recognise and use those capacities outside the game.</p>
        <div class="orientation-flow" aria-label="The Synergy IQ learning loop">
          <span>TRAIN A CAPACITY</span><b>→</b><span>EXTRACT THE MOVE</span><b>→</b><span>USE IT IN CONTEXT</span><b>→</b><span>LET REALITY ANSWER</span><b>→</b><span>BANK WHAT SURVIVES</span>
        </div>
      </div>
      <div class="orientation-actions">
        ${attentionReady ? '<button type="button" class="platform-button" data-action="orientation-attention">Begin with Attention Control</button>' : ""}
        <button type="button" class="platform-button secondary-button" data-action="orientation-dashboard">Explore my network</button>
      </div>
    </section>`);
  }

  function renderChapterIntro(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    if (!module.journey) {
      markNodeChapterSeen(userKey(), nodeId);
      renderNodeHome(nodeId);
      return;
    }
    const journey = module.journey;
    root.innerHTML = shell(`<section class="panel screen-panel chapter-screen">
      <button type="button" class="text-button" data-action="dashboard">← Network</button>
      <div class="chapter-lockup">
        <p class="section-kicker">CHAPTER ${escapeHtml(journey.chapterNumber)} · ${escapeHtml(journey.chapterTitle.toUpperCase())}</p>
        <h2>${escapeHtml(journey.worldviewHook)}</h2>
        <div class="chapter-question"><span>THE QUESTION</span><strong>${escapeHtml(journey.humanQuestion)}</strong></div>
        <p>${escapeHtml(journey.abstractRationale)}</p>
        <blockquote>${escapeHtml(journey.portableMove)}</blockquote>
      </div>
      <div class="screen-footer"><span class="muted-copy">The scored game stays separate from these strategy and real-world layers.</span><button type="button" class="platform-button" data-action="chapter-begin">Start the journey →</button></div>
    </section>`);
  }

  function renderDashboard(): void {
    state.selectedNodeId = null;
    state.strategyPage = 0;
    state.missionPage = 0;
    const attentionReady = state.unlocked.has("attention") && isNodeModuleRegistered("attention");
    const attentionProgress = loadBrowserNodeProgress(userKey(), "attention");
    root.innerHTML = shell(`
      <section class="panel today-panel">
        <div class="today-copy"><p class="section-kicker">TODAY</p><h2>${attentionReady ? "Train Attention" : "Choose your first coach"}</h2>
          ${attentionReady ? `<p>${escapeHtml(attentionQa ? (attentionQaStep(attentionProgress.totalSessions)?.label ?? "QA programme complete") : PHASE_PUBLIC_LABELS[attentionProgress.phase])} · Session ${Math.min(attentionProgress.totalSessions + 1, attentionQa ? ATTENTION_QA_SEQUENCE.length : attentionProgress.totalSessions + 1)}</p>` : `<p>Start with one skill and build from there.</p>`}
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

  function attentionQaJourneyMarkup(totalSessions: number): string {
    if (!attentionQa) return "";
    const labels = ["Core", "Optic", "Return", "Emotion", "Return"];
    const icons = ["◎", "↗", "↩", "◉", "↩"];
    return `<div class="apr-journey" aria-label="Five-session Attention QA journey">
      <div class="apr-journey-head"><span><strong>APR walkthrough</strong> · QA forced sequence</span><span>${Math.min(totalSessions, 5)}/5 complete</span></div>
      <div class="apr-rail">${labels.map((label, index) => {
        const stateClass = index < totalSessions ? "is-complete" : index === totalSessions ? "is-current" : "is-upcoming";
        return `<div class="apr-step ${stateClass}"><span class="apr-dot">${index < totalSessions ? "✓" : icons[index]}</span><span>${label}</span></div>`;
      }).join("")}</div>
    </div>`;
  }
  function renderNodeHome(nodeId: NodeId): void {
    if (!isNodeModuleRegistered(nodeId) || !state.unlocked.has(nodeId)) return;
    state.selectedNodeId = nodeId;
    state.strategyPage = 0;
    state.missionPage = 0;
    const module = getNodeModule(nodeId);
    const progress = loadBrowserNodeProgress(userKey(), nodeId);
    const strategyStatus = loadBrowserStrategyStatus(userKey(), nodeId);
    const missions = loadBrowserMissions(userKey(), nodeId);
    const capacityStatus = progress.totalSessions > 0 ? "In progress" : "Ready";
    const nicheStatus = missions.some((mission) => mission.status === "planned") ? "Planned" : missions.length ? "Started" : "Ready";
    const strategyLabel = strategyStatus === "not-started" ? "Ready" : strategyStatus === "practising" ? "Practising" : "Learned";
    root.innerHTML = shell(`
      <section class="node-home-screen">
      <section class="panel node-hero node-hero-${nodeId}"><button type="button" class="text-button" data-action="dashboard">← Network</button><p class="section-kicker">${escapeHtml(module.shortTitle.toUpperCase())}</p><h2>${escapeHtml(module.title)}</h2><p>${escapeHtml(module.shortDescription)}</p>
        <div class="csn-row"><span><strong>Train</strong>${escapeHtml(capacityStatus)}</span><span><strong>Use</strong>${escapeHtml(strategyLabel)}</span><span><strong>Apply</strong>${escapeHtml(nicheStatus)}</span></div>${nodeId === "attention" ? attentionQaJourneyMarkup(progress.totalSessions) : ""}</section>
      <section class="journey-grid">
        <article class="panel journey-card journey-train"><div class="journey-card-top"><span class="journey-icon" aria-hidden="true">◎</span><span class="journey-badge">ADAPTIVE</span></div><p class="section-kicker">TRAIN</p><h3>Build the skill</h3><p>${attentionQa && nodeId === "attention" ? escapeHtml(attentionQaStep(progress.totalSessions)?.label ?? "Five-session QA complete") : escapeHtml(PHASE_PUBLIC_LABELS[progress.phase])}</p><button type="button" class="platform-button" data-action="${attentionQa && nodeId === "attention" && progress.totalSessions >= ATTENTION_QA_SEQUENCE.length ? "reset-attention-qa" : "train"}">${attentionQa && nodeId === "attention" && progress.totalSessions >= ATTENTION_QA_SEQUENCE.length ? "Restart QA" : "Train now"}</button></article>
        <article class="panel journey-card journey-use"><div class="journey-card-top"><span class="journey-icon" aria-hidden="true">✦</span><span class="journey-badge">TRANSFER CUE</span></div><p class="section-kicker">USE</p><h3>Make it portable</h3><blockquote>${escapeHtml(module.strategy.handle)}</blockquote><button type="button" class="platform-button secondary-button" data-action="strategy">Learn the cue</button></article>
        <article class="panel journey-card journey-apply"><div class="journey-card-top"><span class="journey-icon" aria-hidden="true">AI</span><span class="journey-badge">HUMAN × AI</span></div><p class="section-kicker">APPLY</p><h3>Try it for real</h3><p>${nodeId === "attention" ? "Practise finding the signal with AI, or choose a real-life mission." : (missions.filter((mission) => mission.status === "planned").length ? "Mission ready" : "Choose one small mission")}</p><div class="journey-button-stack">${nodeId === "attention" ? `<button type="button" class="platform-button" data-action="ai-practice">AI practice</button>` : ""}<button type="button" class="platform-button secondary-button" data-action="missions">Pick a mission</button></div></article>
      </section>
      ${nodeId === "attention" ? `<section class="attention-product-strip"><article><span class="product-strip-icon">◈</span><div><strong>Arena</strong><small>Leaderboard competitions · 3 official attempts</small></div><span class="soft-chip">Preview</span></article><article><span class="product-strip-icon">↗</span><div><strong>Transfer view</strong><small>Recovery and frontier signals</small></div><span class="soft-chip">QA</span></article><article><span class="product-strip-icon">G</span><div><strong>Independent check</strong><small>Kept separate from game performance</small></div><span class="soft-chip">G Track</span></article></section>` : ""}
      </section>`);
  }

  function renderStrategy(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const status = loadBrowserStrategyStatus(userKey(), nodeId);
    const examples = [...module.strategy.workedExamples, ...module.strategy.changedExamples];
    const examplesPerPage = window.innerWidth <= 560 ? 1 : 2;
    const examplePageCount = Math.max(1, Math.ceil(examples.length / examplesPerPage));
    const totalPages = 1 + examplePageCount;
    state.strategyPage = Math.max(0, Math.min(state.strategyPage, totalPages - 1));
    const page = state.strategyPage;

    const pageContent = page === 0
      ? `<div class="screen-content">
          <h2>${escapeHtml(module.strategy.handle)}</h2>
          <p class="strategy-explanation">${escapeHtml(module.strategy.explanation)}</p>
          <div class="strategy-grid"><div><h3>Use it when…</h3>${listItems(module.strategy.targetCues)}</div><div><h3>Skip it when…</h3>${listItems(module.strategy.antiCues)}</div></div>
        </div>`
      : (() => {
          const start = (page - 1) * examplesPerPage;
          const pageExamples = examples.slice(start, start + examplesPerPage);
          return `<div class="screen-content">
            <h2>Try it in different situations</h2>
            <p class="muted-copy">The cue matters more than the surface details.</p>
            <div class="example-grid">${pageExamples.map((example) => `<article class="example-card"><strong>${escapeHtml(example.title)}</strong><p>${escapeHtml(example.situation)}</p><span>${example.usePolicy ? "Use it" : "Try something else"}</span><p>${escapeHtml(example.explanation)}</p></article>`).join("")}</div>
          </div>`;
        })();

    const previous = page > 0
      ? `<button type="button" class="platform-button secondary-button compact-button" data-strategy-page="${page - 1}">← Back</button>`
      : `<span aria-hidden="true"></span>`;
    const next = page < totalPages - 1
      ? `<button type="button" class="platform-button compact-button" data-strategy-page="${page + 1}">Next →</button>`
      : `<div class="strategy-status-actions"><button type="button" class="platform-button compact-button" data-strategy-status="learned">${status === "learned" ? "Got it ✓" : "I get it"}</button><button type="button" class="platform-button secondary-button compact-button" data-strategy-status="practising">${status === "practising" ? "Practising ✓" : "Practise"}</button></div>`;

    root.innerHTML = shell(`<section class="panel screen-panel strategy-screen">
      <button type="button" class="text-button" data-action="node-home">← ${escapeHtml(module.shortTitle)}</button>
      <p class="section-kicker">USE</p>
      ${pageContent}
      <div class="screen-footer">${previous}${pagerMarkup(page, totalPages)}${next}</div>
    </section>`);
  }

  function renderMissions(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const missions = loadBrowserMissions(userKey(), nodeId);
    const savedPerPage = 2;
    const savedPageCount = Math.max(1, Math.ceil(missions.length / savedPerPage));
    const firstSavedPage = module.missions.length;
    const totalPages = firstSavedPage + savedPageCount;
    state.missionPage = Math.max(0, Math.min(state.missionPage, totalPages - 1));
    const page = state.missionPage;

    let pageContent = "";
    if (page < firstSavedPage) {
      const mission = module.missions[page];
      pageContent = `<div class="screen-content">
        <h2>Pick one small real-life mission</h2><p class="muted-copy">Choose something easy to notice and easy to try.</p>
        <div class="mission-grid"><article class="mission-card"><h3>${escapeHtml(mission.title)}</h3><p>${escapeHtml(mission.contextExample)}</p><button type="button" class="platform-button secondary-button" data-plan-mission="${escapeHtml(mission.id)}">Choose this</button></article></div>
      </div>`;
    } else {
      const savedIndex = page - firstSavedPage;
      const savedChunk = missions.slice(savedIndex * savedPerPage, (savedIndex + 1) * savedPerPage);
      pageContent = `<div class="screen-content">
        <h2>Your missions</h2><p class="muted-copy">Small, cue-linked practice keeps the skill connected to real life.</p>
        ${savedChunk.length ? `<div class="planned-list">${savedChunk.map((mission) => `<p><strong>${escapeHtml(mission.context)}</strong><br>${escapeHtml(mission.intendedPolicy)}</p>`).join("")}</div>` : `<p class="muted-copy">Nothing planned yet.</p>`}
      </div>`;
    }

    const previous = page > 0
      ? `<button type="button" class="platform-button secondary-button compact-button" data-mission-page="${page - 1}">← Back</button>`
      : `<span aria-hidden="true"></span>`;
    const next = page < totalPages - 1
      ? `<button type="button" class="platform-button compact-button" data-mission-page="${page + 1}">Next →</button>`
      : `<span aria-hidden="true"></span>`;

    root.innerHTML = shell(`<section class="panel screen-panel mission-screen">
      <button type="button" class="text-button" data-action="node-home">← ${escapeHtml(module.shortTitle)}</button><p class="section-kicker">APPLY</p>
      ${pageContent}
      <div class="screen-footer">${previous}${pagerMarkup(page, totalPages)}${next}</div>
    </section>`);
  }

  function renderAiPractice(): void {
    state.selectedNodeId = "attention";
    root.innerHTML = shell(`<section class="panel screen-panel ai-practice-screen"><button type="button" class="text-button" data-action="node-home">← Attention</button><div id="attention-ai-practice" class="ai-practice-host"></div></section>`);
    const host = root.querySelector<HTMLElement>("#attention-ai-practice");
    if (!host) throw new Error("Missing Attention AI practice host.");
    mountAttentionAiPractice(host);
  }
  function renderTrainingIntro(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const progress = loadBrowserNodeProgress(userKey(), nodeId);
    const qaStep = attentionQa && nodeId === "attention" ? attentionQaStep(progress.totalSessions) : null;
    const sessionNumber = progress.totalSessions + 1;
    let title = "Ready to train?";
    let copy = "Stay with the task goal and let the difficulty adapt around you.";
    let invariant = "The target operation stays the same.";
    if (qaStep?.wrapperMode === "A" && sessionNumber === 1) {
      title = "Build your core";
      copy = "This is the stable Attention game we return to after each challenge.";
      invariant = "Find whether the majority of signals point IN or OUT.";
    } else if (qaStep?.wrapperMode === "B") {
      title = "Same skill. New surface.";
      copy = "Static arrows become optic-flow motion for one session. The visual carrier changes; the majority relation does not.";
      invariant = "Keep extracting the same IN / OUT majority relation.";
    } else if (qaStep?.wrapperMode === "C") {
      title = "Hold the goal under salience";
      copy = "Faces will compete for attention, but they never contain information needed for the answer.";
      invariant = "Ignore the face. Use only the arrow majority.";
    } else if (qaStep?.wrapperMode === "A") {
      title = "Return to the core";
      copy = "You are back on the stable game. This is where the full protocol measures recovery and possible frontier extension.";
      invariant = "Recover the same IN / OUT majority operation.";
    }
    root.innerHTML = shell(`<section class="panel screen-panel session-preflight">
      <button type="button" class="text-button" data-action="node-home">← Attention</button>
      <div class="preflight-stage"><span class="preflight-index">${sessionNumber}</span><span>SESSION ${sessionNumber}${attentionQa && nodeId === "attention" ? " OF 5" : ""}</span></div>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(copy)}</p>
      <div class="preflight-invariant"><span>WHAT STAYS</span><strong>${escapeHtml(invariant)}</strong></div>
      ${nodeId === "attention" ? attentionQaJourneyMarkup(progress.totalSessions) : ""}
      <div class="preflight-footer"><span class="muted-copy">About ${escapeHtml(module.estimatedSessionMinutes)} min in this QA build</span><button type="button" class="platform-button" data-action="start-session">Start session →</button></div>
    </section>`);
  }
  function renderTraining(nodeId: NodeId): void {
    const module = getNodeModule(nodeId);
    const progress = loadBrowserNodeProgress(userKey(), nodeId);
    const qaStep = attentionQa && nodeId === "attention" ? attentionQaStep(progress.totalSessions) : null;
    if (attentionQa && nodeId === "attention" && !qaStep) {
      state.notice = "Five-session Attention QA programme complete. Restart it from the Attention screen if you want another run.";
      renderNodeHome(nodeId);
      return;
    }
    const wrapperMode = qaStep?.wrapperMode ?? wrapperModeForPhase(progress.phase);
    const sessionId = randomId(`${nodeId}-session`);
    state.gamePaused = false;
    root.innerHTML = shell(`<section class="panel training-shell"><div class="session-heading"><div><button type="button" class="text-button" data-action="node-home">← Exit</button><p class="section-kicker">TRAIN · SESSION ${Math.min(progress.totalSessions + 1, attentionQa && nodeId === "attention" ? 5 : progress.totalSessions + 1)}${attentionQa && nodeId === "attention" ? " / 5" : ""}</p><h2>${escapeHtml(module.title)}</h2><p class="training-context">${escapeHtml(attentionQa && nodeId === "attention" ? (qaStep?.label ?? "") : PHASE_PUBLIC_LABELS[progress.phase])}</p></div><button type="button" class="text-button pause-control" data-action="pause">Pause</button></div><div id="game-host"></div></section>`);
    const host = root.querySelector<HTMLElement>("#game-host");
    if (!host) throw new Error("Missing game host.");
    module.game.onComplete?.((summary) => {
      const current = loadBrowserNodeProgress(userKey(), nodeId);
      const decision = attentionQa && nodeId === "attention"
        ? recordAttentionQaSession(current, summary, wrapperMode)
        : recordProgressionSession(current, { summary, wrapperMode, dataQualityAdequate: summary.validTrials >= 10 }, module.progression);
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
    root.innerHTML = shell(`<section class="panel screen-panel session-complete-panel"><p class="section-kicker">DONE</p><h2>Nice work</h2>
      <div class="metric-row">${(summary.displayMetrics ?? []).map((metric) => `<span><strong>${escapeHtml(metric.label)}</strong><br>${escapeHtml(metric.value)}</span>`).join("")}</div>
      <p><strong>Next:</strong> ${escapeHtml(attentionQa && nodeId === "attention" ? (attentionQaStep(decision.state.totalSessions)?.label ?? "QA programme complete") : PHASE_PUBLIC_LABELS[decision.state.phase])}</p><p class="muted-copy">${attentionQa && nodeId === "attention" ? "QA transitions are forced so you can inspect the whole APR sequence quickly." : "Your training path adapts as you go."}</p>
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
    const target = rawTarget.closest<HTMLElement>("[data-action], [data-open-node], [data-plan-mission], [data-strategy-status], [data-strategy-page], [data-mission-page]");
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
      renderTrainingIntro(state.selectedNodeId);
      return;
    }
    if (action === "start-session" && state.selectedNodeId) {
      renderTraining(state.selectedNodeId);
      return;
    }
    if (action === "ai-practice" && state.selectedNodeId === "attention") {
      renderAiPractice();
      return;
    }
    if (action === "reset-attention-qa") {
      clearBrowserNodeProgress(userKey(), "attention");
      state.notice = "Attention QA progress reset.";
      renderNodeHome("attention");
      return;
    }
    if (action === "strategy" && state.selectedNodeId) {
      state.strategyPage = 0;
      renderStrategy(state.selectedNodeId);
      return;
    }
    if (action === "missions" && state.selectedNodeId) {
      state.missionPage = 0;
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

    const strategyPage = target.dataset.strategyPage;
    if (strategyPage !== undefined && state.selectedNodeId) {
      state.strategyPage = Number.parseInt(strategyPage, 10) || 0;
      renderStrategy(state.selectedNodeId);
      return;
    }

    const missionPage = target.dataset.missionPage;
    if (missionPage !== undefined && state.selectedNodeId) {
      state.missionPage = Number.parseInt(missionPage, 10) || 0;
      renderMissions(state.selectedNodeId);
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
      state.missionPage = module.missions.length;
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
      state.strategyPage = 0;
      state.missionPage = 0;
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
