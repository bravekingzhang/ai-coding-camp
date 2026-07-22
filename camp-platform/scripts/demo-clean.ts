/** 清除演示数据：强制删除 90001 与 10001~10008，保留 00001。 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DEMO_EMP_IDS = ['90001', '10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008'];

async function forceDeleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { enrollments: true } });
  if (!user) return null;
  const enrollmentIds = user.enrollments.map((e) => e.id);
  await prisma.$transaction(async (tx) => {
    await tx.group.updateMany({ where: { leaderId: userId }, data: { leaderId: null } });
    if (enrollmentIds.length) {
      await tx.labAttempt.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
      await tx.peerTest.deleteMany({ where: { testerId: userId } });
      await tx.reviewAssignment.deleteMany({ where: { OR: [{ authorId: { in: enrollmentIds } }, { reviewerId: { in: enrollmentIds } }] } });
      await tx.adoption.deleteMany({ where: { asset: { enrollmentId: { in: enrollmentIds } } } });
      await tx.assetContribution.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
      await tx.pointsLedger.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
      await tx.placementResult.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
      await tx.certAward.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
    }
    await tx.enrollment.deleteMany({ where: { userId } });
    await tx.userRole.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });
  return user.empId;
}

async function main() {
  const users = await prisma.user.findMany({ where: { empId: { in: DEMO_EMP_IDS } }, select: { id: true, empId: true, name: true } });
  console.log(`将删除 ${users.length} 个演示账号：\n${users.map((u) => `  ${u.empId} ${u.name}`).join('\n')}`);
  for (const u of users) {
    const emp = await forceDeleteUser(u.id);
    if (emp) console.log(`  ✓ 已删除 ${emp}`);
  }
  const remain = await prisma.user.findUnique({ where: { empId: '00001' } });
  console.log(`\n完成。00001 ${remain ? '仍存在（请为其重置为强密码）' : '不存在'}`);
}

main().finally(() => prisma.$disconnect());
