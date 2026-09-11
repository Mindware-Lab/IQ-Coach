import { NODE_CATALOGUE } from "../modules/catalogue";

function nodeCard(title: string, description: string): string {
  return `
    <article class="node-card" aria-disabled="true">
      <div class="node-dot" aria-hidden="true"></div>
      <div>
        <h3>${title}</h3>
        <p>${description}</p>
        <span class="node-state">Module not yet connected</span>
      </div>
    </article>
  `;
}

export function bootstrap(root: HTMLElement): void {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">IQ MINDWARE</p>
          <h1>Your cognitive training network</h1>
          <p class="lede">One shared platform for six separately unlockable training modules.</p>
        </div>
        <div class="phase-pill">Phase-1 platform shell</div>
      </header>

      <main>
        <section class="panel today-panel">
          <p class="section-kicker">TODAY</p>
          <h2>Shared platform setup</h2>
          <p>The shell is ready for the first node adapter. Product progression will use the approved A → B → A-return/reopen → A/B sequence.</p>
        </section>

        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="section-kicker">MY NETWORK</p>
              <h2>Six-node platform</h2>
            </div>
            <p class="boundary-note">Network lines are conceptual only. Phase 1 does not display personalised causal edges or synergy scores.</p>
          </div>
          <div class="node-grid">
            ${NODE_CATALOGUE.map((node) => nodeCard(node.title, node.shortDescription)).join("")}
          </div>
        </section>

        <section class="panel gtrack-panel">
          <p class="section-kicker">G TRACK</p>
          <h2>Independent measurement surface</h2>
          <p>G Track results will live at platform level and remain separate from node training performance.</p>
        </section>
      </main>
    </div>
  `;
}
