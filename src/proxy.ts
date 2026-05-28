import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-friendly gate for `/student`. We only check for the presence of a
 * signed Better Auth session cookie here — full session validation happens
 * inside the page / API handlers via `auth.api.getSession`. This keeps the
 * proxy fast and stateless.
 *
 * `/` is the login page itself, so it is intentionally NOT matched.
 * The admin page (long random URL) is gated only by its URL, also not matched.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*"],
};
