"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  buyPortfolioTrade,
  fetchAnalysis,
  fetchPortfolio,
  fetchStocks,
  PortfolioResponse,
  sellPortfolioTrade,
} from "@/lib/api";

const PIE_COLORS = ["#39FF14", "#00BFFF", "#a855f7", "#ec4899", "#f59e0b", "#ef4444", "#22d3ee", "#84cc16"];

function getUserId(): string {
  if (typeof window === "undefined") return "";
  const key = "niftypulse_user_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `guest-${Date.now()}`;
  localStorage.setItem(key, generated);
  return generated;
}

function fmtINR(value: number): string {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

export default function PortfolioPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [stocks, setStocks] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioResponse>({
    trades: [],
    closed_trades: [],
    summary: { total_invested: 0, total_current: 0, total_pnl: 0, total_pnl_percent: 0 },
  });
  const [symbolInput, setSymbolInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [loadingBuy, setLoadingBuy] = useState(false);

  const [capital, setCapital] = useState("100000");
  const [riskPct, setRiskPct] = useState("2");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");

  const filteredStocks = useMemo(() => {
    if (!symbolInput.trim()) return [];
    const q = symbolInput.toUpperCase();
    return stocks.filter((s) => s.toUpperCase().includes(q)).slice(0, 8);
  }, [stocks, symbolInput]);

  const pieData = useMemo(() => {
    return portfolio.trades
      .map((t) => ({
        name: t.symbol,
        value: Number(t.current_value || 0),
      }))
      .filter((x) => x.value > 0);
  }, [portfolio.trades]);

  const sizing = useMemo(() => {
    const c = Number(capital) || 0;
    const r = Number(riskPct) || 0;
    const e = Number(entryPrice) || 0;
    const s = Number(stopPrice) || 0;
    const perShareRisk = Math.abs(e - s);
    const maxLoss = (c * r) / 100;
    const shares = perShareRisk > 0 ? Math.floor(maxLoss / perShareRisk) : 0;
    const positionSize = shares * e;
    const reward = Math.abs(e - s) * 2;
    const ratio = perShareRisk > 0 ? reward / perShareRisk : 0;
    return { shares, maxLoss, ratio, positionSize };
  }, [capital, riskPct, entryPrice, stopPrice]);

  const loadPortfolio = async (uid: string) => {
    if (!uid) return;
    const data = await fetchPortfolio(uid);
    setPortfolio(data);
  };

  useEffect(() => {
    fetchStocks().then(setStocks).catch(() => {});
    const uid = getUserId();
    setUserId(uid);
    loadPortfolio(uid);
  }, []);

  const onSelectStock = async (value: string) => {
    setSymbolInput(value);
    setDropdownOpen(false);
    const symbol = value.split(" - ")[0].trim().toUpperCase();
    if (!symbol) return;
    try {
      const res = await fetchAnalysis(symbol);
      setPrice(String(res.market_data.current_price || ""));
      setEntryPrice(String(res.market_data.current_price || ""));
    } catch {
      setPrice("");
    }
  };

  const buyNow = async () => {
    const symbol = symbolInput.split(" - ")[0].trim().toUpperCase();
    if (!symbol || !userId || quantity < 1) return;
    setLoadingBuy(true);
    try {
      await buyPortfolioTrade({
        user_id: userId,
        symbol,
        company_name: symbolInput.includes(" - ") ? symbolInput.split(" - ").slice(1).join(" - ").trim() : symbol,
        quantity,
        price: price ? Number(price) : undefined,
      });
      setSymbolInput("");
      setQuantity(1);
      setPrice("");
      await loadPortfolio(userId);
    } finally {
      setLoadingBuy(false);
    }
  };

  const sellTrade = async (trade: PortfolioResponse["trades"][number]) => {
    const ok = confirm(`Sell ${trade.quantity} shares of ${trade.symbol} at ₹${Number(trade.current_price || 0).toFixed(2)}?`);
    if (!ok) return;
    await sellPortfolioTrade(trade.id, { price: trade.current_price });
    await loadPortfolio(userId);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      <nav
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "#0a0a0a",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20, fontWeight: 800, cursor: "pointer" }}
        >
          ⚡ NiftyPulse
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{ background: "#39FF14", color: "#000", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 700, cursor: "pointer" }}
          >
            Menu ▾
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 170, background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
              <button onClick={() => router.push("/")} style={{ width: "100%", background: "transparent", border: "none", color: "#fff", textAlign: "left", padding: "10px 12px", cursor: "pointer" }}>Home</button>
              <button onClick={() => router.push("/alerts")} style={{ width: "100%", background: "transparent", border: "none", color: "#fff", textAlign: "left", padding: "10px 12px", cursor: "pointer", borderTop: "1px solid rgba(255,255,255,0.08)" }}>Alerts</button>
              <button onClick={() => setMenuOpen(false)} style={{ width: "100%", background: "rgba(57,255,20,0.08)", border: "none", color: "#39FF14", textAlign: "left", padding: "10px 12px", cursor: "default", borderTop: "1px solid rgba(255,255,255,0.08)" }}>Portfolio</button>
            </div>
          )}
        </div>
      </nav>

      <main style={{ padding: "64px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Virtual Portfolio</h1>
        <p style={{ color: "#9ca3af", marginTop: 8, marginBottom: 24 }}>Paper trade with zero risk</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { icon: "💰", label: "Total Invested", value: fmtINR(portfolio.summary.total_invested), color: "#fff" },
            { icon: "📊", label: "Current Value", value: fmtINR(portfolio.summary.total_current), color: "#fff" },
            { icon: portfolio.summary.total_pnl >= 0 ? "📈" : "📉", label: "Total P&L", value: `${portfolio.summary.total_pnl >= 0 ? "+" : ""}${fmtINR(portfolio.summary.total_pnl)}`, color: portfolio.summary.total_pnl >= 0 ? "#39FF14" : "#F85149" },
            { icon: "🎯", label: "Return %", value: `${portfolio.summary.total_pnl_percent >= 0 ? "+" : ""}${portfolio.summary.total_pnl_percent.toFixed(2)}%`, color: portfolio.summary.total_pnl_percent >= 0 ? "#39FF14" : "#F85149" },
          ].map((item) => (
            <div key={item.label} style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32 }}>{item.icon}</div>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", marginTop: 8 }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 6, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, margin: "24px 0", display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: 260, flex: 2 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Stock</div>
            <input
              value={symbolInput}
              onChange={(e) => {
                setSymbolInput(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search stock symbol"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", outline: "none" }}
            />
            {dropdownOpen && filteredStocks.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: "100%", maxHeight: 230, overflowY: "auto", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, zIndex: 30 }}>
                {filteredStocks.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSelectStock(s)}
                    style={{ width: "100%", border: "none", background: "transparent", color: "#fff", textAlign: "left", padding: "10px 12px", cursor: "pointer" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Quantity</div>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", outline: "none" }}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Price</div>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", outline: "none" }}
            />
          </div>
          <button
            onClick={buyNow}
            disabled={loadingBuy}
            style={{ background: "#39FF14", color: "#000", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", padding: "10px 18px", height: 42 }}
          >
            Buy Now
          </button>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Open Positions ({portfolio.trades.length})</h2>
        <div style={{ overflowX: "auto", background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                {["Stock", "Qty", "Buy Price", "Current", "Invested", "Value", "P&L", "P&L%", "Action"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.trades.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{t.symbol}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{t.quantity}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{fmtINR(t.buy_price)}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{fmtINR(Number(t.current_price || 0))}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{fmtINR(Number(t.invested || 0))}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{fmtINR(Number(t.current_value || 0))}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: Number(t.pnl || 0) >= 0 ? "#39FF14" : "#F85149" }}>
                    {`${Number(t.pnl || 0) >= 0 ? "+" : ""}${fmtINR(Number(t.pnl || 0))}`}
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{`${Number(t.pnl_percent || 0) >= 0 ? "+" : ""}${Number(t.pnl_percent || 0).toFixed(2)}%`}</div>
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: Number(t.pnl_percent || 0) >= 0 ? "#39FF14" : "#F85149" }}>
                    {`${Number(t.pnl_percent || 0) >= 0 ? "+" : ""}${Number(t.pnl_percent || 0).toFixed(2)}%`}
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <button
                      onClick={() => sellTrade(t)}
                      style={{ border: "1px solid rgba(248,81,73,0.6)", background: "transparent", color: "#F85149", borderRadius: 999, padding: "6px 14px", cursor: "pointer" }}
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>Closed Trades</h2>
        <div style={{ overflowX: "auto", background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                {["Stock", "Qty", "Buy", "Sell", "Invested", "Final", "Final P&L", "Result"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.closed_trades.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{t.symbol}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{t.quantity}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{fmtINR(t.buy_price)}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{fmtINR(Number(t.sell_price || 0))}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{fmtINR(Number(t.invested || 0))}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{fmtINR(Number(t.final_value || 0))}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: Number(t.pnl || 0) >= 0 ? "#39FF14" : "#F85149" }}>
                    {`${Number(t.pnl || 0) >= 0 ? "+" : ""}${fmtINR(Number(t.pnl || 0))}`}
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ borderRadius: 999, padding: "4px 10px", fontSize: 12, color: Number(t.pnl || 0) >= 0 ? "#39FF14" : "#F85149", background: Number(t.pnl || 0) >= 0 ? "rgba(57,255,20,0.12)" : "rgba(248,81,73,0.12)" }}>
                      {Number(t.pnl || 0) >= 0 ? "Won" : "Lost"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, marginTop: 24 }}>
          <h3 style={{ margin: 0, marginBottom: 12 }}>Portfolio Allocation</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label={false}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtINR(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {pieData.map((item, idx) => {
              const pct = portfolio.summary.total_current > 0 ? (item.value / portfolio.summary.total_current) * 100 : 0;
              return (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6, color: "#d1d5db", fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", display: "inline-block", background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span>{item.name}</span>
                  <span style={{ color: "#9ca3af" }}>{pct.toFixed(2)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, marginTop: 24 }}>
          <h3 style={{ margin: 0, marginBottom: 12 }}>Position Size Calculator</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Total Capital</div>
              <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Risk per trade %</div>
              <input type="number" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Entry Price</div>
              <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Stop Loss Price</div>
              <input type="number" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", outline: "none" }} />
            </div>
          </div>

          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Shares to buy</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{sizing.shares}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Max loss</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#F85149" }}>{fmtINR(sizing.maxLoss)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Risk/Reward</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: sizing.ratio > 2 ? "#39FF14" : "#F59E0B" }}>{sizing.ratio.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Position size</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{fmtINR(sizing.positionSize)}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
