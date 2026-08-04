'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X } from 'lucide-react';

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  label,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = useCallback(
    (optValue: string) => {
      if (value.includes(optValue)) {
        onChange(value.filter((v) => v !== optValue));
      } else {
        onChange([...value, optValue]);
      }
    },
    [value, onChange],
  );

  const removeTag = useCallback(
    (optValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((v) => v !== optValue));
    },
    [value, onChange],
  );

  const selectedLabels = options.filter((o) => value.includes(o.value));

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && <label className="form-label">{label}</label>}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'form-input flex items-center justify-between gap-2 text-left cursor-pointer',
          open && 'ring-2 ring-gold-500/30 border-gold-500',
        )}
      >
        <span className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedLabels.length === 0 ? (
            <span className="text-stone-400">{placeholder}</span>
          ) : (
            selectedLabels.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md px-1.5 py-0.5 text-xs font-medium"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={(e) => removeTag(opt.value, e)}
                  className="text-emerald-500 hover:text-emerald-700 flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-stone-200 shadow-lg py-1 max-h-60 overflow-auto">
          {options.map((opt) => {
            const selected = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors duration-100',
                  selected
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-700 hover:bg-cream-100',
                )}
              >
                <span
                  className={cn(
                    'w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors',
                    selected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-stone-300',
                  )}
                >
                  {selected && <Check className="w-3 h-3" />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
