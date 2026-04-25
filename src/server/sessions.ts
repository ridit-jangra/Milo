import type { Mode } from "../types";
import type { Session } from "../utils/session";
import {
  createSession,
  saveSession,
  loadSession,
  listSessions,
} from "../utils/session";

type ActiveSession = {
  session: Session;
  mode: Mode;
};

const active = new Map<string, ActiveSession>();

export function createDaemonSession(mode: Mode = "agent"): ActiveSession {
  const session = createSession();
  const entry: ActiveSession = { session, mode };
  active.set(session.id, entry);
  saveSession(session);
  return entry;
}

export function getDaemonSession(id: string): ActiveSession | null {
  if (active.has(id)) return active.get(id)!;

  const session = loadSession(id);
  if (!session) return null;

  const entry: ActiveSession = { session, mode: "agent" };
  active.set(id, entry);
  return entry;
}

export function deleteDaemonSession(id: string): boolean {
  return active.delete(id);
}

export function listDaemonSessions(): {
  id: string;
  createdAt: number;
  updatedAt: number;
}[] {
  return listSessions();
}

export function updateDaemonSession(id: string, session: Session): void {
  const entry = active.get(id);
  if (!entry) return;
  entry.session = session;
  saveSession(session);
}
