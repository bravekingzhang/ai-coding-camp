export type CertConditions = {
  labs?: 'all_yellow';
  project?: { code: string; min: 'YELLOW' | 'GREEN' };
  reviews_given?: { gte: number };
  adoptions?: { gte: number };
};

export type CertFacts = {
  labColors: Record<string, 'RED' | 'YELLOW' | 'GREEN' | null>;
  requiredLabs: string[];
  projectColor?: 'RED' | 'YELLOW' | 'GREEN' | null;
  reviewsGiven: number;
  adoptionsConfirmed: number;
};

const ok = (c: string | null | undefined) => c === 'YELLOW' || c === 'GREEN';

/** 声明式认证条件评估：返回 [是否达成, 未达成项说明] */
export function evaluateCert(cond: CertConditions, facts: CertFacts): [boolean, string[]] {
  const missing: string[] = [];
  if (cond.labs === 'all_yellow') {
    const bad = facts.requiredLabs.filter((code) => !ok(facts.labColors[code]));
    if (bad.length) missing.push(`未通过关卡：${bad.join(', ')}`);
  }
  if (cond.project) {
    const c = facts.projectColor;
    const pass = cond.project.min === 'GREEN' ? c === 'GREEN' : ok(c);
    if (!pass) missing.push(`项目 ${cond.project.code} 未达 ${cond.project.min}`);
  }
  if (cond.reviews_given && facts.reviewsGiven < cond.reviews_given.gte) {
    missing.push(`评审贡献 ${facts.reviewsGiven}/${cond.reviews_given.gte}`);
  }
  if (cond.adoptions && facts.adoptionsConfirmed < cond.adoptions.gte) {
    missing.push(`资产被采纳 ${facts.adoptionsConfirmed}/${cond.adoptions.gte}`);
  }
  return [missing.length === 0, missing];
}
