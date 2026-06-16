"use client";

import { useState } from "react";
import type { SearchFilters } from "./SearchForm";

interface LinkedInSearchFormProps {
  onSubmit: (filters: SearchFilters) => void;
  isLoading: boolean;
}

const WORK_TYPE_OPTIONS = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const JOB_TYPE_OPTIONS = [
  { value: "internship", label: "Internship" },
  { value: "full_time", label: "Full-time" },
];

const FRESHNESS_OPTIONS = [
  { value: "r3600", label: "Past 1 hour" },
  { value: "r86400", label: "Past 24 hours" },
  { value: "r604800", label: "Past week" },
  { value: "r2592000", label: "Past month" },
];

const LINKEDIN_BLUE = "#0A66C2";
const LINKEDIN_BLUE_DIM = "rgba(10, 102, 194, 0.12)";

export default function LinkedInSearchForm({
  onSubmit,
  isLoading,
}: LinkedInSearchFormProps) {
  const [keywords, setKeywords] = useState("intern");
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
    Boolean,
  ).length;

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in-up">
      <div
        className="neo-card-static p-6"
        style={{
          borderColor: LINKEDIN_BLUE,
          borderWidth: "2px",
        }}
      >
        {/* ── LinkedIn Header Badge ── */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold"
            style={{
              background: LINKEDIN_BLUE_DIM,
              color: LINKEDIN_BLUE,
              border: `1.5px solid ${LINKEDIN_BLUE}`,
            }}
          >
            <LinkedInIcon size={14} />
            LinkedIn Scraper
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Headless browser scraping — results may vary
          </span>
        </div>

        {/* ── Primary Row: Keywords + Scrape button ── */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 flex flex-col gap-2">
            <label
              htmlFor="linkedin-search-keywords"
              className="text-xs font-bold tracking-wide uppercase"
              style={{ color: "var(--muted)" }}
            >
              Search LinkedIn
            </label>
            <input
              id="linkedin-search-keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. intern, Software Engineer, Data Analyst"
              disabled={isLoading}
              className="neo-input w-full px-4 py-3 text-sm font-medium"
              style={{
                borderColor: LINKEDIN_BLUE,
              }}
            />
          </div>

          <button
            id="linkedin-scrape-button"
            type="submit"
            disabled={isLoading || !keywords.trim()}
            className="neo-button w-full sm:w-auto px-7 py-3 text-sm font-bold"
            style={{
              background: isLoading ? "var(--surface-2)" : LINKEDIN_BLUE,
              color: isLoading ? "var(--muted)" : "#fff",
              borderColor: isLoading ? "var(--card-border)" : LINKEDIN_BLUE,
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
                Scraping LinkedIn...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LinkedInIcon size={16} />
                Scrape via LinkedIn
              </span>
            )}
          </button>
        </div>

        {/* ── Filters Row ───────────────────────────── */}
        <div
          className="mt-5 pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          style={{ borderTop: `2px solid ${LINKEDIN_BLUE}30` }}
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
                accentColor={LINKEDIN_BLUE}
                accentDim={LINKEDIN_BLUE_DIM}
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
                accentColor={LINKEDIN_BLUE}
                accentDim={LINKEDIN_BLUE_DIM}
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
            Scrapes LinkedIn&apos;s public job listings in the{" "}
            <span className="font-semibold" style={{ color: LINKEDIN_BLUE }}>
              Bengaluru metro
            </span>{" "}
            area using headless browsers. Results depend on LinkedIn&apos;s
            availability.
          </p>
          {activeFilterCount > 0 && (
            <span
              className="shrink-0 px-2 py-0.5 rounded-md text-xs font-bold"
              style={{
                background: LINKEDIN_BLUE_DIM,
                color: LINKEDIN_BLUE,
                border: `2px solid ${LINKEDIN_BLUE}`,
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

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

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
  accentColor,
  accentDim,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  accentColor: string;
  accentDim: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`neo-chip px-3 py-1.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${active ? "active" : ""}`}
      style={{
        background: active ? accentDim : "var(--surface-1)",
        color: active ? accentColor : "var(--muted)",
        borderColor: active ? accentColor : "var(--card-border)",
      }}
    >
      {label}
    </button>
  );
}

function toggleMulti(
  current: string[],
  setter: (val: string[]) => void,
  value: string,
) {
  if (current.includes(value)) {
    setter(current.filter((x) => x !== value));
  } else {
    setter([...current, value]);
  }
}
