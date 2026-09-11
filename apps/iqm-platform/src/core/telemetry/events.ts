import type { NodeId } from "../../types/node";
import type { WrapperPhase } from "../../types/progression";

export type ProductEventType =
  | "training_session_started"
  | "training_session_completed"
  | "strategy_status_changed"
  | "mission_created"
  | "mission_checkin_recorded"
  | "entitlement_changed"
  | "gtrack_viewed";

export interface ProductEvent {
  id: string;
  userId: string;
  eventType: ProductEventType;
  occurredAt: string;
  nodeId?: NodeId;
  sessionId?: string;
  wrapperPhase?: WrapperPhase;
  payload: Record<string, unknown>;
}

/**
 * Product events preserve raw implementation history for operations and later
 * governed analysis. They must not be labelled as scientific transfer outcomes
 * or mutualist causal estimates in Phase 1.
 */
export function createProductEvent(event: ProductEvent): ProductEvent {
  return event;
}
