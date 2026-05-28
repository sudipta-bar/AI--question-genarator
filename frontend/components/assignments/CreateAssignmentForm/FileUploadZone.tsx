'use client';

import { useDropzone } from 'react-dropzone';
import { useAssignmentStore } from '@/store/assignmentStore';
import { Button } from '@/components/ui/Button';

export function FileUploadZone() {
  const { file, setFile } = useAssignmentStore();
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    noClick: true,
    onDrop: ([accepted]) => setFile(accepted ?? null),
  });
  return (
    <div>
      <div {...getRootProps()} className={`rounded-lg border-2 border-dashed bg-[var(--bg)] p-8 text-center transition ${isDragActive ? 'border-[var(--primary)]' : 'border-[var(--border)]'}`}>
        <input {...getInputProps()} />
        <div className="text-3xl text-[#9CA3AF]">☁</div>
        <div className="mt-3 text-sm font-semibold">Choose a file or drag & drop it here</div>
        <div className="mt-1 text-xs text-[var(--muted)]">PDF, JPEG, PNG, upto 10MB</div>
        <Button type="button" variant="outline" className="mt-4 h-9 rounded-md px-5 text-[13px]" onClick={open}>Browse Files</Button>
      </div>
      {file ? <div className="mt-3 flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"><span>{file.name} - {(file.size / 1024 / 1024).toFixed(2)}MB</span><button type="button" className="rounded-md px-2 py-1 text-[var(--danger)] hover:bg-[var(--surface-subtle)] active:scale-[0.95]" onClick={() => setFile(null)}>x</button></div> : null}
      <p className="mt-2 text-center text-xs text-[var(--muted)]">Upload images of your preferred document/image</p>
    </div>
  );
}
