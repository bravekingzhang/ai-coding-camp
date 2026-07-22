'use client';
import { useActionState } from 'react';
import { CopyButton } from './CopyButton';

type Result = {
  created: { empId: string; name: string; password: string }[];
  failed: string[];
} | null;

/** 批量导入表单：提交后展示「工号|姓名|初始密码」表格 + 失败行。 */
export function BulkImportForm({
  action,
}: {
  action: (fd: FormData) => Promise<Result>;
}) {
  const [result, formAction, pending] = useActionState(async (_: Result, fd: FormData) => action(fd), null);
  return (
    <form action={formAction} className="space-y-2">
      <textarea
        name="bulk"
        rows={4}
        placeholder={'20001,张三,A中心研发一部\n20002,李四,B中心研发二部,MyPass123'}
        className="w-full border rounded p-2 font-mono text-sm"
      />
      <p className="text-xs text-slate-400">每行：工号,姓名,部门[,初始密码]。密码缺省=自动生成。新用户默认授予 LEARNER 角色。</p>
      <button disabled={pending} className="bg-slate-900 text-white rounded px-4 py-1.5 text-sm disabled:opacity-50">
        {pending ? '导入中…' : '批量导入'}
      </button>
      {result && (
        <div className="text-sm space-y-3 mt-3">
          {result.created.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-amber-700 bg-amber-50 rounded p-2 flex-1 mr-2">
                  ⚠️ 此清单仅本次展示，请立即复制发给学员；系统只保存加密后的密码。共 {result.created.length} 条。
                </p>
                <CopyButton text={result.created.map((r) => `${r.empId}\t${r.name}\t${r.password}`).join('\n')} label="复制全部" />
              </div>
              <table className="w-full border rounded text-xs">
                <thead><tr className="bg-slate-100"><th className="p-1 text-left">工号</th><th className="text-left">姓名</th><th className="text-left">初始密码</th></tr></thead>
                <tbody>
                  {result.created.map((r) => (
                    <tr key={r.empId} className="border-t"><td className="p-1 font-mono">{r.empId}</td><td>{r.name}</td><td className="font-mono">{r.password}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.failed.length > 0 && (
            <ul className="text-red-600 list-disc ml-5">
              {result.failed.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
