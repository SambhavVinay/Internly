"use client";

import { useState } from "react";
import LegalModal, {
  TermsContent,
  PrivacyContent,
  AboutContent,
} from "./LegalModal";

type ModalType = "terms" | "privacy" | "about" | "contact" | null;

export default function Footer() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  return (
    <>
      <footer
        className="mt-auto"
        style={{
          borderTop: "2px solid var(--card-border)",
          background: "var(--card)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* ── Top Grid: About / Disclaimer / Attribution ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About */}
            <div>
              <h4
                className="text-sm font-bold tracking-tight mb-3"
                style={{ color: "var(--foreground)" }}
              >
                About OpportunityHub
              </h4>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                A student-led academic project designed to help students
                discover employment opportunities more efficiently. Built by
                students, for students, to support career exploration and
                employability research.
              </p>
            </div>

            {/* Educational Disclaimer */}
            <div>
              <h4
                className="text-sm font-bold tracking-tight mb-3"
                style={{ color: "var(--foreground)" }}
              >
                Educational Disclaimer
              </h4>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                This platform is intended solely for educational and academic
                purposes. No employment opportunities are owned, created, or
                endorsed by this platform. Users apply through the original
                source platform. All trademarks, logos, and content belong to
                their respective owners.
              </p>
            </div>

            {/* Attribution */}
            <div>
              <h4
                className="text-sm font-bold tracking-tight mb-3"
                style={{ color: "var(--foreground)" }}
              >
                Attribution
              </h4>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                Opportunity information originates from publicly available
                listings published by their respective platforms and
                organizations. We respectfully acknowledge and attribute all
                content to its original publishers.
              </p>
            </div>
          </div>

          {/* ── Divider ── */}
          <div
            className="mb-6"
            style={{
              borderTop: "1px solid var(--card-border)",
            }}
          />

          {/* ── Bottom Row: Links + Copyright ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <FooterLink
                label="Terms & Conditions"
                onClick={() => setActiveModal("terms")}
              />
              <FooterDot />
              <FooterLink
                label="Privacy Policy"
                onClick={() => setActiveModal("privacy")}
              />
              <FooterDot />
              <FooterLink
                label="About Project"
                onClick={() => setActiveModal("about")}
              />
              <FooterDot />
              <FooterLink
                label="Contact"
                onClick={() => setActiveModal("contact")}
              />
            </div>
            <p
              className="text-xs font-mono"
              style={{ color: "var(--muted)" }}
            >
              OpportunityHub &middot; Academic Project
            </p>
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      <LegalModal
        open={activeModal === "terms"}
        onClose={() => setActiveModal(null)}
        title="Terms & Conditions"
      >
        <TermsContent />
      </LegalModal>

      <LegalModal
        open={activeModal === "privacy"}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
      >
        <PrivacyContent />
      </LegalModal>

      <LegalModal
        open={activeModal === "about"}
        onClose={() => setActiveModal(null)}
        title="About OpportunityHub"
      >
        <AboutContent />
      </LegalModal>

      <LegalModal
        open={activeModal === "contact"}
        onClose={() => setActiveModal(null)}
        title="Contact"
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3
              className="text-base font-bold mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Get in Touch
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              OpportunityHub is an academic project. For questions, feedback,
              or collaboration inquiries, please reach out through your
              institution&apos;s academic channels or contact the project
              maintainers directly.
            </p>
          </div>
          <div>
            <h3
              className="text-base font-bold mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Reporting Issues
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              If you notice any inaccuracies in listed opportunities or have
              concerns about content attribution, please let us know so we
              can address them promptly.
            </p>
          </div>
          <div>
            <h3
              className="text-base font-bold mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Contributing
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              As a student-led project, we welcome contributions from fellow
              students interested in improving career discovery tools and
              supporting student employability initiatives.
            </p>
          </div>
        </div>
      </LegalModal>
    </>
  );
}

function FooterLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-medium transition-colors duration-150 cursor-pointer"
      style={{ color: "var(--muted)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
    >
      {label}
    </button>
  );
}

function FooterDot() {
  return (
    <span
      className="w-1 h-1 rounded-full hidden sm:block"
      style={{ background: "var(--card-border)" }}
    />
  );
}
