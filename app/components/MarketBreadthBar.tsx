"use client";
import { useEffect, useState } from "react";
import { fetchIndicesData, IndicesData, IndexItem } from "@/lib/api";

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function vixColor(v: number) {
  if (v < 15) return "#39FF14";
  if (v <= 20) return "#F59E0B";
  return "#F85149";
}

export default function MarketBreadthBar() {
  const [data, setData] = useState<IndicesData | null>(null);

  async function load() {
    const d = await fetchIndicesData();
    if (d) setData(d);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 120_000);
    return () => clearInterval(id);
  }, []);

  const nifty = data?.indices.find((i) => i.symbol === "^NSEI");
  const sensex = data?.indices.find((i) => i.symbol === "^BSESN");
  const vix = data?.indices.find((i) => i.symbol === "^INDIAVIX");
  const breadth = data?.breadth;

  if (!data) {
    return (
      <div
        style={{
          height: 36,
          background: "#0d0d0d",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Loading market data…</span>
      </div>
    );
  }

  return (
    <div
      style={{
        height: 36,
        background: "#0d0d0d",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        fontSize: 12,
        position: "sticky",
        top: 56,
        zIndex: 49,
      }}
    >
      {/* Left: NIFTY | SENSEX | VIX */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {nifty && (
          <IndexPill label="NIFTY 50" item={nifty} />
        )}
        <Divider />
        {sensex && (
          <IndexPill label="SENSEX" item={sensex} />
        )}
        {vix && (
          <>
            <Divider />
            <span style={{ color: "rgba(255,255,255,0.5)" }}>INDIA VIX:&nbsp;</span>
            <span style={{ color: vixColor(vix.price), fontWeight: 600 }}>{vix.price.toFixed(2)}</span>
          </>
        )}
      </div>

      {/* Right: Advances / Declines / Unchanged */}
      {breadth && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>Advances: </span>
            <span style={{ color: "#39FF14", fontWeight: 600 }}>{breadth.advances}</span>
          </span>
          <span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>Declines: </span>
            <span style={{ color: "#F85149", fontWeight: 600 }}>{breadth.declines}</span>
          </span>
          <span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>Unchanged: </span>
            <span style={{ color: "#8B949E", fontWeight: 600 }}>{breadth.unchanged}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function IndexPill({ label, item }: { label: string; item: IndexItem }) {
  const pos = item.change_percent >= 0;
  return (
    <span style={{ marginRight: 4 }}>
      <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}:&nbsp;</span>
      <span style={{ color: "#fff", fontWeight: 600 }}>₹{item.price.toLocaleString("en-IN")}</span>
      <span style={{ color: pos ? "#39FF14" : "#F85149", marginLeft: 4 }}>
        {pos ? "+" : ""}{item.change_percent.toFixed(2)}%
      </span>
    </span>
  );
}

function Divider() {
  return (
    <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 10px" }}>|</span>
  );
}
