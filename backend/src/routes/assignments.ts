import { Router } from 'express';
import { createAssignment, deleteAssignment, getAssignment, getPaper, getPdfDownloadUrl, listAssignments, regenerate, regeneratePdf, uploadGeneratedPdf } from '../controllers/assignmentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { pdfUpload, upload } from '../middleware/upload.js';

export const assignmentsRouter = Router();

assignmentsRouter.use(authenticate);
assignmentsRouter.post('/', upload.single('file'), createAssignment);
assignmentsRouter.get('/', listAssignments);
assignmentsRouter.get('/:id/pdf/download', getPdfDownloadUrl);
assignmentsRouter.post('/:id/pdf/regenerate', regeneratePdf);
assignmentsRouter.post('/:id/pdf', pdfUpload.single('pdf'), uploadGeneratedPdf);
assignmentsRouter.get('/:id/paper', getPaper);
assignmentsRouter.post('/:id/regenerate', regenerate);
assignmentsRouter.get('/:id', getAssignment);
assignmentsRouter.delete('/:id', deleteAssignment);
