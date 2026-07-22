'use server';
import { prisma } from '@/lib/db';
import { getSession, getActiveEnrollment, hasRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function registerAsset(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const enrollment = await getActiveEnrollment(session.userId);
  if (!enrollment) return;
  await prisma.assetContribution.create({
    data: {
      enrollmentId: enrollment.id,
      type: String(formData.get('type')) as never,
      name: String(formData.get('name') || '').trim(),
      skillHubRef: String(formData.get('skillHubRef') || '') || null,
    },
  });
  revalidatePath('/assets');
}

export async function submitAdoption(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  await prisma.adoption.create({
    data: {
      assetId: String(formData.get('assetId')),
      adopterDept: String(formData.get('adopterDept') || '').trim(),
      source: 'MANUAL',
      evidence: String(formData.get('evidence') || ''),
    },
  });
  revalidatePath('/assets');
}

/** 采纳确认 —— 只有组长/教练可点，是"被采纳"计入毕业条件的唯一入口（防刷） */
export async function confirmAdoption(formData: FormData) {
  const session = await getSession();
  if (!hasRole(session, 'GROUP_LEADER', 'COACH', 'CAMP_ADMIN')) return;
  const id = String(formData.get('id'));
  const adoption = await prisma.adoption.update({ where: { id }, data: { confirmedById: session!.userId }, include: { asset: true } });
  await prisma.pointsLedger.create({
    data: { enrollmentId: adoption.asset.enrollmentId, delta: 20, reason: '资产被采纳', refType: 'ADOPTION', refId: id },
  });
  await prisma.auditLog.create({ data: { actorId: session!.userId, action: 'CONFIRM_ADOPTION', target: `adoption:${id}` } });
  revalidatePath('/assets');
}
