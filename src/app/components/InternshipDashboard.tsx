"use client";

import { useState, useCallback, useEffect } from "react";
import SearchForm from "./SearchForm";
import type { SearchFilters } from "./SearchForm";
import JobCard from "./JobCard";
import StatusBanner from "./StatusBanner";
import SchoolFilter from "./SchoolFilter";
import type { SchoolsData } from "./SchoolFilter";

const API_BASE = "http://localhost:8000";

export interface Job {
  title: string | null;
  company: string | null;
  location: string | null;
  link: string | null;
  posted: string | null;
  posted_datetime: string | null;
  programs: string[];
  schools: string[];
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

    // Location is server-fixed (Bengaluru metro via f_PP); show it in the banner
    // for clarity rather than letting the user think they can change it.
    setLastQuery({ keywords: filters.keywords, location: "Bengaluru metro" });

    const startTime = Date.now();

    try {
      const params = new URLSearchParams({
        keywords: filters.keywords,
        freshness: filters.freshness,
      });
      // FastAPI collects repeated keys into a list automatically.
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

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Failed to initialize stream reader");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
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
                setStatusMessages([`Multi-search: ${chunk.total_searches} searches queued (parallel)`]);
              }
            } else if (chunk.type === "info") {
              console.log("Scraper info:", chunk.message);
              // Add to status messages for UI display
              setStatusMessages((prev) => {
                const updated = [...prev, chunk.message];
                // Keep only last 3 messages to avoid clutter
                return updated.slice(-3);
              });
            } else if (chunk.type === "jobs") {
              if (chunk.data && chunk.data.length > 0) {
                setJobs((prev) => {
                  const combined = [...prev, ...chunk.data];
                  // Deduplicate by link
                  const seen = new Set();
                  return combined.filter((job) => {
                    if (!job.link) return true;
                    if (seen.has(job.link)) return false;
                    seen.add(job.link);
                    return true;
                  });
                });
                // Track deduplication
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
              setScrapeUrl(chunk.url || "");
              setTotal(chunk.total || 0);
              setElapsed(Math.round((Date.now() - startTime) / 1000));
              // If partial results, show success with a note
              if (chunk.partial && jobs.length > 0) {
                setErrorMsg(`Got ${jobs.length} jobs but stream was interrupted: ${chunk.error || "connection lost"}`);
              }
              setStatus("success");
            } else if (chunk.type === "error") {
              // If we have accumulated jobs, show them as partial success instead of full error
              if (jobs.length > 0) {
                setErrorMsg(`Got ${jobs.length} jobs before scraping failed: ${chunk.message || "Scraping failed"}`);
                setStatus("success");
              } else {
                throw new Error(chunk.message || "Scraping failed");
              }
            }
          } catch (e) {
            console.error("Failed to parse stream line:", e);
          }
        }
      }

      // Ensure success status if stream ends without done event
      setStatus((prev) => (prev === "loading" ? "success" : prev));
      setElapsed(Math.round((Date.now() - startTime) / 1000));
    } catch (err: unknown) {
      setElapsed(Math.round((Date.now() - startTime) / 1000));
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setStatus("error");
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* ── Header ──────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{
          background: "var(--header-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
              }}
            >
              IS
            </div>
            <div>
              <h1
                className="text-base font-semibold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                InternScrapper
              </h1>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                LinkedIn Internship Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Engine badge */}
            {engine && status === "success" && (
              <div
                className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider animate-fade-in-up"
                style={{
                  background:
                    engine === "selenium"
                      ? "rgba(52, 211, 153, 0.1)"
                      : "rgba(129, 140, 248, 0.1)",
                  color:
                    engine === "selenium"
                      ? "var(--success)"
                      : "var(--accent)",
                  border: `1px solid ${engine === "selenium"
                      ? "rgba(52, 211, 153, 0.15)"
                      : "rgba(129, 140, 248, 0.15)"
                    }`,
                }}
              >
                {engine}
              </div>
            )}

            {/* Status pill */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background:
                  status === "loading"
                    ? "rgba(251, 191, 36, 0.1)"
                    : "rgba(52, 211, 153, 0.1)",
                color:
                  status === "loading" ? "var(--warning)" : "var(--success)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    status === "loading"
                      ? "var(--warning)"
                      : "var(--success)",
                  animation:
                    status === "loading" ? "pulseGlow 1.5s infinite" : "none",
                }}
              />
              {status === "loading" ? "Scraping…" : "System Online"}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {/* Search Form */}
        <SearchForm onSubmit={handleScrape} isLoading={status === "loading"} />

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

        {/* Constructed URL (debug link) */}
        {scrapeUrl && status === "success" && (
          <div className="mt-3 animate-slide-down">
            <a
              href={scrapeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono transition-colors duration-200"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              <svg
                className="w-3 h-3 shrink-0"
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
              Open this search on LinkedIn ↗
            </a>
          </div>
        )}

        {/* ── School Filter ─────────────────────────── */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 animate-fade-in-up"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--card-border)",
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {filteredJobs.map((job, i) => (
              <JobCard key={i} job={job} index={i} />
            ))}
            
            {/* Pulsing card appended at the end when still loading additional pages */}
            {status === "loading" && (
              <div
                className="rounded-2xl p-5 animate-pulse"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--card-border)",
                }}
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
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-5"
              style={{ background: "var(--surface-1)" }}
            >
              🔍
            </div>
            <p
              className="text-base font-medium"
              style={{ color: "var(--foreground)" }}
            >
              No jobs match this school filter
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Try a different school or clear the filter to see all results.
            </p>
          </div>
        )}

        {/* ── Empty State (no results) ──────────────── */}
        {status === "success" && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-5"
              style={{ background: "var(--surface-1)" }}
            >
              🔍
            </div>
            <p
              className="text-base font-medium"
              style={{ color: "var(--foreground)" }}
            >
              No internships found
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Try different keywords, a broader location, or relax the filters.
            </p>
            {scrapeUrl && (
              <a
                href={scrapeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xs font-medium transition-colors duration-200"
                style={{ color: "var(--accent)" }}
              >
                Verify this search on LinkedIn ↗
              </a>
            )}
          </div>
        )}

        {/* ── Idle State ───────────────────────────── */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">

            <p
              className="text-lg font-semibold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Ready to scrape
            </p>
            <p
              className="text-sm mt-1.5 max-w-sm text-center leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              Enter keywords, tick the{" "}
              <span style={{ color: "var(--accent)" }}>work-type</span> /{" "}
              <span style={{ color: "var(--accent)" }}>job-type</span> filters
              you care about, then hit{" "}
              <span style={{ color: "var(--accent)" }}>Scrape</span> to pull
              fresh Bengaluru-metro internships from LinkedIn.
            </p>
            <div
              className="flex items-center gap-4 mt-6 text-[10px] font-mono uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              <span>Selenium</span>
              <span style={{ color: "var(--card-border)" }}>+</span>
              <span>Playwright</span>
              <span style={{ color: "var(--card-border)" }}>+</span>
              <span>BeautifulSoup</span>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <footer
        className="border-t py-5"
        style={{ borderColor: "var(--card-border)" }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Selenium + Playwright + BeautifulSoup + Next.js
          </p>
          <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
            localhost:8000
          </p>
        </div>
      </footer>
    </div>
  );
}
