import { prisma } from './db';
import type { Session } from './auth';

/** 记一条审计日志。写库失败不阻断主流程（审计是旁路记录）。 */
export async function audit(session: Session | null, action: string, target: string, diff?: unknown) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: session?.empId || 'system',
        action,
        target,
        diff: diff as object | undefined,
      },
    });
  } catch {
    // 审计失败不影响业务事务
  }
}
