import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { editTool } from '../../actions';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ToolEditPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/admin');
  const decodedDept = decodeURIComponent(dept);
  const tool = await prisma.toolRegistry.findUnique({ where: { dept: decodedDept } });
  if (!tool) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-slate-500">管理</Link>
        <span className="text-slate-300">›</span>
        <Link href="/admin" className="text-slate-500">部门工具</Link>
        <span className="text-slate-300">›</span>
        <span className="font-bold text-2xl">{tool.dept}</span>
      </div>
      <section className="bg-white rounded-xl shadow-sm p-6">
        <form action={editTool} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs text-slate-500 mb-1">部门（只读）</label>
            <input name="dept" value={tool.dept} readOnly className="w-full border rounded px-3 py-1.5 bg-slate-50" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">默认工具</label>
            <input name="defaultTool" defaultValue={tool.defaultTool} className="w-full border rounded px-3 py-1.5" required />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">加载 Skill/Rules 卡点备注</label>
            <input name="quirks" defaultValue={tool.quirks || ''} className="w-full border rounded px-3 py-1.5" />
          </div>
          <button className="bg-slate-900 text-white rounded px-4 py-1.5">保存</button>
          <Link href="/admin" className="ml-2 text-slate-500 underline">取消</Link>
        </form>
      </section>
    </div>
  );
}
