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
import { Plus, Search, Filter, Download } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Student, PaginatedResponse } from '@/types';
import { debounce } from '@/lib/utils';
import { studentStatusLabel } from '@/lib/utils';

export default function StudentListPage() {
  const router = useRouter();
  const { hasRole, canExport } = useAuth();
  
  const [data, setData] = useState<PaginatedResponse<Student> | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchStudents = useCallback(async (searchQuery: string, statusFilter: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await api.get('/students', {
        params: {
          search: searchQuery,
          status: statusFilter,
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
  }, []);

  // Debounced search
  const debouncedFetch = useCallback(
    debounce((s: string, st: string, p: number) => fetchStudents(s, st, p), 500),
    [fetchStudents]
  );

  useEffect(() => {
    debouncedFetch(search, status, page);
  }, [search, status, page, debouncedFetch]);

  // Columns definition
  const columns = [
    {
      header: 'Nama Siswa',
      cell: (row: Student) => (
        <div>
          <p className="font-semibold text-slate-800">{row.name}</p>
          <p className="text-xs text-stone-500">{row.nisn} • {row.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
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
      header: 'Status',
      cell: (row: Student) => (
        <Badge variant={row.student_status as any}>
          {studentStatusLabel(row.student_status)}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-800">Data Siswa</h1>
          <p className="text-stone-500 mt-1">Kelola data buku induk peserta didik</p>
        </div>
        
        <div className="flex items-center gap-3">
          {canExport && (
            <Button variant="secondary" onClick={() => router.push('/siswa/export')}>
              <Download className="w-4 h-4 mr-2" />
              Export
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
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Cari nama atau NISN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              rightElement={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
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
                setPage(1);
              }}
            />
          </div>
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
