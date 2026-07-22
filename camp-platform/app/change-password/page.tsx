import { changePassword } from './actions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

const ERR_MSG: Record<string, string> = {
  wrong: '旧密码不正确。',
  weak: '新密码至少 8 位，且必须同时包含字母和数字。',
  mismatch: '两次输入的新密码不一致。',
};

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  const { err } = await searchParams;

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white rounded-xl shadow p-8">
      <h1 className="text-xl font-bold mb-1">修改密码</h1>
      <p className="text-sm text-slate-500 mb-6">
        {session.roles.includes('LEARNER') && !session.roles.some((r) => r !== 'LEARNER')
          ? '首次登录，请设置你的登录密码。'
          : '为了账号安全，请修改初始密码。'}
      </p>
      {err && ERR_MSG[err] && <p className="text-sm text-red-600 mb-3">{ERR_MSG[err]}</p>}
      <form action={changePassword} className="space-y-4">
        <input name="oldPassword" type="password" placeholder="旧密码" className="w-full border rounded-lg px-3 py-2 text-sm" required />
        <input name="newPassword" type="password" placeholder="新密码（≥8 位，含字母和数字）" className="w-full border rounded-lg px-3 py-2 text-sm" required />
        <input name="confirmPassword" type="password" placeholder="确认新密码" className="w-full border rounded-lg px-3 py-2 text-sm" required />
        <button className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-medium">确认修改</button>
      </form>
    </div>
  );
}
