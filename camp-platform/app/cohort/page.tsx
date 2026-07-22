import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function CohortPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const cohort = await prisma.cohort.findFirst({ where: { status: 'RUNNING' }, include: { groups: true } });
  if (!cohort) return <p className="text-slate-500">没有进行中的一期。</p>;

  const labs = await prisma.lab.findMany({ where: { active: true }, orderBy: { code: 'asc' } });
  const attempts = await prisma.labAttempt.findMany({
    where: { enrollment: { cohortId: cohort.id } },
    include: { enrollment: true },
  });
  // 卡点热力图：组 × 关卡 的 🔴 数量（大面积红 = 教学或工具链问题）
  const redCount = (groupId: string, labCode: string) =>
    attempts.filter((a) => a.enrollment.groupId === groupId && a.labCode === labCode && a.color === 'RED').length;

  // 贡献榜：积分（评审贡献 + 资产被采纳），刻意不排“通关速度”
  const points = await prisma.pointsLedger.groupBy({
    by: ['enrollmentId'],
    _sum: { delta: true },
    orderBy: { _sum: { delta: 'desc' } },
    take: 10,
  });
  const topEnrollments = await prisma.enrollment.findMany({
    where: { id: { in: points.map((p) => p.enrollmentId) } },
    include: { user: true, group: true },
  });
  const nameOf = (id: string) => {
    const e = topEnrollments.find((x) => x.id === id);
    return e ? `${e.user.name}（${e.group.name}）` : id;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{cohort.name} · 全营看板</h1>
      <section className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
        <h2 className="font-bold mb-1">卡点热力图（🔴 数量）</h2>
        <p className="text-xs text-slate-400 mb-4">某一列大面积变红 = 该关卡的教学设计或工具链有问题，进中期迭代周议题</p>
        <table className="text-xs">
          <thead>
            <tr>
              <th className="pr-3 text-left">小组</th>
              {labs.map((l) => (<th key={l.code} className="px-1 font-normal text-slate-400" title={l.title}>{l.code.slice(0, 5)}</th>))}
            </tr>
          </thead>
          <tbody>
            {cohort.groups.map((g) => (
              <tr key={g.id}>
                <td className="pr-3 py-1 font-medium whitespace-nowrap">{g.name}</td>
                {labs.map((l) => {
                  const n = redCount(g.id, l.code);
                  const bg = n === 0 ? 'bg-slate-100' : n === 1 ? 'bg-red-200' : n === 2 ? 'bg-red-400' : 'bg-red-600';
                  return <td key={l.code} className="px-0.5 py-1"><div className={`w-6 h-5 rounded-sm ${bg} text-center text-white`}>{n || ''}</div></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-4">贡献榜（评审 + 资产被采纳，不排速度）</h2>
        <ol className="space-y-2 text-sm">
          {points.map((p, i) => (
            <li key={p.enrollmentId} className="flex justify-between border-b border-slate-100 pb-1">
              <span>{i + 1}. {nameOf(p.enrollmentId)}</span>
              <span className="font-mono text-slate-500">{p._sum.delta ?? 0} 分</span>
            </li>
          ))}
          {points.length === 0 && <li className="text-slate-400">暂无数据</li>}
        </ol>
      </section>
    </div>
  );
}
