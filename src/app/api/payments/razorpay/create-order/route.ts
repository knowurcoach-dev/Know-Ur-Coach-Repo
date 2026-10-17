import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createSubscriptionOrder } from '@/lib/payments';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to proceed.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { centreId, planTier, billingCycle } = body;

    if (!centreId || !planTier) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: centreId and planTier.' },
        { status: 400 }
      );
    }

    const result = await createSubscriptionOrder({
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
    console.error('[PAYMENT_ERROR] Failed to initialize subscription order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error initializing order.' },
      { status: 500 }
    );
  }
}
