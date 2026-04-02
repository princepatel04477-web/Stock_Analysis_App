import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint === 'ticker') {
      return NextResponse.json({
        ticker: {
          symbol: 'NIFTY50',
          price: 21500,
          change: 150.5,
          change_percent: 0.71,
          volume: '5.2B',
        },
        top_gainers: [
          { symbol: 'INFY', change_percent: 3.45, price: 1850 },
          { symbol: 'TCS', change_percent: 2.89, price: 3650 },
          { symbol: 'WIPRO', change_percent: 2.34, price: 420 },
        ],
        top_losers: [
          { symbol: 'SBIN', change_percent: -2.12, price: 620 },
          { symbol: 'ICICI', change_percent: -1.89, price: 1100 },
          { symbol: 'HDFC', change_percent: -1.45, price: 2400 },
        ],
      });
    }

    if (endpoint === 'movers') {
      return NextResponse.json({
        top_gainers: [
          { symbol: 'RELIANCE', change_percent: 5.23, price: 2850 },
          { symbol: 'ITC', change_percent: 4.12, price: 465 },
          { symbol: 'MARUTI', change_percent: 3.89, price: 9250 },
        ],
        top_losers: [
          { symbol: 'BAJAJFINSV', change_percent: -3.45, price: 1650 },
          { symbol: 'ULTRACEMCO', change_percent: -2.89, price: 9450 },
          { symbol: 'ASIANPAINT', change_percent: -2.34, price: 3100 },
        ],
      });
    }

    if (endpoint === 'indices') {
      return NextResponse.json({
        indices: [
          { name: 'Nifty 50', value: 21500, change: 150.5 },
          { name: 'Sensex', value: 70850, change: 450.25 },
          { name: 'Nifty IT', value: 42500, change: 280.75 },
          { name: 'Nifty Bank', value: 48200, change: 320.5 },
          { name: 'Nifty PSU', value: 5450, change: 45.25 },
        ],
      });
    }

    if (endpoint === 'summary') {
      return NextResponse.json({
        market_status: 'open',
        market_time: new Date().toISOString(),
        total_advancers: 1850,
        total_decliners: 950,
        total_unchanged: 340,
        market_breadth: 'Positive',
        sentiment: 'Bullish',
      });
    }

    if (endpoint === 'heatmap') {
      return NextResponse.json({
        sectors: [
          { name: 'IT', change: 2.45, stocks: 15 },
          { name: 'Banking', change: 1.89, stocks: 12 },
          { name: 'Auto', change: -0.34, stocks: 8 },
          { name: 'Pharma', change: 1.23, stocks: 10 },
          { name: 'Energy', change: -1.12, stocks: 6 },
        ],
      });
    }

    return NextResponse.json({
      ticker: { symbol: 'NIFTY50', price: 21500, change_percent: 0.71 },
    });
  } catch (error) {
    console.error('Market endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data', details: String(error) },
      { status: 500 }
    );
  }
}
