import prisma from '@/lib/prisma';

export interface LogAdminActionParams {
  actorEmail: string;
  actorRole?: string;
  action: string;
  targetModel: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Automatically creates an immutable audit record for administrative actions
 */
export async function logAdminAction(params: LogAdminActionParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorEmail: params.actorEmail,
        actorRole: params.actorRole || 'ADMIN',
        action: params.action,
        targetModel: params.targetModel,
        targetId: params.targetId,
        details: params.details || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    console.error('[DB_ERROR] Failed to record admin audit log:', err);
    return null;
  }
}

/**
 * Retrieves the most recent administrative audit logs
 */
export async function getRecentAuditLogs(limit = 50) {
  try {
    return await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (err) {
    console.error('[DB_ERROR] Failed to fetch audit logs:', err);
    throw new Error('Database error: Failed to fetch audit logs');
  }
}
