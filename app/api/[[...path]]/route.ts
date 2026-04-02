import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Proxy all /api requests to the Python FastAPI backend
export async function handler(req: NextRequest, context: any) {
  try {
    const params = context?.params?.path || [];
    const pathSegments = Array.isArray(params) ? params : [params];
    const path = '/' + pathSegments.join('/');
    
    const url = new URL(req.url);
    const searchParams = url.search;
    
    // Determine backend URL based on environment
    let backendUrl: string;
    
    if (process.env.NODE_ENV === 'development') {
      // Local development - FastAPI on port 8001
      backendUrl = `http://localhost:8001/api${path}${searchParams}`;
    } else {
      // Production - use Railway backend
      const railwayBackend = process.env.RAILWAY_BACKEND_URL || 'https://stock-analysis-api-production.up.railway.app';
      backendUrl = `${railwayBackend}/api${path}${searchParams}`;
    }
    
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(
          Array.from(req.headers.entries()).filter(([key]) => 
            !['host', 'connection'].includes(key.toLowerCase())
          )
        ),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend', details: String(error) },
      { status: 503 }
    );
  }
}

// Export handlers for all HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;


