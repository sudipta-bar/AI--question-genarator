import fs from 'fs/promises';
import pdf from 'pdf-parse';

function cleanExtractedText(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([.,])([A-Za-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractTextFromFile(filePath: string, mimetype?: string) {
  if (mimetype === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
    const buffer = await fs.readFile(filePath);
    const result = await pdf(buffer);
    return cleanExtractedText(result.text).slice(0, 8000);
  }
  return 'Image reference uploaded. OCR is not configured in this deployment; generate questions using assignment details and special instructions.';
}
