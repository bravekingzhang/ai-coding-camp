import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const ROOT = () => process.env.CAMP_CONTENT_DIR || path.join(process.cwd(), '..', 'landing-zone-camp');

export function readLabReadme(repoPath: string): string {
  const p = path.join(ROOT(), repoPath, 'README.md');
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return `> 任务卡未找到：${p}\n\n请检查 CAMP_CONTENT_DIR 配置或运行课程同步。`;
  }
}

/**
 * 写回某关 README.md。带路径穿越防护：
 * 解析后的绝对路径必须以内容根目录开头，且只允许写 README.md。
 */
export function writeLabReadme(repoPath: string, text: string): void {
  const root = path.resolve(ROOT());
  const target = path.resolve(root, repoPath, 'README.md');
  // 防穿越：resolve 后的目标必须仍在内容根目录下
  if (target !== path.join(root, 'README.md') && !target.startsWith(root + path.sep)) {
    throw new Error('非法路径：禁止写出到内容目录之外');
  }
  fs.writeFileSync(target, text, 'utf-8');
}

/** 列出某关 starter/ 与 .verify/ 下的文件名（供预览展示）。 */
export function listLabFiles(repoPath: string): { starter: string[]; verify: string[] } {
  const base = path.join(ROOT(), repoPath);
  const readDir = (sub: string): string[] => {
    try {
      return fs.readdirSync(path.join(base, sub)).filter((f) => !f.startsWith('.'));
    } catch {
      return [];
    }
  };
  // .verify 是隐藏目录，单独读
  let verifyFiles: string[] = [];
  try {
    verifyFiles = fs.readdirSync(path.join(base, '.verify'));
  } catch {
    verifyFiles = [];
  }
  return { starter: readDir('starter'), verify: verifyFiles };
}

export type CurriculumLab = {
  code: string; title: string; module: string; domain: number;
  verify: string; green_by?: string; minutes?: number; unlocks?: string[]; repo_path: string;
};
export type Curriculum = {
  version: number;
  certs: { code: string; name: string; labs: CurriculumLab[]; graduation?: Record<string, unknown> }[];
};

export function readCurriculum(): Curriculum {
  const p = path.join(ROOT(), 'curriculum.yaml');
  return parse(fs.readFileSync(p, 'utf-8')) as Curriculum;
}
