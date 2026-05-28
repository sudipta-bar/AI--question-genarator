import { api, plainApi } from '@/lib/api';
import { createPdfBlob } from '@/lib/pdfExport';
import { useAuthStore } from '@/store/authStore';

export async function getCloudinaryPdfUrl(
  assignmentId: string,
): Promise<{ url: string; pdfUrl: string; cached: boolean; publicId?: string }> {
  if (!assignmentId || assignmentId === 'undefined') {
    throw new Error('Missing assignment id for PDF download');
  }
  const backendUrl = `/api/assignments/${assignmentId}/pdf/download`;
  return { url: backendUrl, pdfUrl: backendUrl, cached: true };
}

export async function regenerateCloudinaryPdf(
  assignmentId: string,
): Promise<{ url: string; pdfUrl: string; cached: boolean; publicId?: string }> {
  if (!assignmentId || assignmentId === 'undefined') {
    throw new Error('Missing assignment id for PDF generation');
  }
  await ensureAccessToken();
  const res = await api.post(`/api/assignments/${assignmentId}/pdf/regenerate`);
  return res.data;
}

export async function downloadPdf(
  url: string,
  filename: string,
): Promise<void> {
  const match = url.match(/\/api\/assignments\/([^/]+)\/pdf\/download$/);
  if (!match?.[1]) {
    throw new Error('PDF downloads must go through the backend assignment download route.');
  }

  await downloadAssignmentPdf(match[1], filename);
}

export async function downloadAssignmentPdf(
  assignmentId: string,
  filename: string,
): Promise<void> {
  if (!assignmentId || assignmentId === 'undefined') {
    throw new Error('Missing assignment id for PDF download');
  }

  await ensureAccessToken();
  const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const response = await api.get<Blob>(`/api/assignments/${assignmentId}/pdf/download`, {
    responseType: 'blob',
  });

  const headerContentType = response.headers['content-type'];
  const contentType = typeof headerContentType === 'string' ? headerContentType : 'application/pdf';
  const blob = new Blob([response.data], { type: contentType });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = pdfFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

export function openPdf(url: string): void {
  if (!url.includes('/api/assignments/') || !url.endsWith('/pdf/download')) {
    throw new Error('PDF preview must use the backend assignment download route.');
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function uploadRenderedPdf(assignmentId: string, elementId: string, filename: string) {
  const blob = await createPdfBlob(elementId);
  const formData = new FormData();
  formData.append('pdf', blob, filename);
  const { data } = await api.post<{ pdfUrl: string; publicId: string; downloadUrl: string; resourceType?: string }>(`/api/assignments/${assignmentId}/pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

async function ensureAccessToken() {
  const currentToken = useAuthStore.getState().accessToken;
  if (currentToken) return currentToken;

  const { data } = await plainApi.get('/api/auth/me');
  useAuthStore.getState().setAuth(data.user, data.accessToken);
  return data.accessToken as string;
}

export async function downloadStoredPdf(assignmentId: string, filename = 'vedaai-question-paper.pdf', _fallbackUrl?: string) {
  await downloadAssignmentPdf(assignmentId, filename);
}
