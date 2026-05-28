"use client";

import { useState, useEffect } from "react";

const DISMISS_KEY = "opportunityhub-notice-dismissed";

export default function AcademicNotice() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (!mounted || !visible) return null;

  return (
    <div className="max-w-5xl w-full mx-auto px-6 pt-6">
      <div
        className="neo-card-static px-6 py-5 animate-slide-down"
        style={{ borderColor: "var(--accent)", borderLeftWidth: "4px" }}
      >
        <div className="flex items-start gap-4">
          {/* Academic icon */}
          <div
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--accent-dim)",
              border: "2px solid var(--accent)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 12 3 12 0v-5" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-bold tracking-tight mb-1"
              style={{ color: "var(--foreground)" }}
            >
              Academic Notice
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              This academic initiative indexes publicly available job
              opportunities for educational and student employability purposes.
              Applications are completed exclusively on the original hiring
              platform. All trademarks, content, and intellectual property
              remain the property of their respective owners and publishers.
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1.5 rounded-md transition-colors duration-150 cursor-pointer"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--foreground)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--muted)")
            }
            title="Dismiss notice"
            aria-label="Dismiss academic notice"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
