import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { readLabReadme } from '@/lib/content';
import { saveLabReadme } from '../../actions';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function LabEditPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/admin');

  const lab = await prisma.lab.findUnique({ where: { code } });
  if (!lab) notFound();

  const text = readLabReadme(lab.repoPath);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/admin/labs/${lab.code}`} className="text-sm text-slate-500">← 返回预览</Link>
        <h1 className="text-2xl font-bold">编辑 {lab.code}</h1>
      </div>

      <div className="bg-amber-50 text-amber-800 text-sm rounded-lg p-3">
        ⚠️ 直接写入内容目录的 README.md。内容目录以 Git 为准，保存后请尽快提交回 landing-zone-camp 仓库，否则下次拉取会被覆盖。
      </div>

      <form action={saveLabReadme} className="space-y-3">
        <input type="hidden" name="code" value={lab.code} />
        <input type="hidden" name="repoPath" value={lab.repoPath} />
        <textarea
          name="text"
          defaultValue={text}
          rows={32}
          className="w-full border rounded-lg p-4 font-mono text-sm bg-slate-50"
          spellCheck={false}
        />
        <div className="flex gap-2">
          <button className="bg-slate-900 text-white rounded-lg px-6 py-2 text-sm">保存</button>
          <Link href={`/admin/labs/${lab.code}`} className="border rounded-lg px-6 py-2 text-sm text-slate-600">取消</Link>
        </div>
      </form>
    </div>
  );
}
