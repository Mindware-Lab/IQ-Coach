import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PLATFORM_AUTH_POLICY } from "./policy";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface PlatformAuthUser {
  id: string;
  email?: string;
}

export const isPlatformAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const platformSupabase: SupabaseClient | null = isPlatformAuthConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        flowType: "pkce",
        persistSession: PLATFORM_AUTH_POLICY.persistSession,
        autoRefreshToken: PLATFORM_AUTH_POLICY.autoRefreshToken,
        detectSessionInUrl: true,
      },
    })
  : null;

function toPlatformUser(user: { id: string; email?: string | null } | null): PlatformAuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || undefined,
  };
}

export async function currentPlatformUser(): Promise<PlatformAuthUser | null> {
  if (!platformSupabase) return null;
  const { data, error } = await platformSupabase.auth.getUser();
  if (error || !data.user) return null;
  return toPlatformUser(data.user);
}

export function onPlatformAuthChange(
  callback: (user: PlatformAuthUser | null) => void,
): { unsubscribe: () => void } | null {
  if (!platformSupabase) return null;
  const { data } = platformSupabase.auth.onAuthStateChange((_event, session) => {
    callback(toPlatformUser(session?.user ?? null));
  });
  return { unsubscribe: () => data.subscription.unsubscribe() };
}

export async function sendPlatformSignInLink(
  email: string,
  redirectTo = `${window.location.origin}${window.location.pathname}`,
): Promise<void> {
  if (!platformSupabase) {
    throw new Error("IQ Mindware platform authentication is not configured.");
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("Email is required.");
  const { error } = await platformSupabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function signOutPlatformUser(): Promise<void> {
  if (!platformSupabase) return;
  const { error } = await platformSupabase.auth.signOut();
  if (error) throw new Error(error.message);
}
