'use client';
import { useState, useTransition } from 'react';

/**
 * 危险删除区。
 * - 无痕迹：普通删除可用（确认框）。
 * - 有痕迹：普通删除置灰并提示；仅 PLATFORM_ADMIN 可见「强制删除」（需键入工号确认）。
 */
export function DangerDelete({
  userId,
  empId,
  hasTraces,
  isPlatformAdmin,
  action,
}: {
  userId: string;
  empId: string;
  hasTraces: boolean;
  isPlatformAdmin: boolean;
  action: (fd: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState('');

  const doDelete = (fd: FormData) => startTransition(() => action(fd));

  if (!hasTraces) {
    return (
      <form action={doDelete} className="mt-3">
        <input type="hidden" name="userId" value={userId} />
        <button
          disabled={pending}
          onClick={(e) => { if (!window.confirm('确认删除该用户？此操作不可撤销。')) e.preventDefault(); }}
          className="bg-red-600 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {pending ? '删除中…' : '删除用户'}
        </button>
        <p className="text-xs text-slate-500 mt-1">该用户无训练记录，可直接删除。</p>
      </form>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <button disabled className="bg-slate-200 text-slate-400 rounded px-3 py-1.5 text-sm cursor-not-allowed">
        删除用户
      </button>
      <p className="text-xs text-slate-600">该学员已有训练记录，建议停用以保留审计链。</p>
      {isPlatformAdmin && (
        <form action={doDelete} className="space-y-2 pt-2 border-t border-red-200">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="force" value="1" />
          <p className="text-xs text-red-700 font-medium">平台管理员强制删除（将清除全部关联数据）：请键入工号 <code className="font-mono">{empId}</code> 确认</p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={empId}
            className="border border-red-300 rounded px-2 py-1.5 text-sm w-40"
          />
          <button
            disabled={pending || confirmText !== empId}
            className="block bg-red-600 text-white rounded px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {pending ? '强制删除中…' : '确认强制删除'}
          </button>
        </form>
      )}
    </div>
  );
}
