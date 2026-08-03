'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import api from '@/lib/api';

interface FileDropzoneProps {
  studentId: string;
  docType: string;
  onSuccess?: () => void;
  className?: string;
}

export default function FileDropzone({ studentId, docType, onSuccess, className }: FileDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2MB.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);

    try {
      await api.post(`/students/${studentId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Gagal mengupload file.');
    } finally {
      setUploading(false);
    }
  }, [studentId, docType, onSuccess]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          'dropzone',
          isDragActive && 'dropzone-active',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-3" />
            <p className="text-sm text-slate-700 font-medium">Mengupload dokumen...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <UploadCloud className={cn("w-10 h-10 mb-3", isDragActive ? "text-gold-500" : "text-stone-400")} />
            <p className="text-sm text-slate-700 mb-1">
              {isDragActive ? 'Lepaskan file di sini' : 'Tarik & lepas file di sini, atau klik untuk memilih'}
            </p>
            <p className="text-xs text-stone-500">
              Format: PDF, JPG, PNG (Maks. 2MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
          <X className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
}
