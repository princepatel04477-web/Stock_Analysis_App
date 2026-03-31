"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchStocks, fetchAnalysis, fetchPrediction, AnalyzeResponse, Prediction } from "@/lib/api";
import SearchBar from "@/components/SearchBar";
import StockHeader from "@/components/StockHeader";
import TechnicalSnapshot from "@/components/TechnicalSnapshot";
import SignalGauge from "@/components/SignalGauge";
import PriceChart from "@/components/PriceChart";
import NewsCard from "@/components/NewsCard";
import MarketBreadthBar from "@/components/MarketBreadthBar";
import TickerBar from "@/components/TickerBar";
import MarketMovers from "@/components/MarketMovers";
import SectorHeatmap from "@/components/SectorHeatmap";
import NavbarSearch, { MobileNavbarSearch } from "@/components/NavbarSearch";
import MLSignalCard from "@/components/MLSignalCard";

// ──────────────────────────────────────────────
// Mini sparkline SVG for the hero card mockup
// ──────────────────────────────────────────────
function Sparkline() {
  const pts = "0,60 20,55 40,48 60,52 80,40 100,32 120,28 140,22 160,18 180,10";
  return (
    <svg viewBox="0 0 180 70" width="100%" height={50} style={{ display: "block" }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#39FF14" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#39FF14" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke="#39FF14" strokeWidth={2} />
      <polygon points={`0,70 ${pts} 180,70`} fill="url(#sg)" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// Hero card mockup (right side of hero section)
// ──────────────────────────────────────────────
function HeroCard() {
  return (
    <div
      className="float-card"
      style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: 24,
        maxWidth: 360,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span
          style={{
            background: "rgba(57,255,20,0.12)",
            color: "#39FF14",
            borderRadius: 6,
            padding: "2px 10px",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          RELIANCE.NS
        </span>
        <span
          style={{
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.5)",
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 11,
          }}
        >
          NSE
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1 }}>₹2,450.30</div>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            background: "rgba(57,255,20,0.15)",
            color: "#39FF14",
            padding: "2px 10px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          +1.24% ↑
        </span>
      </div>
      <div style={{ margin: "14px 0" }}>
        <Sparkline />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 12,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.4)" }}>RSI</div>
          <div style={{ color: "#fff", fontWeight: 700 }}>58.3</div>
        </div>
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 12,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.4)" }}>SMA20</div>
          <div style={{ color: "#fff", fontWeight: 700 }}>₹2,380</div>
        </div>
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 12,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.4)" }}>Target</div>
          <div style={{ color: "#39FF14", fontWeight: 700 }}>₹2,570</div>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            background: "rgba(57,255,20,0.15)",
            border: "1px solid rgba(57,255,20,0.4)",
            color: "#39FF14",
            borderRadius: 10,
            padding: "8px 36px",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 2,
            display: "inline-block",
          }}
        >
          BUY
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Dashboard mockup (used in "Who We Are" section)
// ──────────────────────────────────────────────
function DashboardMockup() {
  const pts = "0,80 30,72 60,58 90,64 120,45 150,38 180,32 210,25 240,18";
  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        overflow: "hidden",
        fontSize: 12,
      }}
    >
      {/* Mock window chrome */}
      <div
        style={{
          background: "#161b22",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F85149", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#39FF14", display: "inline-block" }} />
        <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 8, fontSize: 11 }}>NiftyPulse — AI Stock Analyzer</span>
      </div>
      <div style={{ display: "flex", minHeight: 360 }}>
        {/* Left panel */}
        <div
          style={{
            width: 180,
            background: "#111",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 6,
              padding: "6px 10px",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Search stock…
          </div>
          <button
            style={{
              background: "#39FF14",
              color: "#000",
              border: "none",
              borderRadius: 6,
              padding: "7px 10px",
              fontWeight: 700,
              fontSize: 12,
              cursor: "default",
            }}
          >
            Analyze Stock
          </button>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 10, color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
            Recent
          </div>
          {["RELIANCE", "TCS", "INFY", "HDFCBANK"].map((s) => (
            <div
              key={s}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                color: "rgba(255,255,255,0.5)",
                cursor: "default",
              }}
            >
              {s}.NS
            </div>
          ))}
        </div>

        {/* Main area */}
        <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Stock header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>RELIANCE.NS · NSE</div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>₹2,450 <span style={{ color: "#39FF14", fontSize: 13 }}>+1.24%</span></div>
            </div>
            <span
              style={{
                background: "rgba(57,255,20,0.15)",
                border: "1px solid rgba(57,255,20,0.4)",
                color: "#39FF14",
                padding: "4px 14px",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              BUY
            </span>
          </div>

          {/* Indicator cards */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "RSI 14", value: "58.3", color: "#fff" },
              { label: "SMA 20", value: "₹2,380", color: "#fff" },
              { label: "SMA 50", value: "₹2,290", color: "#fff" },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 6,
                  padding: "8px 10px",
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{c.label}</div>
                <div style={{ color: c.color, fontWeight: 700, fontSize: 13 }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 6,
              padding: "10px 12px",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: 4, fontSize: 11 }}>Price Chart · 6M</div>
            <svg viewBox="0 0 240 90" width="100%" height={70}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#39FF14" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#39FF14" stopOpacity={0} />
                </linearGradient>
              </defs>
              <polyline points={pts} fill="none" stroke="#39FF14" strokeWidth={1.5} />
              <polygon points={`0,90 ${pts} 240,90`} fill="url(#cg)" />
            </svg>
          </div>

          {/* AI Reasoning */}
          <div
            style={{
              background: "rgba(57,255,20,0.04)",
              border: "1px solid rgba(57,255,20,0.15)",
              borderRadius: 6,
              padding: "10px 12px",
            }}
          >
            <div style={{ color: "#39FF14", fontWeight: 600, marginBottom: 6, fontSize: 11 }}>⚡ AI Reasoning</div>
            {[
              "RSI at 58.3 is neutral — no overbought/oversold signal",
              "Price above 20-day SMA ₹2,380 — bullish trend",
              "Strong institutional buying detected in recent sessions",
            ].map((pt, i) => (
              <div key={i} style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 3 }}>
                • {pt}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Stats section
// ──────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: "5,000+", label: "NSE Stocks Covered" },
    { value: "< 5s", label: "Analysis Speed" },
    { value: "3-in-1", label: "AI + Technical + News" },
    { value: "Free", label: "No Subscription Needed" },
  ];
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
        }}
      >
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#39FF14" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// How It Works section
// ──────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: "🔍",
      title: "Search Any NSE Stock",
      desc: "Type a symbol like RELIANCE, TCS, or INFY and hit Analyze.",
    },
    {
      icon: "📡",
      title: "Live Data Fetched",
      desc: "yfinance pulls real-time price, RSI, SMA and volume data instantly.",
    },
    {
      icon: "🤖",
      title: "Groq AI Analyzes",
      desc: "Our AI model reads technicals + news sentiment to generate a signal.",
    },
    {
      icon: "📊",
      title: "Get BUY / SELL / HOLD",
      desc: "Clear signal with reasoning, target price and risk summary in seconds.",
    },
  ];
  return (
    <section style={{ padding: "64px 24px", maxWidth: 1280, margin: "0 auto" }}>
      <h2
        style={{
          textAlign: "center",
          fontSize: 28,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 8,
          letterSpacing: "-0.5px",
        }}
      >
        How Does It Work?
      </h2>
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 15, marginBottom: 40 }}>
        From search to AI signal in under 5 seconds
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "24px 20px",
              position: "relative",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 24,
                height: 24,
                background: "rgba(57,255,20,0.1)",
                border: "1px solid rgba(57,255,20,0.2)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#39FF14",
              }}
            >
              {i + 1}
            </div>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "0 0 8px" }}>{s.title}</h3>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// Analysis Dashboard section (main app)
