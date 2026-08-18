'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Spinner } from '@heroui/react';
import { LuArrowLeft, LuMail, LuCircleCheck } from 'react-icons/lu';
import Logo from '@/components/ui/logo';

export default function OlvideContrasenaPage() {
  const [email,   setEmail]   = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | loading | done
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al procesar la solicitud.'); setStatus('idle'); return; }
      setStatus('done');
    } catch {
      setError('No se pudo conectar con el servidor.');
      setStatus('idle');
    }
  }

  return (
    <div className="w-screen -mx-[calc((100vw-100%)/2)] min-h-screen flex">

      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden shrink-0 bg-gradient-to-br from-brand-primary/[0.10] to-surface-secondary">
        <Link href="/login" className="relative z-10 inline-flex items-center select-none group">
          <Logo className="h-6 w-auto transition-opacity group-hover:opacity-80" />
        </Link>

        <div className="relative z-10">
          <div className="h-px w-10 bg-brand-primary mb-7" />
          <p className="font-extrabold text-foreground leading-[1.15] mb-4 tracking-tight" style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.2rem)' }}>
            Te ayudamos a <span className="text-brand-primary">recuperar el acceso</span> a tu cuenta.
          </p>
          <p className="text-[12px] text-muted leading-relaxed">
            Ingresa tu email y te enviamos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-[12px] text-muted font-semibold">
            Joanluna Viajes · Buenos Aires
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 bg-background">

        <div className="w-full max-w-[400px] mb-8 lg:hidden">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors">
            <LuArrowLeft size={13} /> Volver al inicio de sesión
          </Link>
        </div>

        <div className="w-full max-w-[400px]" style={{ animation: 'fadeUp 0.45s ease both' }}>

          {status === 'done' ? (
            /* ── Estado enviado ── */
            <div className="text-center space-y-5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 border border-success/20 mx-auto">
                <LuCircleCheck className="w-7 h-7 text-success" />
              </div>
              <div>
                <h1 className="font-extrabold text-foreground mb-2 tracking-tight" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.2rem)' }}>
                  ¡Revisa tu email!
                </h1>
                <p className="text-[13px] text-muted leading-relaxed">
                  Si <strong className="text-foreground">{email}</strong> tiene una cuenta, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
              </div>
              <p className="text-[12px] text-muted">
                ¿No llegó? Revisa la carpeta de spam o{' '}
                <button onClick={() => setStatus('idle')} className="text-brand-primary font-semibold hover:underline">
                  intenta de nuevo
                </button>.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors"
              >
                <LuArrowLeft size={13} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              <div className="mb-8">
                <h1 className="font-extrabold text-foreground leading-tight mb-2 tracking-tight" style={{ fontSize: 'clamp(1.9rem, 5vw, 2.5rem)' }}>
                  ¿Olvidaste tu contraseña?
                </h1>
                <p className="text-[13px] text-muted leading-relaxed">
                  Ingresa tu email y te enviamos un enlace para crear una nueva.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted">
                    Email
                  </label>
                  <div className="relative">
                    <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                    <input
                      type="email" required autoComplete="email"
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-surface text-foreground text-[13px] placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary/60 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-[13px] text-danger bg-danger/5 border border-danger/20 px-4 py-2.5 rounded-xl">
                    {error}
                  </p>
                )}

                <button
                  type="submit" disabled={status === 'loading'}
                  className="w-full h-11 mt-1 rounded-xl bg-brand-primary text-brand-primary-foreground text-[13px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {status === 'loading'
                    ? <><Spinner color="current" size="sm" /> Enviando enlace...</>
                    : 'Enviar enlace de recuperación'
                  }
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-border text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors">
                  <LuArrowLeft size={13} /> Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}

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
