import { describe, expect, it } from "vitest";
import {
  PLATFORM_AUTH_POLICY,
  assertPlatformOwnedAuthentication,
} from "../../src/core/auth/policy";

describe("platform authentication policy", () => {
  it("keeps one shared platform-owned login for every node", () => {
    expect(PLATFORM_AUTH_POLICY.owner).toBe("platform");
    expect(PLATFORM_AUTH_POLICY.nodeOwnedAuthenticationAllowed).toBe(false);
    expect(PLATFORM_AUTH_POLICY.flow).toBe("pkce-email-link");
    expect(() => assertPlatformOwnedAuthentication(false)).not.toThrow();
    expect(() => assertPlatformOwnedAuthentication(true)).toThrow(/must not own authentication/i);
  });
});
