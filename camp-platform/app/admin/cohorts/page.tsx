import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createCohort, setCohortStatus, createGroup, setGroupLeader } from './actions';
import { cohortStatusText } from '@/lib/ui-text';
import Link from 'next/link';
import type { CohortStatus } from '@prisma/client';

const STATUS_STYLE: Record<CohortStatus, string> = {
  PLANNING: 'bg-slate-100 text-slate-600',
  RUNNING: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-400',
};

export default async function CohortsAdminPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/admin');

  const cohorts = await prisma.cohort.findMany({
    orderBy: { startsAt: 'desc' },
    include: { groups: { include: { _count: { select: { members: true } } }, orderBy: { name: 'asc' } } },
  });
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { empId: 'asc' },
    select: { id: true, empId: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-slate-500">管理</Link>
        <span className="text-slate-300">›</span>
        <span className="font-bold text-2xl">期次与小组</span>
      </div>

      <section className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-3">新建期次</h2>
        <form action={createCohort} className="flex flex-wrap gap-2 text-sm">
          <input name="name" placeholder="期次名称（如：第 2 期）" className="border rounded px-3 py-1.5 flex-1" required />
          <input name="startsAt" type="date" className="border rounded px-3 py-1.5" required />
          <input name="weeks" type="number" defaultValue={12} min={1} max={24} className="border rounded px-3 py-1.5 w-20" />
          <span className="text-slate-400 self-center text-xs">周</span>
          <button className="bg-slate-900 text-white rounded px-4">创建</button>
        </form>
      </section>

      {cohorts.map((c) => (
        <section key={c.id} className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold">{c.name}</h2>
                <span className={`text-xs rounded px-2 py-0.5 ${STATUS_STYLE[c.status]}`}>{cohortStatusText(c.status)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                开营 {new Date(c.startsAt).toLocaleDateString('zh-CN')} · {c.weeks} 周 · {c.groups.length} 个小组
              </p>
            </div>
            <div className="flex gap-2">
              {(['PLANNING', 'RUNNING', 'CLOSED'] as CohortStatus[]).map((s) => (
                <form key={s} action={setCohortStatus}>
                  <input type="hidden" name="cohortId" value={c.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    disabled={c.status === s}
                    className={`text-xs rounded px-2 py-1 border disabled:opacity-30 ${
                      s === 'RUNNING' ? 'border-emerald-300 text-emerald-700' : s === 'CLOSED' ? 'border-slate-200 text-slate-400' : 'border-slate-300'
                    }`}
                  >
                    设为{cohortStatusText(s)}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {c.groups.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-2 text-sm border-t border-slate-50 pt-2">
                <span className="font-medium">{g.name}</span>
                <span className="text-xs text-slate-400">{g._count.members} 人</span>
                <form action={setGroupLeader} className="flex items-center gap-1 ml-auto">
                  <input type="hidden" name="groupId" value={g.id} />
                  <select name="leaderId" defaultValue={g.leaderId || ''} className="border rounded px-1 py-0.5 text-xs">
                    <option value="">指定组长…</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.empId} {u.name}</option>)}
                  </select>
                  <button className="text-slate-400 hover:text-slate-700 underline text-xs">设定</button>
                </form>
              </div>
            ))}
            {c.groups.length === 0 && <p className="text-xs text-slate-400">暂无小组，在下方新建。</p>}
          </div>

          <form action={createGroup} className="flex gap-2 text-sm">
            <input type="hidden" name="cohortId" value={c.id} />
            <input name="name" placeholder="新建小组名称（如：小组7）" className="border rounded px-3 py-1.5 flex-1" required />
            <button className="bg-slate-900 text-white rounded px-4 text-sm">加小组</button>
          </form>
        </section>
      ))}
      {cohorts.length === 0 && (
        <p className="text-center text-slate-400 py-12">暂无期次。在上方创建第一期。</p>
      )}
    </div>
  );
}
