import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ exists: true });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists in database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { phone: cleanEmail },
        ],
      },
      select: {
        id: true,
        role: true,
      },
    });

    return NextResponse.json({
      exists: Boolean(user),
      role: user?.role || null,
    });
  } catch (err) {
    console.warn('[CHECK_USER_WARNING] Failed to check user existence:', err);
    return NextResponse.json({ exists: true });
  }
}
