import { getSession, getActiveEnrollment } from '@/lib/auth';
import { getSetting, SETTING_KEYS } from '@/lib/settings';
import { prisma } from '@/lib/db';
import { CopyButton } from '@/components/CopyButton';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const repoUrl = await getSetting(SETTING_KEYS.trainingRepoUrl);
  const empId = session.empId;
  const name = session.name;
  const repoDisplay = repoUrl || '<训练仓库地址>';

  // 部门默认工具：按当前登录人 dept 精确匹配，无匹配则展示全表
  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { dept: true } });
  const dept = me?.dept || '';
  const allTools = await prisma.toolRegistry.findMany({ orderBy: { dept: 'asc' } });
  const myTool = allTools.find((t) => t.dept === dept);

  const steps = [
    {
      title: '1. 获取训练仓库代码',
      cmd: `# 方式一：标准 clone（大多数平台适用）\ngit clone ${repoDisplay}\ncd <仓库目录>\n\n# 方式二：若 clone 报空仓库（部分 Gerrit 环境），用 fetch 代替：\nmkdir camp && cd camp\ngit init\ngit fetch ${repoDisplay} main\ngit checkout FETCH_HEAD -- .`,
      note: '所有学员获取同一个共享仓库的代码。仓库地址见上方。',
    },
    {
      title: '2. 配置 git 身份',
      cmd: `git config user.name "${name}"\ngit config user.email "${empId}@公司邮箱域"`,
      note: '每个仓库只需配一次。',
    },
    {
      title: '3. 建分支（工号 = 平台认人依据，别写错）',
      cmd: `git checkout -b camp/c1-00/${empId}`,
      note: '分支名格式：camp/<关卡号>/<工号>。这一关是 c1-00。',
    },
    {
      title: '4. 进入关卡目录，创建 hello.md',
      cmd: `cd labs/c1-00-hello-camp\n# 创建 hello.md，内容三行：\n#   工号: ${empId}\n#   姓名: ${name}\n#   我最想让 AI 帮我解决的事: <一句话>`,
      note: '',
    },
    {
      title: '5. 提交并推送',
      cmd: `git add .\ngit commit -m "chore(camp): c1-00 hello"\ngit push -u origin camp/c1-00/${empId}`,
      note: '',
    },
    {
      title: '6. 回平台刷新关卡页，看判分记录',
      cmd: `# 约 1 分钟内 c1-00 变 🟡 = 成功！`,
      note: '这个闭环就是你之后每一关的提交方式。',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新手引导：从零到第一次提交</h1>
      <p className="text-sm text-slate-500">
        {session.name}（工号 {empId}），跟着下面 6 步走，约 15 分钟走通完整链路。每块命令已替换好你的工号，点右上角「复制」即可。
      </p>

      {!repoUrl && (
        <div className="bg-amber-50 text-amber-800 text-sm rounded-lg p-3">
          ⚠️ 训练仓库地址未配置，请联系营长在「管理 → 系统设置」填写。下方命令中的 <code>{'<训练仓库地址>'}</code> 需要替换为实际地址。
        </div>
      )}

      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-sm">{s.title}</h2>
              <CopyButton text={s.cmd.replace(/^#.*$/gm, '').trim()} />
            </div>
            <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap"><code>{s.cmd}</code></pre>
            {s.note && <p className="text-xs text-slate-400 mt-2">{s.note}</p>}
          </div>
        ))}
      </div>

      {/* 部门默认工具 */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-2">你所在部门的默认工具</h2>
        {myTool ? (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400"><th className="py-1">部门</th><th>默认工具</th><th>卡点备注</th></tr></thead>
            <tbody>
              <tr className="border-t border-slate-100"><td className="py-2">{myTool.dept}</td><td>{myTool.defaultTool}</td><td className="text-slate-500">{myTool.quirks || '—'}</td></tr>
            </tbody>
          </table>
        ) : (
          <>
            <p className="text-xs text-amber-600 mb-2">未找到你部门（{dept || '—'}）的登记，请联系营长补充。以下是已登记的全部部门：</p>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400"><th className="py-1">部门</th><th>默认工具</th><th>卡点备注</th></tr></thead>
              <tbody>
                {allTools.map((t) => (
                  <tr key={t.dept} className="border-t border-slate-100"><td className="py-2">{t.dept}</td><td>{t.defaultTool}</td><td className="text-slate-500">{t.quirks || '—'}</td></tr>
                ))}
                {allTools.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-slate-400">暂无登记</td></tr>}
              </tbody>
            </table>
          </>
        )}
      </section>

      <Link href="/labs/c1-00" className="block bg-slate-900 text-white rounded-lg p-4 text-center font-medium">
        去做 c1-00 →
      </Link>
    </div>
  );
}
