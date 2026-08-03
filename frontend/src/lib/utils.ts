import { clsx, type ClassValue } from 'clsx';

/**
 * Merge class names with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format tanggal singkat
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format angka ke Rupiah
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Masking NIK: tampilkan 4 digit pertama dan 4 digit terakhir
 * Contoh: "3201012345670001" → "3201********0001"
 */
export function maskNik(nik: string | null | undefined): string {
  if (!nik || nik.length < 8) return nik || '-';
  return nik.substring(0, 4) + '*'.repeat(nik.length - 8) + nik.substring(nik.length - 4);
}

/**
 * Label gender
 */
export function genderLabel(gender: 'L' | 'P'): string {
  return gender === 'L' ? 'Laki-laki' : 'Perempuan';
}

/**
 * Label status siswa
 */
export function studentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    aktif: 'Aktif',
    lulus: 'Lulus',
    pindah: 'Pindah',
    keluar: 'Keluar',
    nonaktif: 'Nonaktif',
  };
  return labels[status] || status;
}

/**
 * Label enrollment status
 */
export function enrollmentStatusLabel(status: string | null): string {
  if (!status) return 'Berjalan';
  const labels: Record<string, string> = {
    naik_kelas: 'Naik Kelas',
    tinggal_kelas: 'Tinggal Kelas',
    lulus: 'Lulus',
    pindah: 'Pindah',
  };
  return labels[status] || status;
}

/**
 * Label guardian type
 */
export function guardianTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ayah: 'Ayah Kandung',
    ibu: 'Ibu Kandung',
    orang_lain: 'Orang Lain',
  };
  return labels[type] || type;
}

/**
 * Label role
 */
export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_tu: 'Admin Tata Usaha',
    guru: 'Guru',
    wali_kelas: 'Wali Kelas',
  };
  return labels[role] || role;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Generate tahun ajaran options dari range tahun
 */
export function generateTahunMasukOptions(startYear = 2015): { value: number; label: string }[] {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let y = currentYear; y >= startYear; y--) {
    options.push({ value: y, label: `${y}` });
  }
  return options;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
