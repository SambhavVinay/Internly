"use client";

import type { Job } from "./InternshipDashboard";

interface JobCardProps {
  job: Job;
  index: number;
}

export default function JobCard({ job, index }: JobCardProps) {
  const staggerClass = `stagger-${Math.min(index + 1, 10)}`;

  return (
    <div
      className={`group rounded-2xl p-5 transition-all duration-300 animate-fade-in-up ${staggerClass}`}
      style={{
        background: "var(--card)",
        border: "1px solid var(--card-border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--card-hover)";
        e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.15)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow =
          "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(129, 140, 248, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--card)";
        e.currentTarget.style.borderColor = "var(--card-border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header row: Title + Posted badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3
          className="text-sm font-semibold leading-snug line-clamp-2 flex-1"
          style={{ color: "var(--foreground)" }}
        >
          {job.title || "Untitled Position"}
        </h3>
        {job.posted && (
          <span
            className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
            }}
          >
            {job.posted}
          </span>
        )}
      </div>

      {/* Company */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
          }}
        >
          {job.company?.[0]?.toUpperCase() || "?"}
        </div>
        <p className="text-sm truncate" style={{ color: "var(--muted)" }}>
          {job.company || "Unknown Company"}
        </p>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 mb-3">
        <svg
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: "var(--muted)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
          {job.location || "Location not specified"}
        </p>
      </div>

      {/* Program tags */}
      {job.programs && job.programs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {job.programs.slice(0, 3).map((prog) => (
            <span
              key={prog}
              className="px-2 py-0.5 rounded text-[10px] font-medium"
              style={{
                background: "var(--surface-2)",
                color: "var(--muted)",
                border: "1px solid var(--card-border)",
              }}
            >
              {prog}
            </span>
          ))}
          {job.programs.length > 3 && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-medium"
              style={{
                background: "var(--surface-2)",
                color: "var(--muted)",
                border: "1px solid var(--card-border)",
              }}
            >
              +{job.programs.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      {job.link ? (
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200"
          style={{ color: "var(--accent)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "#a5b4fc")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--accent)")
          }
        >
          View on LinkedIn
          <svg
            className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
            />
          </svg>
        </a>
      ) : (
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          No link available
        </span>
      )}
    </div>
  );
}
