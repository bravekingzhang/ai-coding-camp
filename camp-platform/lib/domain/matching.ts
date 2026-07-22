export type Candidate = {
  enrollmentId: string;
  groupId: string;
  pendingReviews: number;
  totalReviews: number;
  recentPairCount: number; // 最近与作者互评次数
};

/**
 * 跨组评审匹配 —— C2 毕业条件的自动化核心
 * 硬约束：跨组、非固定搭子；排序：待评少者优先、机会均衡
 */
export function pickReviewer(authorGroupId: string, pool: Candidate[]): Candidate | null {
  const eligible = pool.filter((c) => c.groupId !== authorGroupId && c.recentPairCount < 2);
  if (eligible.length === 0) return null; // 调用方降级为教练评审并告警
  eligible.sort((a, b) => a.pendingReviews - b.pendingReviews || a.totalReviews - b.totalReviews);
  return eligible[0];
}
