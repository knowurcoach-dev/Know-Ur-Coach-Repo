import { NextRequest, NextResponse } from 'next/server';
import { generatePassPDF } from '@/lib/pdf';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to download this admission pass.' },
        { status: 401 }
      );
    }

    const { passId } = await params;
    const user = session.user as any;
    const isAdmin =
      user.role === Role.ADMIN ||
      user.email === 'admin@knowurcoach.in' ||
      user.email === 'admin.rawat@knowurcoach.com';

    // Verify booking exists and caller is authorized (Parent, Coach, or Admin)
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: passId }, { passId: passId }],
      },
      include: {
        parent: { include: { user: true } },
        centre: { include: { owner: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
    }

    if (!isAdmin) {
      const isParentOwner =
        booking.parent?.userId === user.id ||
        booking.parent?.user?.email?.toLowerCase() === user.email?.toLowerCase() ||
        (user.phone && booking.parent?.user?.phone === user.phone);

      const isCoachOwner =
        booking.centre?.ownerUserId === user.id ||
        booking.centre?.owner?.email?.toLowerCase() === user.email?.toLowerCase() ||
        (user.phone && booking.centre?.phone === user.phone);

      if (!isParentOwner && !isCoachOwner) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to download this minor pass.' },
          { status: 403 }
        );
      }
    }

    const { buffer, filename, contentType } = await generatePassPDF(passId);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Pass generation failed' },
      { status: 500 }
    );
  }
}
