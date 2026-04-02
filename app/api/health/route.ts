import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Stock Analysis API is running on Vercel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
