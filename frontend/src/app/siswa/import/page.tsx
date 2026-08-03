'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { ImportResult } from '@/types';

export default function ImportSiswaPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
  });

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_import_siswa.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template berhasil diunduh!');
    } catch (error) {
      toast.error('Gagal mengunduh template.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/import/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      if (res.data.success > 0) {
        toast.success(`${res.data.success} siswa berhasil diimport!`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memproses file.');
      setResult({
        message: error?.message || 'Gagal memproses file.',
        success: 0,
        errors: error?.errors ? Object.values(error.errors).flat() as string[] : ['File tidak sesuai format template.'],
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/siswa')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-800">Import Data Siswa</h1>
          <p className="text-stone-500 mt-1">Upload file Excel untuk memasukkan data siswa secara massal</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Step 1: Download Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="w-7 h-7 bg-emerald-700 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Unduh Template Excel
            </CardTitle>
            <CardDescription>
              Download template terlebih dahulu, lalu isi sesuai kolom yang tersedia. Jangan mengubah header kolom.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Button variant="secondary" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template (.xlsx)
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Upload File */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="w-7 h-7 bg-emerald-700 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Upload File Excel
            </CardTitle>
            <CardDescription>
              Upload file Excel yang sudah diisi. Maksimal 10MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-gold-500 bg-gold-50' : 'border-stone-300 hover:border-gold-400 hover:bg-cream-50'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet className="w-12 h-12 text-emerald-600" />
                  <div>
                    <p className="font-medium text-slate-800">{selectedFile.name}</p>
                    <p className="text-xs text-stone-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <p className="text-xs text-stone-400">Klik atau tarik file baru untuk mengganti</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <UploadCloud className={`w-12 h-12 ${isDragActive ? 'text-gold-500' : 'text-stone-400'}`} />
                  <p className="text-sm text-slate-700">
                    {isDragActive ? 'Lepaskan file di sini' : 'Tarik & lepas file Excel, atau klik untuk memilih'}
                  </p>
                  <p className="text-xs text-stone-500">Format: .xlsx, .xls (Maks. 10MB)</p>
                </div>
              )}
            </div>

            {selectedFile && !result && (
              <Button variant="primary" onClick={handleUpload} isLoading={uploading} className="w-full">
                {uploading ? 'Memproses...' : 'Proses Import'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Hasil Import */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="w-7 h-7 bg-emerald-700 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Hasil Import
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-700">{result.success}</p>
                    <p className="text-xs text-emerald-600">Berhasil</p>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-1">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
                      <p className="text-xs text-red-600">Gagal</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Details */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">Detail Error:</h4>
                  <ul className="space-y-1">
                    {result.errors.map((err, idx) => (
                      <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                        <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="primary" onClick={() => router.push('/siswa')}>
                  Lihat Data Siswa
                </Button>
                <Button variant="secondary" onClick={() => { setResult(null); setSelectedFile(null); }}>
                  Import Lagi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
