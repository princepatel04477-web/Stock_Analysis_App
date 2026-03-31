"use client";

import { useEffect, useState } from "react";
import { fetchModelAccuracy, AccuracyResponse } from "@/lib/api";

const MODEL_IDS = ["llama", "mixtral", "gemma"];

function rankBadge(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

function winRateColor(winRate: number) {
  if (winRate > 60) return "#39FF14";
  if (winRate >= 40) return "#f59e0b";
  return "#F85149";
}

export default function AccuracyPage() {
  const [rows, setRows] = useState<AccuracyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await Promise.all(MODEL_IDS.map((id) => fetchModelAccuracy(id)));
        data.sort((a, b) => b.win_rate - a.win_rate);
        setRows(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load accuracy";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "48px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <a href="/" style={{ color: "#39FF14", textDecoration: "none", fontSize: 13 }}>
          ← Back to Dashboard
        </a>
        <h1 style={{ marginTop: 16, marginBottom: 8, fontSize: 34, fontWeight: 900 }}>Model Accuracy Tracker</h1>
        <p style={{ marginTop: 0, color: "#6b7280", fontSize: 14 }}>Based on signals given 7+ days ago</p>

        {error && (
          <div
            style={{
              marginTop: 20,
              background: "rgba(248,81,73,0.1)",
              border: "1px solid rgba(248,81,73,0.3)",
              color: "#F85149",
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            background: "#111",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            className="acc-head"
            style={{
              display: "grid",
              gridTemplateColumns: "80px 2fr 1fr 1.3fr 1fr 120px",
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            <span>Rank</span>
            <span>Model</span>
            <span>Total Signals</span>
            <span>Win Rate</span>
            <span className="acc-hide-mobile">Avg Return</span>
            <span className="acc-hide-mobile">Status</span>
          </div>

          {loading && (
            <div style={{ padding: 20 }}>
              <div className="skeleton" style={{ height: 54, borderRadius: 8, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 54, borderRadius: 8, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 54, borderRadius: 8 }} />
            </div>
          )}

          {!loading && rows.map((row, index) => {
            const wrColor = winRateColor(row.win_rate);
            const avgPositive = row.avg_return >= 0;
            return (
              <div
                className="acc-row"
                key={row.model_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 2fr 1fr 1.3fr 1fr 120px",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 20 }}>{rankBadge(index)}</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700 }}>{row.model_name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase" }}>{row.model_id}</div>
                </div>
                <span style={{ color: "#6b7280", fontSize: 14 }}>{row.total_signals}</span>
                <div>
                  <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 5, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(100, row.win_rate))}%`,
                        background: wrColor,
                      }}
                    />
                  </div>
                  <div style={{ color: wrColor, fontSize: 13, fontWeight: 700, marginTop: 6 }}>{row.win_rate}%</div>
                </div>
                <span className="acc-hide-mobile" style={{ color: avgPositive ? "#39FF14" : "#F85149", fontWeight: 700 }}>
                  {avgPositive ? "+" : ""}{row.avg_return}%
                </span>
                <span
                  className="acc-hide-mobile"
                  style={{
                    display: "inline-flex",
                    width: "fit-content",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(57,255,20,0.1)",
                    border: "1px solid rgba(57,255,20,0.3)",
                    color: "#39FF14",
                    borderRadius: 999,
                    fontSize: 12,
                    padding: "4px 10px",
                    fontWeight: 700,
                  }}
                >
                  Live
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
