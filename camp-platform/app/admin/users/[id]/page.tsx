import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { hasTraces } from '@/lib/user-traces';
import { roleText } from '@/lib/ui-text';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  updateProfile, saveRoles, enrollToCohort, moveGroup,
  resetPassword, toggleActive, deleteUser,
} from './actions';
import { ResetPasswordCard } from './reset-card';
import { DangerDelete } from './danger-delete';

const ALL_ROLES = ['LEARNER', 'GROUP_LEADER', 'COACH', 'REVIEW_BOARD', 'CAMP_ADMIN', 'PLATFORM_ADMIN'] as const;

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/admin');
  const isPlatformAdmin = hasRole(session, 'PLATFORM_ADMIN');

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: true,
      enrollments: { include: { group: true, cohort: true } },
    },
  });
  if (!user) notFound();

  const runningCohort = await prisma.cohort.findFirst({
    where: { status: 'RUNNING' },
    include: { groups: { orderBy: { name: 'asc' } } },
  });
  const enroll = user.enrollments.find((e) => e.cohort.status === 'RUNNING');
  const isSelf = user.id === session.userId;
  const isLearner = user.roles.some((r) => r.role === 'LEARNER');
  const traced = await hasTraces(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-slate-500">管理</Link>
        <span className="text-slate-300">›</span>
        <Link href="/admin/users" className="text-slate-500">学员管理</Link>
        <span className="text-slate-300">›</span>
        <span className="font-bold text-2xl">{user.name}</span>
      </div>

      {/* 1. 基本信息 */}
      <section className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-bold text-sm mb-3">基本信息</h2>
        <form action={updateProfile} className="grid grid-cols-3 gap-3 text-sm items-end">
          <input type="hidden" name="userId" value={user.id} />
          <div><label className="block text-xs text-slate-400 mb-1">工号（只读）</label><input value={user.empId} disabled className="w-full border rounded px-2 py-1.5 bg-slate-50" /></div>
          <div><label className="block text-xs text-slate-400 mb-1">姓名</label><input name="name" defaultValue={user.name} className="w-full border rounded px-2 py-1.5" required /></div>
          <div><label className="block text-xs text-slate-400 mb-1">部门</label><input name="dept" defaultValue={user.dept} className="w-full border rounded px-2 py-1.5" required /></div>
          <div className="col-span-3"><button className="bg-slate-900 text-white rounded px-4 py-1.5">保存</button></div>
        </form>
      </section>

      {/* 2. 角色管理 */}
      <section className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-bold text-sm mb-3">角色管理</h2>
        <form action={saveRoles} className="space-y-2 text-sm">
          <input type="hidden" name="userId" value={user.id} />
          <div className="flex flex-wrap gap-4">
            {ALL_ROLES.map((r) => {
              const checked = user.roles.some((x) => x.role === r);
              const locked = isSelf && (r === 'CAMP_ADMIN' || r === 'PLATFORM_ADMIN');
              return (
                <label key={r} className={`flex gap-1.5 items-center ${locked ? 'text-slate-400' : ''}`}>
                  <input type="checkbox" name={`role_${r}`} defaultChecked={checked} disabled={locked} />
                  {roleText(r)}{locked && <span className="text-xs text-slate-300">（不可移除自己的）</span>}
                </label>
              );
            })}
          </div>
          <button className="bg-slate-900 text-white rounded px-4 py-1.5">保存角色</button>
        </form>
      </section>

      {/* 3. 入营与小组 */}
      <details open={isLearner} className="bg-white rounded-xl shadow-sm p-5">
        <summary className="font-bold text-sm cursor-pointer">入营与小组{!isLearner && <span className="text-xs text-slate-400 ml-2">（此用户无学员角色，操作名为"以学员身份入营"）</span>}</summary>
        <div className="mt-3 text-sm space-y-3">
          {enroll ? (
            <>
              <p>当前：<strong>{enroll.cohort.name} · {enroll.group.name}</strong></p>
              <form action={moveGroup} className="flex gap-2 items-center">
                <input type="hidden" name="enrollmentId" value={enroll.id} />
                <input type="hidden" name="userId" value={user.id} />
                <select name="groupId" defaultValue={enroll.groupId} className="border rounded px-2 py-1.5">
                  {runningCohort?.groups.filter((g) => g.id !== enroll.groupId).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <button className="bg-slate-900 text-white rounded px-3 py-1.5">调组</button>
              </form>
            </>
          ) : runningCohort ? (
            <form action={enrollToCohort} className="flex gap-2 items-center">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="cohortId" value={runningCohort.id} />
              <select name="groupId" className="border rounded px-2 py-1.5" required>
                <option value="">选择小组…</option>
                {runningCohort.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <button className="bg-slate-900 text-white rounded px-3 py-1.5">{isLearner ? '编入本期' : '以学员身份入营'}</button>
            </form>
          ) : (
            <p className="text-slate-400">暂无进行中的期次，请先去「期次与小组」创建。</p>
          )}
        </div>
      </details>

      {/* 4. 账号安全 */}
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-sm">账号安全</h2>
        <ResetPasswordCard userId={user.id} action={resetPassword} />
        <form action={toggleActive}>
          <input type="hidden" name="userId" value={user.id} />
          <button disabled={isSelf} className={`rounded px-3 py-1.5 text-sm disabled:opacity-40 ${user.active ? 'border border-red-200 text-red-600' : 'bg-slate-900 text-white'}`}>
            {isSelf ? '不能停用自己' : user.active ? '停用账号' : '启用账号'}
          </button>
        </form>
      </section>

      {/* 5. 危险区 */}
      <section className="bg-red-50 border border-red-200 rounded-xl p-5">
        <h2 className="font-bold text-sm text-red-700">危险操作</h2>
        <DangerDelete userId={user.id} empId={user.empId} hasTraces={traced} isPlatformAdmin={isPlatformAdmin} action={deleteUser} />
      </section>
    </div>
  );
}
