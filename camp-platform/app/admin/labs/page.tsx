import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { runSync } from '../actions';
import { toggleLabActive } from './actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const VERIFY_LABEL: Record<string, string> = {
  CI: 'CI', LLM: 'LLM', HYBRID: '混合', PEER: '互评', MANUAL: '人工',
};

export default async function LabsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ cert?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'COACH', 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/admin');

  const { cert } = await searchParams;
  const labs = await prisma.lab.findMany({
    where: cert ? { certLevel: cert as 'C1' | 'C2' | 'C3' | 'C4' } : undefined,
    orderBy: { code: 'asc' },
  });
  const lastSync = await prisma.curriculumSync.findFirst({ orderBy: { syncedAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-slate-500">← 管理首页</Link>
        <h1 className="text-2xl font-bold">题目管理</h1>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 text-sm">
          <Link href="/admin/labs" className={`px-3 py-1.5 rounded border ${!cert ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}>全部</Link>
          {['C1', 'C2', 'C3', 'C4'].map((c) => (
            <Link key={c} href={`/admin/labs?cert=${c}`} className={`px-3 py-1.5 rounded border ${cert === c ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200'}`}>{c}</Link>
          ))}
        </div>
        <form action={runSync}>
          <button className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">立即同步 curriculum.yaml</button>
        </form>
      </div>

      <p className="text-xs text-slate-500">
        共 {labs.length} 关 · 上次同步 {lastSync ? new Date(lastSync.syncedAt).toLocaleString('zh-CN') : '从未'}（commit: {lastSync?.gitCommit ?? '—'}）
      </p>

      <section className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="p-3">关卡号</th><th>标题</th><th>证书</th><th>判题</th>
              <th>🟢判定</th><th>时长</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {labs.map((lab) => (
              <tr key={lab.code} className={`border-b border-slate-50 ${!lab.active ? 'opacity-50' : ''}`}>
                <td className="p-3 font-mono">{lab.code}</td>
                <td className="py-3">{lab.title}</td>
                <td className="py-3">{lab.certLevel}</td>
                <td className="py-3 text-slate-600">{VERIFY_LABEL[lab.verifyType] || lab.verifyType}</td>
                <td className="py-3 text-slate-600 text-xs">{lab.greenBy}</td>
                <td className="py-3 text-slate-600">{lab.minutes}min</td>
                <td className="py-3">
                  <span className={`text-xs rounded px-2 py-0.5 ${lab.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                    {lab.active ? '启用' : '停用'}
                  </span>
                </td>
                <td className="py-3 whitespace-nowrap">
                  <Link href={`/admin/labs/${lab.code}`} className="text-slate-600 hover:text-slate-900 underline mr-3">预览</Link>
                  <form action={toggleLabActive} className="inline">
                    <input type="hidden" name="code" value={lab.code} />
                    <button className="text-slate-400 hover:text-slate-700 underline text-xs">{lab.active ? '停用' : '启用'}</button>
                  </form>
                </td>
              </tr>
            ))}
            {labs.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-slate-400">没有题目。请点击右上角同步 curriculum.yaml。</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
