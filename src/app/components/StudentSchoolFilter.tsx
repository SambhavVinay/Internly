"use client";

interface StudentSchoolFilterProps {
  /** All school names available across the currently-loaded jobs. */
  schools: string[];
  /** Currently selected school names. Empty array means "no filter". */
  selected: string[];
  /** Replace the selected list. */
  onChange: (next: string[]) => void;
  /** Number of jobs per school */
  counts: Record<string, number>;
  /** Total number of jobs */
  totalJobs: number;
}

/**
 * Horizontal chip-style filter for the student dashboard.
 */
export default function StudentSchoolFilter({
  schools,
  selected,
  onChange,
  counts,
  totalJobs,
}: StudentSchoolFilterProps) {
  if (schools.length === 0) return null;

  const toggle = (school: string) => {
    if (selected.includes(school)) {
      onChange(selected.filter((s) => s !== school));
    } else {
      onChange([...selected, school]);
    }
  };

  const isAllSelected = selected.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* "All" Chip */}
      <button
        type="button"
        onClick={() => onChange([])}
        className={`neo-chip flex items-center gap-2 px-3 py-1.5 text-xs font-bold ${isAllSelected ? "active" : ""}`}
        style={{
          background: isAllSelected ? "var(--accent-dim)" : "var(--surface-1)",
          color: isAllSelected ? "var(--accent)" : "var(--muted)",
          borderColor: isAllSelected ? "var(--accent)" : "var(--card-border)",
        }}
      >
        All Departments
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums font-mono"
          style={{
            background: isAllSelected ? "var(--accent-glow)" : "var(--surface-2)",
            color: isAllSelected ? "var(--accent)" : "var(--muted)",
          }}
        >
          {totalJobs}
        </span>
      </button>

      {/* Per-school chips */}
      {schools.map((school) => {
        const active = selected.includes(school);
        return (
          <button
            key={school}
            type="button"
            onClick={() => toggle(school)}
            className={`neo-chip flex items-center gap-2 px-3 py-1.5 text-xs font-bold ${active ? "active" : ""}`}
            style={{
              background: active ? "var(--accent-dim)" : "var(--surface-1)",
              color: active ? "var(--accent)" : "var(--muted)",
              borderColor: active ? "var(--accent)" : "var(--card-border)",
            }}
          >
            {school}
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums font-mono"
              style={{
                background: active ? "var(--accent-glow)" : "var(--surface-2)",
                color: active ? "var(--accent)" : "var(--muted)",
              }}
            >
              {counts[school] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
