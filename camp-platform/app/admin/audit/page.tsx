import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const ACTION_TEXT: Record<string, string> = {
  SYNC: '课程同步',
  'settings.update': '系统设置更新',
  'tool.create': '新增工具登记', 'tool.update': '编辑工具登记', 'tool.delete': '删除工具登记',
  'user.create': '新增学员', 'user.update': '编辑学员', 'user.enable': '启用学员', 'user.disable': '停用学员',
  'user.delete': '删除学员', DELETE_USER: '删除学员', FORCE_DELETE_USER: '强制删除学员',
  'password.reset': '重置密码',
  'role.add': '授予角色', 'role.remove': '移除角色', 'role.save': '保存角色',
  enroll: '编入期次', 'enroll.move': '调组',
  'cohort.create': '创建期次', 'cohort.status': '改期次状态',
  'group.create': '新建小组', 'group.leader': '指定组长',
  'lab.enable': '启用关卡', 'lab.disable': '停用关卡', 'lab.edit': '编辑关卡',
  CLEAN_DEMO: '清除演示数据',
};

function actionText(a: string) {
  return ACTION_TEXT[a] || a;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/admin');
  const { action } = await searchParams;

  const logs = await prisma.auditLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { at: 'desc' },
    take: 200,
  });
  // 操作人姓名（批量查）
  const actorIds = Array.from(new Set(logs.map((l) => l.actorId)));
  const actors = await prisma.user.findMany({ where: { empId: { in: actorIds } }, select: { empId: true, name: true } });
  const actorName = (id: string) => {
    const a = actors.find((x) => x.empId === id);
    return a ? `${a.name}（${a.empId}）` : id;
  };

  const actionTypes = Array.from(new Set(Object.keys(ACTION_TEXT)));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-slate-500">管理</Link>
        <span className="text-slate-300">›</span>
        <span className="font-bold text-2xl">审计日志</span>
      </div>
      <form className="flex gap-2 text-sm items-center">
        <span className="text-slate-500">按动作筛选：</span>
        <select name="action" defaultValue={action || ''} className="border rounded px-3 py-1.5">
          <option value="">全部</option>
          {actionTypes.map((a) => <option key={a} value={a}>{actionText(a)}</option>)}
        </select>
        <button className="bg-slate-900 text-white rounded px-4">筛选</button>
      </form>
      <section className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="p-3">时间</th><th>操作人</th><th>动作</th><th>对象</th><th>摘要</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-slate-50 align-top">
                <td className="p-3 text-xs text-slate-400 whitespace-nowrap">{new Date(l.at).toLocaleString('zh-CN')}</td>
                <td className="py-2 text-xs">{actorName(l.actorId)}</td>
                <td className="py-2 text-xs">{actionText(l.action)}</td>
                <td className="py-2 text-xs font-mono text-slate-500">{l.target}</td>
                <td className="py-2 text-xs text-slate-400 max-w-md break-all">{l.diff ? JSON.stringify(l.diff) : '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">暂无记录。有操作后会在此显示。</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
