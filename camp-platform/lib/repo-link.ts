import { getSetting, SETTING_KEYS, DEFAULT_BRANCH_TEMPLATE } from './settings';

/**
 * 构造分支在代码托管平台的网页浏览 URL。
 * 读取 trainingRepoWebUrl 与 repoBranchUrlTemplate，替换 {web}/{branch}/{path}。
 * path 为空时去掉模板中含 {path} 的尾段。webUrl 未配置返回 null。
 */
export async function buildBranchUrl(branch: string, path?: string): Promise<string | null> {
  const web = await getSetting(SETTING_KEYS.trainingRepoWebUrl);
  if (!web) return null;
  const template = await getSetting(SETTING_KEYS.repoBranchUrlTemplate, DEFAULT_BRANCH_TEMPLATE);
  let url = template.replace('{web}', web).replace('{branch}', encodeURIComponent(branch));
  if (path) {
    url = url.replace('{path}', path.split('/').map(encodeURIComponent).join('/'));
  } else {
    // 去掉含 {path} 的尾段，如 "/{path}" 或 "/{path}/"
    url = url.replace(/\/?\{path\}\/?$/, '');
  }
  return url;
}
