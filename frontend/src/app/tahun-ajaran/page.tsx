'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import type { AcademicYear } from '@/types';

export default function TahunAjaranPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('super_admin', 'admin_tu');

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ label: '', start_date: '', end_date: '', is_active: false });
  const [submitting, setSubmitting] = useState(false);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic-years');
      setYears(res.data.data || res.data);
    } catch (error) {
      toast.error('Gagal memuat data tahun ajaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, [isAdmin]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ label: '', start_date: '', end_date: '', is_active: false });
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (year: AcademicYear) => {
    setModalMode('edit');
    setFormData({
      label: year.label,
      start_date: year.start_date.split('T')[0],
      end_date: year.end_date.split('T')[0],
      is_active: year.is_active || false,
    });
    setSelectedId(year.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tahun ajaran ini?')) return;
    
    try {
      await api.delete(`/academic-years/${id}`);
      toast.success('Tahun ajaran berhasil dihapus');
      fetchYears();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus tahun ajaran');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
      };

      if (modalMode === 'add') {
        await api.post('/academic-years', payload);
        toast.success('Tahun ajaran berhasil ditambahkan');
      } else {
        await api.put(`/academic-years/${selectedId}`, payload);
        toast.success('Tahun ajaran berhasil diperbarui');
      }
      setIsModalOpen(false);
      fetchYears();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Label',
      cell: (row: AcademicYear) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">{row.label}</span>
        </div>
      ),
    },
    {
      header: 'Mulai',
      accessorKey: 'start_date' as keyof AcademicYear,
    },
    {
      header: 'Selesai',
      accessorKey: 'end_date' as keyof AcademicYear,
    },
    {
      header: 'Status',
      cell: (row: AcademicYear) => (
        row.is_active ? 
          <Badge variant="default" className="bg-emerald-100 text-emerald-800">Aktif</Badge> : 
          <Badge variant="default" className="bg-stone-100 text-stone-800">Nonaktif</Badge>
      ),
    },
    ...(isAdmin ? [{
      header: 'Aksi',
      cell: (row: AcademicYear) => (
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-blue-600" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEdit(row); }}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-red-600" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(row.id); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-serif font-bold text-slate-800">Akses Ditolak</h1>
          <p className="text-stone-500 mt-1">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-800">Data Tahun Ajaran</h1>
          <p className="text-stone-500 mt-1">Kelola periode tahun ajaran akademik sekolah</p>
        </div>
        
        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Tahun Ajaran
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={years}
          keyExtractor={(row) => row.id}
          isLoading={loading}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Tambah Tahun Ajaran' : 'Edit Tahun Ajaran'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Label Tahun Ajaran"
                placeholder="Contoh: 2024/2025"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
              />
            </div>
            <div className="col-span-1">
              <Input
                label="Tanggal Mulai"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="col-span-1">
              <Input
                label="Tanggal Selesai"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="text-sm font-medium text-slate-700">Set sebagai Tahun Ajaran Aktif</span>
              </label>
              <p className="text-xs text-stone-500 mt-1 ml-6">Hanya boleh ada 1 tahun ajaran yang aktif. Menyentang ini akan menonaktifkan tahun ajaran sebelumnya.</p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2 border-t border-stone-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Simpan Data
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
