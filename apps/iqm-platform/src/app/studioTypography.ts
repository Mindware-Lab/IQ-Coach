/**
 * Presentation only. Match IQ Mindware's editorial title rhythm without changing
 * wording, navigation, task stimuli or results. View replacement (including the
 * separately mounted AI exercise) is observed only to decorate new headings.
 */
export interface HeadingAccent {
  phrase: string;
  newLine?: boolean;
  underline?: boolean;
}

const ACCENTS: Readonly<Record<string, HeadingAccent>> = {
  'Navigate possibility. Build intelligence.': { phrase: 'Build intelligence.', newLine: true, underline: true },
  'What matters now?': { phrase: 'matters now?', underline: true },
  'Find the signal.': { phrase: 'the signal.', underline: true },
  'Your next move.': { phrase: 'next move.', underline: true },
  'Your thinking network.': { phrase: 'thinking network.', underline: true },
  'Same skill. New surface.': { phrase: 'New surface.', newLine: true, underline: true },
  'Vivid is not always useful.': { phrase: 'not always useful.', underline: true },
  'Can you recover the signal?': { phrase: 'recover the signal?', underline: true },
  'Return. Keep what survives.': { phrase: 'Keep what survives.', newLine: true, underline: true },
  'Find the relation across change.': { phrase: 'across change.', underline: true },
  'You showed up. Now take something with you.': { phrase: 'take something with you.', underline: true },
  'Your first result is ahead.': { phrase: 'ahead.', underline: true },
  'A simple rule. A deliberate choice.': { phrase: 'A deliberate choice.', newLine: true, underline: true },
  'Try it here.': { phrase: 'here.', underline: true },
  'A feed with a purpose.': { phrase: 'a purpose.', underline: true },
  'A busy workspace.': { phrase: 'workspace.', underline: true },
  'Choose something that matters.': { phrase: 'that matters.', underline: true },
  'Give the move a place to happen.': { phrase: 'a place to happen.', underline: true },
  'What did reality say?': { phrase: 'reality say?', underline: true },
  'What would you keep?': { phrase: 'keep?', underline: true },
  'My adaptive rules.': { phrase: 'adaptive rules.', underline: true },
  'Keep the useful things close.': { phrase: 'useful things', underline: true },
  'Can you find the signal before the tool does?': { phrase: 'find the signal', underline: true },
  'AI expands the search. You keep the goal.': { phrase: 'You keep the goal.', newLine: true, underline: true },
  'What remains without the scaffold?': { phrase: 'without the scaffold?', underline: true },
  'The signal survived the scaffold': { phrase: 'signal survived', underline: true },
  'What is connected to what?': { phrase: 'connected to what?' },
  'What belongs with what?': { phrase: 'belongs with what?' },
  'Where might this lead?': { phrase: 'might this lead?' },
  'What do I already know?': { phrase: 'already know?' },
  'What else could be true?': { phrase: 'else could be true?' },
  'What actually follows?': { phrase: 'actually follows?' },
  'One connected journey.': { phrase: 'connected journey.' },
  'Pause. Find the signal. Commit.': { phrase: 'Find the signal.' },
};

/** Exact copy keys avoid styling arbitrary user content or changing its meaning. */
export function headingAccent(text: string): HeadingAccent | null {
  return Object.prototype.hasOwnProperty.call(ACCENTS, text) ? ACCENTS[text] : null;
}

export function headingSegments(text: string): { before: string; accent: string; after: string } | null {
  const plan = headingAccent(text);
  if (!plan) return null;
  const index = text.indexOf(plan.phrase);
  if (index < 0) return null;
  return { before: text.slice(0, index), accent: plan.phrase, after: text.slice(index + plan.phrase.length) };
}

export function mountStudioTypography(root: HTMLElement): () => void {
  const refresh = () => {
    const studio = root.querySelector<HTMLElement>('.studio');
    // Do no work inside active gameplay: even the instructional renderer is excluded.
    if (!studio || studio.classList.contains('st-training')) return;
    studio.querySelectorAll<HTMLElement>('.st-main h2, .st-main h3, .st-next-card > strong').forEach(title => {
      if (title.dataset.brandHeading || title.closest('#studio-game-host, .st-briefing-visual')) return;
      // Preserve explicit authored markup (line breaks, icons and links) unchanged.
      if (title.children.length) return;
      const text = title.textContent ?? '';
      const plan = headingAccent(text), parts = headingSegments(text);
      title.dataset.brandHeading = 'v1';
      if (title.tagName === 'H2') title.classList.add('st-brand-heading');
      if (!plan || !parts) return;
      const accent = document.createElement('span');
      accent.className = 'st-heading-accent' + (plan.newLine ? ' st-heading-line' : '');
      accent.textContent = parts.accent;
      title.replaceChildren(document.createTextNode(parts.before), accent, document.createTextNode(parts.after));
      if (plan.underline && title.tagName === 'H2') title.classList.add('st-heading-mark');
    });
  };
  const observer = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(n => n instanceof Element &&
      (n.matches('.studio, h2, h3') || n.querySelector('h2, h3'))))) refresh();
  });
  observer.observe(root, { childList: true, subtree: true });
  refresh();
  return () => observer.disconnect();
}
