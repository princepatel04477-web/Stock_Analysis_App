import { NextRequest, NextResponse } from 'next/server';

// Mock market data generator
function generateMockMarketData(symbol: string) {
  const price = Math.random() * 200 + 50;
  const change = (Math.random() - 0.5) * 10;
  
  return {
    symbol,
    current_price: parseFloat(price.toFixed(2)),
    change_percent: parseFloat(change.toFixed(2)),
    rsi_14: Math.random() * 100,
    sma_20: parseFloat((price + (Math.random() - 0.5) * 5).toFixed(2)),
    sma_50: parseFloat((price + (Math.random() - 0.5) * 10).toFixed(2)),
    sentiment: ['bullish', 'neutral', 'bearish'][Math.floor(Math.random() * 3)],
    analyst_rating: ['buy', 'hold', 'sell'][Math.floor(Math.random() * 3)],
    analyst_target_price: parseFloat((price * 1.1).toFixed(2)),
    news_summary: `Market update for ${symbol}: Stock shows mixed signals with moderate trading volume.`,
    company_name: symbol,
    sector: 'Technology',
  };
}

// Mock chart data generator
function generateMockChartData(symbol: string) {
  const data = [];
  let price = Math.random() * 200 + 50;
  
  for (let i = 0; i < 30; i++) {
    price += (Math.random() - 0.5) * 5;
    data.push({
      date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split('T')[0],
      open: parseFloat((price + (Math.random() - 0.5) * 2).toFixed(2)),
      high: parseFloat((price + Math.random() * 3).toFixed(2)),
      low: parseFloat((price - Math.random() * 3).toFixed(2)),
      close: parseFloat((price + (Math.random() - 0.5) * 2).toFixed(2)),
      volume: Math.floor(Math.random() * 1000000),
      sma_20: parseFloat(price.toFixed(2)),
      sma_50: parseFloat(price.toFixed(2)),
      ema_9: parseFloat(price.toFixed(2)),
      ema_21: parseFloat(price.toFixed(2)),
      macd: parseFloat((Math.random() - 0.5).toFixed(4)),
      macd_signal: parseFloat((Math.random() - 0.5).toFixed(4)),
      macd_diff: parseFloat((Math.random() - 0.5).toFixed(4)),
      bb_upper: parseFloat((price + 10).toFixed(2)),
      bb_middle: parseFloat(price.toFixed(2)),
      bb_lower: parseFloat((price - 10).toFixed(2)),
    });
  }
  
  return data;
}

// Mock patterns generator
function generateMockPatterns(symbol: string) {
  return [
    {
      date: new Date().toISOString().split('T')[0],
      pattern: 'Head and Shoulders',
      type: 'bearish' as const,
      description: 'Potential reversal pattern detected',
    },
    {
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      pattern: 'Double Bottom',
      type: 'bullish' as const,
      description: 'Support level confirmed twice',
    },
  ];
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const params = await context.params;
    const { symbol } = params;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const normalizedSymbol = symbol.toUpperCase();
    const marketData = generateMockMarketData(normalizedSymbol);
    const chartData = generateMockChartData(normalizedSymbol);
    const patterns = generateMockPatterns(normalizedSymbol);

    const response = {
      symbol: normalizedSymbol,
      market_data: marketData,
      analysis: {
        signal: ['BUY', 'SELL', 'NEUTRAL'][Math.floor(Math.random() * 3)],
        target_price: parseFloat((marketData.current_price * 1.15).toFixed(2)),
        summary: `Analysis for ${normalizedSymbol}: Technical indicators suggest a moderate ${['uptrend', 'downtrend', 'consolidation'][Math.floor(Math.random() * 3)]} in the near term.`,
        reasoning: [
          'Price is trading above 50-day moving average',
          'RSI indicates moderate momentum',
          'Volume is within normal range',
          'Support level at $' + (marketData.current_price - 5).toFixed(2),
        ],
      },
      chart_data: chartData,
      patterns,
      levels: {
        support: [
          parseFloat((marketData.current_price - 5).toFixed(2)),
          parseFloat((marketData.current_price - 10).toFixed(2)),
        ],
        resistance: [
          parseFloat((marketData.current_price + 5).toFixed(2)),
          parseFloat((marketData.current_price + 10).toFixed(2)),
        ],
        current_price: marketData.current_price,
      },
      from_cache: false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analyze endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze stock', details: String(error) },
      { status: 500 }
    );
  }
}
