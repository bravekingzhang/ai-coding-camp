'use server';
import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { writeLabReadme } from '@/lib/content';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/** 切换 Lab.active（启/停） */
export async function toggleLabActive(formData: FormData) {
  const session = await getSession();
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) return;
  const code = String(formData.get('code') || '');
  if (!code) return;
  const lab = await prisma.lab.findUnique({ where: { code } });
  if (!lab) return;
  const next = !lab.active;
  await prisma.lab.update({ where: { code }, data: { active: next } });
  await audit(session, next ? 'lab.enable' : 'lab.disable', `lab:${code}`, {});
  revalidatePath('/admin/labs');
  revalidatePath('/');
}

/** 保存编辑后的 README 原文 */
export async function saveLabReadme(formData: FormData) {
  const session = await getSession();
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) return;
  const code = String(formData.get('code') || '');
  const repoPath = String(formData.get('repoPath') || '');
  const text = String(formData.get('text') || '');
  if (!code || !repoPath || !text) return;
  try {
    writeLabReadme(repoPath, text);
    await audit(session, 'lab.edit', `lab:${code}`, { repoPath, bytes: text.length });
  } catch (e) {
    throw new Error('保存失败：' + (e as Error).message);
  }
  revalidatePath(`/admin/labs/${code}`);
  revalidatePath(`/labs/${code}`);
  redirect(`/admin/labs/${code}?saved=1`);
}
