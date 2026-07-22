import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { readLabReadme, listLabFiles } from '@/lib/content';
import { marked } from 'marked';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function LabPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { code } = await params;
  const { saved } = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'COACH', 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/admin');

  const lab = await prisma.lab.findUnique({ where: { code } });
  if (!lab) notFound();

  const isAdmin = hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN');
  const html = marked.parse(readLabReadme(lab.repoPath)) as string;
  const files = listLabFiles(lab.repoPath);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/labs" className="text-sm text-slate-500">← 题目管理</Link>
        <h1 className="text-2xl font-bold">{lab.code} · {lab.title}</h1>
      </div>

      {saved === '1' && (
        <div className="bg-emerald-50 text-emerald-700 text-sm rounded-lg p-3">
          ✅ 已写入内容目录。内容目录以 Git 为准，请尽快将改动提交回 landing-zone-camp 仓库，否则下次拉取会被覆盖。
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 md-body"
          dangerouslySetInnerHTML={{ __html: html }} />

        <aside className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5 text-sm space-y-1">
            <h3 className="font-bold mb-2">元数据</h3>
            <p>证书：<span className="text-slate-600">{lab.certLevel}</span></p>
            <p>判题：<span className="text-slate-600">{lab.verifyType}</span></p>
            <p>🟢判定：<span className="text-slate-600">{lab.greenBy}</span></p>
            <p>时长：<span className="text-slate-600">{lab.minutes}min</span></p>
            <p className="text-xs text-slate-400 break-all">repoPath: {lab.repoPath}</p>
            {lab.unlocks && Array.isArray(lab.unlocks) && lab.unlocks.length > 0 && (
              <p className="text-xs text-slate-500">解锁依赖：{(lab.unlocks as string[]).join(', ')}</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 text-sm">
            <h3 className="font-bold mb-2">文件清单</h3>
            <p className="text-xs text-slate-400 mb-1">starter/</p>
            <ul className="font-mono text-xs text-slate-600 mb-2">
              {files.starter.map((f) => <li key={f}>· {f}</li>)}
              {files.starter.length === 0 && <li className="text-slate-300">（空）</li>}
            </ul>
            <p className="text-xs text-slate-400 mb-1">.verify/</p>
            <ul className="font-mono text-xs text-slate-600">
              {files.verify.map((f) => <li key={f}>· {f}</li>)}
              {files.verify.length === 0 && <li className="text-slate-300">（空）</li>}
            </ul>
          </div>

          {isAdmin && (
            <Link href={`/admin/labs/${lab.code}/edit`}
              className="block bg-slate-900 text-white rounded-lg p-3 text-sm text-center">
              编辑 README
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
