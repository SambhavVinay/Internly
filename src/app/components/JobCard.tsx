"use client";

import { useState, useEffect } from "react";
import type { Job } from "./InternshipDashboard";

interface JobCardProps {
  job: Job;
  index: number;
  rating?: number; // 1.0–5.0, shown as stars; omit for no stars
}

// Renders up to 5 stars (filled / half / empty) for a 1–5 float rating.
function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
    stars.push(
      <svg
        key={i}
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Empty star background */}
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={fill === 0 ? "var(--card-border)" : fill === 1 ? "var(--accent)" : "url(#half)"}
          stroke={fill === 0 ? "var(--card-border)" : "var(--accent)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {fill === 0.5 && (
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="var(--accent)" />
              <stop offset="50%" stopColor="var(--card-border)" />
            </linearGradient>
          </defs>
        )}
      </svg>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">{stars}</div>
      <span className="text-xs font-bold ml-1" style={{ color: "var(--accent)" }}>
        {rating.toFixed(1)}
      </span>
      <span className="text-xs" style={{ color: "var(--muted)" }}>/ 5</span>
    </div>
  );
}

function useTimeAgo(postedDatetime?: string | null, fallback?: string | null) {
  const [timeAgo, setTimeAgo] = useState(fallback || "");

  useEffect(() => {
    if (!postedDatetime) return;

    const calculateTimeAgo = () => {
      const now = new Date();
      const posted = new Date(postedDatetime);
      
      // Treat invalid dates or date-only strings (YYYY-MM-DD) by falling back to the original string
      if (isNaN(posted.getTime()) || (postedDatetime && postedDatetime.length <= 10)) {
        setTimeAgo(fallback || "");
        return;
      }
      
      const diffMs = now.getTime() - posted.getTime();
      
      if (diffMs < 0) {
        setTimeAgo("Just now");
        return;
      }
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        setTimeAgo(`${diffDays} day${diffDays > 1 ? "s" : ""} ago`);
      } else if (diffHours > 0) {
        setTimeAgo(`${diffHours} hour${diffHours > 1 ? "s" : ""} ago`);
      } else if (diffMins > 0) {
        setTimeAgo(`${diffMins} minute${diffMins > 1 ? "s" : ""} ago`);
      } else {
        setTimeAgo("Just now");
      }
    };

    calculateTimeAgo();
    const interval = setInterval(calculateTimeAgo, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [postedDatetime, fallback]);

  return timeAgo;
}

export default function JobCard({ job, index, rating }: JobCardProps) {
  const staggerClass = `stagger-${Math.min(index + 1, 10)}`;
  const timeAgo = useTimeAgo(job.posted_datetime, job.posted);

  return (
    <div
      className={`neo-card p-5 animate-fade-in-up ${staggerClass}`}
    >
      {/* Header row: Title + Posted badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3
          className="text-sm font-bold leading-snug line-clamp-2 flex-1"
          style={{ color: "var(--foreground)" }}
        >
          {job.title || "Position Details Pending"}
        </h3>
        {timeAgo && (
          <span
            className="shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1.5px solid var(--accent)",
            }}
          >
            {timeAgo}
          </span>
        )}
      </div>

      {/* Company */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "2px solid var(--accent)",
          }}
        >
          {job.company?.[0]?.toUpperCase() || "?"}
        </div>
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--foreground)" }}
        >
          {job.company || "Organization Pending"}
        </p>
      </div>

      {/* Star Rating (LLM-generated, ephemeral) */}
      {rating !== undefined && (
        <div
          className="flex items-center gap-2 mb-2 px-2 py-1 rounded-md"
          style={{
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            display: "inline-flex",
            width: "fit-content",
          }}
        >
          <StarRating rating={rating} />
        </div>
      )}

      {/* Location */}
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 shrink-0"
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
        <p className="text-sm truncate" style={{ color: "var(--muted)" }}>
          {job.location || "Location not specified"}
        </p>
      </div>

      {/* Program tags */}
      {job.programs && job.programs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.programs.slice(0, 3).map((prog) => (
            <span
              key={prog}
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                background: "var(--surface-1)",
                color: "var(--muted)",
                border: "1.5px solid var(--card-border)",
              }}
            >
              {prog}
            </span>
          ))}
          {job.programs.length > 3 && (
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                background: "var(--surface-1)",
                color: "var(--muted)",
                border: "1.5px solid var(--card-border)",
              }}
            >
              +{job.programs.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <div
        className="pt-3"
        style={{ borderTop: "1px solid var(--card-border)" }}
      >
        {job.link ? (
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold transition-all duration-150"
            style={{ color: "var(--accent)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.gap = "10px";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.gap = "8px";
            }}
          >
            View Original Listing
            <svg
              className="w-4 h-4"
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
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            Original listing unavailable
          </span>
        )}
      </div>
    </div>
  );
}
