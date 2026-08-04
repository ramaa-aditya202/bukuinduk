'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import MultiSelect from '@/components/ui/MultiSelect';
import Badge from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Search, Download, Upload } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Student, PaginatedResponse, ClassRoom } from '@/types';
import { debounce, generateTahunMasukOptions } from '@/lib/utils';
import { studentStatusLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { label: 'Aktif', value: 'aktif' },
  { label: 'Lulus', value: 'lulus' },
  { label: 'Pindah', value: 'pindah' },
  { label: 'Keluar', value: 'keluar' },
  { label: 'Nonaktif', value: 'nonaktif' },
];

const SPECIAL_STATUS_OPTIONS = [
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

  // Filters — all multi-select (arrays)
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [tahunMasukList, setTahunMasukList] = useState<string[]>([]);
  const [specialStatuses, setSpecialStatuses] = useState<string[]>([]);
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
      statusFilters: string[],
      classFilters: string[],
      tahunFilters: string[],
      specialStatusFilters: string[],
      pageNum: number,
    ) => {
      setLoading(true);
      try {
        const res = await api.get('/students', {
          params: {
            search: searchQuery || undefined,
            student_status: statusFilters.length ? statusFilters : undefined,
            class_id: classFilters.length ? classFilters : undefined,
            tahun_masuk: tahunFilters.length ? tahunFilters : undefined,
            special_status: specialStatusFilters.length ? specialStatusFilters : undefined,
            page: pageNum,
            per_page: 15,
          },
          // Custom serializer: array → key[]=val1&key[]=val2 (format yang Laravel parse sebagai array)
          paramsSerializer: (params) => {
            const parts: string[] = [];
            Object.entries(params).forEach(([key, val]) => {
              if (val === undefined || val === null) return;
              if (Array.isArray(val)) {
                val.forEach((v) => parts.push(`${key}[]=${encodeURIComponent(String(v))}`))
              } else {
                parts.push(`${key}=${encodeURIComponent(String(val))}`);
              }
            });
            return parts.join('&');
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

  const debouncedFetch = useCallback(
    debounce(
      (
        s: string,
        st: string[],
        cl: string[],
        tm: string[],
        ss: string[],
        p: number,
      ) => fetchStudents(s, st, cl, tm, ss, p),
      400,
    ),
    [fetchStudents],
  );

  useEffect(() => {
    debouncedFetch(search, statuses, classIds, tahunMasukList, specialStatuses, page);
  }, [search, statuses, classIds, tahunMasukList, specialStatuses, page, debouncedFetch]);

  const resetPage = () => setPage(1);

  const activeFilterCount = statuses.length + classIds.length + tahunMasukList.length + specialStatuses.length;

  const resetAllFilters = () => {
    setStatuses([]);
    setClassIds([]);
    setTahunMasukList([]);
    setSpecialStatuses([]);
    resetPage();
  };

  // Export — passes all active filters as arrays
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.post(
        '/export/students',
        {
          student_status: statuses.length ? statuses : undefined,
          class_id: classIds.length ? classIds : undefined,
          tahun_masuk: tahunMasukList.length ? tahunMasukList.map(Number) : undefined,
          special_status: specialStatuses.length ? specialStatuses : undefined,
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

  const tahunMasukOptions = generateTahunMasukOptions(2015).map((o) => ({
    label: String(o.label),
    value: String(o.value),
  }));

  const classOptions = classes.map((c) => ({ label: c.name, value: c.id }));

  return (
    <DashboardLayout>
      {/* Header */}
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
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold">
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

      {/* Filter Card */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          {/* Search */}
          <Input
            placeholder="Cari nama atau NISN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            rightElement={<Search className="w-4 h-4" />}
          />

          {/* Multi-select filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <MultiSelect
              placeholder="Semua Kelas"
              options={classOptions}
              value={classIds}
              onChange={(v) => { setClassIds(v); resetPage(); }}
            />
            <MultiSelect
              placeholder="Semua Angkatan"
              options={tahunMasukOptions}
              value={tahunMasukList}
              onChange={(v) => { setTahunMasukList(v); resetPage(); }}
            />
            <MultiSelect
              placeholder="Semua Status"
              options={STATUS_OPTIONS}
              value={statuses}
              onChange={(v) => { setStatuses(v); resetPage(); }}
            />
            <MultiSelect
              placeholder="Semua Status Khusus"
              options={SPECIAL_STATUS_OPTIONS}
              value={specialStatuses}
              onChange={(v) => { setSpecialStatuses(v); resetPage(); }}
            />
          </div>

          {/* Active filter summary + reset */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
              <p className="text-xs text-stone-500">
                {activeFilterCount} filter aktif • {data?.total ?? '...'} siswa ditemukan
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2"
              >
                Reset semua filter
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
