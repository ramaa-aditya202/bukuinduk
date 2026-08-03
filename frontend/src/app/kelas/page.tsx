'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import type { ClassRoom } from '@/types';

export default function KelasPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('super_admin', 'admin_tu');

  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', level: '', homeroom_teacher_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classes');
      setClasses(res.data.data || res.data);
    } catch (error) {
      toast.error('Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/users/teachers');
      setTeachers(res.data.data || res.data);
    } catch (error) {
      console.error('Gagal memuat data guru');
    }
  };

  useEffect(() => {
    fetchClasses();
    if (isAdmin) fetchTeachers();
  }, [isAdmin]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ name: '', level: '', homeroom_teacher_id: '' });
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassRoom) => {
    setModalMode('edit');
    setFormData({
      name: cls.name,
      level: cls.level,
      homeroom_teacher_id: cls.homeroom_teacher_id || '',
    });
    setSelectedId(cls.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;
    
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Kelas berhasil dihapus');
      fetchClasses();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus kelas');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        homeroom_teacher_id: formData.homeroom_teacher_id || null,
      };

      if (modalMode === 'add') {
        await api.post('/classes', payload);
        toast.success('Kelas berhasil ditambahkan');
      } else {
        await api.put(`/classes/${selectedId}`, payload);
        toast.success('Kelas berhasil diperbarui');
      }
      setIsModalOpen(false);
      fetchClasses();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Tingkat',
      cell: (row: ClassRoom) => (
        <Badge variant="default" className="text-sm font-bold bg-gold-100 text-gold-800 border-gold-200">
          Kelas {row.level}
        </Badge>
      ),
    },
    {
      header: 'Nama Kelas',
      cell: (row: ClassRoom) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Wali Kelas',
      cell: (row: ClassRoom) => (
        <span className="text-stone-600">
          {row.homeroom_teacher?.name || <span className="italic text-stone-400">Belum diatur</span>}
        </span>
      ),
    },
    ...(isAdmin ? [{
      header: 'Aksi',
      cell: (row: ClassRoom) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600" onClick={() => handleOpenEdit(row)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-red-600" onClick={() => handleDelete(row.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-800">Data Kelas</h1>
          <p className="text-stone-500 mt-1">Kelola rombongan belajar dan wali kelas</p>
        </div>
        
        {isAdmin && (
          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kelas
          </Button>
        )}
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={classes}
          keyExtractor={(row) => row.id}
          isLoading={loading}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Tambah Kelas Baru' : 'Edit Data Kelas'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select
                label="Tingkat Kelas"
                options={[
                  { label: 'Kelas 10', value: '10' },
                  { label: 'Kelas 11', value: '11' },
                  { label: 'Kelas 12', value: '12' },
                ]}
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Nama Kelas"
                placeholder="Contoh: 10 IPA 1, 10 RPL 2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <Select
                label="Wali Kelas (Opsional)"
                options={teachers.map(t => ({ label: t.name, value: t.id }))}
                value={formData.homeroom_teacher_id}
                onChange={(e) => setFormData({ ...formData, homeroom_teacher_id: e.target.value })}
              />
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
