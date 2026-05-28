"use client";

import { useEffect, useRef } from "react";

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function LegalModal({
  open,
  onClose,
  title,
  children,
}: LegalModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock body scroll and handle escape key
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-overlay-in"
      style={{ background: "var(--overlay-bg)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="neo-card-static w-full max-w-2xl max-h-[85vh] flex flex-col animate-modal-in"
        style={{ background: "var(--card)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "2px solid var(--card-border)" }}
        >
          <h2
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="neo-button p-2"
            style={{
              background: "var(--surface-1)",
              color: "var(--muted)",
            }}
            aria-label="Close modal"
          >
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
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5"
          style={{ color: "var(--foreground)" }}
        >
          {children}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 shrink-0 flex justify-end"
          style={{ borderTop: "2px solid var(--card-border)" }}
        >
          <button
            onClick={onClose}
            className="neo-button px-5 py-2 text-sm font-semibold"
            style={{
              background: "var(--accent)",
              color: "#ffffff",
              borderColor: "var(--accent)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Pre-built modal content sections ─────────────── */

export function TermsContent() {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Purpose">
        This platform is an academic student project created to support career
        exploration, internship discovery, and employability research. It is
        designed to help students identify and access publicly available
        employment opportunities more efficiently.
      </Section>

      <Section title="Non-Commercial Use">
        The project is not intended for commercial exploitation and exists
        primarily for educational and academic purposes. No fees are charged,
        and no revenue is generated through the operation of this platform.
      </Section>

      <Section title="Original Application Sources">
        All applications occur through the original hiring platform or
        employer website. This platform does not host, modify, or intercept
        any application process. Users are always redirected to the original
        source to complete their applications.
      </Section>

      <Section title="Intellectual Property">
        All trademarks, company names, logos, branding, and published listings
        remain the property of their respective owners. This platform claims
        no ownership over any third-party content displayed.
      </Section>

      <Section title="Attribution & Respect for Publishers">
        The project recognizes and respects the contribution of professional
        employment platforms and publishers that make opportunities publicly
        discoverable. Users should refer to and engage with original sources
        whenever possible.
      </Section>

      <Section title="No Affiliation">
        The project is not affiliated with, endorsed by, or sponsored by any
        employer, recruitment platform, or job board unless explicitly stated.
        All brand names and logos referenced are the intellectual property of
        their respective holders.
      </Section>

      <Section title="Accuracy">
        While reasonable efforts are made to keep information current,
        availability and details may change on the original source platform.
        Users should verify all opportunity details directly on the source
        before applying.
      </Section>
    </div>
  );
}

export function PrivacyContent() {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Information We Collect">
        This platform does not collect, store, or process any personal
        information. Search queries are processed in real-time and are not
        logged or retained. No user accounts, cookies, or tracking
        mechanisms are employed beyond basic local preferences (such as
        theme selection).
      </Section>

      <Section title="Third-Party Links">
        This platform contains links to external websites and job platforms.
        We are not responsible for the privacy practices or content of these
        external sites. Users should review the privacy policies of any
        external site they visit.
      </Section>

      <Section title="Data Storage">
        All theme preferences are stored locally in your browser using
        localStorage. No data is transmitted to external servers for
        storage or analytics purposes.
      </Section>

      <Section title="Changes to This Policy">
        As an academic project, this privacy policy may be updated as the
        project evolves. Any significant changes will be reflected on this
        page.
      </Section>
    </div>
  );
}

export function AboutContent() {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Our Mission">
        OpportunityHub is a student-led academic initiative designed to help
        students discover employment opportunities more efficiently. Built
        by students, for students, our platform indexes publicly available
        career listings to support internship discovery and career
        exploration.
      </Section>

      <Section title="How It Works">
        The platform aggregates publicly available job and internship
        listings, organizes them by academic department and program
        relevance, and presents them in a clean, accessible interface.
        All applications are completed on the original hiring platform.
      </Section>

      <Section title="Academic Context">
        This project was developed as part of an academic research initiative
        focused on improving student employability outcomes. It serves as
        both a practical tool for students and a demonstration of modern
        web development practices.
      </Section>

      <Section title="Open Source">
        This project is built with transparency in mind. We believe in the
        educational value of open collaboration and knowledge sharing
        within the academic community.
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="text-base font-bold mb-2"
        style={{ color: "var(--foreground)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        {children}
      </p>
    </div>
  );
}
