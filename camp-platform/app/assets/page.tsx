import { prisma } from '@/lib/db';
import { getSession, getActiveEnrollment, hasRole } from '@/lib/auth';
import { registerAsset, submitAdoption, confirmAdoption } from './actions';
import { redirect } from 'next/navigation';

export default async function AssetsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const enrollment = await getActiveEnrollment(session.userId);
  if (!enrollment) return <p className="text-slate-500">未在营中。</p>;
  const canConfirm = hasRole(session, 'GROUP_LEADER', 'COACH', 'CAMP_ADMIN');

  const mine = await prisma.assetContribution.findMany({
    where: { enrollmentId: enrollment.id }, include: { adoptions: true }, orderBy: { id: 'desc' },
  });
  const pendingConfirm = canConfirm
    ? await prisma.adoption.findMany({ where: { confirmedById: null }, include: { asset: { include: { enrollment: { include: { user: true } } } } } })
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">我的资产</h1>
      <p className="text-sm text-slate-500">C3 毕业硬条件：至少 1 个资产被其他团队采纳（需采纳方组长确认）</p>
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {mine.map((a) => (
          <div key={a.id} className="border rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{a.type} · {a.name}</span>
              <span className="text-slate-500">已确认采纳 {a.adoptions.filter((x) => x.confirmedById).length} 次</span>
            </div>
            <form action={submitAdoption} className="flex gap-2 mt-3 text-xs">
              <input type="hidden" name="assetId" value={a.id} />
              <input name="adopterDept" placeholder="采纳团队" className="border rounded px-2 py-1 flex-1" required />
              <input name="evidence" placeholder="佐证链接/说明" className="border rounded px-2 py-1 flex-1" />
              <button className="bg-slate-700 text-white rounded px-3">登记采纳</button>
            </form>
          </div>
        ))}
        <form action={registerAsset} className="flex gap-2 text-sm border-t pt-4">
          <select name="type" className="border rounded px-2 py-1.5">
            <option value="SKILL">SKILL</option><option value="RULE">RULE</option>
            <option value="DETECTION">DETECTION</option><option value="SPEC_TEMPLATE">SPEC_TEMPLATE</option>
          </select>
          <input name="name" placeholder="资产名称" className="border rounded px-2 py-1.5 flex-1" required />
          <input name="skillHubRef" placeholder="SkillHub 命名空间/ID" className="border rounded px-2 py-1.5 flex-1" />
          <button className="bg-slate-900 text-white rounded px-3">登记资产</button>
        </form>
      </section>
      {canConfirm && (
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold mb-3">待我确认的采纳（组长/教练）</h2>
          <div className="space-y-2 text-sm">
            {pendingConfirm.map((ad) => (
              <form key={ad.id} action={confirmAdoption} className="flex justify-between items-center border rounded-lg p-3">
                <input type="hidden" name="id" value={ad.id} />
                <span>{ad.asset.name} · 作者 {ad.asset.enrollment.user.name} · 采纳方 {ad.adopterDept} · {ad.evidence || '无佐证'}</span>
                <button className="bg-emerald-600 text-white rounded px-3 py-1 text-xs">确认真实使用</button>
              </form>
            ))}
            {pendingConfirm.length === 0 && <p className="text-slate-400">无待确认项</p>}
          </div>
        </section>
      )}
    </div>
  );
}
