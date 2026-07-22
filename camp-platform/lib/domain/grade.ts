import { prisma } from '../db';
import { reduceColor } from './color';
import type { GradeEventLite } from './types';

/** 追加判分事件并重算 attempt 颜色（事件只增不改 —— 可审计） */
export async function appendGradeEvent(args: {
  attemptId: string;
  source: 'CI' | 'LLM' | 'COACH' | 'PEER_TEST' | 'SYSTEM';
  color?: 'RED' | 'YELLOW' | 'GREEN';
  score?: number;
  payload: unknown;
  actorId?: string;
}) {
  await prisma.gradeEvent.create({
    data: {
      attemptId: args.attemptId,
      source: args.source,
      color: args.color ?? null,
      score: args.score ?? null,
      payload: args.payload as object,
      actorId: args.actorId ?? null,
    },
  });
  const events = await prisma.gradeEvent.findMany({ where: { attemptId: args.attemptId } });
  const color = reduceColor(events as unknown as GradeEventLite[]);
  await prisma.labAttempt.update({
    where: { id: args.attemptId },
    data: { color: color ?? undefined, status: color ? 'GRADED' : 'SUBMITTED' },
  });
  return color;
}
