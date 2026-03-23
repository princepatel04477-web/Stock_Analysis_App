"use client";
import { useEffect, useState } from "react";
import { fetchMarketMovers, MarketMovers, StockMover } from "@/lib/api";

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtVol(v: number) {
  if (v >= 10_000_000) return (v / 10_000_000).toFixed(1) + "Cr";
  if (v >= 100_000) return (v / 100_000).toFixed(1) + "L";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return String(v);
}

function rankBadge(rank: number) {
  if (rank === 1) return { bg: "#B8860B", color: "#FFD700" }; // gold
  if (rank === 2) return { bg: "#555", color: "#C0C0C0" };    // silver
  if (rank === 3) return { bg: "#7a3b00", color: "#CD7F32" }; // bronze
  return { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" };
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} style={{ padding: "10px 12px" }}>
          <div className="skeleton" style={{ height: 14, borderRadius: 4, width: i === 1 ? 80 : 60 }} />
        </td>
      ))}
    </tr>
  );
}

function MoversTable({
  rows,
  isGainer,
  loading,
}: {
  rows: StockMover[];
  isGainer: boolean;
  loading: boolean;
}) {
  const accent = isGainer ? "#39FF14" : "#F85149";
  const pillBg = isGainer ? "rgba(57,255,20,0.1)" : "rgba(248,81,73,0.1)";

  return (
    <div
      style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: accent, margin: 0 }}>
          {isGainer ? "🟢 Top Gainers" : "🔴 Top Losers"}
        </h3>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.03)" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500 }}>Rank</th>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500 }}>Symbol</th>
              <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500 }}>Price (₹)</th>
              <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500 }}>Change%</th>
              <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500 }}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
              : rows.map((row, idx) => {
                  const badge = rankBadge(idx + 1);
                  return (
                    <tr
                      key={row.symbol}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: badge.bg,
                            color: badge.color,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#fff" }}>
                        {row.symbol}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "rgba(255,255,255,0.85)" }}>
                        {fmt(row.price)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span
                          style={{
                            background: pillBg,
                            color: accent,
                            borderRadius: 20,
                            padding: "2px 8px",
                            fontWeight: 600,
                          }}
                        >
                          {row.change_percent > 0 ? "+" : ""}{row.change_percent.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "rgba(255,255,255,0.5)" }}>
                        {fmtVol(row.volume)}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MarketMoversSection() {
  const [data, setData] = useState<MarketMovers | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  async function load() {
    setLoading(true);
    const d = await fetchMarketMovers();
    if (d) {
      setData(d);
      setUpdatedAt(new Date().toLocaleTimeString("en-IN"));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section style={{ padding: "48px 24px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Today&apos;s Market Movers
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "4px 0 0" }}>
            Live NSE Gainers &amp; Losers
          </p>
          {updatedAt && (
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: "2px 0 0" }}>
              Last updated: {updatedAt}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: "rgba(57,255,20,0.1)",
            border: "1px solid rgba(57,255,20,0.3)",
            color: "#39FF14",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Two-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <MoversTable rows={data?.gainers ?? []} isGainer loading={loading} />
        <MoversTable rows={data?.losers ?? []} isGainer={false} loading={loading} />
      </div>
    </section>
  );
}
