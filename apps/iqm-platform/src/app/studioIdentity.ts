import { NODE_ORDER, NODE_WORLDS } from './studioModel';
import type { NodeId } from '../types/node';

// The approved orbital collection mark is NOT the Attention target icon.
// These lines express a brand, not measured cognitive connections.
export const COLLECTION_LINKS: readonly (readonly [number, number])[] = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[0,3],[0,4],[1,5],[2,6],
];
export const TARGET_PATH = '<circle cx="12" cy="12" r="7.4"/><circle cx="12" cy="12" r="2.8"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>';
const NODE_DETAILS: Record<NodeId, { tagline: string; glyph: string }> = {
  attention: { tagline:'Find the signal.', glyph:TARGET_PATH },
  'relational-memory': { tagline:'Keep the structure.', glyph:'<circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 8-4 7m8-7 4 7M8 18h8"/>' },
  'binding-memory': { tagline:'Keep context connected.', glyph:'<rect x="3" y="3" width="12" height="12" rx="4"/><rect x="9" y="9" width="12" height="12" rx="4"/>' },
  'path-horizon': { tagline:'See where paths lead.', glyph:'<path d="M4 20v-5h6v-5h7V4m-4 3 4-4 4 4"/>' },
  'knowledge-access': { tagline:'Bring knowledge back.', glyph:'<path d="M12 5c-3-2-6-2-9-1v15c4-1 6 0 9 2 3-2 6-3 9-2V4c-3-1-6-1-9 1v16"/>' },
  'generative-search': { tagline:'Open new possibilities.', glyph:'<path d="M4 20C18 20 22 10 20 3 10 1 2 6 4 20zm0 0L16 8"/>' },
  reasoning: { tagline:'Test what follows.', glyph:'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>' },
};
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function nodeIdentity(node: NodeId) {
  const index = NODE_ORDER.indexOf(node);
  if (index < 0) throw new Error('Unknown capacity identity');
  const world = NODE_WORLDS[node];
  return { title:world.title, identity:world.accent, deep:world.action, ...NODE_DETAILS[node], number:String(index + 1).padStart(2, '0') };
}
export function collectionMarkMarkup(): string {
  const points = NODE_ORDER.map((_, i) => {
    const angle = i * Math.PI * 2 / 7 - Math.PI / 2;
    return [48 + 36 * Math.cos(angle), 48 + 36 * Math.sin(angle)].map(v => v.toFixed(3));
  });
  const paths = COLLECTION_LINKS.map(([a,b]) => `<path d="M${points[a].join(' ')}L${points[b].join(' ')}"/>`).join('');
  const dots = NODE_ORDER.map((n,i) => `<circle data-capacity="${n}" cx="${points[i][0]}" cy="${points[i][1]}" r="7.7" fill="${NODE_WORLDS[n].accent}"/>`).join('');
  return `<svg class="st-collection-mark" data-brand="seven-node-orbital" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><g fill="none" stroke="#8AABC4" stroke-width="1.7" stroke-opacity=".72" stroke-linecap="round">${paths}</g><g stroke="#FFFFFF" stroke-width="1.2">${dots}</g></svg>`;
}
export function nodeGlyphMarkup(node: NodeId): string {
  return `<svg class="st-capacity-glyph" data-capacity-icon="${node}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${NODE_DETAILS[node].glyph}</svg>`;
}
export function nodeIdentityMarkup(node: NodeId): string {
  const n = nodeIdentity(node);
  return `<div class="st-node-identity" data-capacity="${node}" aria-label="Node ${n.number}: ${escape(n.title)}" style="--identity:${n.identity};--identity-deep:${n.deep}"><span class="st-node-badge">${nodeGlyphMarkup(node)}</span><div class="st-node-lockup"><span class="st-node-number">Node ${n.number}</span><strong class="st-node-title">${escape(n.title)}</strong></div><p class="st-node-tagline">${escape(n.tagline)}</p></div>`;
}

