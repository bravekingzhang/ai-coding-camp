'use server';
import { prisma } from '@/lib/db';
import { getSession, getActiveEnrollment } from '@/lib/auth';
import { notify } from '@/lib/adapters/im';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function submitReview(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const enrollment = await getActiveEnrollment(session.userId);
  if (!enrollment) return;
  const id = String(formData.get('id'));
  const assignment = await prisma.reviewAssignment.findUnique({
    where: { id },
    include: { author: { include: { user: true } } },
  });
  if (!assignment || assignment.reviewerId !== enrollment.id || assignment.status !== 'PENDING') return;

  const form = {
    specTestable: formData.get('specTestable') === 'on',
    exceptionsCovered: formData.get('exceptionsCovered') === 'on',
    nonFunctional: formData.get('nonFunctional') === 'on',
    rollbackConsidered: formData.get('rollbackConsidered') === 'on',
    verdict: String(formData.get('verdict') || 'YELLOW'),
    comments: String(formData.get('comments') || ''),
  };
  await prisma.reviewAssignment.update({ where: { id }, data: { status: 'SUBMITTED', formJson: form } });
  // 评审贡献计分（C2 毕业条件之一）
  await prisma.pointsLedger.create({
    data: { enrollmentId: enrollment.id, delta: 10, reason: '完成跨组评审', refType: 'REVIEW', refId: id },
  });
  // 通知作者：你的产物收到一条跨组评审
  const verdictText = form.verdict === 'YELLOW' ? '🟡 通过' : '🔴 打回';
  await notify(`你的 ${assignment.artifactType}·${assignment.artifactRef} 收到一条跨组评审（结论：${verdictText}，评审人：${session.name}）。`);
  revalidatePath('/reviews');
  redirect('/reviews?msg=' + encodeURIComponent('评审已提交，感谢贡献 +10 分'));
}
