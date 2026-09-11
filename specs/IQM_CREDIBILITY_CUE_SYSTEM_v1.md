# IQ Mindware Credibility Cue System v1

**Status:** Canonical shared-platform specification  
**Version:** 1.0  
**Date:** 12 September 2026  
**Applies to:** the shared `apps/iqm-platform` shell and every node module  
**Machine-readable source:** `apps/iqm-platform/config/credibility-cues.yaml`  
**Shared SVG assets:** `apps/iqm-platform/public/credibility/`

## 1. Purpose

IQ Mindware uses a deliberately small set of credibility and quality cues to communicate real product properties quickly without turning the interface into a collection of marketing badges.

The governing rule is:

> **Credibility must emerge from visible process. Symbols only compress facts that are already true.**

Every cue must therefore cash out into a real underlying property, status, source or user right. Generic authority theatre — fake certification crests, unsupported “science backed” labels, decorative security shields or invented approval marks — is prohibited.

The system is shared by the platform shell. Node modules may supply state and provenance, but they must not invent their own credibility iconography or redefine cue meanings.

## 2. Visual grammar

Credibility cues should resemble **instrument/status labels**, not promotional seals.

Default chip:

```text
[ icon ]  UPPERCASE LABEL
```

Recommended implementation:

```css
height: 28px;
padding: 5px 9px;
gap: 6px;
border-radius: 999px;
border: 1px solid currentColor at low opacity;
icon: 14px × 14px;
font-size: 0.65rem;
font-weight: 850;
letter-spacing: 0.06em;
```

All canonical SVGs use:

```text
viewBox      0 0 24 24
fill         none
stroke       currentColor
stroke-width 1.7
linecap      round
linejoin     round
```

Colour semantics:

- **cyan** — protocol, evidence provenance, ordinary scientific/process status;
- **deep blue** — measurement, transfer/re-check, independent checks;
- **violet** — explicitly experimental status;
- **lime-readable** — only when a condition has genuinely passed, completed or been verified;
- **muted grey** — unavailable, informational or not-yet-assessed state.

Lime must never be used simply because a designer wants emphasis.

## 3. Canonical cue set

There are exactly eight v1 cue families.

| ID | SVG | Core label | Meaning |
| --- | --- | --- | --- |
| `protocol` | `protocol.svg` | `IQM PROTOCOL · vX.X` | The user is inside a versioned, maintained protocol |
| `evidence` | `evidence.svg` | state-dependent | Epistemic provenance of the product/claim |
| `calibration` | `calibration.svg` | state-dependent | Calibration, timing or data-quality process |
| `transfer` | `transfer.svg` | state-dependent | Wrapper change, recovery, return or delayed re-check |
| `independent_check` | `independent-check.svg` | `INDEPENDENT CHECK` | Measurement is separate from training performance |
| `privacy` | `privacy.svg` | `DATA CONTROL` | Storage, sync, research-use and sharing status are inspectable |
| `guarantee` | `guarantee.svg` | configured guarantee label | Seller risk-reversal at purchase |
| `reviews` | `reviews.svg` | verified review summary | Genuine customer social proof |

The SVGs are platform assets. No node-specific substitute icons should be created for these meanings.

## 4. Evidence-state rules

The `evidence` cue has four allowed states.

### `EXPERIMENTAL_PROTOCOL`

Label:

```text
EXPERIMENTAL PROTOCOL
```

Use when the intervention is deliberately engineered and instrumented but the specific IQ Mindware implementation does not yet have confirmatory outcome evidence adequate for a stronger status.

Colour: violet.

Must disclose:

> Not yet independently validated as an intervention.

### `PUBLISHED_ANCHOR`

Label:

```text
PUBLISHED ANCHOR
```

Use only when a current evidence/claims reference identifies relevant published research anchoring the target construct, task family or mechanism.

It does **not** mean the IQ Mindware implementation itself has been independently validated.

Colour: cyan.

### `PILOT_EVIDENCE`

Label:

```text
PILOT EVIDENCE
```

Use only when governed pilot evidence exists for the specific implementation and the linked claims profile permits that description.

Colour: cyan by default. Lime may be used only for a more specific passed/verified sub-state, never merely because a pilot produced a favourable result.

### `INDEPENDENT_VALIDATION`

Label:

```text
INDEPENDENT VALIDATION
```

This is the highest-status evidence cue and requires a current read-only claims/evidence reference explicitly authorising it. It must not be inferred from product telemetry, testimonials, internal experiments or unpublished analysis.

Colour: lime-readable only when the predicate is satisfied.

## 5. Process cue states

### Protocol

Visible only when `protocol_id` and `protocol_version` exist.

Format:

```text
IQM PROTOCOL · v1.2
```

The version itself is part of the credibility signal. Do not show a protocol badge without an actual maintained version.

### Calibration

Allowed labels:

```text
CALIBRATING
TIMING · GOOD
TIMING · LIMITED
DATA QUALITY · GOOD
DATA QUALITY · LIMITED
```

`GOOD` may use lime only after an actual quality check passes. `LIMITED` is neutral/muted, not red unless the data are unusable and the user must stop.

### Transfer / re-check

The same transfer icon is reused for distinct process states:

