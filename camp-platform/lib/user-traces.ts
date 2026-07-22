import { prisma } from './db';

/** 判断某用户是否有"业务痕迹"（判分/评审/资产等），用于决定删除档位。 */
export async function hasTraces(userId: string): Promise<boolean> {
  const enrollments = await prisma.enrollment.findMany({ where: { userId }, select: { id: true } });
  if (enrollments.length === 0) {
    // 没有 enrollment，直接看 User 层关联
    const inAudit = await prisma.auditLog.count({ where: { actorId: userId } });
    return inAudit > 0;
  }
  const enrollmentIds = enrollments.map((e) => e.id);
  const [attempts, reviewsGiven, reviewsReceived, assets, points, placements, certs] = await Promise.all([
    prisma.labAttempt.count({ where: { enrollmentId: { in: enrollmentIds } } }),
    prisma.reviewAssignment.count({ where: { authorId: { in: enrollmentIds } } }),
    prisma.reviewAssignment.count({ where: { reviewerId: { in: enrollmentIds } } }),
    prisma.assetContribution.count({ where: { enrollmentId: { in: enrollmentIds } } }),
    prisma.pointsLedger.count({ where: { enrollmentId: { in: enrollmentIds } } }),
    prisma.placementResult.count({ where: { enrollmentId: { in: enrollmentIds } } }),
    prisma.certAward.count({ where: { enrollmentId: { in: enrollmentIds } } }),
  ]);
  return attempts + reviewsGiven + reviewsReceived + assets + points + placements + certs > 0;
}
