"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchScreener, ScreenerFilters, ScreenerRow } from "@/lib/api";

type SortKey = "symbol" | "sector" | "price" | "change_percent" | "rsi_14" | "sma_20" | "sma_50" | "signal";
type SortDir = "asc" | "desc";

const DEFAULT_FILTERS: ScreenerFilters = {
  rsi_min: 0,
  rsi_max: 100,
  price_min: 0,
  price_max: 999999,
  change_min: -100,
  change_max: 100,
  signal: "ALL",
  above_sma20: false,
  above_sma50: false,
  sector: "All",
};

const PRESETS: Array<{ label: string; updates: Partial<ScreenerFilters> }> = [
  { label: "Oversold Stocks", updates: { rsi_max: 30, signal: "BUY" } },
  { label: "Overbought Stocks", updates: { rsi_min: 70, signal: "SELL" } },
  { label: "Strong Uptrend", updates: { above_sma20: true, above_sma50: true, signal: "BUY" } },
  { label: "Near 52W Low", updates: { change_min: -5, change_max: -2 } },
  { label: "Volume Breakout", updates: { change_min: 3 } },
  { label: "IT Sector", updates: { sector: "IT" } },
  { label: "Banking Sector", updates: { sector: "Banking" } },
  { label: "Pharma Sector", updates: { sector: "Pharma" } },
];

const SIGNAL_STYLE: Record<"BUY" | "SELL" | "HOLD", { color: string; bg: string; border: string }> = {
  BUY: { color: "#3FB950", bg: "#3FB95015", border: "#3FB95040" },
  SELL: { color: "#F85149", bg: "#F8514915", border: "#F8514940" },
  HOLD: { color: "#FFA500", bg: "#FFA50015", border: "#FFA50040" },
};

function sortRows(rows: ScreenerRow[], key: SortKey, dir: SortDir): ScreenerRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (key === "symbol" || key === "sector" || key === "signal") {
      return String(a[key]).localeCompare(String(b[key]));
    }
    return Number(a[key]) - Number(b[key]);
  });
  return dir === "asc" ? sorted : sorted.reverse();
}

