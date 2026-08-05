'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { BookOpen, Shield } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const { login, loginWithSSO, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sso') === 'true' || params.get('autoSSO') === 'true') {
        loginWithSSO();
      }
    }
  }, [loginWithSSO]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      toast.error(error?.message || 'Login gagal. Periksa kembali email dan password Anda.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-warm-lg overflow-hidden animate-fade-in border border-stone-100">
        <div className="bg-emerald-800 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-gold-500 rounded-full mx-auto flex items-center justify-center shadow-gold-glow mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide">Buku Induk</h1>
          <p className="text-emerald-200 text-sm mt-1">Sistem Data Peserta Didik</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sekolah.sch.id"
              required
              disabled={isSubmitting || loading}
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting || loading}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isSubmitting || loading}
            >
              Masuk
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={loginWithSSO}
              disabled={isSubmitting || loading}
            >
              <Shield className="w-4 h-4 text-emerald-700" />
              <span className="ml-1">Masuk dengan SSO Sekolah</span>
            </Button>
            <p className="text-xs text-center text-stone-400 mt-4">
              Gunakan akun Authentik Anda untuk akses yang lebih aman.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
