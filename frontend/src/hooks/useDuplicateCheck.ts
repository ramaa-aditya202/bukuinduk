'use client';

import { useState, useCallback, useRef } from 'react';
import api from '@/lib/api';

/**
 * Hook: Debounced NISN/NIK duplicate check.
 * Pengecekan dilakukan setelah user berhenti mengetik 500ms.
 */
export function useDuplicateCheck() {
  const [checking, setChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<{
    is_duplicate: boolean;
    existing?: { name: string; nisn: string } | null;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(
    (field: 'nisn' | 'nik', value: string, excludeId?: string) => {
      // Reset jika value kosong
      if (!value || value.length < 4) {
        setDuplicate(null);
        return;
      }

      // Debounce 500ms
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        setChecking(true);
        try {
          const res = await api.get('/students/check-duplicate', {
            params: { field, value, exclude_id: excludeId },
          });
          setDuplicate(res.data);
        } catch (error) {
          console.error('Duplicate check gagal:', error);
          setDuplicate(null);
        } finally {
          setChecking(false);
        }
      }, 500);
    },
    []
  );

  const reset = useCallback(() => {
    setDuplicate(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    check,
    reset,
    checking,
    isDuplicate: duplicate?.is_duplicate ?? false,
    existingStudent: duplicate?.existing ?? null,
  };
}
