import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { roleText } from '@/lib/ui-text';
import { Flash } from '@/components/FlashBanner';
import { BulkImportForm } from '@/components/BulkImportForm';
import { CreateUserForm } from '@/components/CreateUserForm';
import { createUser, bulkImportUsers } from './actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Role } from '@prisma/client';

const PAGE_SIZE = 50;

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; role?: string; page?: string; msg?: string; err?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/admin');

  const { q, dept, role, page: pageStr, msg, err } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const where = {
    ...(q ? { OR: [{ empId: { contains: q } }, { name: { contains: q } }] } : {}),
    ...(dept ? { dept: { contains: dept } } : {}),
    ...(role === 'learner' ? { roles: { some: { role: 'LEARNER' as Role } } } : {}),
    ...(role === 'staff' ? { NOT: { roles: { some: { role: 'LEARNER' as Role } } } } : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, orderBy: { empId: 'asc' },
      skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: {
        roles: true,
        enrollments: { where: { cohort: { status: 'RUNNING' } }, include: { group: true, cohort: true } },
      },
    }),
  ]);
  const depts = await prisma.user.findMany({ distinct: ['dept'], select: { dept: true } });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-slate-500">管理</Link>
        <span className="text-slate-300">›</span>
        <span className="font-bold text-2xl">学员管理</span>
      </div>

      <Flash msg={msg} err={err} basePath="/admin/users" />

      {/* 新增学员 */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-3">新增学员</h2>
        <CreateUserForm action={createUser} />
      </section>

      {/* 批量导入 */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-3">批量导入（每行：工号,姓名,部门[,初始密码]）</h2>
        <BulkImportForm action={bulkImportUsers} />
      </section>

      {/* 工具条：搜索 + 筛选 */}
      <form className="flex gap-2 text-sm bg-white rounded-xl shadow-sm p-4 flex-wrap items-center">
        <input name="q" defaultValue={q} placeholder="按工号或姓名搜索" className="border rounded px-3 py-1.5 flex-1" />
        <select name="dept" defaultValue={dept || ''} className="border rounded px-3 py-1.5">
          <option value="">全部部门</option>
          {depts.map((d) => <option key={d.dept} value={d.dept}>{d.dept}</option>)}
        </select>
        <select name="role" defaultValue={role || ''} className="border rounded px-3 py-1.5">
          <option value="">全部角色</option>
          <option value="learner">仅学员</option>
          <option value="staff">仅教练及以上</option>
        </select>
        <button className="bg-slate-900 text-white rounded px-4">筛选</button>
      </form>

      {/* 列表 */}
      <section className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="p-3">工号</th><th>姓名</th><th>部门</th>
              <th>角色</th><th>期次·小组</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const enroll = u.enrollments[0];
              const isLearner = u.roles.some((r) => r.role === 'LEARNER');
              return (
                <tr key={u.id} className="border-b border-slate-50 align-top">
                  <td className="p-3 font-mono">{u.empId}</td>
                  <td className="py-3">{u.name}</td>
                  <td className="py-3 text-slate-600">{u.dept}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 && <span className="text-xs text-slate-300">无</span>}
                      {u.roles.map((r) => (
                        <span key={r.role} className="text-xs rounded px-1.5 py-0.5 bg-slate-100 text-slate-600">{roleText(r.role)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-xs text-slate-600">
                    {isLearner && enroll ? `${enroll.cohort.name} · ${enroll.group.name}` : '—'}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs rounded px-2 py-0.5 ${u.active ? 'text-green-700 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
                      {u.active ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="py-3">
                    <Link href={`/admin/users/${u.id}`} className="text-slate-600 hover:text-slate-900 underline text-xs">详情</Link>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">没有匹配的学员。可调整筛选条件，或在上方新增。</td></tr>
            )}
          </tbody>
        </table>
        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/admin/users?${new URLSearchParams({ q: q || '', dept: dept || '', role: role || '', page: String(p) }).toString()}`}
                className={`px-2 py-0.5 rounded ${p === page ? 'bg-slate-900 text-white' : 'border'}`}
              >{p}</Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
