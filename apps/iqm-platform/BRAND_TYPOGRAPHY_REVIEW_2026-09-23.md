# Synergy IQ — website-aligned typography and actions

Date: 23 September 2026
Branch: `feature/attention-apr-qa3`
Review: draft PR #6; no production merge.
Verified code commit: `44114add05b71a8ed5f190511cb0b19c095fe738`
Successful CI run: `35796737176`

## Source of visual direction

The user supplied the IQ Mindware header showing “Navigate possibility. Build intelligence.”, with navy text, blue-to-green emphasis and a short lime underline. The source website was checked in `Mindware-Lab/trident-g-platform`, `main`:

- `products/trident-g-iq/websites/iqmindware/assets/css/pages/synergy-home-v2.css`
- `products/trident-g-iq/websites/iqmindware/assets/css/components/menu-page-spacing.css`

The website uses the display stack `ui-rounded, "Trebuchet MS", system-ui, sans-serif`, weight 850 on hero titles, tight tracking, gradient emphasis and a lime underline. It does not specify a separate downloadable brand font. The app uses that same display stack; actual system fallback varies with the device just as it does on the website.

## Implemented

- Deliberate coloured phrases, two-part title rhythm where appropriate, and short lime strokes on the welcome, chapter, briefing, home, network, strategy, context, AI-practice, mission, review and rules headings.
- Original title wording is preserved exactly. New inline spans are constructed as text nodes, never as unescaped user HTML.
- Blue/cyan/green large-text gradients for Attention; other capacity palettes remain indexed to the corresponding node.
- A light gradient variant is used for text over the dark welcome/art cards.
- Brighter blue/cyan primary buttons with contrasting navy labels; white secondary buttons and white primary actions on the immersive welcome.
- Response controls receive the lighter colour treatment but retain their existing placement, response gating and persistent visibility.
- A brief narrative-title entrance and restrained hover feedback, with reduced-motion and forced-colour fallbacks.
- The existing small-window type sizes are preserved so the more expressive headings do not overflow in a short square desktop window.

The large-text gradient stops are slightly deeper than the website's brightest decorative greens to maintain readable contrast on white. Small text remains a solid readable colour. Decorative lime remains an underline/accent, not pale body text.

## Scope and architecture

`src/app/studioTypography.ts` decorates known authored headings after the existing view replaces its DOM. This also covers the separately mounted AI-practice view. It does no work inside active training and ignores the instructional stimulus renderer. The observer is disconnected on hot-module disposal.

`src/theme/studio-typography.css` owns the shared display and action tokens. `src/main.ts` loads and mounts this presentation layer. No new dependency, remote font request, data collection, progress migration or content rewrite is introduced.

All five files under `src/modules/attention/game/` are byte-identical to the pre-change source: adapter, trial generator, stimulus renderer, staircase and game stylesheet. The new control colours are scoped presentation rules outside those files. Accurate wrapper-specific instruction images remain in use.

## Verification

At the verified commit, the CI build passed:

- 56 unit tests across 13 files;
- TypeScript and Vite build;
- 1,065 existing journey/control browser assertions;
- 237 instruction-geometry and layout assertions;
- 215 new brand-type assertions;
- zero uncaught browser errors in each browser suite.

The 1,517 browser assertions cover square desktop, phone widths from 320 px upwards, short windows, title wording, font stack/weight, gradient presence, node palette identity, lighter/white buttons, calculated contrast, forced-colour fallback, reduced motion, unchanged instruction rendering and persistent game controls. The prior full training/mission/AI/banking checks remain enabled.

Actual screenshots are in CI artifact `synergy-iq-screen-review`, including `brand-desktop-chapter.png`, `brand-mobile-chapter.png`, the briefing/home/network/context/mission views and `brand-mobile-game.png`. CI screenshot artifacts expire after seven days. Screenshot test interactions are not participant or efficacy data.

Real-device Safari/Firefox and wider accessibility review remain release work; automated Chromium checks do not establish those results.
