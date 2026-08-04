'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Search, Download, Upload } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Student, PaginatedResponse, ClassRoom } from '@/types';
import { debounce, generateTahunMasukOptions } from '@/lib/utils';
import { studentStatusLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

const SPECIAL_STATUS_OPTIONS = [
  { label: 'Semua Status Khusus', value: '' },
  { label: 'Umum', value: 'Umum' },
  { label: 'Yatim', value: 'Yatim' },
  { label: "Dhu'afa", value: "Dhu'afa" },
  { label: 'Piatu', value: 'Piatu' },
];

export default function StudentListPage() {
  const router = useRouter();
  const { hasRole, canExport } = useAuth();

  const [data, setData] = useState<PaginatedResponse<Student> | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [classes, setClasses] = useState<ClassRoom[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [classId, setClassId] = useState('');
  const [tahunMasuk, setTahunMasuk] = useState('');
  const [specialStatus, setSpecialStatus] = useState('');
  const [page, setPage] = useState(1);

  // Fetch kelas list on mount
  useEffect(() => {
    api.get('/classes').then((res) => {
      setClasses(res.data.data || []);
    }).catch(() => {});
  }, []);

  const fetchStudents = useCallback(
    async (
      searchQuery: string,
      statusFilter: string,
      classFilter: string,
      tahunFilter: string,
      specialStatusFilter: string,
      pageNum: number,
    ) => {
      setLoading(true);
      try {
        const res = await api.get('/students', {
          params: {
            search: searchQuery || undefined,
            student_status: statusFilter || undefined,
            class_id: classFilter || undefined,
            tahun_masuk: tahunFilter || undefined,
            special_status: specialStatusFilter || undefined,
            page: pageNum,
            per_page: 15,
          },
        });
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch students', error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounced search
  const debouncedFetch = useCallback(
    debounce(
      (s: string, st: string, cl: string, tm: string, ss: string, p: number) =>
        fetchStudents(s, st, cl, tm, ss, p),
      500,
    ),
    [fetchStudents],
  );

  useEffect(() => {
    debouncedFetch(search, status, classId, tahunMasuk, specialStatus, page);
  }, [search, status, classId, tahunMasuk, specialStatus, page, debouncedFetch]);

  const resetPage = () => setPage(1);

  // Export handler — direct download, carries all active filters
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.post(
        '/export/students',
        {
          student_status: status || undefined,
          class_id: classId || undefined,
          tahun_masuk: tahunMasuk ? Number(tahunMasuk) : undefined,
          special_status: specialStatus || undefined,
        },
        { responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `buku_induk_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export berhasil diunduh!');
    } catch {
      toast.error('Gagal mengeksport data.');
    } finally {
      setExporting(false);
    }
  };

  // Columns definition
  const columns = [
    {
      header: 'Nama Siswa',
      cell: (row: Student) => (
        <div>
          <p className="font-semibold text-slate-800">{row.name}</p>
          <p className="text-xs text-stone-500">
            {row.nisn} • {row.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
          </p>
        </div>
      ),
    },
    {
      header: 'Kelas',
      cell: (row: Student) => row.current_class || '-',
    },
    {
      header: 'Angkatan',
      accessorKey: 'tahun_masuk' as keyof Student,
    },
    {
      header: 'Status Khusus',
      cell: (row: Student) =>
        row.status && row.status.length > 0 ? row.status.join(', ') : '-',
    },
    {
      header: 'Status',
      cell: (row: Student) => (
        <Badge variant={row.student_status as any}>
          {studentStatusLabel(row.student_status)}
        </Badge>
      ),
    },
  ];

  // Build tahun masuk options
  const tahunMasukOptions = [
    { label: 'Semua Angkatan', value: '' },
    ...generateTahunMasukOptions(2015).map((o) => ({
      label: String(o.label),
      value: String(o.value),
    })),
  ];

  // Build kelas options
  const classOptions = [
    { label: 'Semua Kelas', value: '' },
    ...classes.map((c) => ({ label: c.name, value: c.id })),
  ];

  // Count active filters (excluding search)
  const activeFilterCount = [status, classId, tahunMasuk, specialStatus].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-800">Data Siswa</h1>
          <p className="text-stone-500 mt-1">Kelola data buku induk peserta didik</p>
        </div>

        <div className="flex items-center gap-3">
          {hasRole('super_admin', 'admin_tu') && (
            <Button variant="secondary" onClick={() => router.push('/siswa/import')}>
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
          )}
          {canExport && (
            <Button variant="secondary" onClick={handleExport} isLoading={exporting}>
              <Download className="w-4 h-4 mr-2" />
              Export
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
          {hasRole('super_admin', 'admin_tu') && (
            <Button variant="secondary" onClick={() => router.push('/siswa/pindahan')}>
              <Plus className="w-4 h-4 mr-2" />
              Siswa Pindahan
            </Button>
          )}
          {hasRole('super_admin', 'admin_tu') && (
            <Button variant="primary" onClick={() => router.push('/siswa/tambah')}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Siswa
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          {/* Row 1: Search */}
          <div className="mb-3">
            <Input
              placeholder="Cari nama atau NISN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              rightElement={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Row 2: Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select
              options={classOptions}
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                resetPage();
              }}
            />
            <Select
              options={tahunMasukOptions}
              value={tahunMasuk}
              onChange={(e) => {
                setTahunMasuk(e.target.value);
                resetPage();
              }}
            />
            <Select
              options={[
                { label: 'Semua Status', value: '' },
                { label: 'Aktif', value: 'aktif' },
                { label: 'Lulus', value: 'lulus' },
                { label: 'Pindah', value: 'pindah' },
                { label: 'Keluar', value: 'keluar' },
                { label: 'Nonaktif', value: 'nonaktif' },
              ]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                resetPage();
              }}
            />
            <Select
              options={SPECIAL_STATUS_OPTIONS}
              value={specialStatus}
              onChange={(e) => {
                setSpecialStatus(e.target.value);
                resetPage();
              }}
            />
          </div>

          {/* Reset filters */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setStatus('');
                  setClassId('');
                  setTahunMasuk('');
                  setSpecialStatus('');
                  resetPage();
                }}
                className="text-sm text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2"
              >
                Reset filter ({activeFilterCount})
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data?.data || []}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => router.push(`/siswa/${row.id}`)}
        isLoading={loading}
        pagination={{
          currentPage: data?.current_page || 1,
          lastPage: data?.last_page || 1,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
        emptyMessage="Tidak ada data siswa ditemukan."
      />
    </DashboardLayout>
  );
}
