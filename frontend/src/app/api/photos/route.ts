import { NextRequest, NextResponse } from 'next/server';

// This endpoint has been disabled as part of the photo fetching removal

export async function POST(request: NextRequest) {
    return NextResponse.json(
        {
            error: 'Photo fetching has been disabled',
            photos: [],
            success: false
        },
        { status: 404 }
    );
}

export async function GET(request: NextRequest) {
    return NextResponse.json(
        {
            error: 'Photo fetching has been disabled',
            photos: [],
            success: false
        },
        { status: 404 }
    );
}
