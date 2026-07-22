'use client';

/** 带二次确认的提交按钮：点击时弹 confirm，取消则阻止提交。 */
export function ConfirmButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}
      className={className}
    >
      {children}
    </button>
  );
}
