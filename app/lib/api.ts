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

export interface LimeFeature {
  feature: string;
  weight: number;
}

export interface PredictionExplanation {
  sentiment_weight: number;
  price_above_sma: boolean;
  volatility: string;
}

export interface Prediction {
  signal: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  explanation: PredictionExplanation;
  lime_features: LimeFeature[];
  error?: string;
}

export interface PredictResponse {
  symbol: string;
  prediction: Prediction;
}

export interface SignalHistory {
  analyzed_at: string;
  signal: string;
  target_price: number;
  rsi_14: number;
  sentiment: string;
  summary: string;
}

export interface IndexItem {
  symbol: string;
  name: string;
  price: number;
  change_percent: number;
}

export interface StockMover {
  symbol: string;
  price: number;
  change_percent: number;
  volume: number;
}

export interface TickerData {
  indices: IndexItem[];
  gainers: StockMover[];
  losers: StockMover[];
}

export interface MarketMovers {
  gainers: StockMover[];
  losers: StockMover[];
}

export interface SectorStock {
  symbol: string;
  change_percent: number;
}

export interface SectorData {
  sector: string;
  avg_change: number;
  stocks: SectorStock[];
}

export interface MarketBreadth {
  advances: number;
  declines: number;
  unchanged: number;
}

export interface IndicesData {
  indices: IndexItem[];
  breadth: MarketBreadth;
}

export interface ScreenerFilters {
  rsi_min: number;
  rsi_max: number;
  price_min: number;
  price_max: number;
  change_min: number;
  change_max: number;
  signal: "ALL" | "BUY" | "SELL" | "HOLD";
  above_sma20: boolean;
  above_sma50: boolean;
  sector: string;
}

export interface ScreenerRow {
  symbol: string;
  sector: string;
  price: number;
  change_percent: number;
  rsi_14: number;
  sma_20: number;
  sma_50: number;
  above_sma20: boolean;
  above_sma50: boolean;
  signal: "BUY" | "SELL" | "HOLD";
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

// Fetch ML prediction for a symbol
export async function fetchPrediction(symbol: string): Promise<PredictResponse> {
  const res = await fetch(`${BASE_URL}/api/predict/${symbol}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Prediction failed");
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

// Fetch ticker bar data (indices + gainers + losers)
export async function fetchTickerData(): Promise<TickerData | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/market/ticker`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Fetch market movers (top 10 gainers + losers)
export async function fetchMarketMovers(): Promise<MarketMovers | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/market/movers`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Fetch sector heatmap data
export async function fetchSectorHeatmap(): Promise<SectorData[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/market/heatmap`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// Fetch indices + VIX + market breadth
export async function fetchIndicesData(): Promise<IndicesData | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/market/indices`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchScreener(filters: ScreenerFilters): Promise<ScreenerRow[]> {
  const res = await fetch(`${BASE_URL}/api/screener`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Screener request failed");
  return res.json();
}
