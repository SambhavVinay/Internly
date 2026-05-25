"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { signIn, useSession } from "@/lib/auth-client";

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/student";

  const { data: session, isPending } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && session) {
      router.replace(redirectTo);
    }
  }, [isPending, session, redirectTo, router]);

  const handleGoogle = async () => {
    setSubmitting(true);
    setError(null);
    // Tell the dashboard to auto-open the account modal once after this
    // OAuth round-trip lands the user back in the app.
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("oh:show-account-modal", "1");
    }
    const { error: err } = await signIn.social({
      provider: "google",
      callbackURL: redirectTo,
    });
    if (err) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("oh:show-account-modal");
      }
      setError(err.message ?? "Sign-in failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-md mx-auto px-6 py-10 rounded-2xl"
      style={{
        background: "var(--card)",
        border: "2px solid var(--card-border)",
        boxShadow: "var(--shadow-brutal-lg)",
      }}
    >
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-black mb-4"
          style={{
            background: "var(--accent)",
            color: "#ffffff",
            border: "2px solid var(--card-border)",
            boxShadow: "var(--shadow-brutal-sm)",
          }}
        >
          OH
        </div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Sign in to OpportunityHub
        </h1>
        <p
          className="text-sm mt-2 max-w-xs"
          style={{ color: "var(--muted)" }}
        >
          Use your Google account to access the student dashboard and saved
          opportunities.
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={submitting || isPending}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-transform duration-150 active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "var(--surface-1)",
          color: "var(--foreground)",
          border: "2px solid var(--card-border)",
          boxShadow: "var(--shadow-brutal-sm)",
        }}
      >
        <GoogleGlyph />
        {submitting ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      {error && (
        <div
          className="mt-4 p-3 rounded-lg text-sm font-medium"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "2px solid var(--error)",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      <p
        className="text-xs text-center mt-6"
        style={{ color: "var(--muted)" }}
      >
        By continuing you agree that this is an academic research tool and
        not a commercial job-board.
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <Suspense
        fallback={
          <div
            className="w-full max-w-md mx-auto px-6 py-10 rounded-2xl animate-pulse"
            style={{
              background: "var(--card)",
              border: "2px solid var(--card-border)",
              boxShadow: "var(--shadow-brutal-lg)",
              minHeight: 280,
            }}
          />
        }
      >
        <LoginCard />
      </Suspense>
    </main>
  );
}
