import { prisma } from './db';
import { readCurriculum } from './content';

const V = (s: string) => (['CI', 'LLM', 'HYBRID', 'PEER', 'MANUAL'].includes(s.toUpperCase()) ? s.toUpperCase() : 'MANUAL');
const G = (s?: string) => (['AUTO', 'COACH', 'PEER_TEST'].includes((s || '').toUpperCase()) ? (s || '').toUpperCase() : 'COACH');

export type SyncResult = { total: number; created: number; updated: number; deactivated: number };

/** 从 landing-zone-camp/curriculum.yaml 同步关卡到数据库（内容永远以 Git 为准，DB 只是缓存） */
export async function syncCurriculum(gitCommit = 'local'): Promise<SyncResult> {
  const cur = readCurriculum();
  const seen: string[] = [];
  let created = 0;
  let updated = 0;

  // 同步前已有清单，用于区分新增/更新
  const existing = await prisma.lab.findMany({ select: { code: true } });
  const existingCodes = new Set(existing.map((l) => l.code));

  for (const cert of cur.certs) {
    for (const lab of cert.labs) {
      seen.push(lab.code);
      const isNew = !existingCodes.has(lab.code);
      await prisma.lab.upsert({
        where: { code: lab.code },
        create: {
          code: lab.code,
          certLevel: cert.code as 'C1' | 'C2' | 'C3' | 'C4',
          module: lab.module,
          title: lab.title,
          domain: lab.domain,
          verifyType: V(lab.verify) as never,
          greenBy: G(lab.green_by) as never,
          minutes: lab.minutes ?? 30,
          repoPath: lab.repo_path,
          unlocks: lab.unlocks ?? [],
        },
        update: {
          title: lab.title,
          module: lab.module,
          domain: lab.domain,
          verifyType: V(lab.verify) as never,
          greenBy: G(lab.green_by) as never,
          minutes: lab.minutes ?? 30,
          repoPath: lab.repo_path,
          unlocks: lab.unlocks ?? [],
          active: true,
        },
      });
      if (isNew) created++; else updated++;
    }
  }
  // 软删：yaml 里消失的关卡不打断在读者
  const deact = await prisma.lab.updateMany({ where: { code: { notIn: seen }, active: true }, data: { active: false } });
  await prisma.curriculumSync.create({ data: { gitCommit, raw: cur as object } });
  return { total: seen.length, created, updated, deactivated: deact.count };
}
