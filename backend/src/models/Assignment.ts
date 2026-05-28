import mongoose, { Schema } from 'mongoose';

const AssignmentSchema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  schoolName: String,
  subject: { type: String, required: true },
  className: { type: String, required: true },
  dueDate: Date,
  fileUrl: String,
  fileText: String,
  pdfUrl: { type: String, default: null },
  publicId: { type: String, default: null },
  pdfPublicId: { type: String, default: null },
  pdfDownloadUrl: { type: String, default: null },
  pdfResourceType: { type: String, default: null },
  pdfGeneratedAt: { type: Date, default: null },
  questionTypes: [{ type: { type: String, required: true }, count: { type: Number, required: true, min: 1 }, marks: { type: Number, required: true, min: 1 } }],
  additionalInfo: { type: String, default: '' },
  totalQuestions: Number,
  totalMarks: Number,
  regenerateCount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'queued', 'processing', 'completed', 'failed'], default: 'draft' },
  jobId: String,
  createdAt: { type: Date, default: Date.now },
});

export const Assignment = mongoose.model('Assignment', AssignmentSchema);
