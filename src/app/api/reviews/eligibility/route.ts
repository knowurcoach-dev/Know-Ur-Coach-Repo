import { NextRequest, NextResponse } from 'next/server';
import { checkParentReviewEligibility } from '@/lib/reviews';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const academyId = searchParams.get('academyId');
    if (!academyId) {
      return NextResponse.json({ error: 'Missing academyId query parameter.' }, { status: 400 });
    }

    const res = await checkParentReviewEligibility(academyId);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[API GET /api/reviews/eligibility error]', err);
    return NextResponse.json({ isEligible: false, reason: 'NOT_ENROLLED', message: 'Could not verify eligibility.' }, { status: 500 });
  }
}
