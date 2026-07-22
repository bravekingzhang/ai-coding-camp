import { prisma } from '../../lib/db';
import { notify } from '../../lib/adapters/im';

/** webhook/CI 回调丢失兜底：SUBMITTED 超 30 分钟无判分事件 → 告警（生产版可直接查 CI API 补录） */
export async function reconcile() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const stuck = await prisma.labAttempt.findMany({
    where: { status: 'SUBMITTED', updatedAt: { lt: cutoff }, events: { none: {} } },
    include: { enrollment: { include: { user: true } } },
    take: 20,
  });
  for (const a of stuck) {
    await notify(`⏰ 对账告警：${a.enrollment.user.name} 的 ${a.labCode} 提交超 30 分钟无 CI 结果，请检查流水线`);
  }
  if (stuck.length) console.log(`[reconcile] ${stuck.length} stuck attempts`);
}
