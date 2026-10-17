import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getRecentAuditLogs } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Platform Admin privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await getRecentAuditLogs(limit);
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    console.error('[DB_ERROR] Failed to retrieve audit logs:', err);
    return NextResponse.json({ error: 'Failed to retrieve audit logs' }, { status: 500 });
  }
}
