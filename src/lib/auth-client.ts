import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same-origin in dev and prod (Next.js serves the auth API), so no baseURL
  // is required. Override here if you ever split the auth server out.
});

export const { signIn, signOut, useSession, getSession } = authClient;
