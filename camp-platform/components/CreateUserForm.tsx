'use client';
import { useActionState } from 'react';

type Result = { empId: string; name: string; password: string; error?: string } | null;

/** 单个新增学员表单：成功后一次性展示初始密码。 */
export function CreateUserForm({
  action,
}: {
  action: (fd: FormData) => Promise<Result>;
}) {
  const [result, formAction, pending] = useActionState(async (_: Result, fd: FormData) => action(fd), null);
  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-wrap gap-2 text-sm">
        <input name="empId" placeholder="工号" className="border rounded px-3 py-1.5 w-28" required />
        <input name="name" placeholder="姓名" className="border rounded px-3 py-1.5 w-28" required />
        <input name="dept" placeholder="部门" className="border rounded px-3 py-1.5 flex-1" required />
        <button disabled={pending} className="bg-slate-900 text-white rounded px-4 disabled:opacity-50">
          {pending ? '提交中…' : '新增'}
        </button>
      </div>
      {result && !result.error && (
        <div className="text-amber-700 bg-amber-50 rounded p-2 text-sm">
          ⚠️ 初始密码仅本次展示，请立即发给学员 {result.name}（{result.empId}）：<span className="font-mono font-bold">{result.password}</span>。系统只保存加密后的密码。
        </div>
      )}
      {result?.error && <div className="text-red-600 text-sm">{result.error}</div>}
    </form>
  );
}
