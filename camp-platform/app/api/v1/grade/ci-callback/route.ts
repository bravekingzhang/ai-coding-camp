import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { appendGradeEvent } from '@/lib/domain/grade';
import { pickReviewer } from '@/lib/domain/matching';
import { gradeLlmQueue } from '@/lib/queue';
import { notify } from '@/lib/adapters/im';

const Body = z.object({
  lab: z.string(),
  emp_id: z.string(),
  commit: z.string(),
  pipeline_url: z.string().optional(),
  result: z.enum(['red', 'yellow']),          // CI 最高只判到黄
  checks: z.array(z.object({ name: z.string(), pass: z.boolean(), detail: z.string().optional() })),
});

// 提交这些关卡时自动指派一次跨组评审（Spec 类产物）
const REVIEW_ON_SUBMIT = new Set(['c2-02', 'c2-05']);

export async function POST(req: NextRequest) {
  if (req.headers.get('x-camp-token') !== process.env.CI_SHARED_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;

  const user = await prisma.user.findUnique({ where: { empId: b.emp_id } });
  const lab = await prisma.lab.findUnique({ where: { code: b.lab } });
  if (!user || !lab) return NextResponse.json({ error: 'unknown user or lab' }, { status: 404 });
  const enrollment = await prisma.enrollment.findFirst({ where: { userId: user.id, cohort: { status: 'RUNNING' } } });
  if (!enrollment) return NextResponse.json({ error: 'no active enrollment' }, { status: 404 });

  const attempt = await prisma.labAttempt.upsert({
    where: { enrollmentId_labCode: { enrollmentId: enrollment.id, labCode: lab.code } },
    create: { enrollmentId: enrollment.id, labCode: lab.code, status: 'SUBMITTED', branch: `camp/${lab.code}/${b.emp_id}` },
    update: { status: 'SUBMITTED' },
  });

  const color = await appendGradeEvent({
    attemptId: attempt.id,
    source: 'CI',
    color: b.result === 'yellow' ? 'YELLOW' : 'RED',
    payload: { checks: b.checks, pipeline: b.pipeline_url, commit: b.commit },
  });

  // HYBRID：CI 过了再进 LLM rubric 队列
  if (lab.verifyType === 'HYBRID' && b.result === 'yellow') {
    await gradeLlmQueue.add('evaluate', { attemptId: attempt.id, labCode: lab.code });
  }

  // 跨组评审自动指派
  if (REVIEW_ON_SUBMIT.has(lab.code) && b.result === 'yellow') {
    const peers = await prisma.enrollment.findMany({
      where: { cohortId: enrollment.cohortId, id: { not: enrollment.id } },
      include: { _count: { select: { reviewsAssigned: true } } },
    });
    const pending = await prisma.reviewAssignment.groupBy({
      by: ['reviewerId'], where: { status: 'PENDING' }, _count: { _all: true },
    });
    const pendingOf = (id: string) => pending.find((p) => p.reviewerId === id)?._count._all ?? 0;
    const pick = pickReviewer(
      enrollment.groupId,
      peers.map((p) => ({
        enrollmentId: p.id, groupId: p.groupId,
        pendingReviews: pendingOf(p.id), totalReviews: p._count.reviewsAssigned, recentPairCount: 0,
      })),
    );
    if (pick) {
      await prisma.reviewAssignment.create({
        data: {
          cohortId: enrollment.cohortId, artifactType: 'SPEC', artifactRef: attempt.id,
          authorId: enrollment.id, reviewerId: pick.enrollmentId,
          dueAt: new Date(Date.now() + 48 * 3600 * 1000),
        },
      });
    } else {
      await notify(`⚠️ ${lab.code} 无可用跨组评审人，请教练接手（学员 ${user.name}）`);
    }
  }

  await notify(`📥 ${user.name} 提交 ${lab.code}，CI 结果：${b.result === 'yellow' ? '🟡' : '🔴'}`);
  return NextResponse.json({ ok: true, color });
}
