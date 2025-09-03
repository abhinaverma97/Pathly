import { NextRequest, NextResponse } from 'next/server';

// This endpoint is reserved for future enhanced search functionality
export async function POST(request: NextRequest) {
    return NextResponse.json(
        {
            error: 'Search enriched endpoint not implemented yet',
            success: false
        },
        { status: 501 }
    );
}

export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST.' },
        { status: 405 }
    );
}