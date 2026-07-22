import { prisma } from '../../lib/db';
import { llm } from '../../lib/adapters/llm';
import { notify } from '../../lib/adapters/im';
import { appendGradeEvent } from '../../lib/domain/grade';

const RUBRIC_OF: Record<string, string> = {
  'c1-06': 'rubrics/spec-quality.yaml',
  'c2-02': 'rubrics/spec-quality.yaml',
  'c2-04': 'rubrics/review-quality.yaml',
  'c3-02': 'rubrics/skill-quality.yaml',
};

export async function runLlmRubric(data: { attemptId: string; labCode: string }) {
  const rubricPath = RUBRIC_OF[data.labCode] ?? 'rubrics/spec-quality.yaml';
  const attempt = await prisma.labAttempt.findUnique({
    where: { id: data.attemptId },
    include: { enrollment: { include: { user: true } } },
  });
  if (!attempt) return;

  const result = await llm.evaluate(rubricPath, { mrUrl: attempt.mrUrl ?? undefined });
  const sampled = Math.random() < 0.2; // 20% 进教练校准队列

  await prisma.rubricEvaluation.create({
    data: {
      attemptId: attempt.id, rubricPath,
      model: process.env.LLM_MODE === 'gateway' ? 'gateway' : 'mock',
      scores: result as object, preColor: result.preColor, sampled,
    },
  });
  await appendGradeEvent({
    attemptId: attempt.id, source: 'LLM', color: result.preColor, score: result.score,
    payload: { rubricPath, items: result.items, sampled },
  });
  await notify(
    `🤖 LLM 预评 ${data.labCode}（${attempt.enrollment.user.name}）：${result.preColor} ${result.score}分` +
    (sampled ? '（已抽样，待教练校准）' : ''),
  );
}
