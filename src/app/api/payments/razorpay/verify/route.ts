import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyAndActivateSubscription } from '@/lib/payments';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to verify payment.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      centreId,
      planTier,
      billingCycle,
    } = body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !centreId || !planTier) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification credentials or details.' },
        { status: 400 }
      );
    }

    const result = await verifyAndActivateSubscription({
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      centreId,
      planTier,
      billingCycle: billingCycle || 'monthly',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[PAYMENT_ERROR] Failed to verify payment signature:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
