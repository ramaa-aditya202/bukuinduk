'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import type { ActivityLog, PaginatedResponse } from '@/types';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

function PengaturanContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'umum';
  const { hasRole } = useAuth();

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-800">Pengaturan Sistem</h1>
        <p className="text-stone-500 mt-1">Konfigurasi sistem dan log aktivitas</p>
      </div>

      <Card>
        <Tabs
          defaultTabId={defaultTab}
          tabs={[
            {
              id: 'profil',
              label: 'Profil',
              content: <TabProfil />,
            },
            {
              id: 'umum',
              label: 'Umum',
              content: <TabUmum />,
            },
            ...(hasRole('super_admin') ? [{
              id: 'audit',
              label: 'Audit Log',
              content: <TabAuditLog />,
            }] : []),
          ]}
          className="p-1"
        />
      </Card>
    </DashboardLayout>
  );
}

export default function PengaturanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PengaturanContent />
    </Suspense>
  );
}

// ── Tab: Profil ──
function TabProfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.new_password_confirmation) {
      toast.error('Konfirmasi password baru tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { name: formData.name };
      if (formData.current_password && formData.new_password) {
        payload.current_password = formData.current_password;
        payload.new_password = formData.new_password;
        payload.new_password_confirmation = formData.new_password_confirmation;
      }
      
      const res = await api.put('/profile', payload);
      toast.success(res.data.message || 'Profil berhasil diperbarui');
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      }));
      // Auto reload auth state could be done here if needed
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  if (user?.is_sso) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center max-w-lg mx-auto mt-8">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Akun SSO Terdeteksi</h3>
          <p className="text-sm text-slate-600">
            Anda login menggunakan Single Sign-On (SSO). Informasi profil dan password Anda dikelola secara terpusat oleh penyedia identitas (Authentik). Perubahan profil tidak dapat dilakukan melalui aplikasi ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-stone-100 pb-2">Informasi Dasar</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (Tidak dapat diubah)</label>
              <input
                type="email"
                value={user?.email}
                className="w-full form-input bg-stone-50 text-stone-500"
                disabled
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-stone-100 pb-2">Ubah Password</h3>
          <p className="text-xs text-stone-500 mb-4">Kosongkan jika tidak ingin mengubah password.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password Saat Ini</label>
              <input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                className="w-full form-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className="w-full form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  name="new_password_confirmation"
                  value={formData.new_password_confirmation}
                  onChange={handleChange}
                  className="w-full form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Tab: Umum ──
function TabUmum() {
  return (
    <div className="p-6 text-center text-stone-500 py-12">
      <div className="max-w-md mx-auto">
        <p>Pengaturan umum sistem seperti tahun ajaran dan kelas saat ini dikonfigurasi melalui backend untuk versi MVP.</p>
      </div>
    </div>
  );
}

// ── Tab: Audit Log ──
function TabAuditLog() {
  const [data, setData] = useState<PaginatedResponse<ActivityLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/activity-logs', { params: { page } });
        setData(res.data);
      } catch (error) {
        console.error('Failed to load audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  const actionLabels: Record<string, string> = {
    create: 'Buat Baru',
    update: 'Ubah Data',
    delete: 'Hapus Data',
    export: 'Export Excel',
    view_sensitive: 'Lihat NIK',
  };

  const actionColors: Record<string, any> = {
    create: 'aktif',
    update: 'lulus',
    delete: 'keluar',
    export: 'gold',
    view_sensitive: 'pindah',
  };

  const columns = [
    {
      header: 'Waktu',
      cell: (row: ActivityLog) => (
        <div className="text-sm">
          <p className="font-medium text-slate-800">{formatDate(row.created_at)}</p>
          <p className="text-xs text-stone-500">{new Date(row.created_at).toLocaleTimeString('id-ID')}</p>
        </div>
      ),
    },
    {
      header: 'Pengguna',
      cell: (row: ActivityLog) => (
        <div>
          <p className="font-medium text-slate-800 text-sm">{row.user?.name}</p>
          <p className="text-xs text-stone-500">{row.user?.email}</p>
        </div>
      ),
    },
    {
      header: 'Aksi',
      cell: (row: ActivityLog) => (
        <Badge variant={actionColors[row.action] || 'default'}>
          {actionLabels[row.action] || row.action}
        </Badge>
      ),
    },
    {
      header: 'Target',
      cell: (row: ActivityLog) => (
        <div className="text-sm">
          <p className="font-medium text-slate-800">{row.entity_type.split('\\').pop()}</p>
          <p className="text-xs text-stone-500 font-mono">{row.entity_id.substring(0, 8)}...</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="px-6 py-4 bg-amber-50/50 border-b border-stone-100 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">Audit Trail (Kepatuhan PDP)</h4>
          <p className="text-xs text-amber-800 mt-1">Semua aktivitas perubahan data dan akses data sensitif (seperti NIK) dicatat dan tidak dapat dihapus.</p>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={data?.data || []}
        keyExtractor={(row) => row.id}
        isLoading={loading}
        pagination={{
          currentPage: data?.current_page || 1,
          lastPage: data?.last_page || 1,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
