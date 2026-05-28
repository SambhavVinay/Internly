"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { signOut, useSession } from "@/lib/auth-client";

/**
 * `sessionStorage` key the login page sets before redirecting to Google.
 * When the user lands back on the dashboard after OAuth completes, this
 * tells us to auto-open the account modal exactly once. The flag is
 * consumed (removed) on first use so a page refresh in the same session
 * doesn't re-trigger the popup.
 */
const SHOW_ON_LOGIN_FLAG = "oh:show-account-modal";

export default function AccountButton() {
  const { data, isPending } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Auto-open once after a fresh sign-in.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!data?.user) return;
    if (window.sessionStorage.getItem(SHOW_ON_LOGIN_FLAG) === "1") {
      setOpen(true);
      window.sessionStorage.removeItem(SHOW_ON_LOGIN_FLAG);
    }
  }, [data?.user]);

  // Close on ESC.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (isPending || !data?.user) return null;

  const { user, session } = data;

  const initials = (user.name || user.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open account details"
        className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center text-xs font-black transition-transform duration-150 active:translate-y-[1px]"
        style={{
          background: "var(--accent)",
          color: "#ffffff",
          border: "2px solid var(--card-border)",
          boxShadow: "var(--shadow-brutal-sm)",
        }}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Account details"
          className="fixed inset-0 z-[100] flex items-center justify-center px-6 py-12"
          style={{ background: "var(--overlay-bg)" }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "var(--card)",
              border: "2px solid var(--card-border)",
              boxShadow: "var(--shadow-brutal-lg)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "2px solid var(--card-border)" }}
            >
              <h2
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                Your account
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-transform duration-150 active:translate-y-[1px]"
                style={{
                  background: "var(--surface-1)",
                  border: "2px solid var(--card-border)",
                  color: "var(--foreground)",
                }}
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6 flex flex-col items-center text-center">
              <div
                className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center text-2xl font-black mb-4"
                style={{
                  background: "var(--accent)",
                  color: "#ffffff",
                  border: "2px solid var(--card-border)",
                  boxShadow: "var(--shadow-brutal)",
                }}
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <h3
                className="text-xl font-bold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                {user.name || "Signed-in user"}
              </h3>

              <div
                className="mt-1.5 flex items-center gap-2 text-sm flex-wrap justify-center"
                style={{ color: "var(--muted)" }}
              >
                <span>{user.email}</span>
                {user.emailVerified && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      background: "rgba(16, 185, 129, 0.10)",
                      color: "var(--success)",
                      border: "1.5px solid var(--success)",
                    }}
                  >
                    Verified
                  </span>
                )}
              </div>

              <div
                className="w-full mt-6 rounded-xl px-4 py-3"
                style={{
                  background: "var(--surface-1)",
                  border: "2px solid var(--card-border)",
                }}
              >
                <dl className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt style={{ color: "var(--muted)" }}>Signed in with</dt>
                    <dd
                      className="font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      Google
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt style={{ color: "var(--muted)" }}>User ID</dt>
                    <dd
                      className="font-mono truncate max-w-[60%] text-right"
                      title={user.id}
                      style={{ color: "var(--foreground)" }}
                    >
                      {user.id}
                    </dd>
                  </div>
                  {session?.expiresAt && (
                    <div className="flex items-center justify-between gap-3">
                      <dt style={{ color: "var(--muted)" }}>Session expires</dt>
                      <dd style={{ color: "var(--foreground)" }}>
                        {new Date(session.expiresAt).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full mt-6 px-4 py-2.5 rounded-xl text-sm font-bold transition-transform duration-150 active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "var(--surface-1)",
                  color: "var(--error)",
                  border: "2px solid var(--error)",
                  boxShadow: "var(--shadow-brutal-sm)",
                }}
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
