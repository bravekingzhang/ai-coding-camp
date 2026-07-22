'use server';
import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { hashPassword, generateInitialPassword } from '@/lib/password';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const requireAdmin = async () => {
  const session = await getSession();
  if (!session || !hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) throw new Error('无权限');
  return session;
};

/** 编辑基本信息（姓名、部门） */
export async function updateProfile(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  const name = String(formData.get('name') || '').trim();
  const dept = String(formData.get('dept') || '').trim();
  if (!userId || !name || !dept) return;
  await prisma.user.update({ where: { id: userId }, data: { name, dept } });
  await audit(session, 'user.update', `user:${userId}`, { name, dept });
  revalidatePath(`/admin/users/${userId}`);
}

/** 保存角色（六个角色勾选）。防自锁 + 保底管理员 */
export async function saveRoles(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  if (!userId || !session) return;
  const target = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
  if (!target) return;
  const allRoles = ['LEARNER', 'GROUP_LEADER', 'COACH', 'REVIEW_BOARD', 'CAMP_ADMIN', 'PLATFORM_ADMIN'] as const;
  const wanted = new Set(allRoles.filter((r) => formData.get(`role_${r}`) === 'on'));

  // 防自锁：不能移除自己的 CAMP_ADMIN/PLATFORM_ADMIN
  if (userId === session.userId) {
    if (!wanted.has('CAMP_ADMIN')) wanted.add('CAMP_ADMIN');
    if (!wanted.has('PLATFORM_ADMIN')) wanted.add('PLATFORM_ADMIN');
  }
  // 保底：移除最后一个 PLATFORM_ADMIN 时拒绝
  if (!wanted.has('PLATFORM_ADMIN') && target.roles.some((r) => r.role === 'PLATFORM_ADMIN')) {
    const otherAdmins = await prisma.user.count({
      where: { id: { not: userId }, roles: { some: { role: Role.PLATFORM_ADMIN } } },
    });
    if (otherAdmins === 0) throw new Error('系统至少需要保留一位平台管理员，操作已拒绝');
  }

  const current = new Set(target.roles.map((r) => r.role));
  for (const r of allRoles) {
    if (wanted.has(r) && !current.has(r)) await prisma.userRole.create({ data: { userId, role: r } });
    if (!wanted.has(r) && current.has(r)) await prisma.userRole.delete({ where: { userId_role: { userId, role: r } } });
  }
  await audit(session, 'role.save', `user:${target.empId}`, { roles: Array.from(wanted) });
  revalidatePath(`/admin/users/${userId}`);
}

/** 编入当前进行中期次 + 小组 */
export async function enrollToCohort(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  const cohortId = String(formData.get('cohortId') || '');
  const groupId = String(formData.get('groupId') || '');
  if (!userId || !cohortId || !groupId) return;
  await prisma.enrollment.create({ data: { userId, cohortId, groupId } }).catch(() => {});
  await audit(session, 'enroll', `user:${userId}`, { cohortId, groupId });
  revalidatePath(`/admin/users/${userId}`);
}

/** 调组（同期次内） */
export async function moveGroup(formData: FormData) {
  const session = await requireAdmin();
  const enrollmentId = String(formData.get('enrollmentId') || '');
  const groupId = String(formData.get('groupId') || '');
  const userId = String(formData.get('userId') || '');
  if (!enrollmentId || !groupId) return;
  await prisma.enrollment.update({ where: { id: enrollmentId }, data: { groupId } });
  await audit(session, 'enroll.move', `enrollment:${enrollmentId}`, { groupId });
  revalidatePath(`/admin/users/${userId}`);
}

/** 重置密码 */
export async function resetPassword(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const plain = generateInitialPassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(plain), mustChangePassword: true, failedLogins: 0, lockedUntil: null },
  });
  await audit(session, 'password.reset', `user:${user.empId}`, {});
  revalidatePath(`/admin/users/${userId}`);
  return plain;
}

/** 停用/启用。不能停用自己。 */
export async function toggleActive(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  if (!userId || userId === session.empId) throw new Error('不能停用自己');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
  await audit(session, user.active ? 'user.disable' : 'user.enable', `user:${user.empId}`, {});
  revalidatePath(`/admin/users/${userId}`);
}

/**
 * 删除用户。
 * - 无 force：仅无痕迹者可用，事务清理空关联。
 * - force=1（PLATFORM_ADMIN）：按依赖顺序清理全部业务痕迹，保留审计链记录条数。
 * 通用约束：不能删自己；被删者是组长则置空 leaderId。
 */
export async function deleteUser(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  const force = formData.get('force') === '1';
  if (!userId || userId === session.empId) throw new Error('不能删除自己');
  if (force && !hasRole(session, 'PLATFORM_ADMIN')) throw new Error('强制删除需要平台管理员权限');

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true, enrollments: true } });
  if (!user) return;

  const enrollmentIds = user.enrollments.map((e) => e.id);
  const counts: Record<string, number> = {};

  await prisma.$transaction(async (tx) => {
    // 置空其担任的组长
    await tx.group.updateMany({ where: { leaderId: userId }, data: { leaderId: null } });

    if (force && enrollmentIds.length > 0) {
      // 按依赖顺序清理：GradeEvent/RubricEvaluation(随 LabAttempt 级联) → LabAttempt → PeerTest → ReviewAssignment → Adoption → AssetContribution → PointsLedger → PlacementResult → CertAward
      counts.labAttempts = await tx.labAttempt.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } }).then((r) => r.count);
      counts.peerTests = await tx.peerTest.deleteMany({ where: { testerId: userId } }).then((r) => r.count);
      counts.reviews = await tx.reviewAssignment.deleteMany({ where: { OR: [{ authorId: { in: enrollmentIds } }, { reviewerId: { in: enrollmentIds } }] } }).then((r) => r.count);
      counts.adoptions = await tx.adoption.deleteMany({ where: { asset: { enrollmentId: { in: enrollmentIds } } } }).then((r) => r.count);
      counts.assets = await tx.assetContribution.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } }).then((r) => r.count);
      counts.points = await tx.pointsLedger.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } }).then((r) => r.count);
      counts.placements = await tx.placementResult.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } }).then((r) => r.count);
      counts.certs = await tx.certAward.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } }).then((r) => r.count);
    }

    await tx.enrollment.deleteMany({ where: { userId } });
    await tx.userRole.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  await audit(session, force ? 'FORCE_DELETE_USER' : 'DELETE_USER', `user:${user.empId}`, force ? { cleaned: counts } : {});
  redirect('/admin/users');
}
