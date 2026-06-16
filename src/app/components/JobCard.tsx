"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Job } from "./InternshipDashboard";

interface JobCardProps {
  job: Job;
  index: number;
  rating?: number; // 1.0–5.0, shown as stars; omit for no stars
  isViewed?: boolean;
  onViewed?: () => void;
  /** Role of the currently logged-in user. Only 'PO' can see hiring team contacts. */
  userRole?: string | null;
  /** Email of the logged-in user — used to pick the right sender name. */
  userEmail?: string | null;
  /** Display name of the logged-in user — shown as sender unless overridden. */
  userName?: string | null;
}

// Renders up to 5 stars (filled / half / empty) for a 1–5 float rating.
function StarRating({ rating }: { rating: number }) {
  const starColor = rating > 4 ? "var(--success)" : rating >= 3 ? "var(--warning)" : "var(--error)";
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
    const gradientId = `half-${rating.toString().replace('.', '-')}-${i}`;
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
          fill={fill === 0 ? "var(--card-border)" : fill === 1 ? starColor : `url(#${gradientId})`}
          stroke={fill === 0 ? "var(--card-border)" : starColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {fill === 0.5 && (
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="50%" stopColor={starColor} />
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
      <span className="text-xs font-bold ml-1" style={{ color: starColor }}>
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

// Build the outreach message (kept under 200 chars)
function buildMessage(contactName: string, jobTitle: string, senderName: string): string {
  // Use first name of the contact only to save space
  const firstName = contactName.split(" ")[0];
  // Truncate role if very long
  const role = jobTitle && jobTitle.length > 40 ? jobTitle.slice(0, 37) + "\u2026" : (jobTitle || "the role");
  const msg = `Hi ${firstName}, I am ${senderName} from RV University. Noticed your ${role} opening — we have strong candidates ready to go. Happy to share profiles right away. Let's connect!`;
  return msg.slice(0, 200);
}

interface MessageModalProps {
  name: string;
  jobTitle: string;
  senderName: string;
  onClose: () => void;
}

function MessageModal({ name, jobTitle, senderName, onClose }: MessageModalProps) {
  const message = buildMessage(name, jobTitle, senderName);
  const [editedMessage, setEditedMessage] = useState(message);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = editedMessage;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 animate-fade-in-up"
        style={{
          background: "var(--card)",
          border: "2px solid var(--card-border)",
          boxShadow: "var(--shadow-brutal-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-dim)", border: "2px solid var(--accent)" }}
            >
              <svg className="w-4 h-4" fill="var(--accent)" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              Message for {name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-transform duration-150 active:translate-y-[1px] cursor-pointer"
            style={{ background: "var(--surface-1)", border: "2px solid var(--card-border)", color: "var(--foreground)" }}
          >
            ✕
          </button>
        </div>

        {/* Editable message textarea */}
        <textarea
          value={editedMessage}
          onChange={(e) => setEditedMessage(e.target.value)}
          rows={6}
          className="w-full rounded-xl p-4 mb-2 text-sm leading-relaxed resize-none outline-none transition-colors duration-150"
          style={{
            background: "var(--surface-1)",
            border: `1.5px solid ${editedMessage.length > 200 ? "var(--error)" : "var(--card-border)"}`,
            color: "var(--foreground)",
            fontFamily: "inherit",
          }}
        />

        {/* Live character count */}
        <p
          className="text-xs mb-4 text-right"
          style={{ color: editedMessage.length > 200 ? "var(--error)" : "var(--muted)" }}
        >
          {editedMessage.length} / 200 characters
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 active:translate-y-[1px] cursor-pointer"
            style={{
              background: copied ? "rgba(5,150,105,0.12)" : "var(--accent-dim)",
              color: copied ? "var(--success)" : "var(--accent)",
              border: `2px solid ${copied ? "var(--success)" : "var(--accent)"}`,
              boxShadow: "var(--shadow-brutal-sm)",
            }}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Message
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 active:translate-y-[1px] cursor-pointer"
            style={{
              background: "var(--surface-1)",
              color: "var(--muted)",
              border: "2px solid var(--card-border)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(overlay, document.body) : null;
}

const DIRECTOR_EMAIL = "director.placements@rvu.edu.in";
const DIRECTOR_DISPLAY_NAME = "Dr. Phani Kumar Pullela";

export default function JobCard({ job, index, rating, isViewed, onViewed, userRole, userEmail, userName }: JobCardProps) {
  const canSeeContact = userRole === "PO";
  // For non-director POs, use only the first name (e.g. "PUNEETHA S SHANKAR" → "PUNEETHA")
  const senderName = userEmail === DIRECTOR_EMAIL
    ? DIRECTOR_DISPLAY_NAME
    : (userName || "Dr. Phani Pullela").split(" ")[0];
  const staggerClass = `stagger-${Math.min(index + 1, 10)}`;
  const timeAgo = useTimeAgo(job.posted_datetime, job.posted);
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [messageModal, setMessageModal] = useState<{ name: string } | null>(null);

  let displaySource = job.source;
  if (!displaySource && job.link) {
    if (job.link.includes("linkedin.com")) displaySource = "LinkedIn";
    else if (job.link.includes("adzuna")) displaySource = "Adzuna";
    else if (job.link.includes("theirstack")) displaySource = "TheirStack";
  }
  const handleJobClick = async () => {
    if (job.id) {
      if (onViewed) onViewed();
      try {
        await fetch("/api/student/jobs/open", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId: job.id }),
        });
      } catch (error) {
        console.error("Failed to record job open:", error);
      }
    }
  };

  return (
    <div
      className={`neo-card p-5 animate-fade-in-up ${staggerClass}`}
    >
      {/* Header row: Title + Badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3
          className="text-sm font-bold leading-snug line-clamp-2 flex-1"
          style={{ color: "var(--foreground)" }}
        >
          {job.title || "Position Details Pending"}
        </h3>
        <div className="flex flex-col sm:flex-row items-end gap-1.5 shrink-0">
          {isViewed && (
            <span
              className="px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap flex items-center gap-1 animate-fade-in-up"
              style={{
                background: "rgba(5, 150, 105, 0.1)",
                color: "var(--success)",
                border: "1.5px solid var(--success)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              Viewed
            </span>
          )}
          {timeAgo && (
            <span
              className="px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1.5px solid var(--accent)",
              }}
            >
              {timeAgo}
            </span>
          )}
          {displaySource && (
            <span
              className="px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap"
              style={{
                background: displaySource === "LinkedIn" ? "rgba(10,102,194,0.1)" : displaySource === "Adzuna" ? "rgba(34, 197, 94, 0.1)" : displaySource === "TheirStack" ? "rgba(168, 85, 247, 0.1)" : "var(--surface-1)",
                color: displaySource === "LinkedIn" ? "#0A66C2" : displaySource === "Adzuna" ? "#16a34a" : displaySource === "TheirStack" ? "#9333ea" : "var(--foreground)",
                border: `1.5px solid ${displaySource === "LinkedIn" ? "#0A66C2" : displaySource === "Adzuna" ? "#16a34a" : displaySource === "TheirStack" ? "#9333ea" : "var(--card-border)"}`,
              }}
            >
              via {displaySource}
            </span>
          )}
        </div>
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
            background: rating > 4 ? "rgba(5, 150, 105, 0.08)" : rating >= 3 ? "rgba(217, 119, 6, 0.08)" : "rgba(239, 68, 68, 0.08)",
            border: `1px solid ${rating > 4 ? "var(--success)" : rating >= 3 ? "var(--warning)" : "var(--error)"}`,
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
          {(showAllPrograms ? job.programs : job.programs.slice(0, 3)).map((prog) => (
            <span
              key={prog}
              className="px-2 py-0.5 rounded text-xs font-semibold animate-fade-in-up"
              style={{
                background: "var(--surface-1)",
                color: "var(--muted)",
                border: "1.5px solid var(--card-border)",
              }}
            >
              {prog}
            </span>
          ))}
          {!showAllPrograms && job.programs.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllPrograms(true)}
              className="px-2 py-0.5 rounded text-xs font-bold transition-all duration-150 cursor-pointer active:translate-y-[1px]"
              style={{
                background: "var(--surface-1)",
                color: "var(--muted)",
                border: "1.5px solid var(--card-border)",
                boxShadow: "var(--shadow-brutal-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--card-border)";
                e.currentTarget.style.color = "var(--muted)";
              }}
            >
              +{job.programs.length - 3} more
            </button>
          )}
          {showAllPrograms && job.programs.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllPrograms(false)}
              className="px-2 py-0.5 rounded text-xs font-bold transition-all duration-150 cursor-pointer active:translate-y-[1px]"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1.5px solid var(--accent)",
                boxShadow: "var(--shadow-brutal-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--card-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
            >
              show less
            </button>
          )}
        </div>
      )}

      {/* Hiring Team / Contact Details — PO only */}
      {canSeeContact && job.contact_details && job.contact_details.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            👤 Contact:
          </span>
          {job.contact_details.map((entry, i) => {
            const url = typeof entry === "string" ? entry : entry.url;
            const rawName = typeof entry === "string"
              ? (url.match(/linkedin\.com\/in\/([^/?]+)/)?.[1] ?? "Profile")
              : entry.name;
            // Clean up slug-style names (e.g. "john-doe-123456" → "John Doe")
            const name = rawName
              .replace(/-\d+$/, "")
              .split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            return (
              <div key={i} className="flex items-center gap-1">
                {/* LinkedIn link */}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`View ${name}'s LinkedIn profile`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150"
                  style={{
                    background: "var(--accent-dim)",
                    color: "var(--accent)",
                    border: "1.5px solid var(--accent)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--accent-dim)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  {name}
                </a>
                {/* Message button */}
                <button
                  type="button"
                  onClick={() => setMessageModal({ name })}
                  title={`Compose message for ${name}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:translate-y-[1px] cursor-pointer"
                  style={{
                    background: "var(--surface-1)",
                    color: "var(--muted)",
                    border: "1.5px solid var(--card-border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.color = "var(--muted)";
                  }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                  </svg>
                  Message
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Modal */}
      {messageModal && (
        <MessageModal
          name={messageModal.name}
          jobTitle={job.title ?? ""}
          senderName={senderName}
          onClose={() => setMessageModal(null)}
        />
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
            onClick={handleJobClick}
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
