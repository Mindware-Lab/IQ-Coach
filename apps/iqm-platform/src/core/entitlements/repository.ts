import { currentPlatformUser, platformSupabase } from "../auth/client";
import type { NodeId } from "../../types/node";
import type { EntitlementRecord, EntitlementStatus } from "./store";

const NODE_IDS = new Set<NodeId>([
  "attention",
  "relational-memory",
  "binding-memory",
  "path-horizon",
  "knowledge-access",
  "generative-search",
  "reasoning",
]);

const STATUSES = new Set<EntitlementStatus>([
  "active",
  "inactive",
  "refunded",
  "admin-granted",
]);

interface EntitlementRow {
  user_id: string;
  node_id: string;
  status: string;
  source: string | null;
  product_key: string;
  activated_at: string;
  expires_at: string | null;
}

function rowToEntitlement(row: EntitlementRow): EntitlementRecord | null {
  if (!NODE_IDS.has(row.node_id as NodeId)) return null;
  if (!STATUSES.has(row.status as EntitlementStatus)) return null;
  return {
    userId: row.user_id,
    nodeId: row.node_id as NodeId,
    status: row.status as EntitlementStatus,
    source: row.source || "unknown",
    productKey: row.product_key,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
  };
}

export async function loadCurrentUserEntitlements(): Promise<EntitlementRecord[]> {
  if (!platformSupabase) return [];
  const user = await currentPlatformUser();
  if (!user) return [];

  const { data, error } = await platformSupabase
    .from("entitlements")
    .select("user_id,node_id,status,source,product_key,activated_at,expires_at")
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return ((data || []) as EntitlementRow[])
    .map(rowToEntitlement)
    .filter((value): value is EntitlementRecord => value !== null);
}
