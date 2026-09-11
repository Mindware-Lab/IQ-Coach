export type CredibilityCueId =
  | "protocol"
  | "evidence"
  | "calibration"
  | "transfer"
  | "independent_check"
  | "privacy"
  | "guarantee"
  | "reviews";

export type CredibilitySurface =
  | "home_network"
  | "node_home"
  | "instructions_practice"
  | "active_training"
  | "progress"
  | "g_track"
  | "account_data"
  | "product_page_above_fold"
  | "checkout";

export type CredibilityTone =
  | "protocol"
  | "evidence"
  | "experimental"
  | "measurement"
  | "confirmed"
  | "neutral";

export interface CredibilityCueDefinition {
  id: CredibilityCueId;
  asset: string;
  defaultTone: CredibilityTone;
  allowedSurfaces: readonly CredibilitySurface[];
}

export const CREDIBILITY_CUES: Readonly<Record<CredibilityCueId, CredibilityCueDefinition>> = Object.freeze({
  protocol: {
    id: "protocol",
    asset: "/credibility/protocol.svg",
    defaultTone: "protocol",
    allowedSurfaces: ["node_home", "instructions_practice", "product_page_above_fold"],
  },
  evidence: {
    id: "evidence",
    asset: "/credibility/evidence.svg",
    defaultTone: "evidence",
    allowedSurfaces: ["node_home", "product_page_above_fold"],
  },
  calibration: {
    id: "calibration",
    asset: "/credibility/calibration.svg",
    defaultTone: "measurement",
    allowedSurfaces: ["instructions_practice", "active_training", "progress"],
  },
  transfer: {
    id: "transfer",
    asset: "/credibility/transfer.svg",
    defaultTone: "measurement",
    allowedSurfaces: ["active_training", "progress"],
  },
  independent_check: {
    id: "independent_check",
    asset: "/credibility/independent-check.svg",
    defaultTone: "measurement",
    allowedSurfaces: ["g_track"],
  },
  privacy: {
    id: "privacy",
    asset: "/credibility/privacy.svg",
    defaultTone: "protocol",
    allowedSurfaces: ["account_data", "checkout"],
  },
  guarantee: {
    id: "guarantee",
    asset: "/credibility/guarantee.svg",
    defaultTone: "confirmed",
    allowedSurfaces: ["product_page_above_fold", "checkout"],
  },
  reviews: {
    id: "reviews",
    asset: "/credibility/reviews.svg",
    defaultTone: "protocol",
    allowedSurfaces: ["product_page_above_fold", "checkout"],
  },
});

export const CREDIBILITY_SURFACE_LIMITS: Readonly<Record<CredibilitySurface, number>> = Object.freeze({
  home_network: 1,
  node_home: 2,
  instructions_practice: 1,
  active_training: 1,
  progress: 2,
  g_track: 1,
  account_data: 1,
  product_page_above_fold: 2,
  checkout: 2,
});

export function cueAllowedOnSurface(cueId: CredibilityCueId, surface: CredibilitySurface): boolean {
  return CREDIBILITY_CUES[cueId].allowedSurfaces.includes(surface);
}

export function credibilityCueMarkup(input: {
  cueId: CredibilityCueId;
  label: string;
  tone?: CredibilityTone;
  title?: string;
}): string {
  const cue = CREDIBILITY_CUES[input.cueId];
  const tone = input.tone ?? cue.defaultTone;
  const title = input.title ? ` title="${escapeAttribute(input.title)}"` : "";
  return `<span class="credibility-cue is-${tone}" data-credibility-cue="${cue.id}"${title}><img src="${cue.asset}" alt="" aria-hidden="true"><span>${escapeHtml(input.label)}</span></span>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
