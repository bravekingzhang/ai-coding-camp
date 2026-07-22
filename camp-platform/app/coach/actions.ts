'use server';
import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { appendGradeEvent } from '@/lib/domain/grade';
import { revalidatePath } from 'next/cache';

export async function calibrate(formData: FormData) {
  const session = await getSession();
  if (!hasRole(session, 'COACH', 'REVIEW_BOARD', 'CAMP_ADMIN')) return;
  const id = String(formData.get('id'));
  const coachColor = String(formData.get('coachColor')) as 'RED' | 'YELLOW' | 'GREEN';
  const ev = await prisma.rubricEvaluation.findUnique({ where: { id } });
  if (!ev || ev.coachColor) return;
  await prisma.rubricEvaluation.update({
    where: { id },
    data: { coachId: session!.userId, coachColor, dispute: coachColor !== ev.preColor },
  });
  await appendGradeEvent({
    attemptId: ev.attemptId, source: 'COACH', color: coachColor,
    payload: { via: 'calibration', rubric: ev.rubricPath, preColor: ev.preColor }, actorId: session!.userId,
  });
  await prisma.auditLog.create({
    data: { actorId: session!.userId, action: 'CALIBRATE', target: `rubricEval:${id}`, diff: { preColor: ev.preColor, coachColor } },
  });
  revalidatePath('/coach');
}
