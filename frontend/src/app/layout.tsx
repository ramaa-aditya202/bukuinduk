import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Buku Induk Siswa — Sistem Informasi Data Peserta Didik',
  description:
    'Sistem manajemen data buku induk peserta didik digital. Mengelola identitas siswa, data keluarga, riwayat akademik, dan dokumen secara terpusat dan aman.',
  keywords: ['buku induk', 'siswa', 'sekolah', 'data peserta didik', 'administrasi sekolah'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
