'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAssignmentStore } from '@/store/assignmentStore';

export function FileUploadZone() {
  const { file, setFile } = useAssignmentStore();
  const [dragging, setDragging] = useState(false);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    noClick: true,
    onDrop: ([accepted]) => {
      setDragging(false);
      setFile(accepted ?? null);
    },
  });

  return (
    <div>
      <div
        {...getRootProps({
          onDragOver: () => setDragging(true),
          onDragLeave: () => setDragging(false),
          onDrop: () => setDragging(false),
        })}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-[250ms] hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] sm:p-9 ${dragging || isDragActive ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]' : 'border-[var(--border-strong)] bg-[var(--surface-subtle)]'}`}
      >
        <input {...getInputProps()} />
        <CloudUpload className="mx-auto h-8 w-8 text-[var(--muted)]" />
        <div className="mt-4 text-sm font-medium text-[var(--text)]">Choose a file or drag & drop here</div>
        <div className="mt-1 text-xs text-[var(--muted)]">PDF, JPEG, PNG, upto 10MB</div>
        <Button type="button" variant="outline" className="mt-5 h-[36px] min-h-0 rounded-lg px-4 py-0 text-xs font-medium shadow-none" onClick={open}>Browse Files</Button>
      </div>
      {file ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm">
          <span>{file.name} - {(file.size / 1024 / 1024).toFixed(2)}MB</span>
          <button type="button" className="rounded-full px-2 py-1 text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] active:scale-[0.95]" onClick={() => setFile(null)}>x</button>
        </div>
      ) : null}
      <p className="mt-3 text-center text-xs text-[var(--muted)]">Upload images of your preferred document/image</p>
    </div>
  );
}
