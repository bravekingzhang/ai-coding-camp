import { Queue } from 'bullmq';

// 传连接配置而非 ioredis 实例，规避 bullmq 内嵌 ioredis 与顶层 ioredis 的类型冲突
export const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  maxRetriesPerRequest: null,
};

export const gradeLlmQueue = new Queue('grade-llm', { connection });
