import { prisma } from '@/lib/db';
import { getSession, getActiveEnrollment } from '@/lib/auth';
import { submitReview } from './actions';
import { buildBranchUrl } from '@/lib/repo-link';
import { Flash } from '@/components/FlashBanner';
import { redirect } from 'next/navigation';

type LabInfo = { code: string; title: string; repoPath: string; authorEmpId: string } | null;

/** 解析 artifactRef → 关卡信息 + 作者工号（用于构造分支名）。 */
async function resolveArtifact(artifactRef: string, authorUserId: string): Promise<LabInfo> {
  // artifactRef 可能是 labCode 或 attempt id
  const [lab, attempt, author] = await Promise.all([
    prisma.lab.findUnique({ where: { code: artifactRef } }),
    prisma.labAttempt.findUnique({ where: { id: artifactRef }, include: { lab: true } }),
    prisma.user.findUnique({ where: { id: authorUserId }, select: { empId: true } }),
  ]);
  if (attempt) return { code: attempt.lab.code, title: attempt.lab.title, repoPath: attempt.lab.repoPath, authorEmpId: author?.empId || '' };
  if (lab) return { code: lab.code, title: lab.title, repoPath: lab.repoPath, authorEmpId: author?.empId || '' };
  return null;
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  const { msg, err } = await searchParams;
  const enrollment = await getActiveEnrollment(session.userId);
  if (!enrollment) {
    return <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-500">未在营中。<p className="text-sm text-slate-400 mt-2">请联系营长将你编入期次。</p></div>;
  }

  const [pending, done, received] = await Promise.all([
    prisma.reviewAssignment.findMany({
      where: { reviewerId: enrollment.id, status: 'PENDING' },
      include: { author: { include: { user: true, group: true } } },
      orderBy: { dueAt: 'asc' },
    }),
    prisma.reviewAssignment.count({ where: { reviewerId: enrollment.id, status: 'SUBMITTED' } }),
    prisma.reviewAssignment.findMany({
      where: { authorId: enrollment.id, status: 'SUBMITTED' },
      include: { reviewer: { include: { user: true, group: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // 解析所有待评审产物的关卡信息
  const pendingInfo = await Promise.all(
    pending.map((r) => resolveArtifact(r.artifactRef, r.author.userId)),
  );

  return (
    <div className="space-y-8">
      <Flash msg={msg} err={err} basePath="/reviews" />
      <header>
        <h1 className="text-2xl font-bold">我的评审</h1>
        <p className="text-sm text-slate-500 mt-1">已完成 {done} 次跨组评审（C2 毕业要求 ≥2 次）</p>
      </header>

      <section className="space-y-4">
        <h2 className="font-bold text-sm text-slate-600">待我评审（{pending.length}）</h2>
        {pending.length === 0 && (
          <p className="text-slate-400 text-sm bg-white rounded-xl shadow-sm p-6">暂无待评审任务。系统会在别组学员提交 Spec/项目时自动指派给你。先去通关其他关卡吧。</p>
        )}
        {pending.map(async (r, i) => {
          const info = pendingInfo[i];
          const branch = info ? `camp/${info.code}/${info.authorEmpId}` : '';
          const productUrl = info ? await buildBranchUrl(branch, info.repoPath) : null;
          return (
            <form key={r.id} action={submitReview} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <input type="hidden" name="id" value={r.id} />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">
                    {info ? `${info.code} ${info.title}` : `${r.artifactType} · ${r.artifactRef}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    作者：{r.author.user.name}（{r.author.group.name}，跨组）· 截止 {new Date(r.dueAt).toLocaleDateString('zh-CN')}
                  </p>
                  {branch && <p className="text-xs text-slate-400 font-mono">分支：{branch}</p>}
                  {info && <p className="text-xs text-slate-400">重点看 {info.repoPath} 目录下的产物文件</p>}
                </div>
                {productUrl ? (
                  <a href={productUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-1 hover:bg-slate-200 whitespace-nowrap">打开产物 ↗</a>
                ) : branch ? (
                  <span className="text-xs text-slate-400 max-w-[200px] text-right">网页地址未配置，本地执行<br /><code className="font-mono">git checkout {branch}</code></span>
                ) : null}
              </div>
              <fieldset className="grid grid-cols-2 gap-2 text-sm">
                <label className="flex gap-2 items-center"><input type="checkbox" name="specTestable" />验收条件可测</label>
                <label className="flex gap-2 items-center"><input type="checkbox" name="exceptionsCovered" />异常流已覆盖</label>
                <label className="flex gap-2 items-center"><input type="checkbox" name="nonFunctional" />非功能需求完整</label>
                <label className="flex gap-2 items-center"><input type="checkbox" name="rollbackConsidered" />回滚已考虑</label>
              </fieldset>
              <div className="flex gap-3 items-center text-sm">
                <span>结论：</span>
                <label className="flex gap-1 items-center"><input type="radio" name="verdict" value="YELLOW" defaultChecked />🟡 通过</label>
                <label className="flex gap-1 items-center"><input type="radio" name="verdict" value="RED" />🔴 打回</label>
              </div>
              <textarea name="comments" placeholder="必填：至少写出 2 条具体改进建议（评审质量会被教练抽评计分）" className="w-full border rounded-lg p-2 text-sm" rows={3} required />
              <button className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">提交评审</button>
            </form>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-sm text-slate-600">我收到的评审（{received.length}）</h2>
        {received.length === 0 && (
          <p className="text-slate-400 text-sm bg-white rounded-xl shadow-sm p-6">还没有收到评审。当你提交 Spec/项目并被跨组指派后，评审意见会出现在这里。</p>
        )}
        {received.map((r) => {
          const form = r.formJson as { specTestable?: boolean; exceptionsCovered?: boolean; nonFunctional?: boolean; rollbackConsidered?: boolean; verdict?: string; comments?: string } | null;
          return (
            <div key={r.id} className="bg-white rounded-xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">{r.artifactType} · {r.artifactRef}</h3>
                <span className={`text-xs rounded px-2 py-0.5 ${form?.verdict === 'YELLOW' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                  {form?.verdict === 'YELLOW' ? '🟡 通过' : '🔴 打回'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                评审人：{r.reviewer.user.name}（{r.reviewer.group.name}）· {new Date(r.createdAt).toLocaleString('zh-CN')}
              </p>
              {form && (
                <div className="flex gap-2 flex-wrap text-xs">
                  {form.specTestable && <span className="bg-slate-100 rounded px-1.5 py-0.5">验收可测</span>}
                  {form.exceptionsCovered && <span className="bg-slate-100 rounded px-1.5 py-0.5">异常流覆盖</span>}
                  {form.nonFunctional && <span className="bg-slate-100 rounded px-1.5 py-0.5">非功能完整</span>}
                  {form.rollbackConsidered && <span className="bg-slate-100 rounded px-1.5 py-0.5">回滚已考虑</span>}
                </div>
              )}
              {form?.comments && <p className="text-sm text-slate-700 bg-slate-50 rounded p-3">{form.comments}</p>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
