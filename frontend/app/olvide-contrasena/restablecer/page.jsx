'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@heroui/react';
import { LuArrowLeft, LuEye, LuEyeOff, LuCircleCheck, LuCircleX } from 'react-icons/lu';

const C = { fontFamily: 'var(--font-cormorant)' };
const S = { fontFamily: 'var(--font-syne)' };

function RestablecerForm() {
  const params   = useSearchParams();
  const token    = params.get('token')  || '';
  const email    = params.get('email')  || '';

  const [password,    setPassword]    = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [status,      setStatus]      = useState('idle'); // idle | loading | done | error
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!token || !email) setStatus('invalid');
  }, [token, email]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPwd) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6)     { setError('La contraseña debe tener al menos 6 caracteres.'); return; }

    setStatus('loading');
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al restablecer la contraseña.'); setStatus('idle'); return; }
      setStatus('done');
    } catch {
      setError('No se pudo conectar con el servidor.');
      setStatus('idle');
    }
  }

  /* ── Enlace inválido ── */
  if (status === 'invalid') {
    return (
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 mx-auto">
          <LuCircleX className="w-7 h-7 text-rose-500" />
        </div>
        <div>
          <h1 className="font-light text-foreground mb-2" style={{ ...C, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
            Enlace <em className="font-semibold">inválido</em>
          </h1>
          <p className="text-[13px] text-muted leading-relaxed" style={S}>
            Este enlace es inválido o ya expiró. Solicitá uno nuevo.
          </p>
        </div>
        <Link
          href="/olvide-contrasena"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-orange-500 transition-all"
          style={S}
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  /* ── Éxito ── */
  if (status === 'done') {
    return (
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 mx-auto">
          <LuCircleCheck className="w-7 h-7 text-emerald-500" />
        </div>
        <div>
          <h1 className="font-light text-foreground mb-2" style={{ ...C, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
            ¡Contraseña <em className="font-semibold">actualizada!</em>
          </h1>
          <p className="text-[13px] text-muted leading-relaxed" style={S}>
            Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-orange-500 transition-all"
          style={S}
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  /* ── Formulario ── */
  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-accent" />
          <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-accent" style={S}>
            Nueva contraseña
          </p>
        </div>
        <h1 className="font-light text-foreground leading-none mb-2" style={{ ...C, fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
          Restablecé tu <em className="font-semibold">contraseña</em>
        </h1>
        <p className="text-[13px] text-muted" style={S}>
          Elegí una contraseña segura para{' '}
          <span className="text-foreground font-medium">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nueva contraseña */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S}>
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mín. 6 caracteres"
              className="w-full h-11 px-4 pr-11 rounded-xl border border-border bg-surface text-foreground text-[13px] placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60 transition-all"
              style={S}
            />
            <button
              type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showPwd ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirmar */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S}>
            Confirmar contraseña
          </label>
          <input
            type={showPwd ? 'text' : 'password'} required
            value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
            placeholder="Repetí la contraseña"
            className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground text-[13px] placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60 transition-all"
            style={S}
          />
        </div>

        {error && (
          <p className="text-[13px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-2.5 rounded-xl" style={S}>
            {error}
          </p>
        )}

        <button
          type="submit" disabled={status === 'loading'}
          className="w-full h-11 mt-1 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-orange-500 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
          style={S}
        >
          {status === 'loading'
            ? <><Spinner color="current" size="sm" /> Guardando...</>
            : 'Guardar nueva contraseña'
          }
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-border text-center">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors" style={S}>
          <LuArrowLeft size={13} /> Volver al inicio de sesión
        </Link>
      </div>
    </>
  );
}

export default function RestablecerPage() {
  return (
    <div className="w-screen -mx-[calc((100vw-100%)/2)] min-h-screen flex items-center justify-center px-6 py-14 bg-background">
      <div className="w-full max-w-[400px]" style={{ animation: 'fadeUp 0.45s ease both' }}>
        <Suspense fallback={<div className="h-64 rounded-2xl bg-muted/10 animate-pulse" />}>
          <RestablecerForm />
        </Suspense>
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
