import type { NodeId } from "./node";

export interface BankedRule {
  id: string;
  userId: string;
  nodeId: NodeId;
  whenCue: string;
  actionRule: string;
  because?: string;
  sourceMissionId?: string;
  createdAt: string;
}
