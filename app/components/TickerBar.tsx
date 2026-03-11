"use client";
import { useEffect, useState } from "react";
import { fetchTickerData, TickerData, IndexItem, StockMover } from "@/lib/api";

export default function TickerBar() {
  const [data, setData] = useState<TickerData | null>(null);

  async function load() {
    const d = await fetchTickerData();
    if (d) setData(d);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  // Duplicate items so the marquee loops seamlessly
  const indices = data?.indices ?? [];
  const gainers = data?.gainers ?? [];
  const losers = data?.losers ?? [];

  return (
    <div style={{ background: "#0f0f0f", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      {/* ROW 1 — Indian Indices, scroll LEFT at 30s */}
      <div style={{ overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "6px 0" }}>
        <div className="marquee-left">
          {[...indices, ...indices].map((item, i) => (
            <IndexChip key={i} item={item} />
          ))}
        </div>
      </div>

      {/* ROW 2 — Gainers & Losers, scroll RIGHT at 25s */}
      <div style={{ overflow: "hidden", padding: "6px 0" }}>
        <div className="marquee-right">
          {[...gainers, ...losers, ...gainers, ...losers].map((item, i) => (
            <MoverChip key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IndexChip({ item }: { item: IndexItem }) {
  const pos = item.change_percent >= 0;
  return (
    <span className="ticker-item">
      <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{item.name}</span>
      <span style={{ color: "#fff" }}>
        ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span style={{ color: pos ? "#39FF14" : "#F85149" }}>
        {pos ? "+" : ""}{item.change_percent.toFixed(2)}%
      </span>
    </span>
  );
}

function MoverChip({ item }: { item: StockMover }) {
  const pos = item.change_percent >= 0;
  return (
    <span className="ticker-item">
      <span style={{ color: pos ? "#39FF14" : "#F85149" }}>{pos ? "▲" : "▼"}</span>
      <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{item.symbol}</span>
      <span style={{ color: pos ? "#39FF14" : "#F85149" }}>
        {pos ? "+" : ""}{item.change_percent.toFixed(2)}%
      </span>
    </span>
  );
}
