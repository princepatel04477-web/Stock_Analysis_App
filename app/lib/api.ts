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
  ema_9: number | null;
  ema_21: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_diff: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
}

export interface AnalyzeResponse {
  symbol: string;
  market_data: MarketData;
  analysis: Analysis;
  chart_data: ChartCandle[];
  patterns: Array<{
    date: string;
    pattern: string;
    type: "bullish" | "bearish" | "neutral";
    description: string;
  }>;
  levels: {
    support: number[];
    resistance: number[];
    current_price?: number;
  };
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
  model?: string;
  prediction: Prediction;
}

// Multimodal ML types
export interface ModelInfo {
  id: string;
  name: string;
  family: "llama" | "mistral" | "gemma" | "qwen";
  provider: "ollama" | "groq";
  vision: boolean;
}

export interface MultimodalModelsResponse {
  models: ModelInfo[];
  default_text_model: string;
  default_vision_model: string;
}

export interface LLMAnalysis {
  model: string;
  model_family: string;
  provider: string;
  signal: "BUY" | "SELL" | "NEUTRAL";
  analysis: string;
  confidence: number;
  error?: string;
}

export interface MultimodalAnalyzeRequest {
  symbol: string;
  model?: string;
  temperature?: number;
}

export interface MultimodalAnalyzeResponse {
  symbol: string;
  analysis: LLMAnalysis;
}

export interface ChartAnalysis {
  model: string;
  model_family: string;
  provider: string;
  signal: "BUY" | "SELL" | "NEUTRAL";
  patterns: string;
  confidence: number;
  error?: string;
}

export interface MultimodalChartRequest {
  symbol: string;
  model?: string;
  temperature?: number;
  period?: string;
}

export interface MultimodalChartResponse {
  symbol: string;
  chart_analysis: ChartAnalysis;
  data_points: number;
}

export interface EnsemblePrediction {
  signal: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
}

export interface EnsembleResponse {
  symbol: string;
  ensemble: EnsemblePrediction;
  svm_prediction: Prediction;
  llm_prediction: LLMAnalysis;
  agreement: boolean;
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

export interface MarketSummaryData {
  nifty: { price: number; change: number };
  sensex: { price: number; change: number };
  india_vix: number;
  date: string;
  outlook: "Bullish" | "Bearish" | "Neutral";
  summary: string;
  watch_list: string[];
  risk_level: "Low" | "Medium" | "High";
  risk_reason: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  company_name?: string;
  alert_type: string;
  target_price: number;
  condition: "above" | "below";
  is_triggered: boolean;
  triggered_at?: string | null;
  created_at?: string;
  current_price?: number;
}

export interface PortfolioTrade {
  id: string;
  user_id: string;
  symbol: string;
  company_name?: string;
  quantity: number;
  buy_price: number;
  buy_date?: string;
  is_open: boolean;
  sell_price?: number | null;
  sell_date?: string | null;
  notes?: string | null;
  current_price?: number;
  invested?: number;
  current_value?: number;
  final_value?: number;
  pnl?: number;
  pnl_percent?: number;
}

export interface PortfolioSummary {
  total_invested: number;
  total_current: number;
  total_pnl: number;
  total_pnl_percent: number;
}

export interface PortfolioResponse {
  trades: PortfolioTrade[];
  closed_trades: PortfolioTrade[];
  summary: PortfolioSummary;
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

export async function fetchMarketSummary(): Promise<MarketSummaryData | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/market/summary`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createPriceAlert(alert: {
  user_id: string;
  symbol: string;
  company_name?: string;
  alert_type: string;
  target_price: number;
  condition: "above" | "below";
}): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/alerts/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alert),
  });
  return res.ok;
}

export async function fetchPriceAlerts(userId: string): Promise<PriceAlert[]> {
  const res = await fetch(`${BASE_URL}/api/alerts/${userId}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function removePriceAlert(alertId: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/alerts/${alertId}`, { method: "DELETE" });
  return res.ok;
}

export async function checkPriceAlerts(userId: string): Promise<{ triggered: PriceAlert[] }> {
  const res = await fetch(`${BASE_URL}/api/alerts/check/${userId}`, { cache: "no-store" });
  if (!res.ok) return { triggered: [] };
  return res.json();
}

export async function buyPortfolioTrade(payload: {
  user_id: string;
  symbol: string;
  company_name?: string;
  quantity: number;
  price?: number;
}): Promise<{ success: boolean; buy_price: number }> {
  const res = await fetch(`${BASE_URL}/api/portfolio/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to buy portfolio trade");
  return res.json();
}

export async function sellPortfolioTrade(tradeId: string, payload?: { price?: number }): Promise<{ success: boolean; sell_price: number; pnl: number }> {
  const res = await fetch(`${BASE_URL}/api/portfolio/sell/${tradeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error("Failed to sell portfolio trade");
  return res.json();
}

export async function fetchPortfolio(userId: string): Promise<PortfolioResponse> {
  const res = await fetch(`${BASE_URL}/api/portfolio/${userId}`, { cache: "no-store" });
  if (!res.ok) {
    return {
      trades: [],
      closed_trades: [],
      summary: { total_invested: 0, total_current: 0, total_pnl: 0, total_pnl_percent: 0 },
    };
  }
  return res.json();
}

// ============================================================================
// Multimodal ML API Functions
// ============================================================================

/**
 * Fetch list of available LLM models with their capabilities
 */
export async function fetchMultimodalModels(): Promise<MultimodalModelsResponse> {
  const res = await fetch(`${BASE_URL}/api/multimodal/models`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch multimodal models");
  }
  return res.json();
}

/**
 * Analyze stock using specified LLM model
 */
export async function analyzeStockWithLLM(
  request: MultimodalAnalyzeRequest
): Promise<MultimodalAnalyzeResponse> {
  const res = await fetch(`${BASE_URL}/api/multimodal/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "LLM analysis failed");
  }
  return res.json();
}

/**
 * Analyze candlestick chart using vision-capable LLM
 */
export async function analyzeChartWithVision(
  request: MultimodalChartRequest
): Promise<MultimodalChartResponse> {
  const res = await fetch(`${BASE_URL}/api/multimodal/analyze-chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Chart vision analysis failed");
  }
  return res.json();
}

/**
 * Get ensemble prediction combining SVM + LLM models
 */
export async function fetchEnsemblePrediction(
  symbol: string,
  llmModel?: string,
  temperature?: number
): Promise<EnsembleResponse> {
  let url = `${BASE_URL}/api/multimodal/ensemble/${symbol}`;
  const params = new URLSearchParams();
  if (llmModel) params.append("llm_model", llmModel);
  if (temperature !== undefined) params.append("temperature", temperature.toString());
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Ensemble prediction failed");
  }
  return res.json();
}

/**
 * Enhanced prediction with model selection
 */
export async function fetchPredictionWithModel(
  symbol: string,
  model: string = "svm",
  temperature: number = 0.7
): Promise<PredictResponse> {
  const url = `${BASE_URL}/api/predict/${symbol}?model=${model}&temperature=${temperature}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Prediction failed");
  }
  return res.json();
}

