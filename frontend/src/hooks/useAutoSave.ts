'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook: Autosave form data ke localStorage setiap kali pindah step.
 * Supaya user tidak kehilangan data jika koneksi putus.
 *
 * @param key - Unique key untuk localStorage
 * @param data - Form data yang akan disimpan
 * @param enabled - Toggle autosave on/off
 */
export function useAutoSave<T>(key: string, data: T, enabled = true) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save data
  const save = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        savedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('Autosave gagal:', error);
    }
  }, [key, data, enabled]);

  // Auto-save setiap 5 detik (debounced)
  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [save, enabled]);

  // Restore data
  const restore = useCallback((): { data: T; savedAt: string } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, [key]);

  // Clear saved data
  const clear = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }, [key]);

  // Save segera (untuk dipanggil saat pindah step)
  const saveNow = useCallback(() => {
    save();
  }, [save]);

  return { restore, clear, saveNow };
}
