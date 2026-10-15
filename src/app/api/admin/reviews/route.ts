import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getAllReviewsForAdmin,
  updateReviewStatusByAdmin,
  deleteReviewByAdmin,
} from '@/lib/reviews';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const reviews = await getAllReviewsForAdmin(limit);
    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error('[Admin Reviews GET error]', err);
    return NextResponse.json({ error: 'Failed to retrieve reviews' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { reviewId, status } = body;
    if (!reviewId || !status) {
      return NextResponse.json({ error: 'Missing reviewId or status' }, { status: 400 });
    }

    const res = await updateReviewStatusByAdmin(reviewId, status);
    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[Admin Reviews PATCH error]', err);
    return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('reviewId');
    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 });
    }

    const res = await deleteReviewByAdmin(reviewId);
    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[Admin Reviews DELETE error]', err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
