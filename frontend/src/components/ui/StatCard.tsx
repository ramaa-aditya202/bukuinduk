'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  className?: string;
}

export default function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <h4 className="stat-value mt-2">{value}</h4>
        </div>
        {icon && (
          <div className="p-3 bg-cream-100 rounded-xl text-gold-600">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span
            className={cn(
              'font-medium',
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
          <span className="text-stone-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
