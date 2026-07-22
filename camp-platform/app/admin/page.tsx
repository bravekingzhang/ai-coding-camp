import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { runSync, upsertTool, editTool, deleteTool } from './actions';
import { saveSettings } from './settings/actions';
import { cleanDemoData } from './demo-clean/actions';
import { getSetting, SETTING_KEYS, DEFAULT_BRANCH_TEMPLATE } from '@/lib/settings';
import { Flash } from '@/components/FlashBanner';
import { ConfirmButton } from '@/components/ConfirmButton';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/');
  const { msg, err } = await searchParams;

  const lastSync = await prisma.curriculumSync.findFirst({ orderBy: { syncedAt: 'desc' } });
  const labCount = await prisma.lab.count({ where: { active: true } });
  const tools = await prisma.toolRegistry.findMany({ orderBy: { dept: 'asc' } });
  const userCount = await prisma.user.count();
  const [trainingRepoUrl, trainingRepoWebUrl, repoBranchUrlTemplate] = await Promise.all([
    getSetting(SETTING_KEYS.trainingRepoUrl),
    getSetting(SETTING_KEYS.trainingRepoWebUrl),
    getSetting(SETTING_KEYS.repoBranchUrlTemplate, DEFAULT_BRANCH_TEMPLATE),
  ]);
  const runningCohort = await prisma.cohort.findFirst({ where: { status: 'RUNNING' } });
  const isPlatformAdmin = hasRole(session, 'PLATFORM_ADMIN');

  return (
    <div className="space-y-8">
      <Flash msg={msg} err={err} basePath="/admin" />
      <div className="flex items-center gap-2 text-sm">
        <span className="font-bold text-2xl">管理</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/users" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div className="text-sm text-slate-400">学员管理</div>
          <div className="text-3xl font-bold mt-1">{userCount}</div>
          <div className="text-xs text-slate-500 mt-1">增删 / 编组 / 授角色 / 停用</div>
        </Link>
        <Link href="/admin/cohorts" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div className="text-sm text-slate-400">期次与小组</div>
          <div className="text-3xl font-bold mt-1">{runningCohort ? '进行中' : '未开营'}</div>
          <div className="text-xs text-slate-500 mt-1">{runningCohort?.name ?? '暂无进行中期次'}</div>
        </Link>
        <Link href="/admin/labs" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div className="text-sm text-slate-400">题目管理</div>
          <div className="text-3xl font-bold mt-1">{labCount}</div>
          <div className="text-xs text-slate-500 mt-1">关卡总览 / 预览 / 启停</div>
        </Link>
        <Link href="/admin/audit" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div className="text-sm text-slate-400">审计日志</div>
          <div className="text-xs text-slate-500 mt-1">最近操作记录</div>
        </Link>
        <Link href="/admin/certs" className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <div className="text-sm text-slate-400">毕业条件</div>
          <div className="text-xs text-slate-500 mt-1">各证书要求一览</div>
        </Link>
      </div>

      {/* 课程同步 */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">课程同步（Git → 平台）</h2>
            <p className="text-xs text-slate-500 mt-1">
              当前 {labCount} 个关卡 · 上次同步：{lastSync ? new Date(lastSync.syncedAt).toLocaleString('zh-CN') : '从未'}（commit: {lastSync?.gitCommit ?? '—'}）
            </p>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl">
              题目的任务卡与判题脚本存放在训练仓库（Git）中，平台只缓存题目清单用于展示与解锁计算。当训练仓库的 curriculum.yaml 或题目内容有更新时，点击同步拉取最新清单；同步不会影响学员已有的提交与成绩。已配置 Git webhook 的环境会自动同步，无需手动点击。
            </p>
          </div>
          <form action={runSync}><button className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm whitespace-nowrap">从训练仓库同步题目清单</button></form>
        </div>
      </section>

      {/* 部门工具登记表 */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-1">部门默认工具登记表</h2>
        <p className="text-xs text-slate-400 mb-4">此表回答学员"我该装哪个工具"：内容会展示在学员的<strong>新手引导页</strong>，关卡 c1-01 的环境自检也以此为准。</p>
        <table className="w-full text-sm mb-4">
          <thead><tr className="text-left text-slate-400"><th className="py-1">部门</th><th>默认工具</th><th>加载 Skill/Rules 卡点</th><th></th></tr></thead>
          <tbody>
            {tools.map((t) => (
              <tr key={t.dept} className="border-t border-slate-100 align-top">
                <td className="py-2 font-medium">{t.dept}</td>
                <td className="py-2">{t.defaultTool}</td>
                <td className="py-2 text-slate-500">{t.quirks || '—'}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  <Link href={`/admin/tools/${encodeURIComponent(t.dept)}`} className="text-xs text-slate-500 underline hover:text-slate-700 mr-2">编辑</Link>
                  <form action={deleteTool} className="inline">
                    <input type="hidden" name="dept" value={t.dept} />
                    <ConfirmButton message={`确认删除部门「${t.dept}」的工具登记？`} className="text-xs text-red-400 hover:text-red-600" >删除</ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {tools.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-slate-400 text-sm">暂无登记。在下方新增部门。</td></tr>}
          </tbody>
        </table>
        <form action={upsertTool} className="flex gap-2 text-sm">
          <input name="dept" placeholder="部门" className="border rounded px-2 py-1.5 flex-1" required />
          <input name="defaultTool" placeholder="默认工具（Claude Code / Qoder / Copilot…）" className="border rounded px-2 py-1.5 flex-1" required />
          <input name="quirks" placeholder="卡点备注" className="border rounded px-2 py-1.5 flex-1" />
          <button className="bg-slate-900 text-white rounded px-3">新增部门</button>
        </form>
      </section>

      {/* 系统设置 */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold mb-1">系统设置</h2>
        <form action={saveSettings} className="space-y-4 text-sm mt-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">训练仓库 clone 地址（trainingRepoUrl）</label>
            <input name="trainingRepoUrl" defaultValue={trainingRepoUrl} placeholder="ssh://git@.../camp.git 或 https://..." className="border rounded px-3 py-1.5 w-full" />
            <p className="text-xs text-slate-400 mt-1">学员新手引导页与每个关卡页的提交命令中的 clone/push 地址统一取自此处。</p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">训练仓库网页浏览地址（trainingRepoWebUrl）</label>
            <input name="trainingRepoWebUrl" defaultValue={trainingRepoWebUrl} placeholder="https://git.company.com/camp" className="border rounded px-3 py-1.5 w-full" />
            <p className="text-xs text-slate-400 mt-1">用于生成评审与教练查看学员产物的网页链接。</p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">分支浏览链接模板（repoBranchUrlTemplate）</label>
            <input name="repoBranchUrlTemplate" defaultValue={repoBranchUrlTemplate} className="border rounded px-3 py-1.5 w-full font-mono text-xs" />
            <p className="text-xs text-slate-400 mt-1">占位符：<code>{'{web}'}</code>=网页地址、<code>{'{branch}'}</code>=分支名、<code>{'{path}'}</code>=文件路径。默认 GitLab 格式；Gitea 等其他平台请按其 URL 规则调整。</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-slate-900 text-white rounded px-4 py-1.5">保存</button>
            <Link href="/onboarding" className="text-xs text-slate-500 underline hover:text-slate-700">预览学员新手引导页 →</Link>
            <Link href="/labs/c1-00" className="text-xs text-slate-500 underline hover:text-slate-700">查看提交指引 →</Link>
          </div>
        </form>
      </section>

      {isPlatformAdmin && (
        <section className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-sm text-red-700 mb-1">清除演示数据</h2>
          <p className="text-xs text-slate-600 mb-3">强制删除演示账号 90001、10001~10008（含全部关联数据）。00001 保留 —— 删除后请为其重置为强密码。</p>
          <form action={cleanDemoData}>
            <ConfirmButton message="确认清除全部演示数据？将删除 90001 与 10001~10008，不可恢复。" className="bg-red-600 text-white rounded px-4 py-1.5 text-sm">清除演示数据</ConfirmButton>
          </form>
        </section>
      )}
    </div>
  );
}
