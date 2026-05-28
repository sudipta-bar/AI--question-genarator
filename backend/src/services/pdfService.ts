import path from 'path';
import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';

interface PaperQuestion {
  questionNumber?: number;
  question?: string;
  number?: number;
  text?: string;
  options?: string[];
  difficulty?: string;
  marks?: number;
}

interface PaperSection {
  title?: string;
  questionType?: string;
  instruction?: string;
  questions?: PaperQuestion[];
}

export interface PaperData {
  schoolName?: string;
  subject?: string;
  className?: string;
  timeAllowed?: string;
  maxMarks?: number;
  instructions?: string;
  sections?: PaperSection[];
}

interface CloudinaryPdfUpload {
  secureUrl: string;
  publicId: string;
  resourceType?: string;
  type?: string;
}

export async function generateAndUploadPDF(paper: PaperData, assignmentId: string): Promise<{ url: string; publicId: string; resourceType?: string; type?: string }> {
  const localPdfPath = await generatePdfFile(paper, assignmentId);

  try {
    const uploaded = await uploadLocalPdfToCloudinary(localPdfPath, assignmentId);
    await fs.unlink(localPdfPath);
    console.log('[PDF] Local temporary file deleted', { localPdfPath });

    return {
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
      resourceType: uploaded.resourceType,
      type: uploaded.type,
    };
  } catch (error) {
    console.error('[PDF] Cloudinary upload failed; local PDF retained for inspection', {
      localPdfPath,
      message: error instanceof Error ? error.message : 'Unknown upload error',
    });
    throw error;
  }
}

async function generatePdfFile(paper: PaperData, assignmentId: string) {
  const pdfDir = path.resolve(env.UPLOAD_DIR, 'pdfs');
  await fs.ensureDir(pdfDir);

  const localPdfPath = path.join(pdfDir, `assignment-${assignmentId}.pdf`);
  console.log('[PDF] Local PDF generation path', { localPdfPath });

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });
    const output = fs.createWriteStream(localPdfPath);

    output.on('finish', resolve);
    output.on('error', reject);
    doc.on('error', reject);
    doc.pipe(output);

    writePaper(doc, paper);
    doc.end();
  });

  console.log('[PDF] Local PDF generated', { localPdfPath });
  return localPdfPath;
}

function writePaper(doc: PDFKit.PDFDocument, paper: PaperData) {
  const schoolName = paper.schoolName || 'School';
  const subject = paper.subject || 'Subject';
  const className = paper.className || 'Class';
  const timeAllowed = paper.timeAllowed || '90 minutes';
  const maxMarks = paper.maxMarks ?? 0;
  const instructions = paper.instructions || 'All questions are compulsory.';

  doc.font('Helvetica-Bold').fontSize(16).text(schoolName.toUpperCase(), { align: 'center' });
  doc.font('Helvetica').fontSize(12).text(`${subject} - ${className}`, { align: 'center' }).text('QUESTION PAPER', { align: 'center' });

  doc.moveDown(0.5);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke();
  doc.moveDown(0.5);

  const metaY = doc.y;
  doc.font('Helvetica').fontSize(11).text(`Time Allowed: ${timeAllowed}`, 60, metaY).text(`Maximum Marks: ${maxMarks}`, { align: 'right' });

  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#555555').text(instructions).fillColor('#000000');
  doc.moveDown(0.5);

  doc.fontSize(11).text('Name: _________________________________').moveDown(0.3).text('Roll Number: ________________').moveDown(0.3).text(`Class: ${className}   Section: __________`);

  doc.moveDown(0.5);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke();
  doc.moveDown(0.5);

  for (const section of paper.sections ?? []) {
    if (doc.y > 690) doc.addPage();

    doc.font('Helvetica-Bold').fontSize(13).text((section.title || 'Section').toUpperCase(), { align: 'center' });
    if (section.questionType) doc.font('Helvetica-Bold').fontSize(11).text(section.questionType, { align: 'center' });
    if (section.instruction) doc.font('Helvetica-Oblique').fontSize(10).fillColor('#555555').text(section.instruction, { align: 'center' }).fillColor('#000000');
    doc.moveDown(0.5);

    for (const [index, question] of (section.questions ?? []).entries()) {
      if (doc.y > 720) doc.addPage();

      const questionNumber = question.questionNumber ?? question.number ?? index + 1;
      const questionText = question.question ?? question.text ?? 'Question text missing';
      const difficulty = question.difficulty || 'Moderate';
      const marks = question.marks ?? 1;

      doc.font('Helvetica').fontSize(11).fillColor('#000000').text(`${questionNumber}. ${questionText}`, 60, doc.y, { width: 380 });
      doc.font('Helvetica').fontSize(9).fillColor(difficultyColor(difficulty)).text(`[${difficulty}] [${marks} Mark${marks === 1 ? '' : 's'}]`, { align: 'right' }).fillColor('#000000');

      if (question.options?.length) {
        doc.moveDown(0.2);
        for (const option of question.options) {
          doc.font('Helvetica').fontSize(10).text(`   ${option}`, { indent: 20 });
        }
      }

      doc.moveDown(0.4);
    }

    doc.moveDown(0.5);
  }

  if (doc.y > 720) doc.addPage();
  doc.font('Helvetica-Oblique').fontSize(10).fillColor('#555555').text('- End of Question Paper -', { align: 'center' });
}

async function uploadLocalPdfToCloudinary(localPdfPath: string, assignmentId: string): Promise<CloudinaryPdfUpload> {
  console.log('[PDF] Cloudinary upload start', { localPdfPath, assignmentId });
  const uploaded = await cloudinary.uploader.upload(localPdfPath, {
    folder: 'vedaai/question-papers',
    resource_type: 'raw',
    type: 'upload',
    access_mode: 'public',
    public_id: `assignment-${assignmentId}`,
    overwrite: true,
  });

  console.log('[PDF] Cloudinary upload success', {
    assignmentId,
    resourceType: uploaded.resource_type,
    type: uploaded.type,
    secureUrl: uploaded.secure_url,
    publicId: uploaded.public_id,
    uploadResponse: uploaded,
  });

  return {
    secureUrl: uploaded.secure_url,
    publicId: uploaded.public_id,
    resourceType: uploaded.resource_type,
    type: uploaded.type,
  };
}

function difficultyColor(difficulty: string) {
  const normalized = difficulty.toLowerCase();
  if (normalized === 'easy') return '#166534';
  if (normalized === 'moderate') return '#854D0E';
  return '#991B1B';
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'upload' });
}
