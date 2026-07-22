'use server';
import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { hashPassword, generateInitialPassword } from '@/lib/password';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

const requireAdmin = async () => {
  const session = await getSession();
  if (!session || !hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) throw new Error('无权限');
  return session;
};

const ROLES = new Set<Role>(['LEARNER', 'GROUP_LEADER', 'COACH', 'REVIEW_BOARD', 'CAMP_ADMIN']);

/** 给用户设密码的公共逻辑：生成初始密码、hash 入库、标记 mustChangePassword */
async function initPassword(userId: string): Promise<string> {
  const plain = generateInitialPassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(plain), mustChangePassword: true },
  });
  return plain;
}

/** 单个新增学员 —— 仅创建，工号已存在时报错（不覆盖）。返回初始密码或错误信息。 */
export async function createUser(formData: FormData) {
  const session = await requireAdmin();
  const empId = String(formData.get('empId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const dept = String(formData.get('dept') || '').trim();
  if (!empId || !name || !dept) return null;
  const existing = await prisma.user.findUnique({ where: { empId } });
  if (existing) {
    return { empId, name: existing.name, password: '', error: `工号 ${empId} 已存在（${existing.name}），如需修改请进入其详情页` };
  }
  const user = await prisma.user.create({ data: { empId, name, dept } });
  // 默认授予 LEARNER 角色（新用户）
  const hasLearner = await prisma.userRole.findUnique({ where: { userId_role: { userId: user.id, role: Role.LEARNER } } });
  if (!hasLearner) await prisma.userRole.create({ data: { userId: user.id, role: Role.LEARNER } });
  const password = await initPassword(user.id);
  await audit(session, 'user.create', `user:${user.empId}`, { empId, name, dept });
  revalidatePath('/admin/users');
  return { empId, name, password };
}

/** 批量导入：每行 `工号,姓名,部门[,初始密码]`。返回成功行（含密码）和失败行 */
export async function bulkImportUsers(formData: FormData) {
  const session = await requireAdmin();
  const raw = String(formData.get('bulk') || '');
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const created: { empId: string; name: string; password: string }[] = [];
  const failed: string[] = [];
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 3) { failed.push(`${line}（格式错误，需 工号,姓名,部门[,初始密码]）`); continue; }
    const [empId, name, dept, customPass] = parts;
    try {
      const existing = await prisma.user.findUnique({ where: { empId } });
      if (existing) { failed.push(`${line}（工号 ${empId} 已存在，已跳过）`); continue; }
      const user = await prisma.user.create({ data: { empId, name, dept } });
      // 密码：自带则用自带的，否则生成
      const plain = customPass || generateInitialPassword();
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(plain), mustChangePassword: true },
      });
      // 默认 LEARNER
      const hasLearner = await prisma.userRole.findUnique({ where: { userId_role: { userId: user.id, role: Role.LEARNER } } });
      if (!hasLearner) await prisma.userRole.create({ data: { userId: user.id, role: Role.LEARNER } });
      await audit(session, 'user.create', `user:${empId}`, { empId, name, dept });
      created.push({ empId, name, password: plain });
    } catch (e) {
      failed.push(`${line}（${(e as Error).message}）`);
    }
  }
  revalidatePath('/admin/users');
  return { created, failed };
}

/** 重置密码：生成新初始密码、mustChangePassword=true、清空锁定与失败计数 */
export async function resetPassword(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const plain = generateInitialPassword();
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashPassword(plain),
      mustChangePassword: true,
      failedLogins: 0,
      lockedUntil: null,
    },
  });
  // audit 不含明文密码
  await audit(session, 'password.reset', `user:${user.empId}`, {});
  revalidatePath('/admin/users');
  return { empId: user.empId, name: user.name, password: plain };
}

/** 授予 / 移除角色 */
export async function toggleRole(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  const role = String(formData.get('role') || '') as Role;
  const action = String(formData.get('action') || 'add');
  if (!userId || !ROLES.has(role)) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
  if (!user) return;
  const exists = user.roles.some((r) => r.role === role);
  if (action === 'add' && !exists) {
    await prisma.userRole.create({ data: { userId, role } });
    await audit(session, 'role.add', `user:${user.empId}`, { role });
  } else if (action === 'remove' && exists) {
    await prisma.userRole.delete({ where: { userId_role: { userId, role } } });
    await audit(session, 'role.remove', `user:${user.empId}`, { role });
  }
  revalidatePath('/admin/users');
}

/** 停用 / 启用 */
export async function toggleUserActive(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const next = !user.active;
  await prisma.user.update({ where: { id: userId }, data: { active: next } });
  await audit(session, next ? 'user.enable' : 'user.disable', `user:${user.empId}`, {});
  revalidatePath('/admin/users');
}

/** 编入当前 RUNNING 期次并选小组 */
export async function enrollUser(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId') || '');
  const cohortId = String(formData.get('cohortId') || '');
  const groupId = String(formData.get('groupId') || '');
  if (!userId || !cohortId || !groupId) return;
  await prisma.enrollment.upsert({
    where: { userId_cohortId: { userId, cohortId } },
    create: { userId, cohortId, groupId },
    update: { groupId },
  });
  const u = await prisma.user.findUnique({ where: { id: userId } });
  await audit(session, 'enroll', `user:${u?.empId ?? userId}`, { cohortId, groupId });
  revalidatePath('/admin/users');
}

/** 调组 */
export async function moveGroup(formData: FormData) {
  const session = await requireAdmin();
  const enrollmentId = String(formData.get('enrollmentId') || '');
  const groupId = String(formData.get('groupId') || '');
  if (!enrollmentId || !groupId) return;
  await prisma.enrollment.update({ where: { id: enrollmentId }, data: { groupId } });
  await audit(session, 'enroll.move', `enrollment:${enrollmentId}`, { groupId });
  revalidatePath('/admin/users');
}

/** 批量删除：仅处理无痕迹者，有痕迹的跳过并返回其工号。不含自己。 */
export async function batchDeleteUsers(userIds: string[], actorEmpId: string) {
  const session = await requireAdmin();
  const { hasTraces } = await import('@/lib/user-traces');
  const deleted: string[] = [];
  const skipped: string[] = [];
  for (const uid of userIds) {
    // 跳过自己（用 actorEmpId 比对，因为这里没有 session.userId 直传）
    const u = await prisma.user.findUnique({ where: { id: uid } });
    if (!u || u.empId === actorEmpId) { skipped.push(u?.empId || uid); continue; }
    if (await hasTraces(uid)) { skipped.push(u.empId); continue; }
    await prisma.$transaction(async (tx) => {
      await tx.group.updateMany({ where: { leaderId: uid }, data: { leaderId: null } });
      await tx.enrollment.deleteMany({ where: { userId: uid } });
      await tx.userRole.deleteMany({ where: { userId: uid } });
      await tx.user.delete({ where: { id: uid } });
    });
    await audit(session, 'DELETE_USER', `user:${u.empId}`, {});
    deleted.push(u.empId);
  }
  revalidatePath('/admin/users');
  return { deleted, skipped };
}

/** 批量停用。不含自己。 */
export async function batchDisableUsers(userIds: string[], actorEmpId: string) {
  const session = await requireAdmin();
  let count = 0;
  for (const uid of userIds) {
    const u = await prisma.user.findUnique({ where: { id: uid } });
    if (!u || u.empId === actorEmpId) continue;
    await prisma.user.update({ where: { id: uid }, data: { active: false } });
    await audit(session, 'user.disable', `user:${u.empId}`, {});
    count++;
  }
  revalidatePath('/admin/users');
  return { count };
}
