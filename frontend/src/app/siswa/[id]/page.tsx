'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Student, DocumentItem } from '@/types';
import { formatFileSize, maskNik, studentStatusLabel, formatDate } from '@/lib/utils';
import { ArrowLeft, Printer, FileText, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import FileDropzone from '@/components/ui/FileDropzone';
import Modal from '@/components/ui/Modal';

export default function DetailSiswaPage() {
  const { id } = useParams();
  const router = useRouter();
  const { canExport, hasRole, canViewSensitive } = useAuth();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  const fetchStudent = async () => {
    try {
      const res = await api.get(`/students/${id}`);
      setStudent(res.data.data);
    } catch (error) {
      console.error('Failed to load student', error);
      toast.error('Siswa tidak ditemukan');
      router.push('/siswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStudent();
  }, [id]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const res = await api.post(`/students/${id}/pdf`);
      toast.success(res.data.message);
      // Logic polling untuk download file akan ditangani oleh sistem notifikasi di versi real,
      // Untuk MVP kita beri notifikasi saja.
    } catch (error: any) {
      toast.error(error?.message || 'Gagal generate PDF');
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 animate-pulse">
          <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) return null;

  return (
    <DashboardLayout>
      {/* Header & Navigasi */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/siswa')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-800">{student.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-stone-500 text-sm">{student.nisn}</span>
              <Badge variant={student.student_status as any}>{studentStatusLabel(student.student_status)}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasRole('super_admin', 'admin_tu') && (
            <Button variant="secondary" onClick={handlePrint} isLoading={printing}>
              <Printer className="w-4 h-4 mr-2" />
              Cetak Buku Induk
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Profil Singkat */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-32 h-32 mx-auto bg-cream-100 rounded-full border-4 border-white shadow-warm-md flex items-center justify-center overflow-hidden mb-4">
                {student.documents?.find(d => d.doc_type === 'pas_foto')?.signed_url ? (
                  <img src={student.documents.find(d => d.doc_type === 'pas_foto')!.signed_url!} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-stone-300 font-serif">{student.name.charAt(0)}</span>
                )}
              </div>
              <h3 className="font-semibold text-lg text-slate-800">{student.name}</h3>
              <p className="text-stone-500 text-sm mb-4">Kelas: {student.current_class || 'Belum ada kelas'}</p>
              
              <div className="text-left text-sm space-y-3 pt-4 border-t border-stone-100">
                <div className="flex justify-between">
                  <span className="text-stone-500">Tahun Masuk</span>
                  <span className="font-medium">{student.tahun_masuk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">L/P</span>
                  <span className="font-medium">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">TTL</span>
                  <span className="font-medium text-right">{student.birth_place}, {formatDate(student.birth_date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail Tabs */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs
              tabs={[
                {
                  id: 'identitas',
                  label: 'Identitas Diri',
                  content: <TabIdentitas student={student} canViewSensitive={canViewSensitive} />,
                },
                {
                  id: 'keluarga',
                  label: 'Data Keluarga',
                  content: <TabKeluarga student={student} />,
                },
                {
                  id: 'akademik',
                  label: 'Riwayat Akademik',
                  content: <TabAkademik student={student} />,
                },
                {
                  id: 'dokumen',
                  label: 'Dokumen',
                  content: <TabDokumen student={student} onUploadSuccess={fetchStudent} hasRole={hasRole} />,
                },
              ]}
              className="p-1"
            />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Tab 1: Identitas ──
function TabIdentitas({ student, canViewSensitive }: { student: Student, canViewSensitive: boolean }) {
  return (
    <div className="p-5 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
        <div>
          <label className="text-xs text-stone-500 block mb-1">NIK</label>
          <div className="font-medium text-slate-800 bg-cream-50 px-3 py-1.5 rounded-md inline-block">
            {canViewSensitive ? student.nik : maskNik(student.nik)}
          </div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">NISN</label>
          <div className="font-medium text-slate-800">{student.nisn}</div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Anak Ke-</label>
          <div className="font-medium text-slate-800">{student.sibling_order} dari {student.total_siblings} bersaudara</div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Status Khusus</label>
          <div className="font-medium text-slate-800">{student.status?.join(', ') || '-'}</div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-stone-500 block mb-1">Riwayat Penyakit</label>
          <div className="font-medium text-slate-800">{student.medical_history || '-'}</div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Keluarga ──
function TabKeluarga({ student }: { student: Student }) {
  return (
    <div className="p-5 space-y-8">
      {/* Wali Alert */}
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-900 flex items-center gap-2">
        <span className="font-semibold">Penanggung Jawab (Wali):</span> {student.guardian_info?.label} ({student.guardian_info?.name})
      </div>

      {/* Grid Ortu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ayah */}
        <div>
          <h4 className="font-serif font-semibold text-slate-800 mb-4 border-b border-stone-100 pb-2">Ayah Kandung</h4>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-stone-50 pb-1">
              <dt className="text-stone-500">Nama</dt>
              <dd className="font-medium text-slate-800 text-right">{student.guardian_info?.type === 'ayah' ? student.guardian_info.name : '-'}</dd>
            </div>
            {/* Real implementation would map from student.parents relation, for MVP we use placeholder if missing */}
            <div className="flex justify-between border-b border-stone-50 pb-1">
              <dt className="text-stone-500">Pekerjaan</dt>
              <dd className="font-medium text-slate-800 text-right">{student.guardian_info?.type === 'ayah' ? student.guardian_info.occupation : '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-stone-50 pb-1">
              <dt className="text-stone-500">No. Telp</dt>
              <dd className="font-medium text-slate-800 text-right">{student.guardian_info?.type === 'ayah' ? student.guardian_info.phone : '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Ibu */}
        <div>
          <h4 className="font-serif font-semibold text-slate-800 mb-4 border-b border-stone-100 pb-2">Ibu Kandung</h4>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-stone-50 pb-1">
              <dt className="text-stone-500">Nama</dt>
              <dd className="font-medium text-slate-800 text-right">{student.guardian_info?.type === 'ibu' ? student.guardian_info.name : '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-stone-50 pb-1">
              <dt className="text-stone-500">Pekerjaan</dt>
              <dd className="font-medium text-slate-800 text-right">{student.guardian_info?.type === 'ibu' ? student.guardian_info.occupation : '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-stone-50 pb-1">
              <dt className="text-stone-500">No. Telp</dt>
              <dd className="font-medium text-slate-800 text-right">{student.guardian_info?.type === 'ibu' ? student.guardian_info.phone : '-'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Riwayat Akademik ──
function TabAkademik({ student }: { student: Student }) {
  if (!student.academic_timeline || student.academic_timeline.length === 0) {
    return <EmptyState title="Belum Ada Riwayat" description="Siswa belum ditempatkan di kelas manapun." className="py-8" />;
  }

  return (
    <div className="p-6">
      <div className="space-y-0">
        {student.academic_timeline.map((entry, idx) => (
          <div key={entry.id} className="timeline-item">
            <div className={`timeline-dot ${idx === 0 ? 'timeline-dot-active' : 'timeline-dot-complete'}`} />
            <div className="bg-cream-50 rounded-lg p-4 border border-stone-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-slate-800">Kelas {entry.class_name}</h4>
                  <p className="text-xs text-stone-500">Tahun Ajaran {entry.academic_year}</p>
                </div>
                <Badge variant={entry.status ? 'lulus' : 'default'}>{entry.status_label}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 4: Dokumen ──
function TabDokumen({ student, onUploadSuccess, hasRole }: { student: Student, onUploadSuccess: () => void, hasRole: any }) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const requiredDocs = [
    { type: 'pas_foto', label: 'Pas Foto 3x4' },
    { type: 'ijazah', label: 'Ijazah Sebelumnya' },
    { type: 'kk', label: 'Kartu Keluarga' },
    { type: 'akta_kelahiran', label: 'Akta Kelahiran' },
  ];

  return (
    <div className="p-5 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredDocs.map((docDef) => {
          const doc = student.documents?.find(d => d.doc_type === docDef.type);
          const isComplete = !!doc;

          return (
            <div key={docDef.type} className={`border rounded-xl p-4 transition-colors ${isComplete ? 'border-emerald-200 bg-emerald-50/30' : 'border-stone-200 bg-white'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FileText className={`w-5 h-5 ${isComplete ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <div>
                    <h4 className="font-medium text-sm text-slate-800">{docDef.label}</h4>
                    <p className="text-xs text-stone-500">{isComplete ? formatFileSize(doc?.file_size) : 'Belum diunggah'}</p>
                  </div>
                </div>
                {isComplete && (
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setPreviewDoc(doc)}>
                    <Eye className="w-4 h-4 text-emerald-700" />
                  </Button>
                )}
              </div>

              {hasRole('super_admin', 'admin_tu') && !isComplete && (
                <div className="mt-2">
                  {selectedDoc === docDef.type ? (
                    <FileDropzone
                      studentId={student.id}
                      docType={docDef.type}
                      onSuccess={() => {
                        setSelectedDoc(null);
                        onUploadSuccess();
                      }}
                    />
                  ) : (
                    <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => setSelectedDoc(docDef.type)}>
                      Unggah Dokumen
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.doc_type_label || 'Preview Dokumen'}
        size="lg"
      >
        {previewDoc && (
          <div className="flex flex-col items-center">
            {previewDoc.mime_type?.startsWith('image/') ? (
              <img src={previewDoc.signed_url!} alt={previewDoc.original_filename} className="max-w-full rounded-lg" />
            ) : previewDoc.mime_type === 'application/pdf' ? (
              <iframe src={previewDoc.signed_url!} className="w-full h-[60vh] rounded-lg" />
            ) : (
              <p>Format tidak dapat dipreview. Silakan unduh.</p>
            )}
            
            <div className="mt-4 flex justify-between w-full">
              <a href={previewDoc.signed_url!} target="_blank" rel="noreferrer" className="text-emerald-700 text-sm font-medium hover:underline">
                Buka di Tab Baru
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
