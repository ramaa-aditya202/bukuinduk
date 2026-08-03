'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, UserCheck, GraduationCap, ArrowRightLeft } from 'lucide-react';
import api from '@/lib/api';
import type { DashboardStats } from '@/types';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data.data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-800">
          Selamat Datang, {user?.name}
        </h1>
        <p className="text-stone-500 mt-1">
          Tahun Ajaran Aktif: <span className="font-semibold text-emerald-700">{stats?.tahun_ajaran_aktif || '-'}</span>
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-stone-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-stone-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              title="Total Siswa"
              value={stats.total_siswa}
              icon={<Users className="w-6 h-6" />}
            />
            <StatCard
              title="Siswa Aktif"
              value={stats.siswa_aktif}
              icon={<UserCheck className="w-6 h-6" />}
            />
            <StatCard
              title="Alumni (Lulus)"
              value={stats.siswa_lulus}
              icon={<GraduationCap className="w-6 h-6" />}
            />
            <StatCard
              title="Siswa Pindah"
              value={stats.siswa_pindah}
              icon={<ArrowRightLeft className="w-6 h-6" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Demografi Gender */}
            <Card>
              <CardHeader>
                <CardTitle>Demografi Gender (Siswa Aktif)</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200 mb-3 mx-auto">
                      <span className="text-2xl font-bold text-blue-700">
                        {stats.gender_breakdown.laki_laki}
                      </span>
                    </div>
                    <p className="font-medium text-slate-700">Laki-laki</p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center border-4 border-pink-200 mb-3 mx-auto">
                      <span className="text-2xl font-bold text-pink-700">
                        {stats.gender_breakdown.perempuan}
                      </span>
                    </div>
                    <p className="font-medium text-slate-700">Perempuan</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart: Kelengkapan Dokumen */}
            <Card>
              <CardHeader>
                <CardTitle>Kelengkapan Dokumen Wajib</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-stone-500">Rata-rata Kelengkapan</span>
                  <span className="text-2xl font-bold text-emerald-700">{stats.kelengkapan_dokumen.percentage}%</span>
                </div>
                
                <div className="space-y-4">
                  {stats.kelengkapan_dokumen.detail.map((doc) => (
                    <div key={doc.doc_type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{doc.label}</span>
                        <span className="text-stone-500">{doc.percentage}% ({doc.completed}/{doc.total})</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gold-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${doc.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="card p-8 text-center text-red-500">
          Gagal memuat data dashboard.
        </div>
      )}
    </DashboardLayout>
  );
}
