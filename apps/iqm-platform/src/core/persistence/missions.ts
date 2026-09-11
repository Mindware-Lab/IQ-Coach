import type { Mission, MissionCheckin } from "../../types/mission";
import type { NodeId } from "../../types/node";

const MISSION_PREFIX = "iqm-platform:missions:v1";
const CHECKIN_PREFIX = "iqm-platform:mission-checkins:v1";

function missionKey(userKey: string, nodeId: NodeId): string {
  return `${MISSION_PREFIX}:${userKey}:${nodeId}`;
}

function checkinKey(userKey: string, nodeId: NodeId): string {
  return `${CHECKIN_PREFIX}:${userKey}:${nodeId}`;
}

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, rows: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(rows));
}

export function loadBrowserMissions(userKey: string, nodeId: NodeId): Mission[] {
  return readArray<Mission>(missionKey(userKey, nodeId));
}

export function saveBrowserMission(userKey: string, mission: Mission): Mission[] {
  const rows = loadBrowserMissions(userKey, mission.nodeId);
  const next = [...rows.filter((row) => row.id !== mission.id), mission];
  writeArray(missionKey(userKey, mission.nodeId), next);
  return next;
}

export function loadBrowserMissionCheckins(userKey: string, nodeId: NodeId): MissionCheckin[] {
  return readArray<MissionCheckin>(checkinKey(userKey, nodeId));
}

export function saveBrowserMissionCheckin(userKey: string, checkin: MissionCheckin): MissionCheckin[] {
  const rows = loadBrowserMissionCheckins(userKey, checkin.nodeId);
  const next = [...rows.filter((row) => row.id !== checkin.id), checkin];
  writeArray(checkinKey(userKey, checkin.nodeId), next);
  return next;
}
