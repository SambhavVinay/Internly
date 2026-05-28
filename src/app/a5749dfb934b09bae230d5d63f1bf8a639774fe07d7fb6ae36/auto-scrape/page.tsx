"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : (process.env.NEXT_PUBLIC_API_URL || "https://oh-internscrapper-oppurtunityhub.hf.space");

const TOTAL_SCHOOLS = 8;
const ALL_SCHOOLS = ["socse", "sob", "sodi", "soepp", "solaw", "sofmca", "solas", "soahp"];

interface SweepEntry {
  sweep_id: number;
  is_running: boolean;
  current_school: string | null;
  completed: { school: string; jobs: number }[];
  failed: { school: string; error: string }[];
  started_at: number;
  finished_at: number | null;
  cancelled: boolean;
  elapsed_seconds?: number;
  progress: string;
  total_schools: number;
  schools: string[];
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ${s}s`;
}

function SweepCard({ sweep }: { sweep: SweepEntry }) {
  const completedSchools = new Set(sweep.completed.map((c) => c.school));
  const failedSchools = new Set(sweep.failed.map((f) => f.school));
  const processedCount = sweep.completed.length + sweep.failed.length;
  const progressPercent = Math.round((processedCount / TOTAL_SCHOOLS) * 100);
  const totalJobs = sweep.completed.reduce((sum, c) => sum + c.jobs, 0);

  const remaining = ALL_SCHOOLS.filter(
    (s) => !completedSchools.has(s) && !failedSchools.has(s) && s !== sweep.current_school
  );

  const status = sweep.cancelled
    ? "cancelled"
    : sweep.is_running
    ? "running"
    : sweep.failed.length > 0 && sweep.completed.length === 0
    ? "error"
    : "done";

  const statusConfig = {
    running: {
      bg: "rgba(217,119,6,0.06)",
      border: "var(--warning)",
      label: "Running",
      color: "var(--warning)",
    },
    done: {
      bg: "rgba(5,150,105,0.06)",
      border: "var(--success)",
      label: "Complete",
      color: "var(--success)",
    },
    error: {
      bg: "rgba(239,68,68,0.06)",
      border: "var(--error)",
      label: "Failed",
      color: "var(--error)",
    },
    cancelled: {
      bg: "rgba(107,114,128,0.06)",
      border: "var(--muted)",
      label: "Cancelled",
      color: "var(--muted)",
    },
  };

  const cfg = statusConfig[status];

  return (
    <div
      className="rounded-xl p-5 animate-fade-in-up"
      style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {status === "running" ? (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(217,119,6,0.12)",
                border: "2px solid var(--warning)",
              }}
            >
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                stroke="var(--warning)"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          ) : status === "done" ? (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(5,150,105,0.12)",
                border: "2px solid var(--success)",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="var(--success)"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: status === "error" ? "rgba(239,68,68,0.12)" : "rgba(107,114,128,0.12)",
                border: `2px solid ${status === "error" ? "var(--error)" : "var(--muted)"}`,
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke={status === "error" ? "var(--error)" : "var(--muted)"}
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
          )}
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              Sweep #{sweep.sweep_id}
              <span
                className="font-mono ml-2 text-xs font-medium"
                style={{ color: "var(--muted)" }}
              >
                {formatTimestamp(sweep.started_at)}
              </span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {sweep.progress} schools processed
              {totalJobs > 0 && (
                <span className="font-semibold ml-1" style={{ color: cfg.color }}>
                  · {totalJobs} jobs found
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Elapsed time */}
          {sweep.elapsed_seconds !== undefined && (
            <span
              className="text-xs font-mono px-2 py-1 rounded-md"
              style={{
                background: "var(--surface-1)",
                color: "var(--muted)",
                border: "1px solid var(--card-border)",
              }}
            >
              ⏱ {formatDuration(sweep.elapsed_seconds)}
            </span>
          )}

          {/* Status badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
            style={{
              background: cfg.bg,
              color: cfg.color,
              border: `2px solid ${cfg.border}`,
            }}
          >
            {status === "running" && (
              <span
                className="w-2 h-2 rounded-full animate-breathe"
                style={{ background: cfg.color }}
              />
            )}
            {cfg.label}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full mb-4 overflow-hidden"
        style={{ background: "var(--card-border)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: status === "running"
              ? "var(--warning)"
              : status === "done"
              ? "var(--success)"
              : status === "error"
              ? "var(--error)"
              : "var(--muted)",
            transition: "width 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>

      {/* School chips */}
      <div className="flex flex-wrap gap-1.5">
        {/* Completed */}
        {sweep.completed.map(({ school, jobs }) => (
          <span
            key={school}
            className="px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1"
            style={{
              background: "rgba(5,150,105,0.12)",
              color: "var(--success)",
              border: "1px solid var(--success)",
            }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {school.toUpperCase()} · {jobs}
          </span>
        ))}

        {/* Failed */}
        {sweep.failed.map(({ school }) => (
          <span
            key={school}
            className="px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1"
            style={{
              background: "rgba(239,68,68,0.10)",
              color: "var(--error)",
              border: "1px solid var(--error)",
            }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {school.toUpperCase()} ✕
          </span>
        ))}

        {/* Currently running */}
        {status === "running" && sweep.current_school && (
          <span
            className="px-2.5 py-1 rounded-md text-xs font-semibold animate-breathe inline-flex items-center gap-1"
            style={{
              background: "rgba(217,119,6,0.12)",
              color: "var(--warning)",
              border: "1px solid var(--warning)",
            }}
          >
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {sweep.current_school.toUpperCase()} ⟳
          </span>
        )}

        {/* Remaining */}
        {status === "running" && remaining.length > 0 && (
          <>
            {remaining.map((school) => (
              <span
                key={school}
                className="px-2.5 py-1 rounded-md text-xs font-medium"
                style={{
                  background: "var(--surface-1)",
                  color: "var(--muted)",
                  border: "1px dashed var(--card-border)",
                  opacity: 0.7,
                }}
              >
                {school.toUpperCase()}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function AutoScrapeAnalyticsPage() {
  const [history, setHistory] = useState<SweepEntry[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/scrape-history`);
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data.history || []);
      setTotalRuns(data.total_runs || 0);
    } catch {
      // silently ignore poll errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    pollRef.current = setInterval(fetchHistory, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchHistory]);

  // Compute summary stats
  const totalJobs = history.reduce(
    (sum, s) => sum + s.completed.reduce((js, c) => js + c.jobs, 0),
    0
  );
  const completedRuns = history.filter((s) => !s.is_running && !s.cancelled).length;
  const activeRun = history.find((s) => s.is_running);

  // Uptime — only counts while a sweep is actively running
  const uptimeSeconds = activeRun?.elapsed_seconds ?? 0;

  // Determine admin dashboard base path
  const adminPath =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/auto-scrape\/?$/, "")
      : "";

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
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href={adminPath || "/"}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
              title="Back to Admin Dashboard"
              style={{
                background: "var(--surface-1)",
                border: "2px solid var(--card-border)",
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--card-border)";
                e.currentTarget.style.color = "var(--foreground)";
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </a>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black"
              style={{
                background: "var(--accent)",
                color: "#ffffff",
                border: "2px solid var(--card-border)",
                boxShadow: "2px 2px 0 var(--shadow-color)",
              }}
            >
              OH
            </div>
            <div>
              <h1
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                Auto Scrape Analytics
              </h1>
              <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                Hourly Sweep History & Progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stop Auto-Scrape Button */}
            {activeRun && (
              <button
                onClick={async () => {
                  try {
                    await fetch(`${API_BASE}/admin/stop-scrape`, { method: "POST" });
                    // Immediately refresh history to reflect the stop
                    fetchHistory();
                  } catch (err) {
                    console.error("Failed to stop auto-scrape", err);
                  }
                }}
                title="Stop the hourly scraper and cancel the current sweep"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={{
                  background: "rgba(239,68,68,0.10)",
                  color: "var(--error)",
                  border: "2px solid var(--error)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--error)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.10)";
                  e.currentTarget.style.color = "var(--error)";
                }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop Auto-Scrape
              </button>
            )}

            {/* Live status pill */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: activeRun
                  ? "rgba(217, 119, 6, 0.08)"
                  : "rgba(5, 150, 105, 0.08)",
                color: activeRun ? "var(--warning)" : "var(--success)",
                border: `2px solid ${activeRun ? "var(--warning)" : "var(--success)"}`,
              }}
            >
              <span
                className={`w-2 h-2 rounded-full ${activeRun ? "animate-breathe" : ""}`}
                style={{
                  background: activeRun ? "var(--warning)" : "var(--success)",
                }}
              />
              {activeRun ? "Sweep Running" : "Idle"}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {/* ── Summary Stats ──────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Runs",
              value: totalRuns.toString(),
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ),
              color: "var(--accent)",
            },
            {
              label: "Completed",
              value: completedRuns.toString(),
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: "var(--success)",
            },
            {
              label: "Total Jobs Found",
              value: totalJobs.toLocaleString(),
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--warning)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                </svg>
              ),
              color: "var(--warning)",
            },
            {
              label: "Uptime",
              value: uptimeSeconds > 0 ? formatDuration(uptimeSeconds) : "—",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--muted)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: "var(--muted)",
            },
          ].map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="neo-card-static px-4 py-4 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: `color-mix(in srgb, ${color} 10%, transparent)`,
                  border: `1.5px solid ${color}`,
                }}
              >
                {icon}
              </div>
              <div>
                <p className="text-lg font-bold font-mono" style={{ color: "var(--foreground)" }}>
                  {value}
                </p>
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Sweep Run Cards ────────────────────────── */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="neo-card-static p-5 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="skeleton h-5 w-1/3 mb-3" />
                <div className="skeleton h-3 w-2/3 mb-4" />
                <div className="skeleton h-2 w-full mb-4 rounded-full" />
                <div className="flex gap-2">
                  <div className="skeleton h-6 w-20 rounded-md" />
                  <div className="skeleton h-6 w-20 rounded-md" />
                  <div className="skeleton h-6 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
              style={{
                background: "var(--accent-dim)",
                border: "2px solid var(--accent)",
                boxShadow: "3px 3px 0 var(--shadow-color)",
              }}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="var(--accent)"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <p
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              No Scrape Runs Yet
            </p>
            <p
              className="text-sm mt-2 max-w-md text-center leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              Start the auto-scrape from the admin dashboard to begin tracking
              sweep runs. Each hourly sweep will appear here with real-time
              progress.
            </p>
            <a
              href={adminPath || "/"}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "2px solid var(--accent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent-dim)";
                e.currentTarget.style.color = "var(--accent)";
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Go to Admin Dashboard
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Sweep History
              </h2>
              <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                Auto-refreshing every 3s
              </p>
            </div>
            {history.map((sweep) => (
              <SweepCard key={sweep.sweep_id} sweep={sweep} />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <footer
        className="py-6 mt-auto"
        style={{ borderTop: "2px solid var(--card-border)" }}
      >
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            OpportunityHub · Auto Scrape Analytics
          </p>
          <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
            Polling active · {history.length} run{history.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
      </footer>
    </div>
  );
}
