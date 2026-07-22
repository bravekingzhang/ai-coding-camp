'use server';
import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

const DEMO_EMP_IDS = ['90001', '10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008'];

/** 强制删除演示账号（90001 + 10001~10008），保留 00001。仅 PLATFORM_ADMIN。 */
export async function cleanDemoData() {
  const session = await getSession();
  if (!hasRole(session, 'PLATFORM_ADMIN')) throw new Error('需要平台管理员权限');
  const users = await prisma.user.findMany({ where: { empId: { in: DEMO_EMP_IDS } }, include: { enrollments: true } });
  for (const u of users) {
    const enrollmentIds = u.enrollments.map((e) => e.id);
    await prisma.$transaction(async (tx) => {
      await tx.group.updateMany({ where: { leaderId: u.id }, data: { leaderId: null } });
      if (enrollmentIds.length) {
        await tx.labAttempt.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await tx.peerTest.deleteMany({ where: { testerId: u.id } });
        await tx.reviewAssignment.deleteMany({ where: { OR: [{ authorId: { in: enrollmentIds } }, { reviewerId: { in: enrollmentIds } }] } });
        await tx.adoption.deleteMany({ where: { asset: { enrollmentId: { in: enrollmentIds } } } });
        await tx.assetContribution.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await tx.pointsLedger.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await tx.placementResult.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await tx.certAward.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
      }
      await tx.enrollment.deleteMany({ where: { userId: u.id } });
      await tx.userRole.deleteMany({ where: { userId: u.id } });
      await tx.user.delete({ where: { id: u.id } });
    });
  }
  await audit(session, 'CLEAN_DEMO', 'system', { deleted: users.map((u) => u.empId) });
  revalidatePath('/admin');
}
