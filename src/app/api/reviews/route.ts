import { NextRequest, NextResponse } from 'next/server';
import { getAcademyReviews, submitAcademyReview } from '@/lib/reviews';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const academyId = searchParams.get('academyId');
    if (!academyId) {
      return NextResponse.json({ error: 'Missing academyId query parameter.' }, { status: 400 });
    }

    const res = await getAcademyReviews(academyId);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[DB_ERROR] Failed to fetch reviews:', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await submitAcademyReview(body);
    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[DB_ERROR] Server error processing review:', err);
    return NextResponse.json({ success: false, message: 'Server error processing review.' }, { status: 500 });
  }
}
