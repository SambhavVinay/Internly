"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AccountButton from "./AccountButton";
import JobCard from "./JobCard";
import ThemeToggle from "./ThemeToggle";
import AcademicNotice from "./AcademicNotice";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { isEmailInAllowlist } from "@/lib/allowlist";
import type { Job } from "./InternshipDashboard";

export default function GCCDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;
  const userEmail = session?.user?.email ?? null;
  const userName = session?.user?.name ?? null;

  // Enforce PO-only and approval check client-side
  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/student");
      return;
    }
    const isApproved = (session.user as any).isApproved as boolean | undefined;
    if (!isApproved && !isEmailInAllowlist(session.user.email)) {
      router.replace("/pending");
      return;
    }
    if (userRole !== "PO") {
      router.replace("/student");
    }
  }, [session, userRole, isPending, router]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [openedJobIds, setOpenedJobIds] = useState<number[]>([]);

  const handleJobOpened = (jobId: number) => {
    setOpenedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/po/gcc-jobs?t=${Date.now()}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      const result = await response.json();
      setJobs(result.jobs || []);
      setTotalCount(result.totalCount || 0);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (isPending || !session || userRole !== "PO") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="skeleton h-12 w-48" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* ── Header ──────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "var(--header-bg)",
          borderBottom: "2px solid var(--card-border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black cursor-pointer"
              style={{ color: "#ffffff" }}
              onClick={() => router.push("/PO")}
            >
              <Image
                src="/internly.jpeg"
                alt="Internly Logo"
                width={100}
                height={100}
              />
            </div>
            <div>
              <h1
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                PO Dashboard - GCC Listings
              </h1>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--muted)" }}
              >
                Global Capability Centers
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
            <button
              onClick={() => router.push("/PO")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200"
              style={{
                background: "var(--surface-1)",
                color: "var(--foreground)",
                border: "2px solid var(--card-border)",
              }}
            >
              ← Back to PO Dashboard
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              suppressHydrationWarning
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200"
              style={{
                background: loading ? "var(--surface-1)" : "var(--accent-dim)",
                color: loading ? "var(--muted)" : "var(--accent)",
                border: `2px solid ${loading ? "var(--card-border)" : "var(--accent)"}`,
              }}
            >
              <svg
                className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Account avatar */}
            <AccountButton />
          </div>
        </div>
      </header>

      {/* ── Academic Notice ──────────────────────────── */}
      <AcademicNotice />

      {/* ── Main Content ────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className={`mb-6 flex items-center justify-between gap-3 flex-wrap transition-opacity duration-300 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {lastUpdated ? `Last updated: ${formatLastUpdated(lastUpdated)}` : ""}
          </p>
          {totalCount > 0 && (
            <p className="text-sm font-bold text-emerald-600">
              Showing top {jobs.length} of {totalCount} total jobs from GCC Hunt
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "2px solid var(--error)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--error)" }}>
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && jobs.length === 0 && (
          <div className="space-y-8">
            <div className="skeleton h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="neo-card-static p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="skeleton h-5 w-3/4 mb-3" />
                  <div className="skeleton h-4 w-1/2 mb-2" />
                  <div className="skeleton h-3 w-1/3 mb-3" />
                  <div className="skeleton h-3 w-1/4" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Section */}
        {!loading && jobs.length > 0 && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job, i) => (
                <JobCard
                  key={`gcc-job-${i}`}
                  job={job}
                  index={i}
                  isViewed={job.id ? openedJobIds.includes(job.id) : false}
                  onViewed={() => job.id && handleJobOpened(job.id)}
                  userRole="PO"
                  userEmail={userEmail}
                  userName={userName}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up transition-opacity duration-500">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
              style={{ background: "var(--surface-1)", border: "2px solid var(--card-border)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <p className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              No GCC Opportunities Yet
            </p>
            <p className="text-sm mt-2 max-w-md text-center leading-relaxed" style={{ color: "var(--muted)" }}>
              The GCC Hunt database returned no jobs. Ensure the jobs.json file is populated.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
