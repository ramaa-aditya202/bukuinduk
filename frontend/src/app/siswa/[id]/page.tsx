'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Student, DocumentItem, ClassRoom, AcademicYear } from '@/types';
import { formatFileSize, maskNik, studentStatusLabel, formatDate } from '@/lib/utils';
import { ArrowLeft, Printer, FileText, Edit3, Eye, Trash2, RefreshCw, MapPin } from 'lucide-react';
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('aktif');
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  useEffect(() => {
    if (student) {
      setNewStatus(student.student_status);
    }
  }, [student]);

  // Cetak Buku Induk — direct PDF download
  const handlePrint = async () => {
    setPrinting(true);
    try {
      const res = await api.post(`/students/${id}/pdf`, {}, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `buku_induk_${student?.name?.replace(/\s+/g, '_') || 'siswa'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF berhasil diunduh!');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal generate PDF');
    } finally {
      setPrinting(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdatingStatus(true);
    try {
      await api.put(`/students/${id}`, {
        ...student,
        student_status: newStatus,
        father: student?.parents?.find(p => p.type === 'ayah') || {},
        mother: student?.parents?.find(p => p.type === 'ibu') || {},
        guardian: student?.parents?.find(p => p.type === 'wali') || {}
      });
      toast.success('Status siswa berhasil diubah!');
      setShowStatusModal(false);
      fetchStudent();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal mengubah status');
    } finally {
      setUpdatingStatus(false);
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
        
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {hasRole('super_admin', 'admin_tu') && (
            <Button variant="ghost" onClick={() => setShowStatusModal(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Ubah Status
            </Button>
          )}
          {hasRole('super_admin', 'admin_tu') && (
            <Button variant="ghost" onClick={() => router.push(`/siswa/${id}/edit`)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Data
            </Button>
          )}
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
                  id: 'alamat',
                  label: 'Alamat',
                  content: <TabAlamat student={student} />,
                },
                {
                  id: 'keluarga',
                  label: 'Data Keluarga',
                  content: <TabKeluarga student={student} />,
                },
                {
                  id: 'akademik',
                  label: 'Riwayat Akademik',
                  content: <TabAkademik student={student} hasRole={hasRole} onRefresh={fetchStudent} />,
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

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Ubah Status Siswa"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-500">Pilih status terbaru untuk siswa <strong>{student.name}</strong>.</p>
          <Select
            label="Status Siswa"
            options={[
              { label: 'Aktif', value: 'aktif' },
              { label: 'Lulus', value: 'lulus' },
              { label: 'Pindah', value: 'pindah' },
              { label: 'Keluar', value: 'keluar' },
              { label: 'Nonaktif', value: 'nonaktif' },
            ]}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setShowStatusModal(false)}>Batal</Button>
            <Button variant="primary" onClick={handleUpdateStatus} isLoading={updatingStatus}>Simpan Status</Button>
          </div>
        </div>
      </Modal>
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

// ── Tab 2: Alamat ──
function TabAlamat({ student }: { student: Student }) {
  const hasAddress = student.address_street || student.address_village || student.address_city;

  if (!hasAddress) {
    return (
      <div className="p-6">
        <EmptyState
          title="Alamat Belum Diisi"
          description="Data alamat tinggal belum tersedia. Silakan isi melalui menu Edit Data."
          className="py-8"
        />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-emerald-600" />
        <h4 className="font-serif font-semibold text-slate-800">Alamat Tinggal</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
        <div className="sm:col-span-2">
          <label className="text-xs text-stone-500 block mb-1">Jalan / Perumahan</label>
          <div className="font-medium text-slate-800">{student.address_street || '-'}</div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">RT</label>
          <div className="font-medium text-slate-800">{student.address_rt || '-'}</div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">RW</label>
          <div className="font-medium text-slate-800">{student.address_rw || '-'}</div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Kelurahan / Desa</label>
          <div className="font-medium text-slate-800">{student.address_village || '-'}</div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Kecamatan</label>
          <div className="font-medium text-slate-800">{student.address_district || '-'}</div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Kabupaten / Kota</label>
          <div className="font-medium text-slate-800">{student.address_city || '-'}</div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Provinsi</label>
          <div className="font-medium text-slate-800">{student.address_province || '-'}</div>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Kode Pos</label>
          <div className="font-medium text-slate-800">{student.address_postal_code || '-'}</div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Keluarga ──
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
            {(() => {
              const father = student.parents?.find(p => p.type === 'ayah');
              return (
                <>
                  <div className="flex justify-between border-b border-stone-50 pb-1">
                    <dt className="text-stone-500">Nama</dt>
                    <dd className="font-medium text-slate-800 text-right">{father?.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-stone-50 pb-1">
                    <dt className="text-stone-500">Pekerjaan</dt>
                    <dd className="font-medium text-slate-800 text-right">{father?.occupation || '-'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-stone-50 pb-1">
                    <dt className="text-stone-500">No. Telp</dt>
                    <dd className="font-medium text-slate-800 text-right">{father?.phone_number || '-'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-stone-50 pb-1">
                    <dt className="text-stone-500">Pendidikan</dt>
                    <dd className="font-medium text-slate-800 text-right">{father?.last_education || '-'}</dd>
                  </div>
                </>
              );
            })()}
          </dl>
        </div>

        {/* Ibu */}
        <div>
          <h4 className="font-serif font-semibold text-slate-800 mb-4 border-b border-stone-100 pb-2">Ibu Kandung</h4>
          <dl className="space-y-3 text-sm">
            {(() => {
              const mother = student.parents?.find(p => p.type === 'ibu');
              return (
                <>
                  <div className="flex justify-between border-b border-stone-50 pb-1">
                    <dt className="text-stone-500">Nama</dt>
                    <dd className="font-medium text-slate-800 text-right">{mother?.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-stone-50 pb-1">
                    <dt className="text-stone-500">Pekerjaan</dt>
                    <dd className="font-medium text-slate-800 text-right">{mother?.occupation || '-'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-stone-50 pb-1">
                    <dt className="text-stone-500">No. Telp</dt>
                    <dd className="font-medium text-slate-800 text-right">{mother?.phone_number || '-'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-stone-50 pb-1">
                    <dt className="text-stone-500">Pendidikan</dt>
                    <dd className="font-medium text-slate-800 text-right">{mother?.last_education || '-'}</dd>
                  </div>
                </>
              );
            })()}
          </dl>
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Riwayat Akademik + Assign Kelas ──
function TabAkademik({ student, hasRole, onRefresh }: { student: Student, hasRole: any, onRefresh: () => void }) {
  const [showAssign, setShowAssign] = useState(false);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchOptions = async () => {
    try {
      const [classRes, yearRes] = await Promise.all([
        api.get('/classes'),
        api.get('/academic-years'),
      ]);
      setClasses(classRes.data.data || classRes.data);
      setYears(yearRes.data.data || yearRes.data);
    } catch (e) {
      console.error('Failed to fetch options', e);
    }
  };

  const handleAssign = async () => {
    if (!selectedClass || !selectedYear) {
      toast.error('Pilih kelas dan tahun ajaran.');
      return;
    }
    setAssigning(true);
    try {
      await api.post('/enrollments', {
        student_id: student.id,
        class_id: selectedClass,
        academic_year_id: selectedYear,
      });
      toast.success('Siswa berhasil ditempatkan di kelas!');
      setShowAssign(false);
      setSelectedClass('');
      setSelectedYear('');
      onRefresh();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menempatkan siswa.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-6">
      {/* Assign Kelas Button */}
      {hasRole('super_admin', 'admin_tu') && (
        <div className="mb-6">
          {!showAssign ? (
            <Button variant="primary" size="sm" onClick={() => { setShowAssign(true); fetchOptions(); }}>
              Tempatkan ke Kelas
            </Button>
          ) : (
            <div className="bg-cream-50 border border-stone-200 rounded-xl p-4 space-y-4 animate-fade-in">
              <h4 className="font-medium text-slate-800 text-sm">Tempatkan Siswa ke Kelas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Tahun Ajaran"
                  placeholder="Pilih tahun ajaran"
                  options={years.map(y => ({ label: y.label, value: y.id }))}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  required
                />
                <Select
                  label="Kelas"
                  placeholder="Pilih kelas"
                  options={classes.map(c => ({ label: `${c.name} (${c.level})`, value: c.id }))}
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleAssign} isLoading={assigning}>
                  Simpan
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAssign(false)}>
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {!student.academic_timeline || student.academic_timeline.length === 0 ? (
        <EmptyState title="Belum Ada Riwayat" description="Siswa belum ditempatkan di kelas manapun." className="py-8" />
      ) : (
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
      )}
    </div>
  );
}

// ── Tab 5: Dokumen (with reupload) ──
function TabDokumen({ student, onUploadSuccess, hasRole }: { student: Student, onUploadSuccess: () => void, hasRole: any }) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [reuploadingDoc, setReuploadingDoc] = useState<string | null>(null);

  const requiredDocs = [
    { type: 'pas_foto', label: 'Pas Foto 3x4' },
    { type: 'ijazah', label: 'Ijazah Sebelumnya' },
    { type: 'kk', label: 'Kartu Keluarga' },
    { type: 'akta_kelahiran', label: 'Akta Kelahiran' },
    { type: 'sktm', label: 'Surat Keterangan Tidak Mampu' },
    { type: 'sk_kematian', label: 'Surat Kematian' },
  ];

  const handleReupload = async (docId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/documents/${docId}/reupload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Dokumen berhasil diganti.');
      setReuploadingDoc(null);
      onUploadSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal mengganti dokumen.');
    }
  };

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
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setPreviewDoc(doc)}>
                      <Eye className="w-4 h-4 text-emerald-700" />
                    </Button>
                    {hasRole('super_admin', 'admin_tu') && (
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setReuploadingDoc(reuploadingDoc === doc.id ? null : doc.id)}>
                        <RefreshCw className="w-4 h-4 text-amber-600" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Reupload area */}
              {hasRole('super_admin', 'admin_tu') && isComplete && reuploadingDoc === doc!.id && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs text-amber-800 mb-2">Ganti dokumen "{doc!.original_filename}"</p>
                  <FileDropzone
                    studentId={student.id}
                    docType={docDef.type}
                    onSuccess={() => {
                      // After re-upload via new file, call reupload endpoint
                      setReuploadingDoc(null);
                      onUploadSuccess();
                    }}
                  />
                </div>
              )}

              {/* Upload for new */}
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
