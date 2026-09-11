export const ATTENTION_DONOR_MIGRATION = Object.freeze({
  sourceApp: "apps/attention-coach",
  includedConstruct: "ACC",
  excludedConstructs: ["BSE"],
  phase1WrapperCells: {
    A: "arrow_abs",
    B: "flow_abs",
  },
  attentionOwnedLaterCells: ["arrow_rel", "flow_rel"],
  exclusionReason:
    "BSE direction-colour binding belongs to the Binding/Memory stream, not the clean Attention Control node.",
  designRule: "split-early-integrate-late",
} as const);

export function donorConstructBelongsInAttention(construct: string): boolean {
  return construct === ATTENTION_DONOR_MIGRATION.includedConstruct;
}
