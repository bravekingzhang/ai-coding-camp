'use server';
import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { Role, type CohortStatus } from '@prisma/client';

const requireAdmin = async () => {
  const session = await getSession();
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) throw new Error('无权限');
  return session;
};

/** 新建期次 */
export async function createCohort(formData: FormData) {
  const session = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  const startsAt = String(formData.get('startsAt') || '');
  const weeks = Number(formData.get('weeks') || 12);
  if (!name || !startsAt) return;
  const cohort = await prisma.cohort.create({
    data: { name, startsAt: new Date(startsAt), weeks },
  });
  await audit(session, 'cohort.create', `cohort:${cohort.id}`, { name });
  revalidatePath('/admin/cohorts');
}

/** 修改期次状态。RUNNING 全局唯一：存在其他 RUNNING 时拒绝。 */
export async function setCohortStatus(formData: FormData) {
  const session = await requireAdmin();
  const cohortId = String(formData.get('cohortId') || '');
  const status = String(formData.get('status') || '') as CohortStatus;
  if (!cohortId || !['PLANNING', 'RUNNING', 'CLOSED'].includes(status)) return;
  if (status === 'RUNNING') {
    const running = await prisma.cohort.findFirst({ where: { status: 'RUNNING', NOT: { id: cohortId } } });
    if (running) throw new Error('同一时间仅允许一个进行中（RUNNING）的期次，请先关闭「' + running.name + '」');
  }
  await prisma.cohort.update({ where: { id: cohortId }, data: { status } });
  await audit(session, 'cohort.status', `cohort:${cohortId}`, { status });
  revalidatePath('/admin/cohorts');
}

/** 新建小组 */
export async function createGroup(formData: FormData) {
  const session = await requireAdmin();
  const cohortId = String(formData.get('cohortId') || '');
  const name = String(formData.get('name') || '').trim();
  if (!cohortId || !name) return;
  const group = await prisma.group.create({ data: { cohortId, name } });
  await audit(session, 'group.create', `group:${group.id}`, { cohortId, name });
  revalidatePath('/admin/cohorts');
}

/** 指定组长：写 Group.leaderId 并自动授予 GROUP_LEADER 角色 */
export async function setGroupLeader(formData: FormData) {
  const session = await requireAdmin();
  const groupId = String(formData.get('groupId') || '');
  const leaderId = String(formData.get('leaderId') || '');
  if (!groupId || !leaderId) return;
  await prisma.group.update({ where: { id: groupId }, data: { leaderId } });
  const existing = await prisma.userRole.findUnique({ where: { userId_role: { userId: leaderId, role: Role.GROUP_LEADER } } });
  if (!existing) await prisma.userRole.create({ data: { userId: leaderId, role: Role.GROUP_LEADER } });
  await audit(session, 'group.leader', `group:${groupId}`, { leaderId });
  revalidatePath('/admin/cohorts');
}
