import type { NodeId } from "../../types/node";

export type StrategyStatus = "not_started" | "learned" | "practising";

const PREFIX = "iqm-platform:strategy-status:v1";

function key(userKey: string, nodeId: NodeId): string {
  return `${PREFIX}:${userKey}:${nodeId}`;
}

export function loadBrowserStrategyStatus(
  userKey: string,
  nodeId: NodeId,
): StrategyStatus {
  if (typeof window === "undefined") return "not_started";
  const value = window.localStorage.getItem(key(userKey, nodeId));
  return value === "learned" || value === "practising" ? value : "not_started";
}

export function saveBrowserStrategyStatus(
  userKey: string,
  nodeId: NodeId,
  status: StrategyStatus,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(userKey, nodeId), status);
}
