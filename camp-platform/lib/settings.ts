import { prisma } from './db';

/**
 * 读取系统设置。优先级：DB > 环境变量 > fallbackEnv > 空。
 * DB 查询失败（如尚未建表）时优雅降级到环境变量。
 */
export async function getSetting(key: string, fallbackEnv?: string): Promise<string> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    if (row?.value) return row.value;
  } catch {
    // DB 不可用时降级
  }
  return process.env[key] || fallbackEnv || '';
}

/** 写入系统设置（管理员用）。 */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

/** 常用 key 集中管理。 */
export const SETTING_KEYS = {
  trainingRepoUrl: 'trainingRepoUrl',
  trainingRepoWebUrl: 'trainingRepoWebUrl',
  repoBranchUrlTemplate: 'repoBranchUrlTemplate',
} as const;

/** 分支浏览链接模板的默认值（GitLab 格式）。 */
export const DEFAULT_BRANCH_TEMPLATE = '{web}/-/tree/{branch}/{path}';
