import type { NodeId } from "../../types/node";

export type EntitlementStatus =
  | "active"
  | "inactive"
  | "refunded"
  | "admin-granted";

export interface EntitlementRecord {
  userId: string;
  nodeId: NodeId;
  status: EntitlementStatus;
  source: string;
  productKey: string;
  activatedAt: string;
  expiresAt?: string | null;
}

export function entitlementIsActive(
  entitlement: EntitlementRecord,
  now = new Date(),
): boolean {
  if (entitlement.status !== "active" && entitlement.status !== "admin-granted") {
    return false;
  }
  if (!entitlement.expiresAt) return true;
  return new Date(entitlement.expiresAt).getTime() > now.getTime();
}

export function unlockedNodeIds(
  entitlements: EntitlementRecord[],
  now = new Date(),
): Set<NodeId> {
  return new Set(
    entitlements
      .filter((entitlement) => entitlementIsActive(entitlement, now))
      .map((entitlement) => entitlement.nodeId),
  );
}
