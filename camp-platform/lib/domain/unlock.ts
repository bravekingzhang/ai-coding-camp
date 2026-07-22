/** 解锁计算：前置 labs 全部达到 YELLOW 及以上才解锁 */
export function isUnlocked(
  unlocks: string[],
  colorOf: (code: string) => 'RED' | 'YELLOW' | 'GREEN' | null,
): boolean {
  return unlocks.every((code) => {
    const c = colorOf(code);
    return c === 'YELLOW' || c === 'GREEN';
  });
}
