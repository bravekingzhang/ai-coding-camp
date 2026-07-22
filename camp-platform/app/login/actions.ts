'use server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { redirect } from 'next/navigation';

const MAX_FAILS = 5;
const LOCK_MINUTES = 10;
// 统一错误提示，不区分账号是否存在/停用/锁定/密码错，防账号枚举
const GENERIC_ERR = '/login?err=invalid';
const GENERIC_MSG = '工号或密码不正确';

export async function login(formData: FormData) {
  const empId = String(formData.get('empId') || '').trim();
  const password = String(formData.get('password') || '');
  const user = await prisma.user.findUnique({ where: { empId }, include: { roles: true } });

  // 统一处理：用户不存在 / 停用 / 密码未初始化 / 锁定 / 密码错 —— 对外都返回同一提示
  if (!user) redirect(GENERIC_ERR);

  if (user.active === false) redirect(GENERIC_ERR);

  // 锁定检查
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    redirect('/login?err=locked');
  }

  // 密码未初始化
  if (!user.passwordHash) {
    redirect('/login?err=nopass');
  }

  // 密码校验
  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) {
    const fails = user.failedLogins + 1;
    if (fails >= MAX_FAILS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: fails, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) },
      });
      redirect('/login?err=locked');
    }
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: fails } });
    redirect(GENERIC_ERR);
  }

  // 成功：清零失败计数与锁定
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null },
  });

  await createSession({
    userId: user.id,
    empId: user.empId,
    name: user.name,
    roles: user.roles.map((r) => r.role),
    mustChangePassword: user.mustChangePassword,
  });

  // 需要改密则跳转改密页
  if (user.mustChangePassword) redirect('/change-password');
  redirect('/');
}
