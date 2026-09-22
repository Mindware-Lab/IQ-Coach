# Illustrated Synergy IQ — implementation review

**Date:** 22 September 2026  
**Branch:** `feature/attention-apr-qa3`  
**Review surface:** draft PR #6; not merged or deployed to production  
**Screen plan:** `../../specs/SYNERGY_IQ_VISUAL_SCREEN_PLAN_v1.md`

## Delivered presentation

The active studio now provides deliberate square-desktop and portrait-mobile compositions, rather than scaling one layout down. It uses short headings, illustrated chapter panels, one prominent next action, readable light learning screens and a quiet training surface. Home, Network, My rules and More are available outside active training.

The complete Attention journey includes welcome, chapter, actual-wrapper briefing, existing task, actual task result, portable move, cue/anti-cue examples, feed/workspace/AI practice, a two-step mission builder, mission confirmation, two-step check-in, optional banking and retrieval of saved rules. Account/setup/error states use the same presentation system.

Seven palette-indexed network worlds are defined. Other capacity cards are explicitly previews and do not imply that seven games or seven paid products are implemented. The current QA access continues to unlock Attention only.

## Artwork

Attention and welcome use the new local `signal-waves.svg`: scalable original vector artwork interpreting the supplied blue-wave/network motif. The other capacity worlds use art-only crops of the user-approved concept board. Those six concept-derived worlds are QA placeholders for future higher-resolution art, not finished production masters. No Big Health illustration, logo or medical claim has been copied.

## Behavioural refinements

- Narrative meaning follows the actual wrapper/phase, not an arbitrary session index outside forced QA.
- Future missions do not force immediate feedback or block training.
- A missing opportunity is rescheduled without being treated as failure.
- Uncertain or adverse experiences may produce a tentative/revised rule; banking can be skipped.
- Saved training receipts contain real task results only. Illustrative mock-up scores are not used.
- Existing browser progress, strategy, mission, check-in and rule namespaces remain separate.

## Verified build

Code commit: `e01f5f3f134cf6bb1cd8465d519506051289d117`.

GitHub Actions run: `35777347575` — **passed**.

- **33 unit tests** across 11 files passed.
- **TypeScript and Vite production build** passed.
- **747 browser assertions** passed, with **zero uncaught page errors** in the exercised flow.
- The actual accelerated Attention QA runtime completed its 24 trials; pause/resume and real result persistence were exercised. Test-only clock acceleration and automated responses are not user data or evidence of benefit.
- The browser walked through the move, examples, workspace relevance practice, simulated AI correction/unaided check, mission creation, future review point, no-opportunity reschedule, uncertain outcome, banking, rules, seven palette selections and reload persistence.
- Responsive checks used 1200×900, 1440×1000, 900×700, 390×844, 375×667, 320×568, 430×932 and 844×390 viewports.
- Checks include square proportions on desktop, full device dimensions on phones, no page or content horizontal overflow, reachable primary action footers and bounded headline length. Reduced-motion mode was used.
- A long action label overflowing a short square viewport was found and fixed before the passing run.

Screenshots from the built application are retained in the `synergy-iq-screen-review` workflow artefact, together with `qa-results.json`. Build/source snapshot is in `synergy-iq-visual-review`. These workflow artefacts expire after seven days.

## Protected scientific runtime

A repository comparison from the pre-visual-pass commit `3a73f3d3e6d4fbaf7eb4dcbc02e8374222e5eb84` to the verified code commit shows no changes to the Attention game directory. Stimulus geometry, trials, staircase, timing, payoff/scoring and the existing forced QA sequence were not redesigned to resemble illustrative mock-up arrows.

## Remaining release work

This is a reviewed QA implementation, not a production readiness certification. Before public release, perform real-device Safari/Firefox and touch/virtual-keyboard review, explicit text enlargement/screen-reader review, account/entitlement/security release checks and the existing research/product claims review. QA flags must not become a production paid-access bypass.

The six future-node visual worlds still need production-resolution original art. The seven-node palette and chapter contracts are prepared; this pass does not complete the other training engines or remote data synchronisation.
