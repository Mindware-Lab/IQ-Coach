# Synergy IQ node colour contract

Version: 2026-09-23.1. User-approved chart supersedes older website palettes.

| Capacity | Exact identity | Dark text companion | Pale surface |
| --- | --- | --- | --- |
| Attention Control | #22AAFF | #1266B5 | #EAF6FF |
| Relational Memory | #9B7AFF | #6441C6 | #F1ECFF |
| Binding Memory | #ED74AB | #A82E68 | #FFF0F7 |
| Path Horizon | #FFAB63 | #A74E0B | #FFF2E5 |
| Knowledge Access | #F6C64B | #795900 | #FFF8DA |
| Generative Search | #31C89B | #08785A | #E7FAF3 |
| Reasoning | #40BEC7 | #08707A | #E9F8F8 |

Shared brand anchors: blue #22AAFF, navy #0A2550, lime #CCFF66.

Exact identity colours belong on node markers, card accents and capacity badges. Use navy labels on these lighter fills. Dark companions support readable text and focus rings; they must not replace the primary identity on network icons. Pale companions support surfaces. Illustration gradients may vary within the same family. Lime is a brand accent, not an eighth capacity.

Primary actions remain light blue or white. Keep names, icons and selected-state indicators alongside colour. No game-trial colours, geometry, timing, scoring, progress or entitlements are changed by palette alignment.

Machine-readable manifest and CSS tokens are in `apps/iqm-platform/src/theme/synergy-node-palette.{json,css}`. Mirror the identical files in `trident-g-platform/products/trident-g-iq/websites/iqmindware/assets/css/components/`.

`studio-node-identities.css` is the compatibility boundary for older inline network action tokens. The model already uses the selected identity/wash/deep values; unit tests prevent divergence. Browser tests assert actual marker fills and card accents for all seven nodes in both layouts, including selected and unselected states.
