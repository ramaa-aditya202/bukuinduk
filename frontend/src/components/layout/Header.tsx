'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/siswa': 'Data Siswa',
  '/siswa/tambah': 'Tambah Siswa Baru',
  '/pengaturan': 'Pengaturan',
};

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate breadcrumb
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((_, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    return {
      path,
      label: breadcrumbMap[path] || segments[index],
    };
  });

  // Judul halaman
  const pageTitle = breadcrumbMap[pathname] || 'Buku Induk';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left — Breadcrumb */}
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-0.5">
            <span>Beranda</span>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-1.5">
                <span>/</span>
                <span className={i === breadcrumbs.length - 1 ? 'text-slate-700 font-medium' : ''}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
          <h2 className="text-lg font-serif font-semibold text-slate-800">
            {pageTitle}
          </h2>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Cari siswa..."
              className="pl-9 pr-4 py-2 w-64 bg-cream-50 border border-stone-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500
                         placeholder:text-stone-400 transition-all"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-cream-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-stone-500" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold-500 rounded-full
                             text-[10px] text-white flex items-center justify-center font-bold">
                1
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-warm-lg border border-stone-100 overflow-hidden animate-scale-in">
                <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center bg-cream-50">
                  <h4 className="font-semibold text-slate-800 text-sm">Notifikasi</h4>
                  <button className="text-xs text-emerald-700 hover:underline">Tandai semua dibaca</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-stone-50 hover:bg-stone-50 cursor-pointer flex gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-gold-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Export Selesai</p>
                      <p className="text-xs text-stone-500 mt-0.5">File Excel data siswa siap diunduh.</p>
                      <p className="text-[10px] text-stone-400 mt-1">Baru saja</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 text-center border-t border-stone-100 bg-stone-50">
                  <button className="text-xs text-stone-500 hover:text-slate-800">Lihat semua notifikasi</button>
                </div>
              </div>
            )}
          </div>

          {/* User avatar (mobile) */}
          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-sm font-semibold text-white md:hidden">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
