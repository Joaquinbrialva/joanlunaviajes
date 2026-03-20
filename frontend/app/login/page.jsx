'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@heroui/react';
import { LuEye, LuEyeOff, LuArrowLeft } from 'react-icons/lu';

const C = { fontFamily: 'var(--font-cormorant)' };
const S = { fontFamily: 'var(--font-syne)' };
const STAFF_ROLES = ['admin', 'agent', 'designer'];

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

const inputClass = [
  'w-full h-11 px-4 rounded-xl border border-border bg-surface',
  'text-foreground text-[13px] placeholder:text-muted/50',
  'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60',
  'transition-all',
].join(' ');

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

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
      window.location.href = STAFF_ROLES.includes(data.user.role) ? '/admin' : '/cuenta';
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-screen -mx-[calc((100vw-100%)/2)] min-h-screen flex">

      {/* ── Panel izquierdo: atmosférico ── */}
      <div
        className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden shrink-0"
        style={{ background: '#080f16' }}
      >
        {/* Glow naranja de fondo */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 20% 90%, rgba(255,126,45,0.2) 0%, transparent 60%)',
        }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: grain }} />
        {/* Letra decorativa de fondo */}
        <div
          className="absolute -right-8 top-1/2 -translate-y-[55%] text-white/[0.025] select-none pointer-events-none leading-none"
          style={{ ...C, fontSize: '40vw', fontWeight: 300 }}
        >
          V
        </div>

        {/* Wordmark */}
        <Link href="/" className="relative z-10 inline-flex items-baseline gap-0.5 select-none group">
          <span className="text-white text-[14px] font-extrabold tracking-tight uppercase transition-opacity group-hover:opacity-80" style={S}>
            JOANLUNA
          </span>
          <span className="text-accent ml-0.5" style={{ ...C, fontStyle: 'italic', fontSize: '17px', textShadow: '0 0 20px rgba(255,126,45,0.45)' }}>
            viajes
          </span>
        </Link>

        {/* Quote */}
        <div className="relative z-10">
          <div className="h-px w-10 bg-accent mb-7" />
          <blockquote style={{ ...C, fontSize: 'clamp(2rem, 3vw, 2.8rem)' }} className="font-light text-white leading-[1.08] mb-5">
            El mundo es un libro.<br />
            <em className="font-semibold" style={{ color: '#ff9a5c' }}>Quienes no viajan</em><br />
            solo leen una página.
          </blockquote>
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/30 font-semibold" style={S}>
            — San Agustín
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex items-end gap-8">
          {[['500+', 'Destinos'], ['15 años', 'Experiencia'], ['98%', 'Satisfacción']].map(([v, l]) => (
            <div key={l}>
              <p className="font-light text-white leading-none" style={{ ...C, fontSize: '1.5rem' }}>{v}</p>
              <p className="text-white/30 text-[9px] uppercase tracking-[0.22em] mt-1" style={S}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 bg-background overflow-y-auto">

        {/* Back — mobile */}
        <div className="w-full max-w-[400px] mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors" style={S}>
            <LuArrowLeft size={13} /> Volver al inicio
          </Link>
        </div>

        <div className="w-full max-w-[400px]" style={{ animation: 'fadeUp 0.45s ease both' }}>

          {/* Encabezado */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-accent" />
              <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-accent" style={S}>
                Bienvenido
              </p>
            </div>
            <h1 className="font-light text-foreground leading-none mb-2" style={{ ...C, fontSize: 'clamp(2.2rem, 5vw, 3rem)' }}>
              Inicia <em className="font-semibold">sesión</em>
            </h1>
            <p className="text-[13px] text-muted leading-relaxed" style={S}>
              Accede a tus reservas y sigue el estado de tus viajes.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S} htmlFor="email">
                Email
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={inputClass} style={S}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S} htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password" type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`} style={S}
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
              <p className="text-[13px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-2.5 rounded-xl" style={S}>
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full h-11 mt-1 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-orange-500 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
              style={S}
            >
              {loading
                ? <><Spinner color="current" size="sm" /> Iniciando sesión...</>
                : 'Iniciar sesión'
              }
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border space-y-2 text-center">
            <p className="text-[13px] text-muted" style={S}>
              ¿No tienes cuenta?{' '}
              <Link href="/registro" className="text-accent font-semibold hover:underline">
                Regístrate gratis
              </Link>
            </p>
            <Link href="/" className="hidden lg:block text-[13px] text-muted hover:text-foreground transition-colors" style={S}>
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
