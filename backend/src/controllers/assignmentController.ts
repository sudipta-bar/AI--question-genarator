import { Response } from 'express';
import fs from 'fs/promises';
import https from 'https';
import { IncomingMessage } from 'http';
import { z } from 'zod';
import { cacheRedis, redis } from '../config/redis.js';
import { Assignment } from '../models/Assignment.js';
import { GeneratedPaper } from '../models/GeneratedPaper.js';
import { User } from '../models/User.js';
import { enqueueGeneration, removeWaitingGenerationJobs } from '../queues/generationQueue.js';
import { uploadPdfToCloudinary } from '../services/cloudinaryService.js';
import { extractTextFromFile } from '../services/fileService.js';
import { deleteFromCloudinary, generateAndUploadPDF, PaperData } from '../services/pdfService.js';
import { AuthRequest } from '../types/index.js';

const questionTypeSchema = z.object({ type: z.string().min(1), count: z.number().int().min(1).max(50), marks: z.number().int().min(1).max(100) });
const createSchema = z.object({ subject: z.string().min(1), className: z.string().min(1), dueDate: z.string().optional(), questionTypes: z.string(), additionalInfo: z.string().optional() });

async function ownedAssignment(id: string, userId: string) {
  return Assignment.findOne({ _id: id, teacherId: userId });
}

function normalizePaperForResponse(paper: any) {
  const plain = typeof paper.toObject === 'function' ? paper.toObject() : paper;
  return {
    ...plain,
    sections: Array.isArray(plain.sections) ? plain.sections.map((section: any) => ({
      ...section,
      questions: Array.isArray(section.questions) ? section.questions.map((question: any, index: number) => ({
        ...question,
        questionNumber: question.questionNumber ?? question.number ?? index + 1,
        question: question.question ?? question.text ?? 'Question text missing',
        answer: question.answer ?? 'Answer not provided.',
      })) : [],
    })) : [],
  };
}

function pdfFilename(subject?: string) {
  return `${subject || 'vedaai'}-question-paper.pdf`.replace(/[^a-zA-Z0-9.-]/g, '-');
}

function assignmentPdfMeta(assignment: any) {
  return {
    pdfUrl: assignment.pdfUrl,
    publicId: assignment.pdfPublicId ?? assignment.publicId,
    pdfDownloadUrl: assignment.pdfDownloadUrl ?? assignment.pdfUrl,
    pdfResourceType: assignment.pdfResourceType,
    pdfGeneratedAt: assignment.pdfGeneratedAt,
  };
}

function paperDataFromRecords(paper: any, assignment: any): PaperData {
  const plainPaper = typeof paper.toObject === 'function' ? paper.toObject() : paper;
  return {
    schoolName: plainPaper.schoolName || assignment.schoolName || 'School',
    subject: plainPaper.subject || assignment.subject,
    className: plainPaper.className || assignment.className,
    timeAllowed: plainPaper.timeAllowed || '90 minutes',
    maxMarks: plainPaper.maxMarks ?? assignment.totalMarks ?? 0,
    instructions: plainPaper.instructions || 'All questions are compulsory.',
    sections: plainPaper.sections ?? [],
  };
}

async function findGeneratedPaper(assignmentId: string) {
  let paper = await GeneratedPaper.findOne({ assignmentId });
  if (!paper) {
    const cached = await cacheRedis.get(`paper:${assignmentId}`);
    if (cached) paper = JSON.parse(cached);
  }
  return paper;
}

async function ensureAssignmentPdf(assignment: any, assignmentId: string) {
  if (assignment.pdfUrl) {
    console.info('[PDF Download] pdf URL found', {
      assignmentId,
      secureUrl: assignment.pdfUrl,
      publicId: assignment.pdfPublicId ?? assignment.publicId,
      resourceType: assignment.pdfResourceType,
    });
    return assignment.pdfUrl as string;
  }

  const paper = await findGeneratedPaper(assignmentId);
  if (!paper) {
    const notReady = assignment.status === 'queued' || assignment.status === 'processing';
    const error = new Error(notReady ? 'Question paper is still being generated.' : 'Question paper data is missing. Regenerate the assignment and try again.');
    (error as any).statusCode = notReady ? 202 : 409;
    throw error;
  }

  const { url, publicId, resourceType, type } = await generateAndUploadPDF(paperDataFromRecords(paper, assignment), assignmentId);
  assignment.pdfUrl = url;
  assignment.publicId = publicId;
  assignment.pdfPublicId = publicId;
  assignment.pdfDownloadUrl = url;
  assignment.pdfResourceType = resourceType;
  assignment.pdfGeneratedAt = new Date();
  await assignment.save();

  console.info('[PDF Download] generated and saved Cloudinary PDF', {
    assignmentId,
    resourceType,
    type,
    secureUrl: url,
    publicId,
  });

  return url;
}

