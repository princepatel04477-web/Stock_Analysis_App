import { NextRequest, NextResponse } from 'next/server';

// Mock portfolio storage (in production, use Supabase)
const mockPortfolios: Record<string, any> = {};

export async function GET(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const params = await context.params;
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const portfolio = mockPortfolios[userId] || {
      user_id: userId,
      holdings: [],
      total_value: 0,
      total_invested: 0,
      total_gain_loss: 0,
      gain_loss_percent: 0,
    };

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Get portfolio error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, symbol, quantity, buy_price } = body;

    if (!user_id || !symbol || !quantity || !buy_price) {
      return NextResponse.json(
        { error: 'user_id, symbol, quantity, and buy_price are required' },
        { status: 400 }
      );
    }

    if (!mockPortfolios[user_id]) {
      mockPortfolios[user_id] = {
        user_id,
        holdings: [],
        total_value: 0,
        total_invested: 0,
        total_gain_loss: 0,
        gain_loss_percent: 0,
      };
    }

    const portfolio = mockPortfolios[user_id];
    const existingHolding = portfolio.holdings.find(
      (h: any) => h.symbol === symbol.toUpperCase()
    );

    const currentPrice = buy_price * (0.95 + Math.random() * 0.1); // Mock current price

    if (existingHolding) {
      existingHolding.quantity += quantity;
      existingHolding.total_cost += quantity * buy_price;
      existingHolding.avg_price = existingHolding.total_cost / existingHolding.quantity;
    } else {
      portfolio.holdings.push({
        id: `holding_${Date.now()}`,
        symbol: symbol.toUpperCase(),
        quantity,
        buy_price: parseFloat(buy_price),
        current_price: parseFloat(currentPrice.toFixed(2)),
        total_cost: quantity * buy_price,
        current_value: quantity * currentPrice,
        gain_loss: quantity * (currentPrice - buy_price),
        gain_loss_percent: parseFloat(
          (((currentPrice - buy_price) / buy_price) * 100).toFixed(2)
        ),
        avg_price: parseFloat(buy_price),
        purchase_date: new Date().toISOString().split('T')[0],
      });
    }

    // Recalculate totals
    portfolio.total_invested = portfolio.holdings.reduce(
      (sum: number, h: any) => sum + h.total_cost,
      0
    );
    portfolio.total_value = portfolio.holdings.reduce(
      (sum: number, h: any) => sum + h.current_value,
      0
    );
    portfolio.total_gain_loss = portfolio.total_value - portfolio.total_invested;
    portfolio.gain_loss_percent = parseFloat(
      ((portfolio.total_gain_loss / portfolio.total_invested) * 100).toFixed(2)
    );

    return NextResponse.json(portfolio, { status: 201 });
  } catch (error) {
    console.error('Create portfolio entry error:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio entry', details: String(error) },
      { status: 500 }
    );
  }
}
