import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { calibrate } from './actions';
import { buildBranchUrl } from '@/lib/repo-link';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CoachPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'COACH', 'REVIEW_BOARD', 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/');

  const queue = await prisma.rubricEvaluation.findMany({
    where: { sampled: true, coachColor: null },
    include: { attempt: { include: { enrollment: { include: { user: true } }, lab: true } } },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const risky = await prisma.enrollment.findMany({
    where: {
      cohort: { status: 'RUNNING' },
      // 防御：只看学员，排除不含 LEARNER 角色的用户（如教练/管理员误入组）
      user: { roles: { some: { role: 'LEARNER' } } },
      attempts: { none: { updatedAt: { gte: threeDaysAgo } } },
    },
    include: { user: true, group: true },
    take: 20,
  });
  const disputes = await prisma.rubricEvaluation.count({ where: { dispute: true } });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">教练台</h1>
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-1">LLM 判分校准队列（20% 抽样）</h2>
        <p className="text-xs text-slate-400 mb-4">人机不一致会自动标记为争议（累计 {disputes} 条），进每周 rubric 修订会</p>
        <div className="space-y-3">
          {queue.map(async (q) => {
            const empId = q.attempt.enrollment.user.empId;
            const branch = `camp/${q.attempt.lab.code}/${empId}`;
            const productUrl = await buildBranchUrl(branch, q.attempt.lab.repoPath);
            return (
              <form key={q.id} action={calibrate} className="border rounded-lg p-3 flex items-center gap-4 text-sm">
                <input type="hidden" name="id" value={q.id} />
                <div className="flex-1">
                  <div className="font-medium">{q.attempt.lab.code} {q.attempt.lab.title}</div>
                  <div className="text-xs text-slate-500">
                    学员：<Link href={`/coach/learners/${q.attempt.enrollment.id}`} className="underline hover:text-slate-700">{q.attempt.enrollment.user.name}</Link> · LLM 预评：{q.preColor}（{(q.scores as { score?: number })?.score ?? '—'} 分）· rubric: {q.rubricPath}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    分支：{branch}
                    {productUrl && <a href={productUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-slate-500 underline hover:text-slate-700 font-sans">打开产物 ↗</a>}
                  </div>
                </div>
                <select name="coachColor" className="border rounded px-2 py-1 text-sm" defaultValue={q.preColor}>
                  <option value="RED">🔴 RED</option><option value="YELLOW">🟡 YELLOW</option><option value="GREEN">🟢 GREEN</option>
                </select>
                <button className="bg-slate-900 text-white rounded px-3 py-1.5 text-xs">复核</button>
              </form>
            );
          })}
          {queue.length === 0 && <p className="text-slate-400 text-sm">队列为空。</p>}
        </div>
      </section>
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-1">风险名单（3 天无任何提交）</h2>
        <p className="text-xs text-slate-400 mb-4">优先关注画像为「观望者」的学员，建议本周 office hours 主动约谈</p>
        <ul className="text-sm space-y-1">
          {risky.map((e) => (
            <li key={e.id}>
              <Link href={`/coach/learners/${e.id}`} className="underline hover:text-slate-700">{e.user.name}</Link>
              （{e.group.name}）{e.persona === 'OBSERVER' ? '· ⚠️ 观望者' : ''}
            </li>
          ))}
          {risky.length === 0 && <li className="text-slate-400">全员活跃 🎉</li>}
        </ul>
      </section>
    </div>
  );
}