// Only explicitly authored interface labels are renamed; user notes, form values,
// routes, storage keys and the historical chapter-completion flags are untouched.
const LABELS = new Map([
  ['Begin your chapter','Begin this node'],
  ['Open this chapter','Open this node'],
  ['Begin the chapter','Begin the node'],
  ['Replay this chapter','Replay node introduction'],
]);
export const publicNodeLabel = (label: string) => LABELS.get(label) ?? label;
const NODE_SCREENS = new Set(['home','chapter','briefing','result','move','examples','contexts','scenario','ai','mission','mission-saved','checkin','bank','rules','more']);

export function applyStudioIdentity(root: HTMLElement): void {
  const shell = root.querySelector<HTMLElement>(':scope > .studio[data-screen][data-node]');
  if (!shell || shell.dataset.identityReady === 'true') return;
  const node = shell.dataset.node as NodeId;
  if (!Object.prototype.hasOwnProperty.call(NODE_DETAILS, node)) return;
  const screen = shell.dataset.screen!;
  const n = nodeIdentity(node);
  shell.dataset.identityReady = 'true';
  const brand = shell.querySelector<HTMLElement>('.st-brand');
  if (brand) {
    brand.innerHTML = `<span class="st-brand-mark">${collectionMarkMarkup()}</span><span class="st-brand-wordmark">Synergy <b>IQ</b><small>IQ MINDWARE</small></span>`;
  }
  const context = shell.querySelector<HTMLElement>('.st-top-context');
  if (context) {
    if (screen === 'training') {
      context.classList.add('st-training-node');
      context.innerHTML = `<span class="st-training-node-icon" style="--identity:${n.identity}">${nodeGlyphMarkup(node)}</span><span><small>Node ${n.number}</small><strong>${escape(n.title)}</strong></span>`;
    } else context.textContent = screen === 'welcome' ? 'Seven connected capacities' : 'The collection';
  }
  // Active training keeps the same header height and task viewport. No added band.
  if (screen === 'training') return;
  const main = shell.querySelector<HTMLElement>(':scope > .st-main');
  if (main && NODE_SCREENS.has(screen)) {
    const holder = document.createElement('div');
    holder.innerHTML = nodeIdentityMarkup(node);
    shell.insertBefore(holder.firstElementChild!, main);
  }
  shell.querySelectorAll<HTMLElement>('.st-node[data-do^="node:"] > span').forEach(span => {
    const id = span.parentElement?.dataset.do?.slice(5) as NodeId;
    if (Object.prototype.hasOwnProperty.call(NODE_DETAILS,id)) span.innerHTML = nodeGlyphMarkup(id);
  });
  // Preserve the pending-mission icon; the non-interactive attention reminder uses
  // the active capacity symbol and colour, never the old orange arrow.
  shell.querySelectorAll<HTMLElement>('.st-checkin-card:not(button) .st-checkin-icon').forEach(span => { span.innerHTML = nodeGlyphMarkup(node); });
  shell.querySelectorAll<HTMLElement>('.st-utility-list [data-do="briefing"] > span').forEach(span => { span.innerHTML = nodeGlyphMarkup(node); });
  if (node === 'attention') {
    shell.querySelectorAll<SVGElement>('.st-example-card > svg').forEach(svg => {
      if (svg.querySelector('path')?.getAttribute('d') === 'M12 20V4m-6 6 6-6 6 6') {
        const holder = document.createElement('span'); holder.innerHTML = nodeGlyphMarkup(node); svg.replaceWith(holder.firstElementChild!);
      }
    });
  }
  const overline = shell.querySelector<HTMLElement>('.st-card-overline');
  if (overline) overline.textContent = `${n.title} · Node ${n.number}`;
  shell.querySelectorAll<HTMLElement>('[data-do="chapter"], [data-do="chapter-begin"], [data-do="continue"]').forEach(el => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let text: Node | null;
    while ((text = walker.nextNode())) {
      const value = text.nodeValue ?? '', trimmed = value.trim(), replacement = publicNodeLabel(trimmed);
      if (replacement !== trimmed) text.nodeValue = value.replace(trimmed,replacement);
    }
  });
}

export function mountStudioIdentity(root: HTMLElement): () => void {
  // Observe only view replacement at #app. Never observe the game, instructional
  // stimuli, AI exercises, or user forms as a subtree, and never run per trial.
  const observer = new MutationObserver(() => applyStudioIdentity(root));
  observer.observe(root, { childList: true });
  applyStudioIdentity(root);
  return () => observer.disconnect();
}
