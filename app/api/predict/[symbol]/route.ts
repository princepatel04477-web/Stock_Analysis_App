import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: { symbol: string } }
) {
  try {
    const { symbol } = context.params;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const normalizedSymbol = symbol.toUpperCase();
    const confidence = Math.random() * 0.5 + 0.5; // 0.5-1.0
    const signal = ['BUY', 'SELL', 'NEUTRAL'][Math.floor(Math.random() * 3)];

    const response = {
      symbol: normalizedSymbol,
      model: 'SVM',
      prediction: {
        signal,
        confidence: parseFloat(confidence.toFixed(3)),
        explanation: {
          sentiment_weight: parseFloat((Math.random() * 0.3).toFixed(3)),
          price_above_sma: Math.random() > 0.5,
          volatility: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        },
        lime_features: [
          { feature: 'Price Momentum', weight: parseFloat((Math.random()).toFixed(3)) },
          { feature: 'Volume Trend', weight: parseFloat((Math.random()).toFixed(3)) },
          { feature: 'Technical Strength', weight: parseFloat((Math.random()).toFixed(3)) },
        ],
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Predict endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to predict stock', details: String(error) },
      { status: 500 }
    );
  }
}
