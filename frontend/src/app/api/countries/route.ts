import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        const url = new URL(`${BACKEND_URL}/countries`);
        if (search) {
            url.searchParams.append('search', search);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch countries' },
                { status: response.status }
            );
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching countries:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 