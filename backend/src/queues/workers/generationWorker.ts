import { Worker } from 'bullmq';
import { cacheRedis, redis, redisConnection } from '../../config/redis.js';
import { Assignment } from '../../models/Assignment.js';
import { GeneratedPaper } from '../../models/GeneratedPaper.js';
import { generatePaper } from '../../services/aiService.js';
import { extractTextFromFile } from '../../services/fileService.js';
import { generateAndUploadPDF, PaperData } from '../../services/pdfService.js';
import { emitProgress } from '../../services/socketService.js';

type GenerationStage = 'queued' | 'generating' | 'formatting' | 'completed' | 'failed';

class StaleGenerationJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StaleGenerationJobError';
  }
}

async function publishStage(job: { updateProgress: (progress: number | object) => Promise<void> }, assignmentId: string, stage: GenerationStage, progress: number, message: string, extra: Record<string, unknown> = {}) {
  const payload = { assignmentId, stage, progress, message, ...extra };
  await job.updateProgress(payload);
  emitProgress(assignmentId, stage, payload);

  if (stage === 'queued') emitProgress(assignmentId, 'job:queued', payload);
  if (stage === 'generating' || stage === 'formatting') emitProgress(assignmentId, 'job:processing', payload);
  if (stage === 'completed') emitProgress(assignmentId, 'job:completed', payload);
  if (stage === 'failed') emitProgress(assignmentId, 'job:failed', payload);
}

export function startGenerationWorker() {
  const worker = new Worker('question-paper-generation', async (job) => {
    const assignmentId = job.data.assignmentId as string;
    console.info('[generation-worker] started', { assignmentId, jobId: job.id, attempt: job.attemptsMade + 1 });
    try {
      const assignment = await Assignment.findById(assignmentId).lean();
      if (!assignment) {
        throw new StaleGenerationJobError(`Assignment ${assignmentId} not found`);
      }

      const lockKey = `generation:lock:${assignmentId}`;
      const lockValue = String(job.id ?? Date.now());
      const locked = await redis.set(lockKey, lockValue, 'EX', 15 * 60, 'NX');
      if (!locked) {
        console.warn('[generation-worker] skipped duplicate active job', { assignmentId, jobId: job.id });
        return { skipped: true, reason: 'Generation already in progress for this assignment.' };
      }

      try {
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
        await publishStage(job, assignmentId, 'queued', 10, 'Assignment queued for generation.');
        if (assignment.fileUrl && !assignment.fileText) {
          await publishStage(job, assignmentId, 'generating', 25, 'Processing uploaded file...');
          assignment.fileText = await extractTextFromFile(assignment.fileUrl);
          await Assignment.findByIdAndUpdate(assignmentId, { fileText: assignment.fileText });
        } else {
          await publishStage(job, assignmentId, 'generating', 25, 'Preparing generation context...');
        }
        await publishStage(job, assignmentId, 'generating', 40, 'Building question prompt...');

        const startTime = Date.now();
        await publishStage(job, assignmentId, 'generating', 55, 'AI is generating questions...');
        const paper = await generatePaper(assignment);
        const timeTaken = Date.now() - startTime;

        console.info('[generation-worker] ai response parsed', { assignmentId, timeTaken, sections: paper.sections.length });
        await publishStage(job, assignmentId, 'generating', 68, 'Structuring sections...');
        await publishStage(job, assignmentId, 'formatting', 82, 'Formatting structured question paper...');
        await publishStage(job, assignmentId, 'formatting', 92, 'Saving assignment...');

        const saved = await GeneratedPaper.findOneAndUpdate({ assignmentId }, { assignmentId, schoolName: assignment.schoolName, subject: assignment.subject, className: assignment.className, maxMarks: assignment.totalMarks, ...paper, generatedAt: new Date() }, { upsert: true, new: true });

        await cacheRedis.set(`paper:${assignmentId}`, JSON.stringify(saved), 'EX', 3600);

        try {
          await publishStage(job, assignmentId, 'formatting', 94, 'Generating PDF...');
          const savedPaper = saved.toObject();
          const { url, publicId, resourceType, type } = await generateAndUploadPDF(
            {
              schoolName: savedPaper.schoolName || assignment.schoolName || undefined,
              subject: savedPaper.subject || assignment.subject || undefined,
              className: savedPaper.className || assignment.className || undefined,
              timeAllowed: savedPaper.timeAllowed || '90 minutes',
              maxMarks: savedPaper.maxMarks ?? assignment.totalMarks ?? undefined,
              instructions: savedPaper.instructions || 'All questions are compulsory.',
              sections: JSON.parse(JSON.stringify(savedPaper.sections ?? [])) as PaperData['sections'],
            },
            assignmentId,
          );

          await Assignment.findByIdAndUpdate(assignmentId, {
            status: 'completed',
            pdfUrl: url,
            publicId,
            pdfPublicId: publicId,
            pdfDownloadUrl: url,
            pdfResourceType: resourceType,
            pdfGeneratedAt: new Date(),
          });

          console.info('[generation-worker] pdf uploaded', { assignmentId, resourceType, type, secureUrl: url, publicId });
          await publishStage(job, assignmentId, 'completed', 100, 'Question paper generated.', { paperId: saved._id.toString(), pdfUrl: url });
        } catch (pdfError) {
          const pdfMessage = pdfError instanceof Error ? pdfError.message : 'PDF generation failed';
          console.error('[generation-worker] pdf generation failed', { assignmentId, jobId: job.id, message: pdfMessage, error: pdfError });
          await Assignment.findByIdAndUpdate(assignmentId, { status: 'completed' });
          await publishStage(job, assignmentId, 'completed', 100, 'Question paper generated. PDF can be generated on download.', { paperId: saved._id.toString(), pdfUrl: null });
        }

        console.info('[generation-worker] completed', { assignmentId, jobId: job.id });
      } finally {
        const currentLock = await redis.get(lockKey);
        if (currentLock === lockValue) await redis.del(lockKey);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      if (error instanceof StaleGenerationJobError) {
        console.warn('[generation-worker] skipped stale job', { assignmentId, jobId: job.id, message });
        return { skipped: true, reason: message };
      }
      console.error('[generation-worker] failed', { assignmentId, jobId: job.id, attempt: job.attemptsMade + 1, message, error });
      if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
        await publishStage(job, assignmentId, 'failed', 100, 'Question paper generation failed.', { error: message });
      }
      throw error;
    }
  }, { connection: redisConnection, concurrency: 3 });

  worker.on('ready', () => console.info('[generation-worker] ready'));
  worker.on('active', (job) => console.info('[generation-worker] job active', { jobId: job.id, assignmentId: job.data?.assignmentId }));
  worker.on('completed', (job) => console.info('[generation-worker] job completed', { jobId: job.id, assignmentId: job.data?.assignmentId }));
  worker.on('failed', (job, error) => console.error('[generation-worker] job failed', { jobId: job?.id, assignmentId: job?.data?.assignmentId, message: error.message }));
  worker.on('error', (error) => console.error('[generation-worker] worker error', { message: error.message, error }));

  return worker;
}
