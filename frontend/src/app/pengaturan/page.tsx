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
