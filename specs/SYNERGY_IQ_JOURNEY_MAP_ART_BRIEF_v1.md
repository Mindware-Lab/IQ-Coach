# Synergy IQ — journey map and narrative art brief v1

**Date:** 22 September 2026  
**Status:** Proposed next art/design pass. No new map artwork or moving marker is implemented by this document.  
**Branch:** `feature/attention-apr-qa3` / draft PR #6  
**Companions:** `SYNERGY_IQ_VISUAL_SCREEN_PLAN_v1.md`, `IQM_ADAPTIVE_JOURNEY_SPEC_v0.1.md`

## 1. Intent

Develop an illustrated journey, not another collection of pale cards carrying the same wave image. Use the user-approved Synergy IQ concept boards and supplied IQ Mindware blue-wave/network artwork as art direction. Big Health is a reference for visual pacing, brief instruction and meaningful transitions, not a source of illustrations, branding or clinical claims.

The artwork should answer three questions:

- Where am I in this chapter?
- What am I learning here?
- What is the next useful action?

A user marker should show actual journey activity, never a measured intelligence level. Artwork is a metaphor for learning, not a visualisation of neural change.

## 2. Two levels of map

### The network / world map

Keep the seven-node map as the overall index. Each capacity has its own landscape and established palette: Attention blue; Relational violet; Binding rose; Path Horizon apricot; Knowledge Access gold; Generative Search jade; Reasoning teal. The new art must not introduce conflicting node colours.

### The chapter / route map

Inside the selected capacity, show a small set of meaningful places connected by a route. Attention is the first fully illustrated chapter. A location pin, abstract traveller or small person silhouette shows the current stage. Icons, labels and a text alternative identify milestones independently of colour.

Do not require users to understand two maps before starting: show one next action on Home, with the map as orientation and an optional expanded view.

## 3. Attention: one coherent world, distinct scenes

Commission or generate a matching suite of high-resolution, text-free illustrations. Depth, light, layered terrain and flowing ribbons should carry the atmosphere of the approved boards. Avoid replacing rich artwork with a simplistic repeated wave SVG, or enlarging tiny crops from a UI concept sheet.

| Place / scene | Learning meaning | Short narrative | Typical use |
|---|---|---|---|
| The shoreline / beginning | Many possibilities; one owned goal | “More is possible. What matters now?” | Welcome / first chapter entry |
| The current | Carrier changes; relevant relation stays | “Different surface. Same signal.” | First Optic Flow perturbation |
| The landmark | Recovery after a change of context | “Return to what matters.” | Return to the anchor task |
| The passing storm | Compelling input is not necessarily relevant | “Vivid is not always useful.” | Emotional-distractor introduction |
| The bridge | Move from in-app practice to external action | “Take the move into your world.” | Mission invitation / saved mission |
| The lookout | Examine feedback and keep a useful lesson | “What will you carry forward?” | Review / tentative rule banking |

These are art directions, not six new training tasks. The landmark should recur recognisably, so return feels like revisiting a place rather than mechanically advancing to a higher level.

A real-world attempt that does not help can still support reflection. Neither a disappointing result nor a missed opportunity should send the marker backwards as punishment.

## 4. The master route is a loop, not a ladder

Represent an anchor place, an outward route into changed conditions and a return, followed by an optional bridge to real-world application and feedback. This captures Anchor–Perturb–Return and the G-loop more accurately than a one-way march towards a summit.

The current forced QA order remains A → B → A → C → A. In ordinary training, the map must follow the actual wrapper/progression event, not infer the stage from session number. The user may revisit, repeat, postpone a mission or return to training while waiting for feedback.

No map gate should force a fabricated real-world check-in to unlock the next game. Allow an honest pending or “not yet” state.

## 5. How the narrative appears

Use occasional full-colour story screens at meaningful transitions, rather than inserting artwork between every block or trial.

For example:

1. Show the landscape, current position and a short heading.
2. Give one or two sentences explaining this stage.
3. Offer one main action: continue, start, take it outside, or review.
4. Move into the quieter task or form.

Primary story copy should usually fit within roughly 20–40 words; longer explanation belongs behind a secondary control. The illustration is allowed to dominate the screen. The actual game must remain quiet and stimulus-led.

Art-led transitions should be replayable and skippable after the first introduction. A return visit should not require rereading every chapter card.

## 6. Square desktop and portrait mobile

### Desktop

Use the existing square shell, with art occupying most or all of the story surface. The route may run diagonally through the square. Overlay short live text only in a deliberately reserved reading area with a contrast scrim. Do not make every story a narrow artwork strip beside a large white text panel.

### Mobile

Use a deliberately composed portrait scene with important landmarks and route points within the visible area. Show the current location and next destination without requiring a pinch/zoom map interface. A close-up of the same place can work better than shrinking the whole desktop map.

Keep CTA controls outside unsafe device edges. The mobile composition should not be a blind centre crop that removes the person, landmark or route.

## 7. Asset architecture

Keep three layers separate:

- **Illustration:** high-resolution, text-free background scene.
- **Map overlay:** route, landmark labels, completion icons and accessible location marker.
- **UI:** live headings, narrative, buttons and progress explanation.

The marker must not be baked into the image. Use normalised landmark coordinates (or an SVG viewBox) with explicit desktop and portrait compositions, so it remains in the right place under resizing.

Suggested deliverables for the Attention prototype:

- one master chapter map in square and portrait compositions;
- shoreline/welcome scene;
- changed-current scene;
- return-landmark scene;
- passing-storm scene;
- bridge-to-reality scene;
- lookout/review scene;
- one reusable location-pin icon and an optional traveller silhouette.

Use local optimised image assets with provenance. Master files should be large enough for the intended high-density display. Provide image-failure fallbacks. No interface text, fabricated scores or clinical claims in the generated images.

## 8. Marker and progress semantics

Use explicit events such as chapter acknowledged, training session recorded, perturbation encountered, return recorded, mission planned, check-in recorded and rule saved/revised/skipped. Keep visit history and current location separate from scientific performance measures.

Move the marker after the relevant event is recorded, not on every tap. A brief transition may draw attention to a location change, but there should be no continuous drifting or pulsing while the user reads or trains. Respect reduced-motion settings and keep a static equivalent.

A text label must explain the current location, e.g. “Attention · return to the anchor”. A marker’s height, size or distance travelled must not imply an IQ gain or validated far transfer.

## 9. Implementation order

1. Approve one master map and three sample full-art screens: chapter opening, first perturbation and bridge to reality.
2. Compare square and portrait versions at the actual app dimensions.
3. Produce the remaining matching scenes from the same art direction.
4. Integrate the route overlay and milestone event mapping with existing journey state.
5. Verify re-entry, reload, no-opportunity and repeat-session behaviour.
6. Extend the approach to other node palettes as their training and narratives are developed.

The first prototype should visibly exceed the earlier flat-wave presentation before the full suite is integrated.

## 10. Separate immediate usability fix

The response-control change is independent of this proposed art pass: IN/OUT controls remain visible during ready, fixation, stimulus, mask, response, feedback and pause. They only accept input during the existing valid response window. Correct/incorrect feedback is positioned above, not over, the controls. No additional decorative art or moving map appears behind the scored task.
