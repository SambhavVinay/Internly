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
    <div
      className="mt-6 rounded-2xl p-4 animate-slide-down"
      style={{
        background: "var(--card)",
        border: "1px solid var(--card-border)",
      }}
    >
      <p
        className="text-[10px] font-semibold tracking-widest uppercase mb-3"
        style={{ color: "var(--muted)" }}
      >
        Filter by School
      </p>

      <div className="flex flex-wrap gap-2">
        {/* "All" chip */}
        <SchoolChip
          label="All"
          count={totalJobs}
          active={selectedSchool === null}
          title="Show all schools"
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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer"
      style={{
        background: active ? "var(--accent-dim)" : "var(--surface-1)",
        color: active ? "var(--accent)" : "var(--muted)",
        border: `1px solid ${
          active ? "rgba(129, 140, 248, 0.25)" : "var(--card-border)"
        }`,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.15)";
          e.currentTarget.style.color = "var(--foreground)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "var(--card-border)";
          e.currentTarget.style.color = "var(--muted)";
        }
      }}
    >
      {label}
      <span
        className="px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums"
        style={{
          background: active
            ? "rgba(129, 140, 248, 0.2)"
            : "rgba(255, 255, 255, 0.05)",
          color: active ? "var(--accent)" : "var(--muted)",
        }}
      >
        {count}
      </span>
    </button>
  );
}
