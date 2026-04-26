import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { supabase } from "./utils/supabase";
import type { Session } from "@supabase/supabase-js";
import { AUTH_FILE } from "./utils/env";

async function saveSession(session: Session): Promise<void> {
  await writeFile(AUTH_FILE, JSON.stringify(session, null, 2), "utf-8");
}

async function loadSession(): Promise<Session | null> {
  try {
    if (!existsSync(AUTH_FILE)) return null;
    const raw = await readFile(AUTH_FILE, "utf-8");
    return JSON.parse(raw) as Session;
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

export async function getAuthState(): Promise<AuthState> {
  const saved = await loadSession();
  if (!saved) return { status: "none" };

  const { data, error } = await supabase.auth.setSession({
    access_token: saved.access_token,
    refresh_token: saved.refresh_token,
  });

  if (error || !data.session) return { status: "none" };

  const isAnon = data.session.user.is_anonymous === true;
  if (isAnon) return { status: "anonymous" };

  await saveSession(data.session);
  return { status: "logged_in", session: data.session };
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

  await saveSession(data.session);
  return { session: data.session, error: null };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  await clearSession();
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getOrCreateSession();
    return session.access_token;
  } catch {
    return null;
  }
}

export async function getUserId(): Promise<string | null> {
  try {
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
