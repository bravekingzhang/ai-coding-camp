'use server';
import { getSession, hasRole } from '@/lib/auth';
import { setSetting, SETTING_KEYS, DEFAULT_BRANCH_TEMPLATE } from '@/lib/settings';
import { audit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function saveSettings(formData: FormData) {
  const session = await getSession();
  if (!session || !hasRole(session, 'CAMP_ADMIN', 'PLATFORM_ADMIN')) return;
  const trainingRepoUrl = String(formData.get('trainingRepoUrl') || '').trim();
  let trainingRepoWebUrl = String(formData.get('trainingRepoWebUrl') || '').trim();
  const repoBranchUrlTemplate = String(formData.get('repoBranchUrlTemplate') || '').trim() || DEFAULT_BRANCH_TEMPLATE;

  // 格式校验
  if (trainingRepoUrl && !/^(ssh:\/\/|git@|https?:\/\/)/.test(trainingRepoUrl)) {
    redirect('/admin?err=' + encodeURIComponent('clone 地址须以 ssh://、git@ 或 http(s):// 开头'));
  }
  if (trainingRepoWebUrl) {
    if (!/^https?:\/\//.test(trainingRepoWebUrl)) {
      redirect('/admin?err=' + encodeURIComponent('网页地址须以 http(s):// 开头'));
    }
    trainingRepoWebUrl = trainingRepoWebUrl.replace(/\/+$/, ''); // 去尾斜杠
  }

  await setSetting(SETTING_KEYS.trainingRepoUrl, trainingRepoUrl);
  await setSetting(SETTING_KEYS.trainingRepoWebUrl, trainingRepoWebUrl);
  await setSetting(SETTING_KEYS.repoBranchUrlTemplate, repoBranchUrlTemplate);
  await audit(session, 'settings.update', 'system', { trainingRepoUrl: trainingRepoUrl ? '(已设置)' : '(空)' });
  revalidatePath('/admin');
  revalidatePath('/onboarding');
  redirect('/admin?msg=' + encodeURIComponent('系统设置已保存'));
}
