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
    id: "path-horizon",
    title: "Path Horizon",
    shortTitle: "Path",
    shortDescription: "Track where a sequence has come from and where a path may lead next.",
  },
  {
    id: "knowledge-access",
    title: "Knowledge Access",
    shortTitle: "Knowledge",
    shortDescription: "Bring relevant concepts, rules and stored knowledge into mind when they matter.",
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