export default function ScreenerPage() {
  const [filters, setFilters] = useState<ScreenerFilters>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("rsi_14");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activePreset, setActivePreset] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const runScreener = async (nextFilters: ScreenerFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScreener(nextFilters);
      setRows(data);
    } catch {
      setRows([]);
      setError("Failed to run screener. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void runScreener(DEFAULT_FILTERS);
  }, []);

  const sortedRows = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir]);

  const updateFilter = <K extends keyof ScreenerFilters>(key: K, value: ScreenerFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const onPreset = (label: string, updates: Partial<ScreenerFilters>) => {
    const next = { ...DEFAULT_FILTERS, ...updates };
    setActivePreset(label);
    setFilters(next);
    void runScreener(next);
  };

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const exportCsv = () => {
    const header = ["Symbol", "Sector", "Price", "Change%", "RSI", "SMA20", "SMA50", "Signal"];
    const body = sortedRows.map((row) => [
      row.symbol,
      row.sector,
      row.price.toFixed(2),
      row.change_percent.toFixed(2),
      row.rsi_14.toFixed(1),
      row.sma_20.toFixed(2),
      row.sma_50.toFixed(2),
      row.signal,
    ]);
    const csv = [header, ...body].map((line) => line.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dt = new Date().toISOString().slice(0, 10);
    link.download = `screener_results_${dt}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="screener-wrap">
      <style>{`
        .screener-wrap { min-height: 100vh; background: #0a0a0a; color: #fff; padding: 32px; max-width: 1400px; margin: 0 auto; }
        .screener-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .screener-link { font-size: 13px; color: #9ca3af; text-decoration: none; font-weight: 600; }
        .screener-link:hover { color: #39FF14; }
        .preset-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
        .preset-pill { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; padding: 6px 14px; font-size: 12px; color: #9ca3af; cursor: pointer; transition: all .2s; }
        .preset-pill:hover, .preset-pill.active { background: rgba(57,255,20,0.1); border-color: rgba(57,255,20,0.3); color: #39FF14; }
        .filters-panel { background: #111; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .filter-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; display: block; }
        .f-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: white; font-family: Inter, sans-serif; outline: none; width: 100%; box-sizing: border-box; }
        .f-input:focus { border-color: rgba(57,255,20,0.45); }
        .row-two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .toggle { width: 52px; height: 28px; border-radius: 999px; border: none; cursor: pointer; position: relative; transition: background .2s; }
        .toggle span { width: 22px; height: 22px; background: #fff; border-radius: 50%; position: absolute; top: 3px; transition: left .2s; }
        .run-btn { width: 100%; background: #39FF14; color: #000; border: none; border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .run-btn:disabled { opacity: .6; cursor: not-allowed; }
        .results { background: #111; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; }
        .results-top { padding: 12px 20px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .outline-btn { background: transparent; color: #9ca3af; border: 1px solid rgba(255,255,255,0.2); border-radius: 999px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
        .grid { display: grid; grid-template-columns: 1.2fr 1fr .9fr .9fr .9fr .9fr .9fr .9fr 1fr; align-items: center; }
        .head-cell { padding: 12px 16px; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer; }
        .head-cell:hover { color: #fff; }
        .row-cell { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; }
        .data-row:hover { background: rgba(255,255,255,0.03); }
        .change-pill { border-radius: 999px; padding: 3px 9px; font-size: 12px; font-weight: 700; display: inline-block; }
        .rsi-bar { width: 64px; height: 4px; background: rgba(255,255,255,.12); border-radius: 999px; margin-top: 4px; overflow: hidden; }
        .rsi-fill { height: 100%; background: #39FF14; }
        .analyze-btn { border: 1px solid rgba(57,255,20,.4); color: #39FF14; background: transparent; border-radius: 999px; padding: 5px 10px; font-size: 12px; text-decoration: none; }
        .empty { text-align: center; color: #6b7280; padding: 54px 16px; }
        @media (max-width: 1100px) { .filters-panel { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px) { .filters-panel { grid-template-columns: 1fr; } .grid { grid-template-columns: 1.2fr .8fr .8fr .8fr .8fr .8fr .8fr .8fr .9fr; font-size: 12px; overflow-x: auto; min-width: 930px; } .screener-wrap { padding: 18px; } }
      `}</style>

      <div className="screener-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 800 }}>⚡ NiftyPulse</span>
          <Link className="screener-link" href="/">
            Home
          </Link>
          <span className="screener-link" style={{ color: "#39FF14" }}>
            Screener
          </span>
        </div>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "white", margin: 0 }}>Stock Screener</h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32, marginTop: 8 }}>Filter NSE stocks by technical conditions</p>

      <div className="preset-row">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={`preset-pill ${activePreset === preset.label ? "active" : ""}`}
            onClick={() => onPreset(preset.label, preset.updates)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="filters-panel">
        <div>
          <label className="filter-label">RSI Range</label>
          <div className="row-two">
            <input className="f-input" type="number" placeholder="Min" value={filters.rsi_min} onChange={(e) => updateFilter("rsi_min", Number(e.target.value))} />
            <input className="f-input" type="number" placeholder="Max" value={filters.rsi_max} onChange={(e) => updateFilter("rsi_max", Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="filter-label">Price Range</label>
          <div className="row-two">
            <input className="f-input" type="number" placeholder="Min ₹" value={filters.price_min} onChange={(e) => updateFilter("price_min", Number(e.target.value))} />
            <input className="f-input" type="number" placeholder="Max ₹" value={filters.price_max} onChange={(e) => updateFilter("price_max", Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="filter-label">Change % Range</label>
          <div className="row-two">
            <input className="f-input" type="number" placeholder="Min %" value={filters.change_min} onChange={(e) => updateFilter("change_min", Number(e.target.value))} />
            <input className="f-input" type="number" placeholder="Max %" value={filters.change_max} onChange={(e) => updateFilter("change_max", Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="filter-label">Signal Filter</label>
          <select className="f-input" value={filters.signal} onChange={(e) => updateFilter("signal", e.target.value as ScreenerFilters["signal"])}>
            <option value="ALL">ALL</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
            <option value="HOLD">HOLD</option>
          </select>
        </div>

        <div>
          <label className="filter-label">Sector</label>
          <select className="f-input" value={filters.sector} onChange={(e) => updateFilter("sector", e.target.value)}>
            <option value="All">All</option>
            <option value="IT">IT</option>
            <option value="Banking">Banking</option>
            <option value="Auto">Auto</option>
            <option value="FMCG">FMCG</option>
            <option value="Pharma">Pharma</option>
            <option value="Energy">Energy</option>
            <option value="Metals">Metals</option>
            <option value="Consumer">Consumer</option>
            <option value="Infra">Infra</option>
            <option value="Finance">Finance</option>
          </select>
        </div>
        <div>
          <label className="filter-label">Above SMA 20</label>
          <button
            type="button"
            className="toggle"
            style={{ background: filters.above_sma20 ? "#39FF14" : "rgba(255,255,255,0.1)" }}
            onClick={() => updateFilter("above_sma20", !filters.above_sma20)}
          >
            <span style={{ left: filters.above_sma20 ? 27 : 3 }} />
          </button>
        </div>
        <div>
          <label className="filter-label">Above SMA 50</label>
          <button
            type="button"
            className="toggle"
            style={{ background: filters.above_sma50 ? "#39FF14" : "rgba(255,255,255,0.1)" }}
            onClick={() => updateFilter("above_sma50", !filters.above_sma50)}
          >
            <span style={{ left: filters.above_sma50 ? 27 : 3 }} />
          </button>
        </div>
        <div>
          <label className="filter-label">&nbsp;</label>
          <button
            type="button"
            className="run-btn"
            onClick={() => {
              setActivePreset("");
              void runScreener(filters);
            }}
            disabled={loading}
          >
            Run Screener →
          </button>
        </div>
      </div>

      <div className="results">
        <div className="results-top">
          <span style={{ fontSize: 13, color: "#6b7280" }}>Showing {loading ? 0 : sortedRows.length} stocks</span>
          <button type="button" className="outline-btn" onClick={exportCsv} disabled={sortedRows.length === 0}>
            Export CSV
          </button>
        </div>

        <div className="grid" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            ["Symbol", "symbol"],
            ["Sector", "sector"],
            ["Price", "price"],
            ["Change%", "change_percent"],
            ["RSI", "rsi_14"],
            ["SMA20", "sma_20"],
            ["SMA50", "sma_50"],
            ["Signal", "signal"],
            ["Action", ""],
          ].map(([label, key]) => (
            <div key={label} className="head-cell" onClick={() => key && onSort(key as SortKey)}>
              {label} {key ? (sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : "↕") : ""}
            </div>
          ))}
        </div>

        {loading &&
          Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="grid data-row">
              {Array.from({ length: 9 }).map((__, cidx) => (
                <div key={cidx} className="row-cell">
                  <div className="skeleton" style={{ height: 12, borderRadius: 6, width: "80%" }} />
                </div>
              ))}
            </div>
          ))}

        {!loading &&
          sortedRows.map((row) => {
            const changeUp = row.change_percent >= 0;
            const rsiColor = row.rsi_14 > 70 || row.rsi_14 < 30 ? "#F85149" : "#39FF14";
            const signal = SIGNAL_STYLE[row.signal];
            return (
              <div key={row.symbol} className="grid data-row">
                <div className="row-cell">
                  <div style={{ fontWeight: 700, color: "white", fontSize: 14 }}>{row.symbol}</div>
                  <div style={{ color: "#6b7280", fontSize: 11 }}>{row.sector}</div>
                </div>
                <div className="row-cell">{row.sector}</div>
                <div className="row-cell" style={{ fontWeight: 600 }}>₹{row.price.toFixed(2)}</div>
                <div className="row-cell">
                  <span
                    className="change-pill"
                    style={{
                      color: changeUp ? "#3FB950" : "#F85149",
                      background: changeUp ? "#3FB95020" : "#F8514920",
                      border: `1px solid ${changeUp ? "#3FB95050" : "#F8514950"}`,
                    }}
                  >
                    {changeUp ? "+" : ""}
                    {row.change_percent.toFixed(2)}%
                  </span>
                </div>
                <div className="row-cell">
                  <div style={{ color: rsiColor }}>{row.rsi_14.toFixed(1)}</div>
                  <div className="rsi-bar">
                    <div className="rsi-fill" style={{ width: `${Math.max(0, Math.min(100, row.rsi_14))}%`, background: rsiColor }} />
                  </div>
                </div>
                <div className="row-cell" style={{ color: row.above_sma20 ? "#39FF14" : "#F85149" }}>
                  {row.sma_20.toFixed(2)} {row.above_sma20 ? "↑" : "↓"}
                </div>
                <div className="row-cell" style={{ color: row.above_sma50 ? "#39FF14" : "#F85149" }}>
                  {row.sma_50.toFixed(2)} {row.above_sma50 ? "↑" : "↓"}
                </div>
                <div className="row-cell">
                  <span
                    style={{
                      color: signal.color,
                      background: signal.bg,
                      border: `1px solid ${signal.border}`,
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {row.signal}
                  </span>
                </div>
                <div className="row-cell">
                  <Link href={`/?symbol=${row.symbol}`} className="analyze-btn">
                    Analyze →
                  </Link>
                </div>
              </div>
            );
          })}

        {!loading && sortedRows.length === 0 && (
          <div className="empty">
            <div style={{ fontSize: 26, marginBottom: 10 }}>📉</div>
            <div style={{ fontWeight: 700, color: "#9ca3af", marginBottom: 6 }}>No stocks match your filters</div>
            <div>Try adjusting the filter criteria</div>
          </div>
        )}

        {error && <div style={{ color: "#F85149", padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>{error}</div>}
      </div>
    </div>
  );
}
