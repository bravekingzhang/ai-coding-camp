'use client';
import { useActionState } from 'react';

type Result = { empId: string; name: string; password: string } | null;

/** 重置密码按钮：提交后一次性展示新密码。每行一个实例。 */
export function ResetPasswordButton({
  userId,
  action,
}: {
  userId: string;
  action: (fd: FormData) => Promise<Result>;
}) {
  const [result, formAction, pending] = useActionState(async (_: Result, fd: FormData) => action(fd), null);
  return (
    <div className="inline">
      <form action={formAction} className="inline">
        <input type="hidden" name="userId" value={userId} />
        <button disabled={pending} className="text-xs text-slate-400 hover:text-slate-700 underline disabled:opacity-50">
          {pending ? '重置中…' : '重置密码'}
        </button>
      </form>
      {result && (
        <span className="block mt-1 text-amber-700 bg-amber-50 rounded px-2 py-1 text-xs">
          新密码（仅本次展示）：<span className="font-mono font-bold">{result.password}</span>
        </span>
      )}
    </div>
  );
}
