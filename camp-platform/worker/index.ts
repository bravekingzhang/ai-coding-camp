import { Worker } from 'bullmq';
import { connection } from '../lib/queue';
import { runLlmRubric } from './jobs/llm-rubric';
import { reconcile } from './jobs/reconcile';

console.log('[worker] starting…');

new Worker('grade-llm', async (job) => runLlmRubric(job.data as { attemptId: string; labCode: string }), { connection });

// 每 10 分钟对账：SUBMITTED 超时无 CI 事件的提交（webhook 丢失兜底）
setInterval(() => reconcile().catch((e) => console.error('[reconcile]', e)), 10 * 60 * 1000);
reconcile().catch(() => {});

console.log('[worker] listening on queue grade-llm');
