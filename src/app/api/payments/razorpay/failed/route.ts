import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { recordFailedPayment } from '@/lib/payments';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      orderId,
      paymentId,
      centreId,
      errorCode,
      errorDescription,
      errorReason,
      errorSource,
      errorStep,
      rawError,
      notes,
    } = body;

    const result = await recordFailedPayment({
      orderId,
      paymentId,
      centreId,
      errorCode,
      errorDescription,
      errorReason,
      errorSource,
      errorStep,
      rawError,
      notes: {
        ...notes,
        reportedBy: session?.user?.email || 'client_checkout',
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[DB_ERROR] Failed to record payment failure:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record failed payment' },
      { status: 500 }
    );
  }
}
