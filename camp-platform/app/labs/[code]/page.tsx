import { prisma } from '@/lib/db';
import { getSession, getActiveEnrollment } from '@/lib/auth';
import { readLabReadme, listLabFiles } from '@/lib/content';
import { isUnlocked } from '@/lib/domain/unlock';
import { StatusBadge } from '@/components/StatusBadge';
import { CopyButton } from '@/components/CopyButton';
import { verifyTypeText, attemptStatusText } from '@/lib/ui-text';
import { getSetting, SETTING_KEYS } from '@/lib/settings';
import { marked } from 'marked';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function LabPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  const enrollment = await getActiveEnrollment(session.userId);
  const lab = await prisma.lab.findUnique({ where: { code } });
  if (!lab) notFound();

  const [attempt, attempts, allLabs] = await Promise.all([
    enrollment
      ? prisma.labAttempt.findUnique({
          where: { enrollmentId_labCode: { enrollmentId: enrollment.id, labCode: code } },
          include: { events: { orderBy: { createdAt: 'desc' }, take: 10 } },
        })
      : Promise.resolve(null),
    enrollment ? prisma.labAttempt.findMany({ where: { enrollmentId: enrollment.id } }) : Promise.resolve([]),
    prisma.lab.findMany({ where: { active: true }, orderBy: { code: 'asc' } }),
  ]);

  const colorOf = (c: string) => attempts.find((a) => a.labCode === c)?.color ?? null;
  const unlocked = isUnlocked((lab.unlocks as string[]) ?? [], colorOf);
  const html = marked.parse(readLabReadme(lab.repoPath)) as string;
  const branch = `camp/${lab.code}/${session.empId}`;
  const files = listLabFiles(lab.repoPath);
  const repoUrl = await getSetting(SETTING_KEYS.trainingRepoUrl);
  const repoDisplay = repoUrl || '<训练仓库地址>';
  const hasNoAttempts = attempts.length === 0;
  const submitCmd = `git checkout main && git pull\ngit checkout -b ${branch}\ncd ${lab.repoPath}\n# （改完产物后）\ngit add . && git commit -m "chore(camp): ${lab.code}" && git push -u origin ${branch}`;

  // 找下一未过关（按课程顺序）
  const idx = allLabs.findIndex((l) => l.code === code);
  const nextLab = allLabs.slice(idx + 1).find((l) => {
    const c = colorOf(l.code); return c !== 'YELLOW' && c !== 'GREEN';
  });

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-slate-500">← 关卡地图</Link>

      {/* 锁定横幅（仍允许预览，成年人自己安排学习顺序） */}
      {!unlocked && (lab.unlocks as string[])?.length ? (
        <div className="bg-amber-50 text-amber-800 text-sm rounded-lg p-3">
          🔒 本关需先通过：
          {(lab.unlocks as string[]).map((dep, i) => (
            <span key={dep}>
              {i > 0 && '、'}
              <Link href={`/labs/${dep}`} className="underline font-medium">{dep}</Link>
            </span>
          ))}
          。本关仍可预览，也支持 test-out 直接提交。
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 md-body"
          dangerouslySetInnerHTML={{ __html: html }} />
        <aside className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-sm mb-2">我的状态</h3>
            <StatusBadge color={attempt?.color ?? null} />
            <p className="text-xs text-slate-500 mt-2">{attemptStatusText(attempt?.status, attempt?.color ?? null)}</p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">{verifyTypeText(lab.verifyType)}</p>
          </div>

          {/* 起步材料 */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-sm mb-2">起步材料</h3>
            {files.starter.length > 0 ? (
              <ul className="font-mono text-xs text-slate-600 space-y-0.5">
                {files.starter.map((f) => <li key={f}>📄 starter/{f}</li>)}
              </ul>
            ) : <p className="text-xs text-slate-400">本关无 starter 文件</p>}
            <p className="text-xs text-slate-500 mt-3">
              本地预跑：进入关卡目录执行 <code className="bg-slate-100 px-1 rounded">sh .verify/verify.sh</code>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm">提交方式</h3>
              <CopyButton text={submitCmd} />
            </div>
            {hasNoAttempts && (
              <p className="text-xs text-amber-600 mb-2">第一次提交？先看 <Link href="/onboarding" className="underline">新手引导</Link>。</p>
            )}
            <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap mb-2"><code>{submitCmd}</code></pre>
            <p className="text-xs text-slate-500">
              CI 会自动运行本关 <code>.verify/verify.sh</code> 并回传结果。也可本地预跑：进入关卡目录执行 <code className="bg-slate-100 px-1 rounded">sh .verify/verify.sh</code>。
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-sm mb-2">判分记录</h3>
            {attempt?.events.length ? (
              <ul className="space-y-2">
                {attempt.events.map((e) => (
                  <li key={e.id} className="text-xs text-slate-600">
                    <span className="font-mono">{e.source}</span> → {e.color ?? '—'}
                    <span className="text-slate-400"> · {new Date(e.createdAt).toLocaleString('zh-CN')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">尚无提交。本地先跑通 <code>sh .verify/verify.sh</code> 再推分支，省得来回等 CI。</p>
            )}
          </div>

          {(attempt?.color === 'YELLOW' || attempt?.color === 'GREEN') && nextLab && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-xs text-slate-500">下一关</p>
              <Link href={`/labs/${nextLab.code}`} className="text-sm font-medium hover:underline">
                {nextLab.code} {nextLab.title} →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
