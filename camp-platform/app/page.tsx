import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession, getActiveEnrollment } from '@/lib/auth';
import { isUnlocked } from '@/lib/domain/unlock';
import { evaluateCert, type CertConditions } from '@/lib/domain/cert-engine';
import { buildCertFacts } from '@/lib/domain/cert-facts';
import { StatusBadge } from '@/components/StatusBadge';
import { attemptStatusText } from '@/lib/ui-text';
import { redirect } from 'next/navigation';

const CERT_META: Record<string, { name: string; belt: string }> = {
  C1: { name: 'AI 协作开发者', belt: '⚪ 白带' },
  C2: { name: '规范开发者', belt: '🟡 黄带' },
  C3: { name: '资产工程师', belt: '🟢 绿带' },
  C4: { name: '工程教练', belt: '⚫ 黑带' },
};

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect('/login');
  const enrollment = await getActiveEnrollment(session.userId);
  if (!enrollment) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-slate-500">你还没有被编入进行中的一期。</p>
        <p className="text-sm text-slate-400 mt-2">下一步：请联系营长将你编入期次和小组。</p>
      </div>
    );
  }
  const [labs, attempts, certRules, recentEvents] = await Promise.all([
    prisma.lab.findMany({ where: { active: true }, orderBy: { code: 'asc' } }),
    prisma.labAttempt.findMany({ where: { enrollmentId: enrollment.id } }),
    prisma.certRule.findMany(),
    prisma.gradeEvent.findMany({
      where: { attempt: { enrollmentId: enrollment.id } },
      include: { attempt: { include: { lab: { select: { code: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);
  const colorOf = (code: string) => attempts.find((a) => a.labCode === code)?.color ?? null;

  const byCert: Record<string, typeof labs> = {};
  for (const lab of labs) (byCert[lab.certLevel] ||= []).push(lab);

  const passedCount = attempts.filter((a) => a.color === 'YELLOW' || a.color === 'GREEN').length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">你好，{session.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {enrollment.cohort.name} · {enrollment.group.name} · 已通关 {passedCount} / {labs.length}
        </p>
      </header>

      {(() => {
        const c000 = colorOf('c1-00');
        const c000Done = c000 === 'YELLOW' || c000 === 'GREEN';
        if (c000Done) return null;
        return (
          <Link href="/onboarding" className="block bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 hover:bg-amber-100 transition">
            🧭 第一次来？先完成环境准备（约 15 分钟），之后每一关都用同一套提交方式 → 前往新手引导
          </Link>
        );
      })()}

      {/* 最近动态 */}
      <section className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-bold text-sm mb-3">最近动态</h2>
        {recentEvents.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {recentEvents.map((e) => (
              <li key={e.id}>
                <Link href={`/labs/${e.attempt.labCode}`} className="flex items-center gap-2 hover:bg-slate-50 rounded px-2 py-1 -mx-2">
                  <span className="text-xs text-slate-400 w-32">{new Date(e.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-mono text-xs">{e.attempt.lab.code}</span>
                  <span className="text-slate-500">{e.source}</span>
                  <span>→</span>
                  <span>{e.color === 'GREEN' ? '🟢' : e.color === 'YELLOW' ? '🟡' : e.color === 'RED' ? '🔴' : '—'}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">完成第一次提交后，这里会出现你的判分动态。</p>
        )}
      </section>

      {Object.entries(byCert).map(([cert, certLabs]) => {
        const passedInCert = certLabs.filter((l) => {
          const c = colorOf(l.code); return c === 'YELLOW' || c === 'GREEN';
        }).length;
        const rule = certRules.find((r) => r.certLevel === cert);
        const conditions = rule?.conditions as CertConditions | undefined;
        return (
          <section key={cert} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">
                {CERT_META[cert]?.belt} {cert} · {CERT_META[cert]?.name}
              </h2>
              <span className="text-sm text-slate-500">已过 {passedInCert}/{certLabs.length} 关</span>
            </div>

            {/* 毕业进度条 */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-slate-900 h-2 rounded-full transition-all"
                style={{ width: `${certLabs.length ? (passedInCert / certLabs.length) * 100 : 0}%` }}
              />
            </div>

            {/* 毕业条件达成状态 */}
            <CertConditionsView cert={cert} conditions={conditions} enrollmentId={enrollment.id} colorOf={colorOf} certLabs={certLabs} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {certLabs.map((lab) => {
                const unlocked = isUnlocked((lab.unlocks as string[]) ?? [], colorOf);
                const color = colorOf(lab.code);
                return (
                  <div key={lab.code}
                    className={`border rounded-lg p-3 flex items-center justify-between ${unlocked ? 'bg-white' : 'bg-slate-50 opacity-70'}`}>
                    <div>
                      <div className="text-sm font-medium">
                        <Link className="hover:underline" href={`/labs/${lab.code}`}>
                          {unlocked ? '' : '🔒 '}{lab.code} {lab.title}
                        </Link>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{lab.module} · 能力域{lab.domain} · ⏱{lab.minutes}min</div>
                    </div>
                    <StatusBadge color={color} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** 异步子组件：计算并展示毕业条件达成状态。 */
async function CertConditionsView({
  cert, conditions, enrollmentId, colorOf, certLabs,
}: {
  cert: string;
  conditions: CertConditions | undefined;
  enrollmentId: string;
  colorOf: (code: string) => 'RED' | 'YELLOW' | 'GREEN' | null;
  certLabs: { code: string }[];
}) {
  if (!conditions || cert === 'C4') {
    return <p className="text-xs text-slate-400 mb-3">{cert === 'C4' ? 'C4 为模块制，毕业条件见 P3 项目卡。' : ''}</p>;
  }
  const facts = await buildCertFacts(enrollmentId, cert);
  // 补充 labColors（buildCertFacts 已从 DB 取，但这里 colorOf 更即时）
  for (const l of certLabs) facts.labColors[l.code] = colorOf(l.code);
  const [achieved, missing] = evaluateCert(conditions, facts);
  return (
    <div className={`text-xs rounded-lg p-2 mb-1 ${achieved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {achieved
        ? '✅ 毕业条件已达成'
        : <>距离毕业还差：{missing.map((m, i) => <span key={i} className="ml-1">{m}{i < missing.length - 1 ? '；' : ''}</span>)}</>}
    </div>
  );
}
