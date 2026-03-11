"use client";
import { useEffect, useRef, useState } from "react";
import { fetchSectorHeatmap, SectorData } from "@/lib/api";

function heatColor(pct: number): string {
  if (pct > 2)  return "#166534";
  if (pct > 1)  return "#15803d";
  if (pct > 0)  return "rgba(22,101,52,0.6)";
  if (pct > -1) return "rgba(127,29,29,0.6)";
  if (pct > -2) return "#991b1b";
  return "#7f1d1d";
}

function textColor(pct: number): string {
  return pct >= 0 ? "#86efac" : "#fca5a5";
}

function Tooltip({
  sector,
  stocks,
  visible,
}: {
  sector: SectorData;
  stocks: SectorData["stocks"];
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "12px 16px",
        zIndex: 100,
        minWidth: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        pointerEvents: "none",
      }}
    >
      <p style={{ color: "#fff", fontWeight: 700, margin: "0 0 8px", fontSize: 13 }}>
        {sector.sector}
      </p>
      {stocks.map((s) => (
        <div key={s.symbol} style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{s.symbol}</span>
          <span
            style={{
              color: s.change_percent >= 0 ? "#39FF14" : "#F85149",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {s.change_percent >= 0 ? "+" : ""}{s.change_percent.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function SectorCell({ sector }: { sector: SectorData }) {
  const [hover, setHover] = useState(false);
  const bg = heatColor(sector.avg_change);
  const tc = textColor(sector.avg_change);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        background: bg,
        borderRadius: 8,
        padding: 16,
        minHeight: 100,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: hover ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
        transition: "border 0.15s",
      }}
    >
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{sector.sector}</span>
      <span style={{ color: tc, fontWeight: 700, fontSize: 18 }}>
        {sector.avg_change >= 0 ? "+" : ""}{sector.avg_change.toFixed(2)}%
      </span>
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{sector.stocks.length} stocks</span>
      <Tooltip sector={sector} stocks={sector.stocks} visible={hover} />
    </div>
  );
}

function SkeletonCell() {
  return (
    <div
      className="skeleton"
      style={{ minHeight: 100, borderRadius: 8 }}
    />
  );
}

export default function SectorHeatmap() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  async function load() {
    setLoading(true);
    const d = await fetchSectorHeatmap();
    setSectors(d);
    setUpdatedAt(new Date().toLocaleTimeString("en-IN"));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section style={{ padding: "48px 24px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
            Sector Heatmap
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "4px 0 0" }}>
            NSE Sectoral Performance Today
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

      {/* Color legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "> +2%", color: "#166534" },
          { label: "+1–2%", color: "#15803d" },
          { label: "0–1%", color: "rgba(22,101,52,0.6)" },
          { label: "0 to -1%", color: "rgba(127,29,29,0.6)" },
          { label: "-1 to -2%", color: "#991b1b" },
          { label: "< -2%", color: "#7f1d1d" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div style={{ width: 14, height: 14, background: l.color, borderRadius: 3 }} />
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
        }}
      >
        {loading
          ? Array.from({ length: 11 }).map((_, i) => <SkeletonCell key={i} />)
          : sectors.map((s) => <SectorCell key={s.sector} sector={s} />)}
      </div>
    </section>
  );
}
