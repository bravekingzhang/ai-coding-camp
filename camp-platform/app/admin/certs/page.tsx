import { prisma } from '@/lib/db';
import { getSession, hasRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const CERT_META: Record<string, { name: string; belt: string }> = {
  C1: { name: 'AI 协作开发者', belt: '⚪ 白带' },
  C2: { name: '规范开发者', belt: '🟡 黄带' },
  C3: { name: '资产工程师', belt: '🟢 绿带' },
  C4: { name: '工程教练', belt: '⚫ 黑带' },
};

/** 把 CertRule conditions JSON 翻译成中文清单。未知键原样展示。 */
function translateConditions(conditions: unknown): { text: string; recognized: boolean }[] {
  if (!conditions || typeof conditions !== 'object') return [{ text: '（无条件定义）', recognized: false }];
  const c = conditions as Record<string, unknown>;
  const out: { text: string; recognized: boolean }[] = [];
  let idx = 1;
  if (c.labs === 'all_yellow') out.push({ text: `${idx++}. 全部该证书关卡达到 🟡 及以上`, recognized: true });
  if (c.project && typeof c.project === 'object') {
    const p = c.project as { code?: string; min?: string };
    out.push({ text: `${idx++}. 项目 ${p.code || '?'} 判定 ≥ ${p.min || '?'}`, recognized: true });
  }
  if (c.reviews_given && typeof c.reviews_given === 'object') {
    const r = c.reviews_given as { gte?: number };
    out.push({ text: `${idx++}. 完成跨组评审 ≥ ${r.gte || '?'} 次`, recognized: true });
  }
  if (c.adoptions && typeof c.adoptions === 'object') {
    const a = c.adoptions as { gte?: number };
    out.push({ text: `${idx++}. 资产被采纳 ≥ ${a.gte || '?'} 次`, recognized: true });
  }
  if (c.micro_project === true) out.push({ text: `${idx++}. 完成微型项目`, recognized: true });
  if (c.tool_registered === true) out.push({ text: `${idx++}. 工具已登记`, recognized: true });
  if (c.baseline_report === true) out.push({ text: `${idx++}. 交付基线报告`, recognized: true });
  // 未知键
  for (const [k, v] of Object.entries(c)) {
    if (!['labs', 'project', 'reviews_given', 'adoptions', 'micro_project', 'tool_registered', 'baseline_report'].includes(k)) {
      out.push({ text: `${k}: ${JSON.stringify(v)}（未识别条件）`, recognized: false });
    }
  }
  return out;
}

export default async function CertsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) redirect('/admin');

  const rules = await prisma.certRule.findMany({ orderBy: { certLevel: 'asc' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-slate-500">管理</Link>
        <span className="text-slate-300">›</span>
        <span className="font-bold text-2xl">毕业条件</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((r) => {
          const meta = CERT_META[r.certLevel] || { name: r.certLevel, belt: '' };
          const items = translateConditions(r.conditions);
          return (
            <section key={r.certLevel} className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold">{meta.belt} {r.certLevel} · {meta.name}</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {items.map((it, i) => (
                  <li key={i} className={it.recognized ? 'text-slate-700' : 'text-amber-600'}>{it.text}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">
        毕业条件当前通过种子数据维护，修改请更新数据库 CertRule 后刷新（在线编辑将在后续版本提供）。
      </p>
    </div>
  );
}
