"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { isEmailInAllowlist } from "@/lib/allowlist";

export default function PendingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If approved, redirect to target dashboard
  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/");
      return;
    }

    const user = session.user as any;
    const isApproved = user?.isApproved as boolean | undefined;
    const userEmail = user?.email as string | undefined;

    if (isApproved || isEmailInAllowlist(userEmail)) {
      const role = user?.role;
      if (role === "PO") {
        router.replace("/PO");
      } else {
        router.replace("/student");
      }
    } else if (user?.waitlistConsent) {
      setSubmitted(true);
    }
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist-consent", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to submit waitlist consent");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-dim)] border-t-[var(--accent)] rounded-full animate-spin" style={{ animationDuration: '0.8s' }} />
          <p className="text-sm font-bold animate-pulse text-[var(--muted)]">Loading profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div
        className="w-full max-w-md neo-card-static p-8 animate-fade-in-up text-center relative"
        style={{
          background: "var(--card)",
          border: "var(--border-width) solid var(--card-border)",
          boxShadow: "var(--shadow-brutal-lg)",
        }}
      >
        {/* Header Icon */}
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6"
          style={{
            background: "var(--accent-dim)",
            border: "2px solid var(--accent)",
            boxShadow: "var(--shadow-brutal-sm)",
          }}
        >
          <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-xl font-black mb-2 tracking-tight text-[var(--foreground)]">
          Private Access Only
        </h1>
        <p className="text-xs font-semibold mb-6 text-[var(--muted)]">
          Signed in as <span className="font-bold text-[var(--foreground)]">{session?.user?.email}</span>
        </p>

        {submitted ? (
          <div className="animate-fade-in-up">
            <div className="bg-[rgba(16,185,129,0.08)] border-2 border-[var(--success)] rounded-xl p-5 mb-6 text-left">
              <h2 className="text-sm font-bold text-[var(--success)] mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You're on the waitlist!
              </h2>
              <p className="text-xs leading-relaxed text-[var(--foreground)]">
                Thank you for your interest. We are currently testing the platform in private beta. We've recorded your consent to store your profile details. 
              </p>
              <p className="text-xs leading-relaxed mt-2 text-[var(--muted)]">
                Our team is reviewing requests and will grant access manually. You will be redirected once your account is approved.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleCheckStatus}
                className="w-full py-3 px-4 neo-button text-xs font-extrabold uppercase tracking-wider text-[var(--foreground)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
              >
                Check Approval Status
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold text-[var(--muted)] hover:text-[var(--error)] transition-colors py-2"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="text-left animate-fade-in-up">
            <p className="text-xs leading-relaxed mb-6 text-[var(--foreground)]">
              This intelligence tool is currently in private academic testing. If you would like to be considered for early placement coordinator or student access, please register your request below.
            </p>

            {error && (
              <div className="bg-[rgba(239,68,68,0.08)] border-2 border-[var(--error)] text-[var(--error)] rounded-xl p-4 mb-4 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Checkbox consent */}
            <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded-md border-2 transition-all duration-150 flex items-center justify-center"
                  style={{
                    borderColor: consent ? "var(--accent)" : "var(--card-border)",
                    background: consent ? "var(--accent-dim)" : "var(--surface-1)",
                    boxShadow: consent ? "0 0 8px var(--accent-glow)" : "none",
                  }}
                >
                  {consent && (
                    <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--foreground)] leading-tight">
                I consent to my details being stored for private waitlist review.
              </span>
            </label>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={!consent || submitting}
                className="w-full py-3 px-4 neo-button text-xs font-extrabold uppercase tracking-wider text-[var(--foreground)]"
                style={{
                  background: consent ? "var(--accent-dim)" : "var(--surface-2)",
                  borderColor: consent ? "var(--accent)" : "var(--card-border)",
                }}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
              
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 text-xs font-bold text-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Sign out
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
