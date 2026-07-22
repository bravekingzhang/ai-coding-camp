import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** Git 平台 push webhook：分支 camp/<lab>/<empId> → 标记 SUBMITTED（真正定色靠 CI 回调） */
export async function POST(req: NextRequest) {
  if (req.headers.get('x-gitlab-token') !== process.env.GIT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as { ref?: string };
  const m = /refs\/heads\/camp\/([a-z0-9-]+)\/(\w+)/.exec(body.ref || '');
  if (!m) return NextResponse.json({ ok: true, skipped: true });
  const [, labCode, empId] = m;

  const user = await prisma.user.findUnique({ where: { empId } });
  const lab = await prisma.lab.findUnique({ where: { code: labCode } });
  if (!user || !lab) return NextResponse.json({ ok: true, skipped: true });
  const enrollment = await prisma.enrollment.findFirst({ where: { userId: user.id, cohort: { status: 'RUNNING' } } });
  if (!enrollment) return NextResponse.json({ ok: true, skipped: true });

  await prisma.labAttempt.upsert({
    where: { enrollmentId_labCode: { enrollmentId: enrollment.id, labCode } },
    create: { enrollmentId: enrollment.id, labCode, status: 'SUBMITTED', branch: `camp/${labCode}/${empId}` },
    update: { status: 'SUBMITTED' },
  });
  return NextResponse.json({ ok: true });
}
