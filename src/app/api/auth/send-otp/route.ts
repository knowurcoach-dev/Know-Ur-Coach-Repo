import { NextResponse } from 'next/server';
import { generateAndStoreOtp, checkOtpRateLimit, checkIpRateLimit } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role = 'PARENT', isSignup = false } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify user is registered when logging in (not signing up)
    if (!isSignup) {
      const isStandardAdmin =
        cleanEmail === 'admin@knowurcoach.in' || cleanEmail === 'admin.rawat@knowurcoach.com';

      if (!isStandardAdmin) {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: cleanEmail, mode: 'insensitive' } },
              { phone: cleanEmail },
            ],
          },
        });

        if (!existingUser) {
          return NextResponse.json(
            {
              success: false,
              error: 'No registered account found with this email. Please sign up or register first.',
            },
            { status: 404 }
          );
        }
      }
    } else {
      // Pre-validation for coach registration
      if (role === 'COACH') {
        const existingCoach = await prisma.user.findFirst({
          where: {
            email: { equals: cleanEmail, mode: 'insensitive' },
            role: 'COACH',
            coachingCentre: { isNot: null },
          },
          include: { coachingCentre: true },
        });

        if (existingCoach) {
          return NextResponse.json(
            {
              success: false,
              alreadyExists: true,
              error: `An academy account with this email (${cleanEmail}) is already registered. Please sign in to your Coach portal.`,
            },
            { status: 409 }
          );
        }

        if (cleanEmail === 'admin@knowurcoach.in' || cleanEmail === 'admin.rawat@knowurcoach.com') {
          return NextResponse.json(
            {
              success: false,
              error: 'This email address is reserved for Platform Administration.',
            },
            { status: 400 }
          );
        }
      }
    }

    // Check IP rate limit (max 20 per hour)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const ipCheck = checkIpRateLimit(clientIp);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { success: false, error: ipCheck.error },
        { status: 429 }
      );
    }

    // Check email rate limit (30s cooldown, max 5 per 10min)
    const rateCheck = checkOtpRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: rateCheck.error },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP and store it
    const otp = generateAndStoreOtp(cleanEmail, role);

    // Send OTP via Gmail SMTP (or fallback logger)
    const mailResult = await sendOtpEmail({
      to: cleanEmail,
      otp,
      role: role === 'COACH' ? 'Coach' : role === 'ADMIN' ? 'Platform Admin' : 'Parent',
      purpose: isSignup ? 'Registration' : 'Sign In',
    });

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
    });
  } catch (error: any) {
    console.error('[AUTH_ERROR] send-otp API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
