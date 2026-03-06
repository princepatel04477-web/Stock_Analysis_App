// lib/api.ts
// All API calls to FastAPI backend

const BASE_URL = "";

export interface MarketData {
  current_price: number;
  change_percent: number;
  rsi_14: number;
  sma_20: number;
  sma_50: number;
  sentiment: string;
  analyst_rating: string;
  analyst_target_price: number;
  news_summary: string;
  company_name: string;
  sector: string;
}

export interface Analysis {
  signal: string;
  target_price: number;
  summary: string;
  reasoning: string[];
}

export interface ChartCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20: number | null;
  sma_50: number | null;
}

export interface AnalyzeResponse {
  symbol: string;
  market_data: MarketData;
  analysis: Analysis;
  chart_data: ChartCandle[];
  from_cache: boolean;
}

export interface SignalHistory {
  analyzed_at: string;
  signal: string;
  target_price: number;
  rsi_14: number;
  sentiment: string;
  summary: string;
}

// Fetch all stocks for search bar (called once on load)
export async function fetchStocks(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/stocks`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch stocks");
  return res.json();
}

// Run full analysis for a symbol
export async function fetchAnalysis(symbol: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${BASE_URL}/api/analyze/${symbol}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Analysis failed");
  }
  return res.json();
}

// Fetch past signal history
export async function fetchSignalHistory(symbol: string, limit = 10): Promise<SignalHistory[]> {
  const res = await fetch(`${BASE_URL}/api/history/${symbol}?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}
