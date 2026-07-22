import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { buildBranchUrl } from '@/lib/repo-link';
import Link from 'next/link';

export default async function LearnerDetailPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'COACH', 'REVIEW_BOARD', 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/');

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { user: { include: { roles: true } }, group: true, cohort: true },
  });
  if (!enrollment) notFound();

  const [attempts, reviewsGiven, reviewsReceived, assets] = await Promise.all([
    prisma.labAttempt.findMany({
      where: { enrollmentId },
      include: { lab: true, events: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { labCode: 'asc' },
    }),
    prisma.reviewAssignment.count({ where: { authorId: enrollmentId, status: 'SUBMITTED' } }),
    prisma.reviewAssignment.count({ where: { reviewerId: enrollmentId, status: 'SUBMITTED' } }),
    prisma.assetContribution.count({ where: { enrollmentId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/coach" className="text-sm text-slate-500">← 教练台</Link>
        <h1 className="text-2xl font-bold">{enrollment.user.name}</h1>
        <span className="text-sm text-slate-500">
          {enrollment.user.empId} · {enrollment.cohort.name} · {enrollment.group.name}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold">{attempts.filter((a) => a.color === 'YELLOW' || a.color === 'GREEN').length}</div>
          <div className="text-xs text-slate-400">已通关</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold">{reviewsGiven}</div>
          <div className="text-xs text-slate-400">收到的评审</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold">{assets}</div>
          <div className="text-xs text-slate-400">资产数</div>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-4">通关明细</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="py-2">关卡</th><th>标题</th><th>状态</th><th>分支</th><th>最近事件</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map(async (a) => {
              const fullBranch = a.branch || `camp/${a.labCode}/${enrollment.user.empId}`;
              const branchUrl = await buildBranchUrl(fullBranch, a.lab.repoPath);
              return (
              <tr key={a.id} className="border-b border-slate-50">
                <td className="py-2 font-mono">{a.labCode}</td>
                <td className="py-2">{a.lab.title}</td>
                <td className="py-2"><StatusBadge color={a.color} /></td>
                <td className="py-2 font-mono text-xs text-slate-500">
                  {branchUrl ? <a href={branchUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">{fullBranch} ↗</a> : fullBranch || '—'}
                </td>
                <td className="py-2 text-xs text-slate-400">
                  {a.events[0] ? `${a.events[0].source}→${a.events[0].color ?? '—'} ${new Date(a.events[0].createdAt).toLocaleDateString('zh-CN')}` : '—'}
                </td>
              </tr>
              );
            })}
            {attempts.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-slate-400">该学员尚未提交任何关卡。</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 text-sm">
        <h2 className="font-bold mb-3">协作与资产</h2>
        <p>给出评审 {reviewsReceived} 次 · 收到评审 {reviewsGiven} 次 · 产出资产 {assets} 个</p>
        <p className="text-xs text-slate-400 mt-2">画像：{enrollment.persona || '未定'} · 角色：{enrollment.user.roles.map((r) => r.role).join(', ') || '无'}</p>
      </section>
    </div>
  );
}
