import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { Assignment } from '../models/Assignment.js';

export const generationQueue = new Queue('question-paper-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
    removeOnFail: { age: 60 * 60 * 24 * 7, count: 1000 },
  },
});

export async function enqueueGeneration(assignmentId: string, runId = 'initial') {
  const safeRunId = runId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const jobId = `assignment-${assignmentId}-${safeRunId}`;
  const existing = await generationQueue.getJob(jobId);
  if (existing) return existing;
  return generationQueue.add('generate', { assignmentId }, { jobId });
}

export async function removeWaitingGenerationJobs(assignmentId: string) {
  const jobs = await generationQueue.getJobs(['waiting', 'delayed', 'prioritized', 'paused']);
  await Promise.all(
    jobs
      .filter((job) => job.data?.assignmentId === assignmentId)
      .map((job) => job.remove().catch(() => undefined)),
  );
}

export async function cleanupStaleGenerationJobs() {
  const jobs = await generationQueue.getJobs(['waiting', 'delayed', 'prioritized', 'paused', 'failed']);
  let removed = 0;

  for (const job of jobs) {
    const assignmentId = job.data?.assignmentId;
    if (!assignmentId) continue;

    const exists = await Assignment.exists({ _id: assignmentId });
    if (!exists) {
      await job.remove().catch(() => undefined);
      removed += 1;
    }
  }

  if (removed > 0) {
    console.info('[generation-queue] removed stale jobs for deleted assignments', { removed });
  }
}
