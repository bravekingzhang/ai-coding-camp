import { prisma } from '@/lib/db';
import type { CertFacts } from './cert-engine';

/**
 * 给定 enrollmentId，组装该学员的 CertFacts（认证评估的事实输入）。
 * 聚合：各关颜色 / 该证书所需关卡 / 项目颜色 / 给出的评审数 / 已确认采纳数。
 */
export async function buildCertFacts(enrollmentId: string, certLevel: string): Promise<CertFacts> {
  const [attempts, requiredLabs, reviewsGiven, adoptionsConfirmed] = await Promise.all([
    prisma.labAttempt.findMany({ where: { enrollmentId }, include: { events: true } }),
    prisma.lab.findMany({ where: { certLevel: certLevel as 'C1' | 'C2' | 'C3' | 'C4', active: true }, select: { code: true } }),
    prisma.reviewAssignment.count({ where: { authorId: enrollmentId, status: 'SUBMITTED' } }),
    prisma.assetContribution.count({ where: { enrollmentId, adoptions: { some: {} } } }),
  ]);

  // 各关最终颜色（用最近一条非空 GradeEvent 近似；颜色归约完整逻辑在 reduceColor，这里取 attempt.color）
  const labColors: CertFacts['labColors'] = {};
  for (const a of attempts) labColors[a.labCode] = a.color;

  return {
    labColors,
    requiredLabs: requiredLabs.map((l) => l.code),
    reviewsGiven,
    adoptionsConfirmed,
  };
}
