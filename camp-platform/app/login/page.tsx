import { login } from './actions';

const ERR_MSG: Record<string, string> = {
  '1': '工号不存在，请联系营长录入名单。',
  disabled: '账号已停用，请联系营长。',
  invalid: '工号或密码不正确。',
  locked: '连续失败次数过多，请 10 分钟后再试或联系营长重置。',
  nopass: '账号未初始化密码，请联系营长重置。',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const isDev = process.env.NODE_ENV !== 'production';
  return (
    <div className="max-w-sm mx-auto mt-24 bg-white rounded-xl shadow p-8">
      <h1 className="text-xl font-bold mb-1">AI Coding Camp</h1>
      <p className="text-sm text-slate-500 mb-6">从个人强到组织强 · 12 周训练营</p>
      {err && ERR_MSG[err] && <p className="text-sm text-red-600 mb-3">{ERR_MSG[err]}</p>}
      <form action={login} className="space-y-4">
        <input
          name="empId"
          placeholder={isDev ? '工号（演示：10001 / 90001 / 00001）' : '工号'}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          required
        />
        <input
          name="password"
          type="password"
          placeholder={isDev ? '密码（演示：Camp@2026）' : '密码'}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          required
        />
        <button className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-medium">进入训练营</button>
      </form>
    </div>
  );
}
