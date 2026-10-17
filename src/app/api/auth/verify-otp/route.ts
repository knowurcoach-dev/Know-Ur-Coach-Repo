import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    const result = verifyOtp(email, otp);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, valid: false, error: result.error || 'Invalid OTP code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      role: result.role,
      message: 'OTP verified successfully',
    });
  } catch (error: any) {
    console.error('[AUTH_ERROR] verify-otp API error:', error);
    return NextResponse.json(
      { success: false, valid: false, error: error?.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
