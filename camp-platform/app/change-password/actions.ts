'use server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@/lib/password';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function changePassword(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.passwordHash) redirect('/login');

  const oldPass = String(formData.get('oldPassword') || '');
  const newPass = String(formData.get('newPassword') || '');
  const confirmPass = String(formData.get('confirmPassword') || '');

  // 旧密码必须正确
  if (!verifyPassword(oldPass, user.passwordHash)) {
    redirect('/change-password?err=wrong');
  }
  // 规则：≥8 位且同时含字母和数字
  if (newPass.length < 8 || !/[a-zA-Z]/.test(newPass) || !/[0-9]/.test(newPass)) {
    redirect('/change-password?err=weak');
  }
  if (newPass !== confirmPass) {
    redirect('/change-password?err=mismatch');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(newPass),
      mustChangePassword: false,
    },
  });
  revalidatePath('/');
  redirect('/?changed=1');
}
