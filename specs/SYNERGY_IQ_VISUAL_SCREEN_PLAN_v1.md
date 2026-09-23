# Synergy IQ — illustrated screen system v1

**Date:** 22 September 2026  
**Working branch:** `feature/attention-apr-qa3`  
**App:** `apps/iqm-platform/`  
**Review:** Draft PR #6; no production merge is authorised by this design pass.

## 1. Design basis

The approved Synergy IQ concept boards in the conversation are the visual basis, particularly the second board: illustrated blue waves, generous light surfaces, short editorial headings, colour-indexed capacity cards and one clear next action. The supplied IQ Mindware blue-wave/network artwork is the primary brand image. Big Health screenshots inform the hierarchy and pacing only: do not reuse their illustrations, logos, health claims or clinical framing.

This plan changes presentation and journey orchestration, not the Attention task, stimulus geometry, timing, staircase, scoring or forced QA sequence. A conceptual arrow illustration must never silently replace the actual IN/OUT task. Display only real task results, not the attractive invented numbers in a mock-up.

The central design correction is: **a sentence-length heading, a short explanation, an image and an action — not an entire theoretical paragraph rendered as a heading.**

## 2. Two deliberate compositions

### Desktop: a square app, not a stretched phone

At ordinary desktop sizes use a centred 760 × 760 px shell, constrained proportionally by the available viewport. Story screens pair an illustrated panel with a reading/action panel. Dashboard and network screens use the extra width for contextual information, not extra choices. The active training surface uses the square area without decorative art behind stimuli.

A compact brand header replaces the repeated large website tagline. Bottom navigation provides Home, Network, My rules and More. The main action remains at the bottom of the current screen. Content may scroll within its own region when text is enlarged or the viewport is unusually short; never conceal an action or shrink text to make a screenshot fit.

### Mobile: portrait, edge-to-edge

At 720 px and below use the full viewport and safe-area insets. Story images sit above the copy or fill the background with a solid/gradient reading zone. Cards stack; the same desktop split must not simply be squeezed into a narrow column. Bottom controls remain thumb-accessible. There is no fake phone bezel or operating-system status bar in the real app.

Phone reference sizes: 390 × 844 and 375 × 812 px. Also check 320 px width, 430 px width, landscape, short desktop windows and enlarged text. The reading region may scroll; essential buttons must remain reachable.

## 3. Visual families

1. **Immersive story:** welcome, chapter opening and occasional transition. Full-colour artwork with short high-contrast copy.
2. **Light learning:** strategy, examples, task briefing and check-ins. Warm/ice-white surfaces, navy text and a restrained node-colour accent.
3. **Quiet training:** stimulus-led, image-free and free of decorative motion. Preserve the existing Attention runtime.
4. **Reflective progress:** actual metrics, a portable lesson, a real-world observation and the next step. No confetti implying an intelligence gain.

Images are decorative context, not evidence. Readability must not depend on a particularly light or dark part of the image. Provide an image-failure fallback.

## 4. Colour-indexed capacity network

The final approved board supplies this visual direction. Colours are navigation identifiers, not scores or clinical states.

| Capacity | World / motif | Accent | Readable action colour |
|---|---|---|---|
| Attention Control | Blue waves and a clear signal | #22AAFF | #1266B5 |
| Relational Memory | Lavender spheres and connections | #9B7AFF | #6441C6 |
| Binding Memory | Rose layers and linked context | #ED74AB | #A82E68 |
| Path Horizon | Apricot landscape and a winding route | #FFAB63 | #A74E0B |
| Knowledge Access | Golden light and an open book | #F6C64B | #795900 |
| Generative Search | Jade leaves and branching growth | #31C89B | #08785A |
| Reasoning | Teal geometry and a mountain | #40BEC7 | #08707A |

Lime remains a brand highlight against dark backgrounds, for emphasis/underlining and selected progress details. Do not use light lime or light cyan for small text on white. Icons and labels accompany colour. Future nodes can be previewed visually but remain clearly unavailable until implemented and entitled.

## 5. Screen inventory and composition

