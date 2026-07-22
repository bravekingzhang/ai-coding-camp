'use client';
import { useState } from 'react';

/** 小型复制按钮：点击把给定文本写入剪贴板，1.5 秒后恢复。 */
export function CopyButton({ text, label = '复制' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // 剪贴板 API 在非 HTTPS/非 localhost 下可能不可用，静默失败
        }
      }}
      className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 rounded px-1.5 py-0.5"
    >
      {copied ? '已复制 ✓' : label}
    </button>
  );
}
