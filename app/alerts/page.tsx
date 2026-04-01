"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  checkPriceAlerts,
  createPriceAlert,
  fetchPriceAlerts,
  fetchStocks,
  PriceAlert,
  removePriceAlert,
} from "@/lib/api";

interface ToastItem {
  id: string;
  symbol: string;
  target_price: number;
}

const PRESETS = [
  { label: "RSI Oversold Alert", condition: "below" as const, alert_type: "RSI Oversold Alert" },
  { label: "52W High Break", condition: "above" as const, alert_type: "52W High Break" },
  { label: "SMA Crossover", condition: "above" as const, alert_type: "SMA Crossover" },
  { label: "5% Drop Alert", condition: "below" as const, alert_type: "5% Drop Alert" },
];
const ALERT_CHECK_INTERVAL_MS = 300000; // 5 minutes
const TOAST_DISPLAY_DURATION_MS = 5000;

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

function formatAgo(ts?: string | null): string {
  if (!ts) return "Triggered recently";
  const diff = Math.max(0, Date.now() - new Date(ts).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Triggered just now";
  if (mins < 60) return `Triggered ${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Triggered ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Triggered ${days} day${days === 1 ? "" : "s"} ago`;
}

export default function AlertsPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [symbolInput, setSymbolInput] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [alertType, setAlertType] = useState("Manual Price Alert");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [userId, setUserId] = useState("");

  const filteredStocks = useMemo(() => {
    if (!symbolInput.trim()) return [];
    const q = symbolInput.toUpperCase();
    return stocks.filter((s) => s.toUpperCase().includes(q)).slice(0, 8);
  }, [stocks, symbolInput]);

  const activeAlerts = alerts.filter((a) => !a.is_triggered);
  const triggeredAlerts = alerts.filter((a) => a.is_triggered);

  const loadAlerts = async (uid: string) => {
    if (!uid) return;
    const data = await fetchPriceAlerts(uid);
    setAlerts(data);
  };

  useEffect(() => {
    fetchStocks().then(setStocks).catch(() => {});
    const uid = getUserId();
    setUserId(uid);
    loadAlerts(uid);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const timer = setInterval(() => {
      checkPriceAlerts(userId).then((res) => {
        if (res.triggered.length > 0) {
          const incoming = res.triggered.map((a) => ({
            id: `${a.id}-${Date.now()}`,
            symbol: a.symbol,
            target_price: a.target_price,
          }));
          setToasts((prev) => [...incoming, ...prev].slice(0, 5));
          loadAlerts(userId);
        }
      }).catch(() => {});
    }, ALERT_CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [userId]);

  const createAlert = async () => {
    const symbol = symbolInput.split(" - ")[0].trim().toUpperCase();
    if (!symbol || !targetPrice || !userId) return;
    setLoading(true);
    const company_name = symbolInput.includes(" - ") ? symbolInput.split(" - ").slice(1).join(" - ").trim() : symbol;
    const ok = await createPriceAlert({
      user_id: userId,
      symbol,
      company_name,
      alert_type: alertType,
      target_price: Number(targetPrice),
      condition,
    });
    setLoading(false);
    if (!ok) return;
    setTargetPrice("");
    setSymbolInput("");
    setAlertType("Manual Price Alert");
    setDropdownOpen(false);
    loadAlerts(userId);
  };

  const onCheckNow = async () => {
    if (!userId) return;
    const res = await checkPriceAlerts(userId);
    if (res.triggered.length > 0) {
      const incoming = res.triggered.map((a) => ({
        id: `${a.id}-${Date.now()}`,
        symbol: a.symbol,
        target_price: a.target_price,
      }));
      setToasts((prev) => [...incoming, ...prev].slice(0, 5));
    }
    loadAlerts(userId);
  };

  useEffect(() => {
    if (toasts.length === 0) return;
    const id = setTimeout(() => setToasts((prev) => prev.slice(0, -1)), TOAST_DISPLAY_DURATION_MS);
    return () => clearTimeout(id);
  }, [toasts]);

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
              <button onClick={() => setMenuOpen(false)} style={{ width: "100%", background: "rgba(57,255,20,0.08)", border: "none", color: "#39FF14", textAlign: "left", padding: "10px 12px", cursor: "default", borderTop: "1px solid rgba(255,255,255,0.08)" }}>Alerts</button>
            </div>
          )}
        </div>
      </nav>

      <main style={{ padding: "64px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Price Alerts</h1>
        <p style={{ color: "#9ca3af", marginTop: 8, marginBottom: 24 }}>Get notified when stocks hit your target</p>

        <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Set New Alert</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div style={{ position: "relative" }}>
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
                      onClick={() => {
                        setSymbolInput(s);
                        setDropdownOpen(false);
                      }}
                      style={{ width: "100%", border: "none", background: "transparent", color: "#fff", textAlign: "left", padding: "10px 12px", cursor: "pointer" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as "above" | "below")}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", outline: "none" }}
            >
              <option value="above" style={{ background: "#111" }}>Price goes ABOVE</option>
              <option value="below" style={{ background: "#111" }}>Price goes BELOW</option>
            </select>

            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: 10, color: "#9ca3af" }}>₹</span>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g. 2500"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px 10px 28px", color: "#fff", outline: "none" }}
              />
            </div>

            <button
              onClick={createAlert}
              disabled={loading}
              style={{ background: "#39FF14", color: "#000", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", padding: "10px 14px" }}
            >
              Set Alert 🔔
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setCondition(p.condition);
                  setAlertType(p.alert_type);
                }}
                style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", color: "#d1d5db", borderRadius: 999, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Your Active Alerts ({activeAlerts.length})</h2>
          <button
            onClick={onCheckNow}
            style={{ border: "1px solid rgba(57,255,20,0.4)", background: "transparent", color: "#39FF14", borderRadius: 999, padding: "8px 14px", cursor: "pointer", fontWeight: 600 }}
          >
            Check Alerts Now 🔍
          </button>
        </div>

        {activeAlerts.map((alert) => (
          <div key={alert.id} style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, background: "rgba(57,255,20,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#39FF14" }}>🔔</div>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{alert.symbol}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Alert when price goes {alert.condition.toUpperCase()} ₹{Number(alert.target_price).toFixed(2)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {(() => {
                const currentPrice = alert.current_price;
                const hasCurrentPrice = typeof currentPrice === "number";
                const targetPrice = Number(alert.target_price);
                const hasValidTargetPrice = Number.isFinite(targetPrice) && targetPrice > 0;
                const canCalculateDistance = hasCurrentPrice && hasValidTargetPrice;
                const distance = canCalculateDistance
                  ? Math.abs((((currentPrice as number) - targetPrice) / (currentPrice as number)) * 100)
                  : null;
                const near = distance !== null && distance <= 3;
                return (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  ₹{hasCurrentPrice
                    ? (currentPrice as number).toFixed(2)
                    : "—"}
                </div>
                {distance !== null ? (
                  <div style={{ fontSize: 12, color: near ? "#39FF14" : "#6b7280" }}>
                    {distance.toFixed(2)}% away
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>— away</div>
                )}
              </div>
                );
              })()}
              <button
                onClick={async () => {
                  await removePriceAlert(alert.id);
                  loadAlerts(userId);
                }}
                style={{ border: "none", background: "transparent", color: "#6b7280", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                title="Delete alert"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 12, color: "#39FF14" }}>Triggered Alerts</h2>
        {triggeredAlerts.map((alert) => (
          <div key={alert.id} style={{ background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, background: "rgba(57,255,20,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#39FF14" }}>✓</div>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{alert.symbol}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{formatAgo(alert.triggered_at)}</div>
              </div>
            </div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Target ₹{Number(alert.target_price).toFixed(2)}</div>
          </div>
        ))}
      </main>

      <div style={{ position: "fixed", top: 20, right: 20, display: "flex", flexDirection: "column", gap: 10, zIndex: 1200 }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ background: "#111111", border: "1px solid rgba(57,255,20,0.3)", borderRadius: 12, padding: "16px 20px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", minWidth: 260 }}>
            <div style={{ color: "#39FF14", fontWeight: 700, marginBottom: 6 }}>🔔 Alert Triggered!</div>
            <div style={{ color: "#d1d5db", fontSize: 13 }}>{toast.symbol} crossed ₹{Number(toast.target_price).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