```text
FORMAT CHANGE
RECOVERY
RETURN CHECK
DELAYED RE-CHECK
```

These labels describe what the system is doing. They are not claims that far transfer has been demonstrated.

### Independent check

Canonical label:

```text
INDEPENDENT CHECK
```

Use on G Track or another genuinely independent outcome surface only. Never place this cue beside an in-app training score.

Expanded copy should say that training performance and independent measurement are calculated separately.

### Privacy / data control

Default label:

```text
DATA CONTROL
```

Expanded status must expose factual fields such as:

```text
Storage
Sync
Research use
External / employer sharing
Export
Deletion
```

Do not use `SECURE`, `CERTIFIED SECURE` or equivalent language unless a separately documented security claim allows it.

### Guarantee

The visible label is generated from the actual configured policy, for example:

```text
30-DAY SATISFACTION GUARANTEE
```

The cue is forbidden unless the guarantee is currently offered, the duration matches the displayed label, and terms are linked.

### Reviews

Display only from genuine review/customer data.

Preferred format:

```text
★ 4.8 · 126 VERIFIED CUSTOMERS
```

`VERIFIED` is allowed only when the system can substantiate the verification method. Otherwise use:

```text
★ 4.8 · 126 CUSTOMER REVIEWS
```

Do not display a rounded average without the review count.

## 6. Placement rules

The system deliberately limits cue density.

| Surface | Maximum simultaneous cues | Preferred cues |
| --- | ---: | --- |
| Home/network | 1 | protocol **or** evidence only if useful |
| Node home | 2 | protocol + evidence |
| Instructions/practice | 1 | protocol or calibration/process cue |
| Active training | 1 | current process cue only |
| Progress | 2 | calibration/data quality + transfer/re-check |
| G Track | 1 | independent check |
| Account/Data | 1 | privacy/data control |
| Product page above fold | 2 | evidence + one risk/social cue |
| Checkout | 2 | guarantee + verified reviews/security fact if substantiated |

Never place guarantee or review cues inside cognitive training, Progress or G Track.

Never show more than two credibility cues in one visual cluster.

If two cues communicate substantially the same thing, use the more specific one rather than stacking them.

## 7. Progressive disclosure

A cue should support three layers:

```text
rapid symbol + label
→ concise explanation
→ provenance / evidence / terms
```

For example:

```text
PUBLISHED ANCHOR
```

opens:

> Published work anchors this task or construct. This does not mean the IQ Mindware intervention itself has been independently validated.

and may then offer:

```text
View evidence
```

Each cue detail record should expose, where applicable:

- what the cue means;
- source/provenance reference;
- what it does **not** mean;
- last reviewed date;
- review/expiry date;
- user-facing destination such as Evidence, Data or Terms.

## 8. Claims and integrity rules

The following are prohibited unless explicitly authorised by a qualifying predicate/source:

```text
SCIENCE BACKED
SCIENTIFICALLY PROVEN
APPROVED
CERTIFIED
VERIFIED
SECURE
CLINICALLY PROVEN
TRANSFER PROVEN
IQ IMPROVEMENT
```

University, NHS, research-institute or partner logos are **outside** this cue system and require explicit permission plus wording that accurately represents the relationship. Prior employment, education or informal contact is not sufficient.

Evidence status must never be derived from ordinary commercial telemetry.

Product usage, adherence, reviews and sales may support product decisions but must not automatically promote an epistemic evidence state.

## 9. Inheritance model

The shared platform owns:

```text
cue IDs
SVG assets
labels/state vocabulary
colour semantics
placement limits
claims boundaries
progressive-disclosure pattern
```

Node modules may provide only:

```text
protocol_id
protocol_version
evidence_state_reference
claims_profile_reference
process state
data-quality state
```

The node should reference canonical cue IDs; it must not redefine the icon or label semantics.

This means Attention, Generative Search and every later node inherit the same quality grammar automatically from the platform.

## 10. Recommended default by screen

```text
HOME
minimal; usually no persistent badge cluster

NODE HOME
IQM PROTOCOL · vX.X
PUBLISHED ANCHOR / EXPERIMENTAL PROTOCOL

INSTRUCTIONS / PRACTICE
IQM PROTOCOL · vX.X
then current process cue if needed

TRAINING
one live process cue only:
CALIBRATING / FORMAT CHANGE / RECOVERY / RETURN CHECK

PROGRESS
TIMING · GOOD or DATA QUALITY status
DELAYED RE-CHECK when applicable

G TRACK
INDEPENDENT CHECK

ACCOUNT → DATA
DATA CONTROL

CHECKOUT
configured guarantee
verified review summary when mature
```

## 11. Acceptance criteria

The credibility system is correctly implemented when:

1. every cue maps to one canonical ID and one shared SVG;
2. every displayed cue has a satisfied predicate or factual source;
3. the same cue means the same thing across all node apps;
4. evidence-state upgrades require explicit provenance rather than product telemetry;
5. active training never contains commercial trust badges;
6. lime indicates a genuinely satisfied/verified state;
7. every substantive cue can disclose what it means and what it does not mean;
8. no screen exceeds its cue-density limit;
9. node modules cannot invent alternative authority/seal graphics for the same semantic purpose.
