'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  variant: 'aktif' | 'lulus' | 'pindah' | 'keluar' | 'nonaktif' | 'gold' | 'default';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variant === 'aktif' && 'badge-aktif',
        variant === 'lulus' && 'badge-lulus',
        variant === 'pindah' && 'badge-pindah',
        variant === 'keluar' && 'badge-keluar',
        variant === 'nonaktif' && 'badge-nonaktif',
        variant === 'gold' && 'badge-gold',
        variant === 'default' && 'bg-stone-100 text-stone-600 border-stone-200',
        className
      )}
    >
      {children}
    </span>
  );
}