| ID / screen | Job and primary action | Square desktop | Portrait mobile |
|---|---|---|---|
| S01 Welcome | Explain the promise; Begin with Attention | Illustrated left half, short proposition and action on right | Full-bleed waves, short headline, lower action area |
| S02 Today / Home | Show one next useful step | Large illustrated next-step card plus compact mission/context rail | Check-in card above an illustrated Up next card |
| S03 Network | Locate the seven capacities | Orbital map beside the selected capacity card | Compact orbital map, followed by one selected card |
| S04 Chapter: Signal | Give Attention a human purpose | Wave landscape beside “What matters now?” and two short sentences | Illustrated upper panel; question and short explanation beneath |
| S05 Training briefing | Explain the actual operation and current wrapper | Operation/invariant panel beside a concise briefing | Short briefing above a simple rule panel; Start pinned below |
| S06 Active Attention game | Run the existing task | Clean square task area, compact header, pause/exit | Full available game region; no bottom app navigation |
| S07 Block transitions | Explain the next block without distracting | Existing runtime content in the quiet game frame | Same controls with accessible touch targets |
| S08 Session complete | Report actual performance, then extract meaning | Real metric cards beside a short debrief and next step | Stacked real metrics; one portable lesson; Continue |
| S09 The move | Teach “Pause. Find the signal. Commit.” | Three illustrated/icon steps and a short example | Three large numbered steps, one sentence each |
| S10 When to use it | Teach cues and anti-cues | One example per page, explanation separate from question | One example per page; no dense two-column lists |
| S11 Niche practice | Recognise the move in a different context | Scenario/evidence choices in a roomy two-column composition | One goal and a vertical list of tappable evidence cards |
| S12 AI practice | Human first, simulated support, unaided check | Reuse the current five-stage exercise inside the new frame | Same sequence, clean reading region, reachable action |
| S13 Mission builder | Choose a real goal, cue, action and review point | Two-step form; supportive illustration alongside | Two brief form screens, not a long questionnaire |
| S14 Mission saved | Encourage real action rather than endless app use | Confirmation and chosen next step; Done for today | Brief confirmation; leave the app or return Home |
| S15 Reality check-in | Record what happened, including no opportunity | Two short form pages with the mission context visible | One small group of questions per page; no-failure reschedule path |
| S16 Bank a rule | Save a tentative/reusable learning note | WHEN / I WILL / BECAUSE form plus context | Short form in a light card; save or skip |
| S17 My rules | Retrieve previous learning | Illustrated rule cards with source context | Stacked cards; empty state before any real rule exists |
| S18 More / data / G Track | Keep utilities out of the main journey | Clear utility list, privacy and QA controls | Same list with large touch targets |
| S19 Future-node preview | Show the network’s visual worlds honestly | Node-coloured art + human question + Coming soon | Node-coloured portrait card; no fake playable task |
| S20 Sign-in / setup / recovery | Preserve account access and honest errors | Compact form/error in branded frame | Accessible form and retry/back action |

## 6. Flow and state rules

First use: Welcome → Signal chapter → task briefing → existing training → actual result → portable move → scenario/mission → return for feedback → bank or revise a rule.

Returning use: one next action, selected from incomplete orientation, the current training/strategy stage, a due mission or an unbanked observation. **A mission planned for tomorrow is not a check-in due now.** Users may train while waiting for real-world feedback; no fabricated check-in is needed to unlock training.

Narrative wrapper meaning follows the actual wrapper/phase. The forced five-session order is only used in Attention QA. Outside QA, session two must not be described as motion when it is still static.

A “not used”, “not sure” or “no opportunity” response is not a failure. Do not automatically claim a rule is validated because the user saved it. Banking can be skipped. Learning notes, mission records and training scores remain distinct.

## 7. Implementation structure

Build a dedicated presentation controller and a single scoped visual stylesheet rather than adding another layer of conflicting overrides to the old dashboard CSS. Retain the old shell for code history, but use only one active bootstrap from `src/main.ts`.

Reuse existing module registry, entitlements, auth, game adapters, training progression, strategy, mission and rule persistence. Add typed view helpers, palette metadata and small display-state storage where needed. No changes to the scientific game engine and no new remote data collection.

Images must have documented provenance. Reuse supplied/approved artwork, not Big Health assets. Provide local artwork under the app’s public directory; no new runtime dependency on an external image host.

## 8. Validation and acceptance

- TypeScript build and existing unit tests remain green.
- Behavioural tests exercise first entry, returning entry, unavailable nodes, strategy continuation, mission creation, due/not-due review, no-opportunity rescheduling, banking and persistence.
- Browser checks cover desktop square and phone portrait. Test scrolling and actions, not just static screenshots.
- Demonstrate real screenshot strips of representative implemented screens in both layouts.
- Check every training source file against the pre-redesign commit; no scoring/timing/stimulus edits.
- Test without local storage, with corrupt UI data and with artwork unavailable.
- Local preview remains `?attention-qa=1`; no production entitlement bypass is introduced.
- Keep PR #6 draft. A successful build or preview is not a production deployment.

## 9. Scope of this pass

Implement the full Attention presentation and shared visual system, plus clearly labelled colour-indexed previews for other capacities. Do not imply that all seven training games, cloud-synchronised histories or validated Adaptive G personalisation are complete. The page-level mock-up metrics are never production data.
