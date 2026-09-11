import type { NodeId } from "../../types/node";
import type { WrapperProgressionState } from "../../types/progression";
import { createInitialProgressionState } from "../progression/engine";

const STORAGE_PREFIX = "iqm-platform:node-progress:v1";

function storageKey(userKey: string, nodeId: NodeId): string {
  return `${STORAGE_PREFIX}:${userKey}:${nodeId}`;
}

export function loadBrowserNodeProgress(
  userKey: string,
  nodeId: NodeId,
): WrapperProgressionState {
  if (typeof window === "undefined") return createInitialProgressionState();
  const raw = window.localStorage.getItem(storageKey(userKey, nodeId));
  if (!raw) return createInitialProgressionState();
  try {
    const value = JSON.parse(raw) as WrapperProgressionState;
    if (!value || typeof value !== "object" || typeof value.phase !== "string") {
      return createInitialProgressionState();
    }
    return value;
  } catch {
    return createInitialProgressionState();
  }
}

export function saveBrowserNodeProgress(
  userKey: string,
  nodeId: NodeId,
  state: WrapperProgressionState,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userKey, nodeId), JSON.stringify(state));
}

export function clearBrowserNodeProgress(userKey: string, nodeId: NodeId): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(userKey, nodeId));
}
