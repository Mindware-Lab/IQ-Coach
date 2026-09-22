import type { GameAdapter } from "./game";
import type { MissionTemplate, NicheChangeType } from "./mission";
import type { WrapperProgressionConfig } from "./progression";

export type NodeId =
  | "attention"
  | "relational-memory"
  | "binding-memory"
  | "path-horizon"
  | "knowledge-access"
  | "generative-search"
  | "reasoning";

export type JourneyBeatId = "anchor" | "perturb" | "return" | "salience" | "bank";

export interface JourneyBeat {
  id: JourneyBeatId;
  shortLabel: string;
  title: string;
  copy: string;
  debriefTitle: string;
  debriefCopy: string;
}

export interface NodeJourneyConfig {
  chapterNumber: string;
  chapterTitle: string;
  humanQuestion: string;
  worldviewHook: string;
  portableMove: string;
  abstractRationale: string;
  beats: Record<JourneyBeatId, JourneyBeat>;
  realityPrompt: string;
  bankPrompt: string;
}

export interface StrategyExample {
  title: string;
  situation: string;
  usePolicy: boolean;
  explanation: string;
}

export interface StrategyConfig {
  handle: string;
  explanation: string;
  targetCues: string[];
  antiCues: string[];
  workedExamples: StrategyExample[];
  changedExamples: StrategyExample[];
}

export interface WrapperConfig {
  id: string;
  publicName: string;
  description: string;
  invariant: string;
  surfaceChange: string;
  instructions: string;
}

export interface NodeCredibilityMetadata {
  protocolId?: string;
  protocolVersion?: string;
  evidenceStateReference?: string;
  claimsProfileReference?: string;
}

export interface IQMNodeModule {
  id: NodeId;
  title: string;
  shortTitle: string;
  shortDescription: string;
  estimatedSessionMinutes: number;
  programmeSessions?: number;
  game: GameAdapter;
  wrappers: {
    A: WrapperConfig;
    B: WrapperConfig;
    C?: WrapperConfig;
  };
  progression: WrapperProgressionConfig;
  strategy: StrategyConfig;
  missions: MissionTemplate[];
  nicheExamples?: Partial<Record<NicheChangeType, string[]>>;
  gTrackKeys?: string[];
  credibility?: NodeCredibilityMetadata;
  entitlement: {
    productKey: string;
  };
}

export interface NodeCatalogueEntry {
  id: NodeId;
  title: string;
  shortTitle: string;
  shortDescription: string;
}
