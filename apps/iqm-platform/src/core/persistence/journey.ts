import type { BankedRule } from "../../types/learning";
import type { NodeId } from "../../types/node";

const ORIENTATION_PREFIX = "iqm-platform:orientation:v1";
const CHAPTER_PREFIX = "iqm-platform:chapter-seen:v1";
const BANK_PREFIX = "iqm-platform:banked-rules:v1";

function orientationKey(userKey: string): string {
  return `${ORIENTATION_PREFIX}:${userKey}`;
}

function chapterKey(userKey: string, nodeId: NodeId): string {
  return `${CHAPTER_PREFIX}:${userKey}:${nodeId}`;
}

function bankKey(userKey: string, nodeId: NodeId): string {
  return `${BANK_PREFIX}:${userKey}:${nodeId}`;
}

export function hasSeenPlatformOrientation(userKey: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(orientationKey(userKey)) === "seen";
}

export function markPlatformOrientationSeen(userKey: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(orientationKey(userKey), "seen");
}

export function hasSeenNodeChapter(userKey: string, nodeId: NodeId): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(chapterKey(userKey, nodeId)) === "seen";
}

export function markNodeChapterSeen(userKey: string, nodeId: NodeId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(chapterKey(userKey, nodeId), "seen");
}

export function loadBrowserBankedRules(userKey: string, nodeId: NodeId): BankedRule[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(bankKey(userKey, nodeId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BankedRule[]) : [];
  } catch {
    return [];
  }
}

export function saveBrowserBankedRule(userKey: string, rule: BankedRule): BankedRule[] {
  const rows = loadBrowserBankedRules(userKey, rule.nodeId);
  const next = [...rows.filter((row) => row.id !== rule.id), rule].slice(-20);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(bankKey(userKey, rule.nodeId), JSON.stringify(next));
  }
  return next;
}

export function hasBankedMissionRule(
  userKey: string,
  nodeId: NodeId,
  missionId: string,
): boolean {
  return loadBrowserBankedRules(userKey, nodeId).some((rule) => rule.sourceMissionId === missionId);
}
