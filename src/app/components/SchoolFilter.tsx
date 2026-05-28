"use client";

export interface SchoolData {
  name: string;
  programs: string[];
}

export type SchoolsData = Record<string, SchoolData>;

interface SchoolFilterProps {
  schools: SchoolsData;
  selectedSchool: string | null;
  onChange: (school: string | null) => void;
  counts: Record<string, number>;
}

export default function SchoolFilter({
  schools,
  selectedSchool,
  onChange,
  counts,
}: SchoolFilterProps) {
  const codes = Object.keys(schools);
  if (codes.length === 0) return null;

  const totalJobs = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mt-6 neo-card-static p-5 animate-slide-down">
      <p
        className="text-xs font-bold tracking-widest uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Filter by Department
      </p>

      <div className="flex flex-wrap gap-2">
        {/* "All" chip */}
        <SchoolChip
          label="All"
          count={totalJobs}
          active={selectedSchool === null}
          title="Show all departments"
          onClick={() => onChange(null)}
        />

        {/* Per-school chips */}
        {codes.map((code) => (
          <SchoolChip
            key={code}
            label={code}
            count={counts[code] ?? 0}
            active={selectedSchool === code}
            title={schools[code].name}
            onClick={() => onChange(selectedSchool === code ? null : code)}
          />
        ))}
      </div>
    </div>
  );
}

function SchoolChip({
  label,
  count,
  active,
  title,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`neo-chip flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${active ? "active" : ""}`}
      style={{
        background: active ? "var(--accent-dim)" : "var(--surface-1)",
        color: active ? "var(--accent)" : "var(--muted)",
        borderColor: active ? "var(--accent)" : "var(--card-border)",
      }}
    >
      {label}
      <span
        className="px-1.5 py-0.5 rounded text-xs font-bold tabular-nums font-mono"
        style={{
          background: active
            ? "rgba(13, 148, 136, 0.15)"
            : "var(--surface-2)",
          color: active ? "var(--accent)" : "var(--muted)",
        }}
      >
        {count}
      </span>
    </button>
  );
}
