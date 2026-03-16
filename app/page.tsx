"use client";
import { useState, useEffect } from "react";
import { fetchStocks, fetchAnalysis, fetchPrediction, AnalyzeResponse, Prediction } from "@/lib/api";
import SearchBar from "@/components/SearchBar";
import StockHeader from "@/components/StockHeader";
import TechnicalSnapshot from "@/components/TechnicalSnapshot";
import SignalGauge from "@/components/SignalGauge";
import PriceChart from "@/components/PriceChart";
import NewsCard from "@/components/NewsCard";
import MLSignalCard from "@/components/MLSignalCard";

export default function Home() {
  const [stocks, setStocks]   = useState<string[]>([]);
  const [result, setResult]   = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  // Load stock list once on mount
  useEffect(() => {
    fetchStocks()
      .then(setStocks)
      .catch(() => setError("Failed to load stock list. Is the backend running?"));
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
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1117]">

      {/* Top Nav */}
      <nav className="border-b border-[#30363D] bg-[#161B22] px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">⚡ NiftyPulse</h1>
          <p className="text-[#8B949E] text-xs mt-0.5">Powered by Groq + Perplexity</p>
        </div>
        <div className="text-[#8B949E] text-sm">
          {stocks.length > 0 ? `${stocks.length} stocks loaded` : "Loading stocks..."}
        </div>
      </nav>

      {/* Search Bar */}
      <div className="bg-[#161B22] border-b border-[#30363D] px-6 py-4">
        <SearchBar stocks={stocks} onAnalyze={handleAnalyze} loading={loading} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 bg-[#F85149]/10 border border-[#F85149]/30 text-[#F85149] px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <svg className="animate-spin h-10 w-10 text-[#58A6FF]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-[#8B949E]">Fetching live data & running AI analysis...</p>
        </div>
      )}

      {/* Dashboard */}
      {result && !loading && (
        <main className="px-6 py-6 max-w-7xl mx-auto space-y-6">

          {/* Stock Header */}
          <StockHeader
            symbol={result.symbol}
            marketData={result.market_data}
            fromCache={result.from_cache}
          />

          {/* Row 1: Technical + Signal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TechnicalSnapshot marketData={result.market_data} />
            <SignalGauge analysis={result.analysis} />
          </div>

          {/* Row 2: ML Prediction */}
          {prediction && <MLSignalCard prediction={prediction} />}

          {/* Row 3: Price Chart */}
          <PriceChart symbol={result.symbol} chartData={result.chart_data} />

          {/* Row 4: News */}
          <NewsCard marketData={result.market_data} />

          {/* Footer Disclaimer */}
          <p className="text-center text-[#8B949E] text-xs pb-6">
            ⚠️ AI-generated analysis only. Not financial advice. Always verify with your broker.
          </p>

        </main>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-2xl font-semibold mb-2">Search for a stock to get started</h2>
          <p className="text-[#8B949E]">Type a symbol like RELIANCE, TCS, INFY and click Analyze</p>
        </div>
      )}

    </div>
  );
}
