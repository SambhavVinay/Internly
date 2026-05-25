"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface StudentSchoolFilterProps {
  /** All school names available across the currently-loaded jobs. */
  schools: string[];
  /** Currently selected school names. Empty array means "no filter". */
  selected: string[];
  /** Replace the selected list. */
  onChange: (next: string[]) => void;
}

/**
 * Multi-select dropdown used by the student dashboard to filter jobs by
 * the `schools` array stored on each scraped job. An empty `selected`
 * list means the filter is off and all jobs are shown.
 *
 * Kept separate from the chip-style `SchoolFilter` used by the admin
 * dashboard so the two surfaces can evolve independently.
 */
export default function StudentSchoolFilter({
  schools,
  selected,
  onChange,
}: StudentSchoolFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Close on ESC.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const visibleSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) => s.toLowerCase().includes(q));
  }, [schools, query]);

  const toggle = (school: string) => {
    if (selected.includes(school)) {
      onChange(selected.filter((s) => s !== school));
    } else {
      onChange([...selected, school]);
    }
  };

  const active = selected.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200"
        style={{
          background: active ? "var(--accent-dim)" : "var(--surface-1)",
          color: active ? "var(--accent)" : "var(--foreground)",
          border: `2px solid ${active ? "var(--accent)" : "var(--card-border)"}`,
        }}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-.553.894l-4 2A1 1 0 019 21v-8.586L3.293 6.707A1 1 0 013 6V4z"
          />
        </svg>
        <span>Schools</span>
        {active && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-black px-1"
            style={{ background: "var(--accent)", color: "#ffffff" }}
          >
            {selected.length}
          </span>
        )}
        <svg
          className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute right-0 mt-2 w-72 rounded-xl overflow-hidden z-50"
          style={{
            background: "var(--card)",
            border: "2px solid var(--card-border)",
            boxShadow: "var(--shadow-brutal-lg)",
          }}
        >
          <div
            className="flex items-center justify-between gap-2 px-3 py-2"
            style={{ borderBottom: "2px solid var(--card-border)" }}
          >
            <span
              className="text-xs font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Filter by school
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
              className="text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
              style={{ color: "var(--accent)" }}
            >
              Clear
            </button>
          </div>

          {schools.length > 8 && (
            <div
              className="px-3 py-2"
              style={{ borderBottom: "2px solid var(--card-border)" }}
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search schools…"
                className="w-full px-2 py-1.5 rounded-md text-xs outline-none"
                style={{
                  background: "var(--surface-1)",
                  border: "1.5px solid var(--card-border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          )}

          {schools.length === 0 ? (
            <div
              className="px-3 py-6 text-center text-xs"
              style={{ color: "var(--muted)" }}
            >
              No schools tagged on the current jobs
            </div>
          ) : visibleSchools.length === 0 ? (
            <div
              className="px-3 py-6 text-center text-xs"
              style={{ color: "var(--muted)" }}
            >
              No matches for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto py-1">
              {visibleSchools.map((school) => {
                const checked = selected.includes(school);
                return (
                  <label
                    key={school}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors"
                    style={{
                      color: "var(--foreground)",
                      background: checked ? "var(--accent-dim)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(school)}
                      className="w-4 h-4 cursor-pointer flex-shrink-0"
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span className="truncate">{school}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
