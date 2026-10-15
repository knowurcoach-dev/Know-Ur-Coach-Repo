import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getMaskedPaymentSettings, updatePaymentSettings } from '@/lib/payments';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Platform Admin privileges required.' },
        { status: 403 }
      );
    }

    const settings = await getMaskedPaymentSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    console.error('[Admin Payments GET error]', err);
    return NextResponse.json(
      { error: 'Failed to retrieve payment configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Platform Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actorEmail = (session.user as any)?.email || 'admin@knowurcoach.in';

    const result = await updatePaymentSettings(body, actorEmail);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      settings: result.settings,
    });
  } catch (err: any) {
    console.error('[Admin Payments POST error]', err);
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}
