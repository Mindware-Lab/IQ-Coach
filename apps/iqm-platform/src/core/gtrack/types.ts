import type { NodeId } from "../../types/node";

export interface GTrackResult {
  userId: string;
  assessmentId: string;
  testKey: string;
  constructKey: string;
  score: number;
  scoreScaleVersion: string;
  takenAt: string;
  source: string;
  relatedNodeIds?: NodeId[];
}

export interface GTrackReadModel {
  latestAssessmentAt?: string;
  results: GTrackResult[];
}
