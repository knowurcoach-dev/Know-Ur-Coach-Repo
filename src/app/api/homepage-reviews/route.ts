import { NextResponse } from 'next/server';
import { getHomepageReviews } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reviews = await getHomepageReviews();
    return NextResponse.json(
      { success: true, reviews },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    console.error('[DB_ERROR] GET /api/homepage-reviews error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch homepage reviews' }, { status: 500 });
  }
}
