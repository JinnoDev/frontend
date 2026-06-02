'use client';
import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import Logo from '@/components/Logo';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetting, setResetting] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to home
  useEffect(() => {
    if (!authLoading && user) router.replace('/home');
  }, [user, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push('/home');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetting(true);
    try {
      const res = await authApi.resetPassword(resetEmail);
      toast.success(res.data.message);
      setShowReset(false);
      setResetEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Email no encontrado');
    } finally {
      setResetting(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><Logo size={96} /></div>
        <h1 className="text-center text-2xl font-semibold text-white mb-1">SocialConnect</h1>
        <p className="text-center text-sm text-gray-500 mb-8">Inicia sesión en tu cuenta</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#c9a84c] transition-colors" />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#c9a84c] transition-colors" />
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowReset(true)} className="text-xs text-gray-500 hover:text-[#c9a84c] transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#c9a84c] hover:bg-[#e4c46a] disabled:opacity-50 text-black font-semibold py-3 rounded-lg text-sm transition-colors mt-1">
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-[#c9a84c] hover:underline">Regístrate</Link>
        </p>
      </div>

      {/* Reset password modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Restablecer contraseña</h2>
            <p className="text-sm text-gray-500 mb-5">
              Ingresa tu email y se asignará la contraseña <span className="text-[#c9a84c] font-mono">12345678</span> de forma temporal.
            </p>
            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <input type="email" placeholder="Tu correo electrónico" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#c9a84c] transition-colors" />
              <button type="submit" disabled={resetting}
                className="w-full bg-[#c9a84c] hover:bg-[#e4c46a] disabled:opacity-50 text-black font-semibold py-3 rounded-lg text-sm transition-colors">
                {resetting ? 'Restableciendo...' : 'Restablecer contraseña'}
              </button>
              <button type="button" onClick={() => { setShowReset(false); setResetEmail(''); }}
                className="w-full border border-[#2a2a2a] text-gray-400 hover:text-white py-2.5 rounded-lg text-sm transition-colors">
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
