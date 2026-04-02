import { NextRequest, NextResponse } from 'next/server';

// Mock alerts storage (in production, use Supabase)
const mockAlerts: Record<string, any[]> = {};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const alerts = mockAlerts[userId] || [];
    return NextResponse.json({
      user_id: userId,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, symbol, target_price, alert_type } = body;

    if (!user_id || !symbol || !target_price) {
      return NextResponse.json(
        { error: 'user_id, symbol, and target_price are required' },
        { status: 400 }
      );
    }

    if (!mockAlerts[user_id]) {
      mockAlerts[user_id] = [];
    }

    const newAlert = {
      id: `alert_${Date.now()}`,
      user_id,
      symbol: symbol.toUpperCase(),
      target_price: parseFloat(target_price),
      alert_type: alert_type || 'price',
      created_at: new Date().toISOString(),
      status: 'active',
    };

    mockAlerts[user_id].push(newAlert);

    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    console.error('Create alert error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get('alertId');
    const userId = searchParams.get('userId');

    if (!alertId || !userId) {
      return NextResponse.json(
        { error: 'alertId and userId are required' },
        { status: 400 }
      );
    }

    if (mockAlerts[userId]) {
      mockAlerts[userId] = mockAlerts[userId].filter(
        (alert) => alert.id !== alertId
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert', details: String(error) },
      { status: 500 }
    );
  }
}
