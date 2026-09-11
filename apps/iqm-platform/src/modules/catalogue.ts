import type { NodeCatalogueEntry } from "../types/node";

export const NODE_CATALOGUE: readonly NodeCatalogueEntry[] = [
  {
    id: "attention",
    title: "Attention Control",
    shortTitle: "Attention",
    shortDescription: "Protect relevant information while resisting competing signals.",
  },
  {
    id: "relational-memory",
    title: "Relational Memory",
    shortTitle: "Relational",
    shortDescription: "Maintain and update relations across delay and interference.",
  },
  {
    id: "binding-memory",
    title: "Binding Memory",
    shortTitle: "Binding",
    shortDescription: "Keep features, sources and contexts bound to the right item.",
  },
  {
    id: "predictive-mapping",
    title: "Predictive Mapping",
    shortTitle: "Predictive",
    shortDescription: "Learn what tends to follow and detect when paths change.",
  },
  {
    id: "generative-search",
    title: "Generative Search",
    shortTitle: "Generative",
    shortDescription: "Generate distinct plausible alternatives before premature closure.",
  },
  {
    id: "reasoning",
    title: "Reasoning",
    shortTitle: "Reasoning",
    shortDescription: "Work out what follows and what would make a conclusion wrong.",
  },
] as const;