// ──────────────────────────────────────────────
function AnalysisSection({
  stocks,
  onAnalyze,
  loading,
  error,
  result,
  prediction,
}: {
  stocks: string[];
  onAnalyze: (s: string) => void;
  loading: boolean;
  error: string | null;
  result: AnalyzeResponse | null;
  prediction: Prediction | null;
}) {
  return (
    <section
      id="analyze"
      style={{
        padding: "64px 24px",
        background: "rgba(255,255,255,0.01)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 8,
            letterSpacing: "-0.5px",
          }}
        >
          Your AI-Powered Trading Dashboard
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 28 }}>
          Real-time data. Groq AI signals. NSE India.
        </p>

        <div
          style={{
            background: "#111",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <SearchBar stocks={stocks} onAnalyze={onAnalyze} loading={loading} />
        </div>

        {error && (
          <div
            style={{
              background: "rgba(248,81,73,0.1)",
              border: "1px solid rgba(248,81,73,0.3)",
              color: "#F85149",
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 0", gap: 16 }}>
            <svg className="animate-spin" style={{ width: 40, height: 40, color: "#39FF14" }} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Fetching live data &amp; running AI analysis…</p>
          </div>
        )}

        {result && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <StockHeader symbol={result.symbol} marketData={result.market_data} fromCache={result.from_cache} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <TechnicalSnapshot marketData={result.market_data} />
              <SignalGauge analysis={result.analysis} />
            </div>
            {prediction && <MLSignalCard prediction={prediction} />}
            <PriceChart symbol={result.symbol} chartData={result.chart_data} />
            <NewsCard marketData={result.market_data} />
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, paddingBottom: 8 }}>
              ⚠️ AI-generated analysis only. Not financial advice. Always verify with your broker.
            </p>
          </div>
        )}

        {!result && !loading && !error && (
          <div
            style={{
              textAlign: "center",
              padding: "64px 0",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>
              Search for a stock to get started
            </h3>
            <p style={{ fontSize: 14 }}>Type a symbol like RELIANCE, TCS, INFY and click Analyze</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// Hero section (Change 5 + Change 6 combined)
// ──────────────────────────────────────────────
function HeroSection({ onScrollToAnalyze }: { onScrollToAnalyze: () => void }) {
  return (
    <section style={{ padding: "72px 24px", maxWidth: 1280, margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
          alignItems: "center",
        }}
      >
        {/* Left side */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(57,255,20,0.08)",
              border: "1px solid rgba(57,255,20,0.2)",
              borderRadius: 20,
              padding: "4px 14px",
              fontSize: 12,
              color: "#39FF14",
              marginBottom: 20,
            }}
          >
            🟢 Live Market Data
          </div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.15,
              margin: "0 0 12px",
              letterSpacing: "-1px",
            }}
          >
            India&apos;s Smartest<br />Stock Analyzer
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
            Powered by{" "}
            <span style={{ color: "#39FF14", fontWeight: 700 }}>Groq AI</span>
            {" "}+{" "}
            <span style={{ color: "#39FF14", fontWeight: 700 }}>Perplexity</span>
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 32, lineHeight: 1.6 }}>
            Get real-time BUY/SELL/HOLD signals for 5000+ NSE stocks. Backed by
            technical analysis, live news sentiment, and analyst consensus.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onScrollToAnalyze}
              style={{
                background: "#39FF14",
                color: "#000",
                border: "none",
                borderRadius: 8,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Analyze Any Stock →
            </button>
            <button
              onClick={onScrollToAnalyze}
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View Live Markets
            </button>
          </div>
        </div>

        {/* Right side — hero card mockup */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// "Who We Are" section (Change 6)
// ──────────────────────────────────────────────
function DashboardShowcase() {
  return (
    <section
      style={{
        padding: "64px 24px",
        background: "rgba(255,255,255,0.01)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          {/* Left text */}
          <div>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#fff",
                margin: "0 0 12px",
                letterSpacing: "-0.5px",
              }}
            >
              Your AI-Powered<br />Trading Dashboard
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Real-time data. Groq AI signals. NSE India.
              <br />
              Everything you need to make smarter trading decisions — in one place.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Live price + RSI + SMA indicators",
                "Groq AI-powered BUY/SELL/HOLD signal",
                "News sentiment from Perplexity",
                "6-month candlestick chart",
              ].map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                  <span style={{ color: "#39FF14", fontWeight: 700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: dashboard mockup */}
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "24px",
        textAlign: "center",
        color: "rgba(255,255,255,0.25)",
        fontSize: 13,
      }}
    >
      <p style={{ margin: 0 }}>
        ⚡ NiftyPulse · Powered by Groq + Perplexity · Data via yfinance (NSE India)
      </p>
      <p style={{ margin: "6px 0 0" }}>
        ⚠️ For educational purposes only. Not financial advice.
      </p>
    </footer>
  );
}

// ──────────────────────────────────────────────
// Root page
// ──────────────────────────────────────────────
export default function Home() {
  const [stocks, setStocks] = useState<string[]>([]);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    fetchStocks()
      .then(setStocks)
      .catch(() => setError("Failed to load stock list. Is the backend running?"));
  }, []);

  useEffect(() => {
    const symbol = new URLSearchParams(window.location.search).get("symbol");
    if (!symbol) return;

    const runFromQuery = async () => {
      const normalized = symbol.toUpperCase();
      setLoading(true);
      setError(null);
      setPrediction(null);
      try {
        const data = await fetchAnalysis(normalized);
        setResult(data);
        fetchPrediction(normalized)
          .then((res) => setPrediction(res.prediction))
          .catch(() => {});
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Analysis failed";
        setError(`Failed to analyze ${normalized}: ${msg}`);
      } finally {
        setLoading(false);
      }
    };

    void runFromQuery();
  }, []);

  const handleAnalyze = async (symbol: string) => {
    setLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const data = await fetchAnalysis(symbol);
      setResult(data);
      // Fire ML prediction in background (non-blocking)
      fetchPrediction(symbol)
        .then((res) => setPrediction(res.prediction))
        .catch(() => {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      setError(`Failed to analyze ${symbol}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const scrollToAnalyze = () => {
    document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      {/* Sticky navbar */}
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
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 800 }}>⚡ NiftyPulse</span>
          <Link
            href="/screener"
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Screener
          </Link>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
            Powered by Groq + Perplexity
          </span>
        </div>

        {/* Center: NavbarSearch (hidden on mobile via CSS) */}
        <NavbarSearch stocks={stocks} loading={loading} onAnalyze={handleAnalyze} />

        {/* Right: CTA button */}
        <button
          onClick={scrollToAnalyze}
          style={{
            background: "#39FF14",
            color: "#000",
            border: "none",
            borderRadius: 6,
            padding: "6px 16px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Analyze Stock →
        </button>
      </nav>

      {/* Change 4: Market breadth bar (sticky below navbar) */}
      <MarketBreadthBar />

      {/* Change 1: Two-row ticker (Indian indices + gainers/losers) */}
      <TickerBar />

      {/* Change 5: Hero section */}
      <HeroSection onScrollToAnalyze={scrollToAnalyze} />

      {/* Mobile search bar — visible only on < 768px (nb-mobile-search class controls visibility) */}
      <div
        className="nb-mobile-search"
        style={{
          padding: "12px 20px",
          background: "#0a0a0a",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <MobileNavbarSearch stocks={stocks} loading={loading} onAnalyze={handleAnalyze} />
      </div>

      {/* Stats */}
      <StatsSection />

      {/* Change 2: Market Movers (between stats and how-it-works) */}
      <MarketMovers />

      {/* How It Works */}
      <HowItWorks />

      {/* Change 3: Sector Heatmap (after how-it-works) */}
      <SectorHeatmap />

      {/* Change 6: Dashboard showcase */}
      <DashboardShowcase />

      {/* Analysis section (existing functionality) */}
      <AnalysisSection
        stocks={stocks}
        onAnalyze={handleAnalyze}
        loading={loading}
        error={error}
        result={result}
        prediction={prediction}
      />

      <Footer />
    </div>
  );
}
