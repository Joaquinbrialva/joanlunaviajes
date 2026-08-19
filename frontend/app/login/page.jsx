'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@heroui/react';
import { LuEye, LuEyeOff, LuArrowLeft, LuCheck } from 'react-icons/lu';
import Logo from '@/components/ui/logo';

const STAFF_ROLES = ['admin', 'agent', 'designer'];

const inputClass = [
  'w-full h-11 px-4 rounded-xl border border-border bg-surface',
  'text-foreground text-[13px] placeholder:text-muted/50',
  'focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary/60',
  'transition-all',
].join(' ');

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const [res] = await Promise.all([
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }),
        new Promise(r => setTimeout(r, 1200)),
      ]);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.unverified) {
          window.location.href = `/registro/verificar?email=${encodeURIComponent(data.email)}`;
          return;
        }
        setError(data.error || 'Error al iniciar sesión.');
        return;
      }
      if (data.user.mustChangePassword) {
        setLoading(false);
        window.location.href = '/cambiar-contrasena';
        return;
      }
      setLoading(false);
      setSuccess(true);
      const dest = STAFF_ROLES.includes(data.user.role) ? '/admin' : '/cuenta';
      setTimeout(() => { window.location.href = dest; }, 700);
      return;
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-screen -mx-[calc((100vw-100%)/2)] min-h-screen flex">

      {/* ── Panel izquierdo: atmosférico ── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden shrink-0 bg-gradient-to-br from-brand-primary/[0.10] to-surface-secondary">
        {/* Wordmark */}
        <Link href="/" className="relative z-10 inline-flex items-center select-none group">
          <Logo className="h-6 w-auto transition-opacity group-hover:opacity-80" />
        </Link>

        {/* Quote */}
        <div className="relative z-10">
          <div className="h-px w-10 bg-brand-primary mb-7" />
          <blockquote className="font-extrabold text-foreground leading-[1.1] mb-5 tracking-tight" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
            El mundo es un libro.<br />
            <span className="text-brand-primary">Quienes no viajan</span><br />
            solo leen una página.
          </blockquote>
          <p className="text-[12px] text-muted font-semibold">
            — San Agustín
          </p>
        </div>

        <div />
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 bg-background overflow-y-auto">

        {/* Back — mobile */}
        <div className="w-full max-w-[400px] mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors">
            <LuArrowLeft size={13} /> Volver al inicio
          </Link>
        </div>

        <div className="w-full max-w-[400px]" style={{ animation: 'fadeUp 0.45s ease both' }}>

          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="font-extrabold text-foreground leading-tight mb-2 tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)' }}>
              Inicia sesión
            </h1>
            <p className="text-[13px] text-muted leading-relaxed">
              Accede a tus reservas y sigue el estado de tus viajes.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" htmlFor="email">
                Email
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password" type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  aria-label={showPwd ? 'Ocultar' : 'Mostrar'}
                >
                  {showPwd ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[13px] text-danger bg-danger/5 border border-danger/20 px-4 py-2.5 rounded-xl">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Link href="/olvide-contrasena" className="text-[12px] text-muted hover:text-brand-primary transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit" disabled={loading || success}
              className={`w-full h-11 mt-1 rounded-xl text-[13px] font-semibold active:scale-[0.98] transition-all shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 ${
                success
                  ? 'bg-success text-success-foreground shadow-success/20'
                  : 'bg-brand-primary text-brand-primary-foreground hover:opacity-90 shadow-brand-primary/20'
              }`}
            >
              {success
                ? <><LuCheck className="w-4 h-4" /> ¡Bienvenido!</>
                : loading
                  ? <><Spinner color="current" size="sm" /> Iniciando sesión...</>
                  : 'Iniciar sesión'
              }
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border space-y-2 text-center">
            <p className="text-[13px] text-muted">
              ¿No tienes cuenta?{' '}
              <Link href="/registro" className="text-brand-primary font-semibold hover:underline">
                Regístrate gratis
              </Link>
            </p>
            <Link href="/" className="hidden lg:block text-[13px] text-muted hover:text-foreground transition-colors">
              ← Volver al inicio
            </Link>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
