import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getAllHomepageReviewsForAdmin,
  saveHomepageReviewByAdmin,
  deleteHomepageReviewByAdmin,
} from '@/lib/reviews';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const reviews = await getAllHomepageReviewsForAdmin();
    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error('[Admin Homepage Reviews GET error]', err);
    return NextResponse.json({ error: 'Failed to retrieve homepage reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await saveHomepageReviewByAdmin(body);
    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[Admin Homepage Reviews POST error]', err);
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
    }

    const res = await deleteHomepageReviewByAdmin(id);
    if (!res.success) {
      return NextResponse.json(res, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[Admin Homepage Reviews DELETE error]', err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
