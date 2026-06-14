"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : (process.env.NEXT_PUBLIC_API_URL || "https://internscrapper-production.up.railway.app");

interface CompanyRating {
  company: string;
  rating: number;
}

export default function RatingManager() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRating, setNewRating] = useState(3.0);
  const [message, setMessage] = useState("");

  // Load existing ratings
  const loadRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/get-company-ratings`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || {});
      }
    } catch (error) {
      console.error("Failed to load ratings:", error);
      setMessage("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  };

  // Set a new rating
  const setRating = async () => {
    if (!newCompany.trim()) {
      setMessage("Please enter a company name");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/set-company-rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: newCompany.trim(),
          rating: newRating,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ ${data.message} (${data.rows_updated} jobs updated)`);
        setNewCompany("");
        setNewRating(3.0);
        // Reload ratings to show the update
        await loadRatings();
      } else {
        const error = await response.text();
        setMessage(`❌ Failed to set rating: ${error}`);
      }
    } catch (error) {
      console.error("Failed to set rating:", error);
      setMessage("❌ Failed to set rating");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 active:translate-y-[1px]"
          style={{
            background: "var(--surface-1)",
            color: "var(--foreground)",
            border: "2px solid var(--card-border)",
            boxShadow: "var(--shadow-brutal-sm)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--card-border)";
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
        Company Rating Manager
      </h1>

      {/* Set New Rating */}
      {/* <div 
        className="neo-card p-6 mb-6"
        style={{ background: "var(--surface-0)" }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>
          Set Company Rating
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>
              Company Name
            </label>
            <input
              type="text"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Enter company name"
              className="w-full px-3 py-2 rounded-md border"
              style={{
                background: "var(--surface-1)",
                border: "2px solid var(--card-border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>
              Rating (1.0 - 5.0)
            </label>
            <input
              type="number"
              min="1.0"
              max="5.0"
              step="0.1"
              value={newRating}
              onChange={(e) => setNewRating(parseFloat(e.target.value) || 3.0)}
              className="w-full px-3 py-2 rounded-md border"
              style={{
                background: "var(--surface-1)",
                border: "2px solid var(--card-border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={setRating}
              disabled={loading}
              className="w-full px-4 py-2 rounded-md font-semibold transition-all duration-150"
              style={{
                background: "var(--accent)",
                color: "white",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Setting..." : "Set Rating"}
            </button>
          </div>
        </div>

        {message && (
          <div 
            className="p-3 rounded-md text-sm"
            style={{
              background: message.includes("✅") ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${message.includes("✅") ? "#22c55e" : "#ef4444"}`,
              color: message.includes("✅") ? "#22c55e" : "#ef4444",
            }}
          >
            {message}
          </div>
        )}
      </div> */}

      {/* Current Ratings */}
      <div
        className="neo-card p-6"
        style={{ background: "var(--surface-0)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Current Company Ratings ({Object.keys(ratings).length} companies)
          </h2>
          <button
            onClick={loadRatings}
            disabled={loading}
            className="px-3 py-1 rounded text-sm font-medium"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--card-border)",
              color: "var(--muted)",
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {Object.keys(ratings).length === 0 ? (
          <div className="text-center py-8" style={{ color: "var(--muted)" }}>
            No company ratings found. Set some ratings above to see them here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ratings)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([company, rating]) => {
                const starColor = rating > 4 ? "var(--success)" : rating >= 3 ? "var(--warning)" : "var(--error)";
                return (
                <div
                  key={company}
                  className="p-3 rounded-md border"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-medium truncate mr-2"
                      style={{ color: "var(--foreground)" }}
                      title={company}
                    >
                      {company}
                    </span>
                    <div className="flex items-center gap-1">
                      {/* Star display */}
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="w-3 h-3"
                          viewBox="0 0 24 24"
                          fill={rating >= star ? starColor : "var(--card-border)"}
                          stroke={rating >= star ? starColor : "var(--card-border)"}
                          strokeWidth="1"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                      <span
                        className="text-xs font-bold ml-1"
                        style={{ color: starColor }}
                      >
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )})}
          </div>
        )}
      </div>
    </div>
  );
}