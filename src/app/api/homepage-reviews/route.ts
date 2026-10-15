import { NextResponse } from 'next/server';
import { getHomepageReviews } from '@/lib/reviews';

export async function GET() {
  try {
    const reviews = await getHomepageReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error('[API GET /api/homepage-reviews error]', err);
    return NextResponse.json({ error: 'Failed to fetch homepage reviews' }, { status: 500 });
  }
}
