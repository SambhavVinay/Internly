"use client";

type ScrapeStatus = "idle" | "loading" | "success" | "error";

interface StatusBannerProps {
  status: ScrapeStatus;
  total: number;
  errorMsg: string;
  lastQuery: { keywords: string; location: string };
  elapsed: number;
  engine: string;
  totalSearches?: number;
  deduplicatedCount?: number;
  statusMessages?: string[];
}

/**
 * Translate raw backend status messages into user-friendly language.
 * Strips technical jargon (scrape, selenium, HTTP, parallel, etc.)
 * and replaces with academic/career-focused wording.
 */
function sanitizeMessage(msg: string): string {
  let remainingText = "";
  const match = msg.match(/\[(\d+)\/(\d+)\]/);
  if (match) {
    const current = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    const left = total - current;
    remainingText = ` (${left} sources left)`;
  }

  return (
    msg
      // Remove technical prefixes
      .replace(/^Multi-search:\s*/i, "")
      .replace(/^Fallback\s*\[\d+\/\d+\]:\s*/i, "")
      .replace(/\[\d+\/\d+\]\s*/g, "")
      // Replace technical terms
      .replace(/parallel\s+searches?\s+queued\s*\(parallel\)/i, "sources being checked")
      .replace(/parallel\s+HTTP\s+returned\s+0\s+results.*/i, "Expanding search to additional sources...")
      .replace(/robust\s+(sequential\s+)?search\s+for/i, "Checking listings for")
      .replace(/search(es)?\s+queued\s*\(parallel\)/i, "sources being checked")
      .replace(/parallel\s+searches?/i, "sources")
      .replace(/Multi-search\s+aggregated\s+from/i, "Aggregated from")
      .replace(/Multi-search\s+with\s+parallel\s+execution/i, "Checking multiple sources")
      .replace(/Selenium\s+scroll\s*\+\s*HTTP\s+pagination/i, "Reviewing available listings")
      .replace(/scraping/gi, "searching")
      .replace(/scrape/gi, "search")
      .replace(/scraped/gi, "found")
      .replace(/\bnew\s+jobs\b/gi, "new opportunities")
      .replace(/\bjobs?\b/gi, "opportunities")
      .replace(/\binternships?\b/gi, "opportunities")
      .replace(/\btotal:\s*/gi, "total: ")
      .replace(/\bdone\b/gi, "complete")
      // Clean up stray punctuation
      .replace(/\s+/g, " ")
      .trim() + remainingText
  );
}

export default function StatusBanner({
  status,
  total,
  errorMsg,
  lastQuery,
  elapsed,
  totalSearches = 0,
  deduplicatedCount = 0,
  statusMessages = [],
}: StatusBannerProps) {
  if (status === "idle") return null;

  /* ── Loading State ─────────────────────────────── */
  if (status === "loading") {
    return (
      <div className="mt-6 neo-card-static px-5 py-5 animate-slide-down">
        <div className="flex items-start gap-4">
          {/* Animated indicator */}
          <div
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--accent-dim)",
              border: "2px solid var(--accent)",
            }}
          >
            <svg
              className="w-5 h-5"
              style={{
                color: "var(--accent)",
                animation: "spin 1.2s linear infinite",
              }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="60"
                strokeDashoffset="20"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold"
              style={{ color: "var(--foreground)" }}
            >
              Discovering opportunities...
              {total > 0 && (
                <span
                  className="font-mono ml-2"
                  style={{ color: "var(--accent)" }}
                >
                  {total} found
                </span>
              )}
            </p>
            {lastQuery.keywords || lastQuery.location ? (
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Searching for &quot;{lastQuery.keywords || "General opportunities"}&quot; in{" "}
                {lastQuery.location || "Bengaluru metro"}.
                {totalSearches > 1
                  ? ` Checking ${totalSearches} sources simultaneously.`
                  : " Reviewing available listings."}
              </p>
            ) : (
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Gathering opportunities...
                {totalSearches > 1
                  ? ` Checking ${totalSearches} sources simultaneously.`
                  : " Reviewing available listings."}
              </p>
            )}

            {/* Progress steps */}
            {statusMessages.length > 0 && (
              <div
                className="mt-3 pt-3 flex flex-col gap-1.5"
                style={{ borderTop: "1px solid var(--card-border)" }}
              >
                {statusMessages.map((msg, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span
                      className="shrink-0 w-1.5 h-1.5 rounded-full animate-breathe"
                      style={{
                        background: "var(--accent)",
                        animationDelay: `${idx * 0.3}s`,
                      }}
                    />
                    <p
                      className="text-xs font-mono"
                      style={{ color: "var(--muted)" }}
                    >
                      {sanitizeMessage(msg)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error State ───────────────────────────────── */
  if (status === "error") {
    return (
      <div
        className="mt-6 neo-card-static px-5 py-5 animate-slide-down"
        style={{ borderColor: "var(--error)" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(220, 38, 38, 0.08)",
              border: "2px solid var(--error)",
            }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: "var(--error)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold"
              style={{ color: "var(--error)" }}
            >
              Search could not be completed
              {elapsed > 0 && (
                <span
                  className="font-normal ml-2 text-xs font-mono"
                  style={{ color: "var(--muted)" }}
                >
                  after {elapsed}s
                </span>
              )}
            </p>
            <p
              className="text-sm mt-1 break-all"
              style={{ color: "var(--muted)" }}
            >
              {sanitizeMessage(errorMsg)}
            </p>
            <p
              className="text-xs mt-2"
              style={{ color: "var(--muted)" }}
            >
              Please try again with different keywords or adjust your filters.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success State ─────────────────────────────── */
  return (
    <div className="mt-6 neo-card-static px-5 py-5 animate-slide-down">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Success icon */}
          <div
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(5, 150, 105, 0.08)",
              border: "2px solid var(--success)",
            }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: "var(--success)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <p
              className="text-sm font-bold"
              style={{ color: "var(--foreground)" }}
            >
              <span style={{ color: "var(--success)" }}>
                {total} {total === 1 ? "opportunity" : "opportunities"}
              </span>{" "}
              discovered
              {deduplicatedCount > 0 && (
                <span
                  className="font-normal ml-2 text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  ({deduplicatedCount} duplicate
                  {deduplicatedCount !== 1 ? "s" : ""} removed)
                </span>
              )}
            </p>
            {lastQuery.keywords || lastQuery.location ? (
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                &quot;{lastQuery.keywords || "General opportunities"}&quot; in {lastQuery.location || "Bengaluru metro"}
                {elapsed > 0 && (
                  <span className="font-mono ml-1">
                    &middot; {elapsed}s
                  </span>
                )}
                {totalSearches > 1 && (
                  <span style={{ display: "block", marginTop: "0.25rem" }}>
                    Aggregated from {totalSearches} sources
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                General search in Bengaluru metro
                {elapsed > 0 && (
                  <span className="font-mono ml-1">
                    &middot; {elapsed}s
                  </span>
                )}
                {totalSearches > 1 && (
                  <span style={{ display: "block", marginTop: "0.25rem" }}>
                    Aggregated from {totalSearches} sources
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Completion badge */}
        <div
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{
            background: "rgba(5, 150, 105, 0.08)",
            color: "var(--success)",
            border: "2px solid var(--success)",
          }}
        >
          Complete
        </div>
      </div>
    </div>
  );
}