function proxyCloudinaryPdf(url: string, res: Response, filename: string, assignmentId: string): Promise<boolean> {
  return new Promise((resolve) => {
    https
      .get(url, (cloudinaryResponse: IncomingMessage) => {
        const statusCode = cloudinaryResponse.statusCode ?? 500;
        if (statusCode >= 400) {
          console.error('[PDF Download] Cloudinary fetch failed', { assignmentId, statusCode, url });
          cloudinaryResponse.resume();
          resolve(false);
          return;
        }

        console.info('[PDF Download] streaming PDF to frontend', {
          assignmentId,
          statusCode,
          contentType: cloudinaryResponse.headers['content-type'],
          contentLength: cloudinaryResponse.headers['content-length'],
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        cloudinaryResponse.pipe(res);
        cloudinaryResponse.on('end', () => resolve(true));
        cloudinaryResponse.on('error', (error) => {
          console.error('[PDF Download] Cloudinary stream error', { assignmentId, message: error.message });
          resolve(false);
        });
      })
      .on('error', (error) => {
        console.error('[PDF Download] Cloudinary request error', { assignmentId, message: error.message });
        resolve(false);
      });
  });
}

export async function createAssignment(req: AuthRequest, res: Response) {
  const input = createSchema.parse(req.body);
  const questionTypes = z.array(questionTypeSchema).parse(JSON.parse(input.questionTypes));
  const file = req.file;
  const user = await User.findById(req.userId);
  let fileText = '';
  if (file) {
    try {
      fileText = await extractTextFromFile(file.path, file.mimetype);
    } finally {
      await fs.unlink(file.path).catch(() => undefined);
    }
  }
  const totalQuestions = questionTypes.reduce((sum, row) => sum + row.count, 0);
  const totalMarks = questionTypes.reduce((sum, row) => sum + row.count * row.marks, 0);
  const assignment = await Assignment.create({
    teacherId: req.userId,
    schoolName: user?.schoolName ?? '',
    subject: input.subject,
    className: input.className,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    fileText,
    questionTypes,
    additionalInfo: input.additionalInfo ?? '',
    totalQuestions,
    totalMarks,
    status: 'queued',
  });
  const job = await enqueueGeneration(assignment._id.toString());
  assignment.jobId = job.id;
  await assignment.save();
  return res.status(201).json({ success: true, assignmentId: assignment._id.toString(), jobId: job.id, status: 'queued' });
}

export async function uploadGeneratedPdf(req: AuthRequest, res: Response) {
  const assignment = await ownedAssignment(req.params.id, req.userId ?? '');
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

  try {
    const uploaded = await uploadPdfToCloudinary(req.file.path, req.file.originalname);
    assignment.pdfUrl = uploaded.secureUrl;
    assignment.publicId = uploaded.publicId;
    assignment.pdfPublicId = uploaded.publicId;
    assignment.pdfDownloadUrl = uploaded.secureUrl;
    assignment.pdfResourceType = uploaded.resourceType;
    assignment.pdfGeneratedAt = new Date();
    await assignment.save();
    await fs.unlink(req.file.path);
    console.log('[PDF] Local temporary file deleted', { localPdfPath: req.file.path });
    return res.json({ pdfUrl: uploaded.secureUrl, publicId: uploaded.publicId, downloadUrl: uploaded.secureUrl, resourceType: uploaded.resourceType });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cloudinary PDF upload failed';
    console.error('[cloudinary] pdf upload failed', { assignmentId: req.params.id, message });
    return res.status(500).json({ message });
  }
}

export async function getPdfDownloadUrl(req: AuthRequest, res: Response) {
  try {
    console.info('[PDF Download] route hit', { assignmentId: req.params.id, userId: req.userId });
    const assignment = await ownedAssignment(req.params.id, req.userId ?? '');
    if (!assignment) {
      return res.status(404).json({
        code: 'ASSIGNMENT_NOT_FOUND',
        error: 'Assignment not found for this user.',
      });
    }

    console.info('[PDF Download] assignment found', { assignmentId: req.params.id, status: assignment.status });

    const filename = pdfFilename(assignment.subject);
    let pdfUrl = await ensureAssignmentPdf(assignment, req.params.id);
    console.info('[PDF Download] proxying Cloudinary PDF', { assignmentId: req.params.id, pdfUrl });

    const streamed = await proxyCloudinaryPdf(pdfUrl, res, filename, req.params.id);
    if (streamed || res.headersSent) return;

    console.warn('[PDF Download] stored Cloudinary URL failed; regenerating PDF once', { assignmentId: req.params.id, pdfUrl });
    assignment.pdfUrl = null;
    assignment.pdfDownloadUrl = null;
    assignment.pdfPublicId = null;
    assignment.publicId = null;
    assignment.pdfResourceType = null;
    assignment.pdfGeneratedAt = null;
    pdfUrl = await ensureAssignmentPdf(assignment, req.params.id);

    const retryStreamed = await proxyCloudinaryPdf(pdfUrl, res, filename, req.params.id);
    if (retryStreamed || res.headersSent) return;

    return res.status(502).json({ error: 'Could not fetch PDF from Cloudinary after regeneration.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.';
    const statusCode = typeof (error as any)?.statusCode === 'number' ? (error as any).statusCode : 500;
    console.error('[PDF Download] Error:', { assignmentId: req.params.id, message, error });
    return res.status(statusCode).json({ error: message, details: message });
  }
}

export async function regeneratePdf(req: AuthRequest, res: Response) {
  try {
    const assignment = await ownedAssignment(req.params.id, req.userId ?? '');
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const oldPublicId = assignment.pdfPublicId ?? assignment.publicId;
    if (oldPublicId) await deleteFromCloudinary(oldPublicId).catch((error) => console.warn('[PDF Generate] old PDF delete failed:', error));

    const paper = await GeneratedPaper.findOne({ assignmentId: req.params.id });
    if (!paper) return res.status(404).json({ error: 'No generated paper found' });

    const { url, publicId, resourceType, type } = await generateAndUploadPDF(paperDataFromRecords(paper, assignment), req.params.id);

    assignment.pdfUrl = url;
    assignment.publicId = publicId;
    assignment.pdfPublicId = publicId;
    assignment.pdfDownloadUrl = url;
    assignment.pdfResourceType = resourceType;
    assignment.pdfGeneratedAt = new Date();
    await assignment.save();

    console.info('[PDF Generate] generated Cloudinary PDF URL', { assignmentId: req.params.id, resourceType, type, secureUrl: url, publicId });
    console.info('[PDF Generate] returning download URL to frontend', { assignmentId: req.params.id, url });
    return res.json({ success: true, url, pdfUrl: url, publicId, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF generation failed';
    console.error('[PDF Generate] Error:', { assignmentId: req.params.id, message, error });
    return res.status(500).json({ error: message });
  }
}

export async function listAssignments(req: AuthRequest, res: Response) {
  const assignments = await Assignment.find({ teacherId: req.userId }).sort({ createdAt: -1 });
  return res.json({ assignments });
}

export async function getAssignment(req: AuthRequest, res: Response) {
  const assignment = await ownedAssignment(req.params.id, req.userId ?? '');
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  return res.json({ assignment });
}

export async function getPaper(req: AuthRequest, res: Response) {
  const assignment = await ownedAssignment(req.params.id, req.userId ?? '');
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  if (assignment.status === 'queued' || assignment.status === 'processing') {
    return res.status(202).json({ status: assignment.status, message: 'Question paper is still being generated' });
  }
  if (assignment.status === 'failed') {
    return res.status(409).json({ status: assignment.status, message: 'Question paper generation failed' });
  }
  const cached = await cacheRedis.get(`paper:${req.params.id}`);
  const responseAssignment = assignmentPdfMeta(assignment);
  if (cached) return res.json({ paper: normalizePaperForResponse(JSON.parse(cached)), assignment: responseAssignment });
  const paper = await GeneratedPaper.findOne({ assignmentId: req.params.id });
  if (!paper) return res.status(404).json({ message: 'Paper not found' });
  const normalizedPaper = normalizePaperForResponse(paper);
  await cacheRedis.set(`paper:${req.params.id}`, JSON.stringify(normalizedPaper), 'EX', 3600);
  return res.json({ paper: normalizedPaper, assignment: responseAssignment });
}

export async function regenerate(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.userId;

  const assignment = await Assignment.findOne({
    _id: id,
    teacherId: userId,
  });
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  await GeneratedPaper.deleteOne({ assignmentId: id });
  await redis.del(`paper:${id}`);
  await removeWaitingGenerationJobs(id);

  const nextRegenerateCount = assignment.regenerateCount + 1;
  await Assignment.findByIdAndUpdate(id, {
    status: 'queued',
    regenerateCount: nextRegenerateCount,
  });

  const job = await enqueueGeneration(id, `regen:${nextRegenerateCount}`);

  await Assignment.findByIdAndUpdate(id, { jobId: job.id });

  return res.json({
    success: true,
    jobId: job.id,
    assignmentId: id,
    status: 'queued',
  });
}

export async function deleteAssignment(req: AuthRequest, res: Response) {
  const assignment = await ownedAssignment(req.params.id, req.userId ?? '');
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  await removeWaitingGenerationJobs(req.params.id);
  await assignment.deleteOne();
  await GeneratedPaper.deleteOne({ assignmentId: req.params.id });
  await cacheRedis.del(`paper:${req.params.id}`);
  return res.json({ message: 'Assignment deleted' });
}
