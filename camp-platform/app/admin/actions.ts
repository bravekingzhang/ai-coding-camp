'use server';
import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { syncCurriculum } from '@/lib/curriculum-sync';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function runSync() {
  const session = await getSession();
  if (!session || !hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) return;
  const r = await syncCurriculum('admin-ui');
  await audit(session, 'SYNC', 'curriculum', r);
  revalidatePath('/admin');
  revalidatePath('/');
  redirect('/admin?msg=' + encodeURIComponent(`同步完成：共 ${r.total} 关（新增 ${r.created} · 更新 ${r.updated} · 停用 ${r.deactivated}）`));
}

/** 新增部门工具登记（已存在则提示，不静默覆盖） */
export async function upsertTool(formData: FormData) {
  const session = await getSession();
  if (!session || !hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) return;
  const dept = String(formData.get('dept') || '').trim();
  if (!dept) return;
  const existing = await prisma.toolRegistry.findUnique({ where: { dept } });
  if (existing) {
    redirect('/admin?err=' + encodeURIComponent(`部门「${dept}」已登记，请直接在上方行内编辑`));
  }
  await prisma.toolRegistry.create({
    data: { dept, defaultTool: String(formData.get('defaultTool') || ''), quirks: String(formData.get('quirks') || '') },
  });
  await audit(session, 'tool.create', `tool:${dept}`, {});
  revalidatePath('/admin');
  revalidatePath('/onboarding');
  redirect('/admin?msg=' + encodeURIComponent(`已登记部门「${dept}」的默认工具`));
}

/** 行内编辑部门工具 */
export async function editTool(formData: FormData) {
  const session = await getSession();
  if (!session || !hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) return;
  const dept = String(formData.get('dept') || '').trim();
  await prisma.toolRegistry.update({
    where: { dept },
    data: { defaultTool: String(formData.get('defaultTool') || ''), quirks: String(formData.get('quirks') || '') },
  });
  await audit(session, 'tool.update', `tool:${dept}`, {});
  revalidatePath('/admin');
  revalidatePath('/onboarding');
  redirect('/admin?msg=' + encodeURIComponent(`已更新部门「${dept}」的工具登记`));
}

/** 删除部门工具登记 */
export async function deleteTool(formData: FormData) {
  const session = await getSession();
  if (!session || !hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) return;
  const dept = String(formData.get('dept') || '').trim();
  await prisma.toolRegistry.delete({ where: { dept } });
  await audit(session, 'tool.delete', `tool:${dept}`, {});
  revalidatePath('/admin');
  revalidatePath('/onboarding');
  redirect('/admin?msg=' + encodeURIComponent(`已删除部门「${dept}」的工具登记`));
}
