import mongoose, { Schema } from 'mongoose';

const GeneratedPaperSchema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, unique: true },
  schoolName: String,
  subject: String,
  className: String,
  timeAllowed: String,
  maxMarks: Number,
  instructions: String,
  sections: [{
    title: String,
    questionType: String,
    instruction: String,
    questions: [{
      questionNumber: Number,
      question: String,
      number: Number,
      text: String,
      options: [String],
      answer: String,
      difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'] },
      marks: Number,
    }],
  }],
  generatedAt: { type: Date, default: Date.now },
});

export const GeneratedPaper = mongoose.model('GeneratedPaper', GeneratedPaperSchema);
