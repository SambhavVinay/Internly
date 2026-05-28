"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import SearchForm from "./SearchForm";
import type { SearchFilters } from "./SearchForm";
import JobCard from "./JobCard";
import StatusBanner from "./StatusBanner";
import SchoolFilter from "./SchoolFilter";
import type { SchoolsData } from "./SchoolFilter";
import ThemeToggle from "./ThemeToggle";
import AcademicNotice from "./AcademicNotice";
import Footer from "./Footer";

// All scraping/admin actions go directly to the Python backend on HuggingFace Spaces
const API_BASE =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : (process.env.NEXT_PUBLIC_API_URL || "https://oh-internscrapper-oppurtunityhub.hf.space");
const LOCAL_API = API_BASE;

export interface Job {
  title: string | null;
  company: string | null;
  location: string | null;
  link: string | null;
  posted: string | null;
  posted_datetime: string | null;
  programs: string[];
  schools: string[];
  company_rating?: number | null; // persisted from DB after rating
}

type ScrapeStatus = "idle" | "loading" | "success" | "error";

export default function InternshipDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<ScrapeStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [total, setTotal] = useState(0);
  const [lastQuery, setLastQuery] = useState({ keywords: "", location: "" });
  const [elapsed, setElapsed] = useState(0);
  const [engine, setEngine] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [totalSearches, setTotalSearches] = useState(0);
  const [deduplicatedCount, setDeduplicatedCount] = useState(0);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);

  // Company ratings — populated automatically after scraping finishes
  const [companyRatings, setCompanyRatings] = useState<Record<string, number>>({});
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsElapsed, setRatingsElapsed] = useState<number | null>(null);
  const [ratingsError, setRatingsError] = useState("");

  // Auto-scrape sweep state
  type SweepStatus = "idle" | "running" | "done" | "error";
  const [sweepStatus, setSweepStatus] = useState<SweepStatus>("idle");
  const [sweepState, setSweepState] = useState<{
    current_school: string | null;
    completed: { school: string; jobs: number }[];
    failed: { school: string; error: string }[];
    progress: string;
    elapsed_seconds?: number;
  } | null>(null);
  const sweepPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep a ref to the live jobs list so the done-handler can read it without
  // a stale closure (jobs state updates are async).
  const jobsRef = useRef<Job[]>([]);
  useEffect(() => { jobsRef.current = jobs; }, [jobs]);

  const rateCompaniesAuto = useCallback(async (jobList: Job[]) => {
    const companySet = new Set<string>();
    for (const job of jobList) {
      if (job.company) companySet.add(job.company);
    }
    if (companySet.size === 0) return;

    setRatingsLoading(true);
    setRatingsElapsed(null);
    setRatingsError("");
    setCompanyRatings({});
    const ratingStart = Date.now();

    try {
      const response = await fetch(`${LOCAL_API}/rate-companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies: Array.from(companySet) }),
      });
      if (!response.ok) throw new Error(`Rating request failed: ${response.status}`);
      const result = await response.json();
      setCompanyRatings(result.ratings ?? {});
      setRatingsElapsed(Math.round((Date.now() - ratingStart) / 1000));
    } catch (err) {
      setRatingsError(err instanceof Error ? err.message : "Rating failed");
    } finally {
      setRatingsLoading(false);
    }
  }, []);

  // ── Auto-scrape sweep ───────────────────────────────────────────────────
  const stopSweepPoll = useCallback(() => {
    if (sweepPollRef.current) {
      clearInterval(sweepPollRef.current);
      sweepPollRef.current = null;
    }
  }, []);

  const pollSweepStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/scrape-status`);
      if (!res.ok) return;
      const data = await res.json();
      setSweepState(data);
      if (!data.is_running) {
        setSweepStatus(data.failed?.length > 0 && data.completed?.length === 0 ? "error" : "done");
        stopSweepPoll();
      }
    } catch {
      // silently ignore poll errors
    }
  }, [stopSweepPoll]);

  const triggerAutoScrape = useCallback(async () => {
    try {
      setSweepStatus("running");
      setSweepState(null);
      const res = await fetch(`${API_BASE}/admin/trigger-scrape`, { method: "POST" });
      const data = await res.json();
      if (data.status === "already_running") {
        // Already running — just start polling
      }
      // Poll every 3 seconds
      stopSweepPoll();
      sweepPollRef.current = setInterval(pollSweepStatus, 3000);
      // Immediate first poll
      await pollSweepStatus();
    } catch (err) {
      setSweepStatus("error");
      console.error("Failed to trigger auto-scrape", err);
    }
  }, [pollSweepStatus, stopSweepPoll]);

  const stopAutoScrape = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/admin/stop-scrape`, { method: "POST" });
      stopSweepPoll();
      setSweepStatus("idle");
      setSweepState(null);
    } catch (err) {
      console.error("Failed to stop auto-scrape", err);
    }
  }, [stopSweepPoll]);

  // Clean up poll on unmount
  useEffect(() => () => stopSweepPoll(), [stopSweepPoll]);

  const TOTAL_SCHOOLS = 8; // matches _AUTO_SCRAPE_SCHOOLS length in main.py

  const [schools, setSchools] = useState<SchoolsData>({});
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  // Fetch school registry once on mount — used for the filter chips.
  useEffect(() => {
    fetch(`${API_BASE}/schools`)
      .then((r) => r.json())
      .then(setSchools)
      .catch(() => { });
  }, []);

  // Per-school job counts (computed from full unfiltered list).
  const counts: Record<string, number> = {};
  for (const code of Object.keys(schools)) {
    counts[code] = jobs.filter((j) => j.schools.includes(code)).length;
  }

  const filteredJobs = selectedSchool
    ? jobs.filter((j) => j.schools.includes(selectedSchool))
    : jobs;

  const processStream = useCallback(async (res: Response, startTime: number) => {
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("Failed to initialize stream reader");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let hasJobs = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const chunk = JSON.parse(trimmed);
          if (chunk.type === "start") {
            setEngine(chunk.engine || "");
            if (chunk.total_searches) {
              setTotalSearches(chunk.total_searches);
              setStatusMessages([`Checking ${chunk.total_searches} sources simultaneously`]);
            }
          } else if (chunk.type === "info") {
            console.log("Search info:", chunk.message);
            setStatusMessages((prev) => {
              const updated = [...prev, chunk.message];
              return updated.slice(-3);
            });
          } else if (chunk.type === "jobs") {
            if (chunk.data && chunk.data.length > 0) {
              hasJobs = true;
              setJobs((prev) => {
                const combined = [...prev, ...chunk.data];
                const seen = new Set();
                return combined.filter((job) => {
                  if (!job.link) return true;
                  if (seen.has(job.link)) return false;
                  seen.add(job.link);
                  return true;
                });
              });
              if (chunk.deduplicated) {
                setDeduplicatedCount((prev) => prev + chunk.deduplicated);
              }
              setTotal((prev) => prev + chunk.data.length);
              if (chunk.engine) {
                setEngine(chunk.engine);
              }
            }
          } else if (chunk.type === "done") {
            setEngine(chunk.engine || "");
            if (chunk.url) setScrapeUrl(chunk.url);
            setTotal(chunk.total || 0);
            setElapsed(Math.round((Date.now() - startTime) / 1000));
            if (chunk.partial && hasJobs) {
              setErrorMsg(`Found opportunities but the search was interrupted: ${chunk.error || "connection lost"}`);
            }
            setStatus("success");
            // ── Auto-rate companies after scraping finishes ──────────
            // Use the ref so we get the fully up-to-date job list
            setTimeout(() => rateCompaniesAuto(jobsRef.current), 100);
          } else if (chunk.type === "error") {
            if (hasJobs) {
              setErrorMsg(`Found opportunities before the search ended: ${chunk.message || "Search failed"}`);
              setStatus("success");
            } else {
              throw new Error(chunk.message || "Search failed");
            }
          }
        } catch (e) {
          console.error("Failed to parse stream line:", e);
        }
      }
    }

    setStatus((prev) => (prev === "loading" ? "success" : prev));
    setElapsed(Math.round((Date.now() - startTime) / 1000));
  }, []);

  const handleScrape = useCallback(async (filters: SearchFilters) => {
    setStatus("loading");
    setErrorMsg("");
    setJobs([]);
    setTotal(0);
    setEngine("");
    setScrapeUrl("");
    setSelectedSchool(null);
    setTotalSearches(0);
    setDeduplicatedCount(0);
    setStatusMessages([]);
    // Reset ratings for the new scrape
    setCompanyRatings({});
    setRatingsElapsed(null);
    setRatingsError("");
    setRatingsLoading(false);

    setLastQuery({ keywords: filters.keywords, location: "Bengaluru metro" });

    const startTime = Date.now();

    try {
      const params = new URLSearchParams({
        keywords: filters.keywords,
        freshness: filters.freshness,
      });
      for (const wt of filters.work_types) params.append("work_types", wt);
      for (const jt of filters.job_types) params.append("job_types", jt);

      const res = await fetch(
        `${API_BASE}/scrape-internships?${params.toString()}`,
        { method: "POST" }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Server responded with ${res.status}`);
      }

      await processStream(res, startTime);
    } catch (err: unknown) {
      setElapsed(Math.round((Date.now() - startTime) / 1000));
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setStatus("error");
    }
  }, [processStream]);

  const reconnectToStream = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    setJobs([]);
    setTotal(0);
    setEngine("");
    setSelectedSchool(null);
    setTotalSearches(0);
    setDeduplicatedCount(0);
    setStatusMessages(["Reconnecting to active search..."]);

    const startTime = Date.now();
    try {
      const res = await fetch(`${API_BASE}/scrape-internships/stream`);
      if (!res.ok) throw new Error("Failed to reconnect");
      await processStream(res, startTime);
    } catch (err) {
      console.error("Reconnect failed", err);
      setStatus("idle");
    }
  }, [processStream]);

  useEffect(() => {
    fetch(`${API_BASE}/scrape-internships/status`)
      .then(res => res.json())
      .then(data => {
        if (data.is_active || data.has_history) {
          reconnectToStream();
        }
      })
      .catch(e => console.error("Failed to check scrape status", e));
  }, [reconnectToStream]);

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
                OpportunityHub
              </h1>
              <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                Student Career Discovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Student Dashboard Button */}
            <a
              href="/student"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200"
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
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
              Student Dashboard
            </a>

            {/* Auto-Scrape Schools Button */}
            <button
              id="auto-scrape-btn"
              onClick={triggerAutoScrape}
              disabled={sweepStatus === "running"}
              title={sweepStatus === "running" ? "Sweep in progress…" : "Scrape all 8 schools now"}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
              style={{
                background:
                  sweepStatus === "running"
                    ? "rgba(217,119,6,0.10)"
                    : sweepStatus === "done"
                    ? "rgba(5,150,105,0.10)"
                    : sweepStatus === "error"
                    ? "rgba(239,68,68,0.10)"
                    : "var(--surface-1)",
                color:
                  sweepStatus === "running"
                    ? "var(--warning)"
                    : sweepStatus === "done"
                    ? "var(--success)"
                    : sweepStatus === "error"
                    ? "var(--error)"
                    : "var(--foreground)",
                border: `2px solid ${
                  sweepStatus === "running"
                    ? "var(--warning)"
                    : sweepStatus === "done"
                    ? "var(--success)"
                    : sweepStatus === "error"
                    ? "var(--error)"
                    : "var(--card-border)"
                }`,
                cursor: sweepStatus === "running" ? "not-allowed" : "pointer",
                opacity: sweepStatus === "running" ? 0.8 : 1,
              }}
            >
              {sweepStatus === "running" ? (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : sweepStatus === "done" ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {sweepStatus === "running"
                ? sweepState?.current_school
                  ? `Scraping ${sweepState.current_school}…`
                  : "Starting…"
                : sweepStatus === "done"
                ? "Sweep done ✓"
                : sweepStatus === "error"
                ? "Sweep failed"
                : "Auto-Scrape Schools"}
            </button>

            {/* Stop Auto-Scrape Button */}
            {(sweepStatus === "running" || sweepStatus === "done" || sweepStatus === "error") && (
              <button
                onClick={stopAutoScrape}
                title="Stop the hourly scraper and cancel the current sweep"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={{
                  background: "rgba(239,68,68,0.10)",
                  color: "var(--error)",
                  border: "2px solid var(--error)",
                  cursor: "pointer",
                }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop Auto-Scrape
              </button>
            )}

            {/* Status pill */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: status === "loading" ? "rgba(217, 119, 6, 0.08)" : "rgba(5, 150, 105, 0.08)",
                color: status === "loading" ? "var(--warning)" : "var(--success)",
                border: `2px solid ${status === "loading" ? "var(--warning)" : "var(--success)"}`,
              }}
            >
              <span
                className={`w-2 h-2 rounded-full ${status === "loading" ? "animate-breathe" : ""}`}
                style={{
                  background: status === "loading" ? "var(--warning)" : "var(--success)",
                }}
              />
              {status === "loading" ? "Searching..." : "Ready"}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Academic Notice ──────────────────────────── */}
      <AcademicNotice />

      {/* ── Main ────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {/* Search Form */}
        <SearchForm onSubmit={handleScrape} isLoading={status === "loading"} />

        {/* ── Auto-Scrape Progress Panel ───────────────────────────────────── */}
        {(sweepStatus === "running" || sweepStatus === "done" || sweepStatus === "error") && (
          <div
            className="mt-5 p-4 rounded-xl animate-fade-in-up"
            style={{
              background:
                sweepStatus === "error"
                  ? "rgba(239,68,68,0.06)"
                  : sweepStatus === "done"
                  ? "rgba(5,150,105,0.06)"
                  : "rgba(217,119,6,0.06)",
              border: `2px solid ${
                sweepStatus === "error"
                  ? "var(--error)"
                  : sweepStatus === "done"
                  ? "var(--success)"
                  : "var(--warning)"
              }`,
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {sweepStatus === "running" && (
                  <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" stroke="var(--warning)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <p
                  className="text-sm font-bold"
                  style={{
                    color:
                      sweepStatus === "error"
                        ? "var(--error)"
                        : sweepStatus === "done"
                        ? "var(--success)"
                        : "var(--warning)",
                  }}
                >
                  {sweepStatus === "running"
                    ? `Sweeping schools… ${sweepState?.progress ?? "0/8"}`
                    : sweepStatus === "done"
                    ? `Sweep complete — ${sweepState?.progress ?? "8/8"} schools processed`
                    : "Sweep encountered errors"}
                </p>
              </div>
              {sweepState?.elapsed_seconds !== undefined && (
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {sweepState.elapsed_seconds}s elapsed
                </span>
              )}
            </div>

            {/* Progress bar */}
            {sweepState && (
              <div
                className="h-1.5 rounded-full mb-3 overflow-hidden"
                style={{ background: "var(--card-border)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round(
                      ((sweepState.completed.length + sweepState.failed.length) / TOTAL_SCHOOLS) * 100
                    )}%`,
                    background:
                      sweepStatus === "done" ? "var(--success)" : "var(--warning)",
                  }}
                />
              </div>
            )}

            {/* Per-school chips */}
            {sweepState && (
              <div className="flex flex-wrap gap-1.5">
                {sweepState.completed.map(({ school, jobs }) => (
                  <span
                    key={school}
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: "rgba(5,150,105,0.12)",
                      color: "var(--success)",
                      border: "1px solid var(--success)",
                    }}
                  >
                    {school} · {jobs} jobs
                  </span>
                ))}
                {sweepState.failed.map(({ school }) => (
                  <span
                    key={school}
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: "rgba(239,68,68,0.10)",
                      color: "var(--error)",
                      border: "1px solid var(--error)",
                    }}
                  >
                    {school} ✕
                  </span>
                ))}
                {sweepStatus === "running" && sweepState.current_school && (
                  <span
                    className="px-2 py-0.5 rounded text-xs font-semibold animate-breathe"
                    style={{
                      background: "rgba(217,119,6,0.12)",
                      color: "var(--warning)",
                      border: "1px solid var(--warning)",
                    }}
                  >
                    {sweepState.current_school} ⟳
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Banner */}
        <StatusBanner
          status={status}
          total={total}
          errorMsg={errorMsg}
          lastQuery={lastQuery}
          elapsed={elapsed}
          engine={engine}
          totalSearches={totalSearches}
          deduplicatedCount={deduplicatedCount}
          statusMessages={statusMessages}
        />

        {/* Rating Status Banner */}
        {(ratingsLoading || ratingsElapsed !== null || ratingsError) && (
          <div
            className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg animate-fade-in-up"
            style={{
              background: ratingsError
                ? "rgba(239,68,68,0.08)"
                : ratingsLoading
                  ? "rgba(217,119,6,0.08)"
                  : "rgba(251,191,36,0.10)",
              border: `2px solid ${ratingsError ? "var(--error)" : ratingsLoading ? "var(--warning)" : "#f59e0b"
                }`,
            }}
          >
            {ratingsLoading ? (
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--warning)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : ratingsError ? (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="var(--error)" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="#f59e0b" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: ratingsError ? "var(--error)" : ratingsLoading ? "var(--warning)" : "#f59e0b" }}>
                {ratingsLoading
                  ? "Rating companies with AI…"
                  : ratingsError
                    ? `Rating error: ${ratingsError}`
                    : `Companies rated by AI ✓`}
              </p>
              {!ratingsLoading && !ratingsError && ratingsElapsed !== null && (
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {Object.keys(companyRatings).length} companies rated in {ratingsElapsed}s
                </p>
              )}
            </div>
          </div>
        )}

        {/* Source link */}
        {scrapeUrl && status === "success" && (
          <div className="mt-3 animate-slide-down">
            <a
              href={scrapeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.56a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757"
                />
              </svg>
              View on original platform
            </a>
          </div>
        )}

        {/* ── School/Department Filter ────────────────── */}
        {status === "success" && jobs.length > 0 && Object.keys(schools).length > 0 && (
          <SchoolFilter
            schools={schools}
            selectedSchool={selectedSchool}
            onChange={setSelectedSchool}
            counts={counts}
          />
        )}

        {/* ── Skeleton Loading (initial) ────────────── */}
        {status === "loading" && jobs.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="neo-card-static p-5 animate-fade-in-up"
                style={{
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <div className="skeleton h-5 w-3/4 mb-3" />
                <div className="skeleton h-4 w-1/2 mb-2" />
                <div className="skeleton h-3 w-1/3 mb-3" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* ── Results Grid (real-time stream) ───────── */}
        {(status === "success" || (status === "loading" && jobs.length > 0)) && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            {filteredJobs.map((job, i) => (
              <JobCard
                key={i}
                job={job}
                index={i}
                rating={job.company ? companyRatings[job.company] : undefined}
              />
            ))}

            {/* Pulsing card appended at the end when still loading additional pages */}
            {status === "loading" && (
              <div
                className="neo-card-static p-5 animate-progress-pulse"
              >
                <div className="skeleton h-5 w-3/4 mb-3" />
                <div className="skeleton h-4 w-1/2 mb-2" />
                <div className="skeleton h-3 w-1/3 mb-3" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            )}
          </div>
        )}

        {/* ── Empty State (filtered) ────────────────── */}
        {status === "success" && jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
              style={{
                background: "var(--surface-1)",
                border: "2px solid var(--card-border)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <p
              className="text-base font-bold"
              style={{ color: "var(--foreground)" }}
            >
              No opportunities match this department
            </p>
            <p className="text-sm mt-1.5" style={{ color: "var(--muted)" }}>
              Try a different department or clear the filter to see all results.
            </p>
          </div>
        )}

        {/* ── Empty State (no results) ──────────────── */}
        {status === "success" && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
              style={{
                background: "var(--surface-1)",
                border: "2px solid var(--card-border)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <p
              className="text-base font-bold"
              style={{ color: "var(--foreground)" }}
            >
              No opportunities matched your search
            </p>
            <p className="text-sm mt-1.5 max-w-sm text-center" style={{ color: "var(--muted)" }}>
              Try different keywords, a broader location, or adjust the filters to find more opportunities.
            </p>
            {scrapeUrl && (
              <a
                href={scrapeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-sm font-semibold transition-colors duration-200"
                style={{ color: "var(--accent)" }}
              >
                View search on original platform
              </a>
            )}
          </div>
        )}

        {/* ── Idle State ───────────────────────────── */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
              style={{
                background: "var(--accent-dim)",
                border: "2px solid var(--accent)",
                boxShadow: "3px 3px 0 var(--shadow-color)",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>

            <p
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Discover Career Opportunities
            </p>
            <p
              className="text-sm mt-2 max-w-md text-center leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              Search by role, industry, or department to find relevant
              opportunities across the Bengaluru metro area. Results are
              indexed from publicly available listings.
            </p>
            <div
              className="flex items-center gap-3 mt-6 text-xs font-mono font-medium px-4 py-2 rounded-lg"
              style={{
                color: "var(--muted)",
                background: "var(--surface-1)",
                border: "1.5px solid var(--card-border)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--success)" }}
              />
              Index ready &middot; Updated continuously
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <Footer />
    </div>
  );
}
