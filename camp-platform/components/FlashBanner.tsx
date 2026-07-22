import Link from 'next/link';

/**
 * 统一操作反馈横幅（服务端组件）。
 * 配合 server action 的 redirect(`${path}?msg=...` / `?err=...`) 使用。
 * msg → 绿色（成功），err → 红色（失败）。右侧 ✕ 链回无参路径实现关闭。
 * 页面里 await searchParams 后传入解析值。
 */
export function Flash({ msg, err, basePath }: { msg?: string; err?: string; basePath: string }) {
  if (!msg && !err) return null;
  if (msg) {
    return (
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-2 text-sm">
        <span>✅ {msg}</span>
        <Link href={basePath} className="text-emerald-400 hover:text-emerald-600 ml-4 shrink-0">✕</Link>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
      <span>❌ {err}</span>
      <Link href={basePath} className="text-red-400 hover:text-red-600 ml-4 shrink-0">✕</Link>
    </div>
  );
}
