import { readFile, writeFile, rename } from "fs/promises";
import { existsSync } from "fs";
import { supabase } from "./utils/supabase";
import type { Session } from "@supabase/supabase-js";
import { AUTH_FILE } from "./utils/env";

const AUTH_FILE_TMP = AUTH_FILE + ".tmp";

let writeLock: Promise<void> = Promise.resolve();

async function saveSession(session: Session): Promise<void> {
  writeLock = writeLock
    .then(async () => {
      const content = JSON.stringify(session, null, 2);
      await writeFile(AUTH_FILE_TMP, content, "utf-8");
      await rename(AUTH_FILE_TMP, AUTH_FILE);
    })
    .catch(() => {});
  await writeLock;
}

async function loadSession(): Promise<Session | null> {
  try {
    if (!existsSync(AUTH_FILE)) return null;
    const raw = await readFile(AUTH_FILE, "utf-8");

    const cleaned = raw
      .replace(/\uFFFD/g, "")
      .replace(/^\uFEFF/, "")
      .trim();

    if (!cleaned || !cleaned.startsWith("{")) return null;

    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace === -1) return null;

    const parsed = JSON.parse(cleaned.slice(0, lastBrace + 1)) as Session;

    if (!parsed.access_token || !parsed.refresh_token) return null;

    return parsed;
  } catch {
    return null;
  }
}

async function clearSession(): Promise<void> {
  try {
    if (existsSync(AUTH_FILE)) {
      await writeFile(AUTH_FILE, "", "utf-8");
    }
  } catch {}
}

export type AuthState =
  | { status: "logged_in"; session: Session }
  | { status: "anonymous" }
  | { status: "none" };

let cachedState: { state: AuthState; at: number } | null = null;
const CACHE_TTL = 30_000;

export async function getAuthState(force = false): Promise<AuthState> {
  const now = Date.now();
  if (!force && cachedState && now - cachedState.at < CACHE_TTL) {
    return cachedState.state;
  }

  const saved = await loadSession();
  if (!saved) {
    cachedState = { state: { status: "none" }, at: now };
    return cachedState.state;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: saved.access_token,
    refresh_token: saved.refresh_token,
  });

  if (error || !data.session) {
    cachedState = { state: { status: "none" }, at: now };
    return cachedState.state;
  }

  const isAnon = data.session.user.is_anonymous === true;
  if (isAnon) {
    cachedState = { state: { status: "anonymous" }, at: now };
    return cachedState.state;
  }

  await saveSession(data.session);
  const state: AuthState = { status: "logged_in", session: data.session };
  cachedState = { state, at: now };
  return state;
}

export async function getOrCreateSession(): Promise<Session> {
  const saved = await loadSession();

  if (saved) {
    const { data, error } = await supabase.auth.setSession({
      access_token: saved.access_token,
      refresh_token: saved.refresh_token,
    });

    if (!error && data.session) {
      await saveSession(data.session);
      return data.session;
    }
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session)
    throw new Error(`Milo auth failed: ${error?.message}`);

  await saveSession(data.session);
  return data.session;
}

export async function sendMagicLink(
  email: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  return { error: error?.message ?? null };
}

export async function verifyOtp(
  email: string,
  token: string,
): Promise<{ session: Session | null; error: string | null }> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data.session) {
    return { session: null, error: error?.message ?? "Verification failed" };
  }

  cachedState = null;
  await saveSession(data.session);
  return { session: data.session, error: null };
}

export async function logout(): Promise<void> {
  cachedState = null;
  await supabase.auth.signOut();
  await clearSession();
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const state = await getAuthState();
    if (state.status === "logged_in") return state.session.access_token;

    const session = await getOrCreateSession();
    return session.access_token;
  } catch {
    return null;
  }
}

export async function getUserId(): Promise<string | null> {
  try {
    const state = await getAuthState();
    if (state.status === "logged_in") return state.session.user.id;
    const session = await getOrCreateSession();
    return session.user.id;
  } catch {
    return null;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const state = await getAuthState();
  return state.status === "logged_in";
}
