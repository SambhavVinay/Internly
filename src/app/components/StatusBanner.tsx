"use client";

type ScrapeStatus = "idle" | "loading" | "success" | "error";

interface StatusBannerProps {
  status: ScrapeStatus;
  total: number;
  errorMsg: string;
  lastQuery: { keywords: string; location: string };
  elapsed: number;
  engine: string;
}

export default function StatusBanner({
  status,
  total,
  errorMsg,
  lastQuery,
  elapsed,
  engine,
}: StatusBannerProps) {
  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <div
        className="mt-6 rounded-xl px-5 py-4 flex items-center gap-3 animate-slide-down"
        style={{
          background: "rgba(251, 191, 36, 0.06)",
          border: "1px solid rgba(251, 191, 36, 0.12)",
        }}
      >
        <svg
          className="w-4 h-4 shrink-0"
          style={{
            color: "var(--warning)",
            animation: "spin 1s linear infinite",
          }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="60"
            strokeDashoffset="20"
          />
        </svg>
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--warning)" }}
          >
            Scraping in progress…
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Searching for &quot;{lastQuery.keywords}&quot; in {lastQuery.location}.
            Selenium scroll + HTTP pagination.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="mt-6 rounded-xl px-5 py-4 flex items-start gap-3 animate-slide-down"
        style={{
          background: "rgba(248, 113, 113, 0.06)",
          border: "1px solid rgba(248, 113, 113, 0.12)",
        }}
      >
        <svg
          className="w-4 h-4 mt-0.5 shrink-0"
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
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--error)" }}
          >
            Scrape failed
            {elapsed > 0 && (
              <span
                className="font-normal ml-2 text-xs"
                style={{ color: "var(--muted)" }}
              >
                after {elapsed}s
              </span>
            )}
          </p>
          <p
            className="text-xs mt-0.5 font-mono break-all"
            style={{ color: "var(--muted)" }}
          >
            {errorMsg}
          </p>
        </div>
      </div>
    );
  }

  // success
  return (
    <div
      className="mt-6 rounded-xl px-5 py-4 flex items-center justify-between animate-slide-down"
      style={{
        background: "rgba(52, 211, 153, 0.06)",
        border: "1px solid rgba(52, 211, 153, 0.12)",
      }}
    >
      <div className="flex items-center gap-3">
        <svg
          className="w-4 h-4 shrink-0"
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
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--success)" }}
          >
            Found {total} internship{total !== 1 ? "s" : ""}
            {elapsed > 0 && (
              <span
                className="font-normal ml-2 text-xs"
                style={{ color: "var(--muted)" }}
              >
                in {elapsed}s
              </span>
            )}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            &quot;{lastQuery.keywords}&quot; in {lastQuery.location}
          </p>
        </div>
      </div>

      {/* Engine indicator */}
      {engine && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
          style={{
            background:
              engine === "selenium"
                ? "rgba(52, 211, 153, 0.1)"
                : "rgba(129, 140, 248, 0.1)",
            color:
              engine === "selenium" ? "var(--success)" : "var(--accent)",
            border: `1px solid ${
              engine === "selenium"
                ? "rgba(52, 211, 153, 0.15)"
                : "rgba(129, 140, 248, 0.15)"
            }`,
          }}
        >
          <span
            className="w-1 h-1 rounded-full"
            style={{
              background:
                engine === "selenium" ? "var(--success)" : "var(--accent)",
            }}
          />
          via {engine}
        </div>
      )}
    </div>
  );
}
