"use client";

import { useState } from "react";

export interface SearchFilters {
  keywords: string;
  freshness: string;
  work_types: string[];  // semantic keys: "onsite" | "remote" | "hybrid"
  job_types: string[];   // semantic keys: "internship" | "full_time"
}

interface SearchFormProps {
  onSubmit: (filters: SearchFilters) => void;
  isLoading: boolean;
}

/* ── Option definitions ────────────────────────────
 * The keys MUST match the backend's WORK_TYPES / JOB_TYPES tables in main.py;
 * the backend translates them to LinkedIn's f_WT / f_JT codes server-side.
 * Location, experience, and city pickers are intentionally absent — those are
 * fixed server-side via _FIXED_PARAMS (sortBy=R, f_E=1, f_PP=<4 metro ids>).
 */
const WORK_TYPE_OPTIONS = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const JOB_TYPE_OPTIONS = [
  { value: "internship", label: "Internship" },
  { value: "full_time",  label: "Full-time" },
];
const FRESHNESS_OPTIONS = [
  { value: "r3600",    label: "Past 1 hour" },
  { value: "r86400",   label: "Past 24 hours" },
  { value: "r604800",  label: "Past week" },
  { value: "r2592000", label: "Past month" },
];

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [keywords, setKeywords] = useState("Software Engineer");
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [freshness, setFreshness] = useState("r86400");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) return;
    onSubmit({
      keywords: keywords.trim(),
      freshness,
      work_types: workTypes,
      job_types: jobTypes,
    });
  };

  const activeFilterCount = [workTypes.length > 0, jobTypes.length > 0].filter(
    Boolean
  ).length;

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in-up">
      <div className="neo-card-static p-6">
        {/* ── Primary Row: Keywords + Discover button ── */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 flex flex-col gap-2">
            <label
              htmlFor="search-keywords"
              className="text-xs font-bold tracking-wide uppercase"
              style={{ color: "var(--muted)" }}
            >
              Search Opportunities
            </label>
            <input
              id="search-keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. Frontend Developer, Data Analyst, Marketing"
              disabled={isLoading}
              className="neo-input w-full px-4 py-3 text-sm font-medium"
            />
          </div>

          <button
            id="discover-button"
            type="submit"
            disabled={isLoading || !keywords.trim()}
            className="neo-button w-full sm:w-auto px-7 py-3 text-sm font-bold"
            style={{
              background: isLoading ? "var(--surface-2)" : "var(--accent)",
              color: isLoading ? "var(--muted)" : "#fff",
              borderColor: isLoading ? "var(--card-border)" : "var(--accent)",
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  style={{ animation: "spin 1s linear infinite" }}
                  viewBox="0 0 24 24"
                  fill="none"
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
                Searching...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Discover Opportunities
              </span>
            )}
          </button>
        </div>

        {/* ── Filters Row ───────────────────────────── */}
        <div
          className="mt-5 pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          style={{ borderTop: "2px solid var(--card-border)" }}
        >
          {/* Work Type */}
          <FilterGroup label="Work Type">
            {WORK_TYPE_OPTIONS.map((opt) => (
              <ChipToggle
                key={opt.value}
                label={opt.label}
                active={workTypes.includes(opt.value)}
                onClick={() => toggleMulti(workTypes, setWorkTypes, opt.value)}
                disabled={isLoading}
              />
            ))}
          </FilterGroup>

          {/* Job Type */}
          <FilterGroup label="Opportunity Type">
            {JOB_TYPE_OPTIONS.map((opt) => (
              <ChipToggle
                key={opt.value}
                label={opt.label}
                active={jobTypes.includes(opt.value)}
                onClick={() => toggleMulti(jobTypes, setJobTypes, opt.value)}
                disabled={isLoading}
              />
            ))}
          </FilterGroup>

          {/* Freshness */}
          <FilterGroup label="Listed Within">
            <select
              value={freshness}
              onChange={(e) => setFreshness(e.target.value)}
              disabled={isLoading}
              className="neo-input w-full px-3 py-2 text-sm font-medium cursor-pointer"
            >
              {FRESHNESS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FilterGroup>
        </div>

        {/* ── Footer hint ───────────────────────────── */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Opportunities indexed from the{" "}
            <span className="font-semibold" style={{ color: "var(--accent)" }}>
              Bengaluru metro
            </span>{" "}
            area. Experience level:{" "}
            <span className="font-semibold" style={{ color: "var(--accent)" }}>
              Entry-level & Internship
            </span>
            .
          </p>
          {activeFilterCount > 0 && (
            <span
              className="shrink-0 px-2 py-0.5 rounded-md text-xs font-bold"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "2px solid var(--accent)",
              }}
            >
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}

/* ── Sub-components ────────────────────────────── */

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ChipToggle({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`neo-chip px-3 py-1.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${active ? "active" : ""}`}
      style={{
        background: active ? "var(--accent-dim)" : "var(--surface-1)",
        color: active ? "var(--accent)" : "var(--muted)",
        borderColor: active ? "var(--accent)" : "var(--card-border)",
      }}
    >
      {label}
    </button>
  );
}

function toggleMulti(
  current: string[],
  setter: (val: string[]) => void,
  value: string
) {
  if (current.includes(value)) {
    setter(current.filter((x) => x !== value));
  } else {
    setter([...current, value]);
  }
}
