import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward the request to the Python API server with extended timeout
        const response = await fetch(`${API_BASE_URL}/api/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            // Set timeout to 2 minutes for search operations
            signal: AbortSignal.timeout(120000), // 120 seconds = 2 minutes
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('API Error:', error);

        // Handle timeout errors specifically
        if (error instanceof Error && error.name === 'TimeoutError') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Search request timed out. This may happen on first run or with complex queries. Please try again.'
                },
                { status: 408 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to connect to search service'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST.' },
        { status: 405 }
    );
}
