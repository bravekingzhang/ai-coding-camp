export function StatusBadge({ color }: { color: 'RED' | 'YELLOW' | 'GREEN' | null | undefined }) {
  if (!color) return <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-600">未判</span>;
  const map = {
    RED: 'bg-red-100 text-red-700',
    YELLOW: 'bg-amber-100 text-amber-700',
    GREEN: 'bg-emerald-100 text-emerald-700',
  } as const;
  const label = { RED: '🔴 未通过', YELLOW: '🟡 通过', GREEN: '🟢 优秀' } as const;
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${map[color]}`}>{label[color]}</span>;
}
