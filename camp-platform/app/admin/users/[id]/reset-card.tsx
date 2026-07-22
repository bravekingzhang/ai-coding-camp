'use client';
import { useActionState } from 'react';
import { CopyButton } from '@/components/CopyButton';

/** 重置密码卡片：提交后展示一次性密码 + 复制按钮 */
export function ResetPasswordCard({
  userId,
  action,
}: {
  userId: string;
  action: (fd: FormData) => Promise<string | null>;
}) {
  const [password, formAction, pending] = useActionState(async (_: string | null, fd: FormData) => action(fd), null);
  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <button disabled={pending} className="bg-slate-900 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50">
          {pending ? '重置中…' : '重置密码'}
        </button>
      </form>
      {password && (
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2 text-sm flex items-center gap-2">
          <span className="text-amber-700">新密码（仅本次展示）：</span>
          <span className="font-mono font-bold text-amber-900">{password}</span>
          <CopyButton text={password} />
        </div>
      )}
    </div>
  );
}
