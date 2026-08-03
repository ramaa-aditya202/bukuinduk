'use client';

import { ReactNode } from 'react';
import { FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon = <FileSearch className="w-16 h-16 text-stone-300" strokeWidth={1} />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('empty-state animate-fade-in', className)}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-serif font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
