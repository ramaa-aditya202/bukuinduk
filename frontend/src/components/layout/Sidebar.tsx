'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  BookOpen,
  Shield,
  LogOut,
  Calendar,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin_tu', 'guru', 'wali_kelas'] },
  { href: '/siswa', label: 'Data Siswa', icon: Users, roles: ['super_admin', 'admin_tu', 'guru', 'wali_kelas'] },
  { href: '/kelas', label: 'Data Kelas', icon: BookOpen, roles: ['super_admin', 'admin_tu', 'guru', 'wali_kelas'] },
  { href: '/tahun-ajaran', label: 'Tahun Ajaran', icon: Calendar, roles: ['super_admin', 'admin_tu'] },
  { href: '/siswa/tambah', label: 'Tambah Siswa', icon: UserPlus, roles: ['super_admin', 'admin_tu'] },
  { href: '/pengaturan', label: 'Pengaturan', icon: Settings, roles: ['super_admin', 'admin_tu'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo & Title */}
      <div className="px-5 py-6 border-b border-emerald-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-serif font-bold text-white tracking-wide">
              Buku Induk
            </h1>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Sistem Data Peserta Didik
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.roles.some((r) => hasRole(r)))
          .map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('sidebar-link', isActive && 'sidebar-link-active')}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}

        {/* Audit log — hanya super_admin */}
        {hasRole('super_admin') && (
          <Link
            href="/pengaturan?tab=audit"
            className={cn(
              'sidebar-link',
              pathname === '/pengaturan' && 'sidebar-link-active'
            )}
          >
            <Shield className="w-[18px] h-[18px]" />
            <span>Audit Log</span>
          </Link>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-emerald-700 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-emerald-600"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-semibold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-emerald-300 truncate">
              {user?.role === 'super_admin' && 'Super Admin'}
              {user?.role === 'admin_tu' && 'Tata Usaha'}
              {user?.role === 'guru' && 'Guru'}
              {user?.role === 'wali_kelas' && 'Wali Kelas'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="sidebar-link w-full text-red-300 hover:text-red-100 hover:bg-red-900/30"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
