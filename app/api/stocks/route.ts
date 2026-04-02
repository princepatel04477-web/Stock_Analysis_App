import { NextRequest, NextResponse } from 'next/server';

// Mock stock data for now
const MOCK_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 182.50 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 140.22 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 415.78 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.95 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.84 },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (query) {
      const filtered = MOCK_STOCKS.filter(stock =>
        stock.symbol.toUpperCase().includes(query.toUpperCase()) ||
        stock.name.toUpperCase().includes(query.toUpperCase())
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(MOCK_STOCKS);
  } catch (error) {
    console.error('Stocks endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
