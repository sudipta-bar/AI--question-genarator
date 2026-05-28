export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Question paper element not found');
  const hidden = Array.from(document.querySelectorAll<HTMLElement>('.no-print, .sidebar, .topbar'));
  const previous = hidden.map((node) => node.style.display);
  hidden.forEach((node) => (node.style.display = 'none'));
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save();
  } finally {
    hidden.forEach((node, index) => (node.style.display = previous[index]));
  }
}

export async function createPdfBlob(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Question paper element not found');
  const hidden = Array.from(document.querySelectorAll<HTMLElement>('.no-print, .sidebar, .topbar'));
  const previous = hidden.map((node) => node.style.display);
  hidden.forEach((node) => (node.style.display = 'none'));
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    return await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .outputPdf('blob');
  } finally {
    hidden.forEach((node, index) => (node.style.display = previous[index]));
  }
}
