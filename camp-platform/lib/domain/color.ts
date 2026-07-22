import type { ColorT, GradeEventLite } from './types';

/**
 * 颜色归约器 —— 平台判分的唯一真相函数（纯函数，重点单测对象）
 * 规则：
 *  1. CI 最高只能给到 YELLOW（🟢 永远需要人/互测）
 *  2. 人评（COACH）覆盖一切机评；互测（PEER_TEST）次之；LLM 预评再次；CI 垫底
 *  3. 同一来源取最新一条
 */
const PRECEDENCE: Record<string, number> = { COACH: 4, PEER_TEST: 3, LLM: 2, CI: 1, SYSTEM: 0 };

export function reduceColor(events: GradeEventLite[]): ColorT | null {
  const latest = new Map<string, GradeEventLite>();
  for (const e of [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    if (e.color) latest.set(e.source, e);
  }
  let winner: GradeEventLite | null = null;
  for (const e of latest.values()) {
    if (!winner || PRECEDENCE[e.source] > PRECEDENCE[winner.source]) winner = e;
  }
  if (!winner || !winner.color) return null;
  if (winner.source === 'CI' && winner.color === 'GREEN') return 'YELLOW'; // 规则 1 钳制
  return winner.color;
}
