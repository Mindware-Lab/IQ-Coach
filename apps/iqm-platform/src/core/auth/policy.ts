export const PLATFORM_AUTH_POLICY = Object.freeze({
  owner: "platform",
  provider: "supabase",
  flow: "pkce-email-link",
  persistSession: true,
  autoRefreshToken: true,
  nodeOwnedAuthenticationAllowed: false,
  entitlementLookupScope: "authenticated-user",
} as const);

/**
 * Authentication is owned once by the IQ Mindware platform shell. Node modules
 * may request entitlement state for the authenticated user, but must never
 * create their own login/session implementation.
 */
export function assertPlatformOwnedAuthentication(nodeOwnsAuth: boolean): void {
  if (nodeOwnsAuth) {
    throw new Error("Node modules must not own authentication. Use core/auth.");
  }
}
