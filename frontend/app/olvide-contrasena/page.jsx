'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Spinner } from '@heroui/react';
import { LuArrowLeft, LuMail, LuCircleCheck } from 'react-icons/lu';

const C = { fontFamily: 'var(--font-cormorant)' };
const S = { fontFamily: 'var(--font-syne)' };

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

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
      <div
        className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden shrink-0"
        style={{ background: '#080f16' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 30% 70%, rgba(255,126,45,0.16) 0%, transparent 60%)',
        }} />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: grain }} />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-white/[0.022] select-none pointer-events-none leading-none"
          style={{ ...C, fontSize: '38vw', fontWeight: 300 }}
        >
          ?
        </div>

        <Link href="/login" className="relative z-10 inline-flex items-baseline gap-0.5 select-none group">
          <span className="text-white text-[14px] font-extrabold tracking-tight uppercase transition-opacity group-hover:opacity-80" style={S}>
            JOANLUNA
          </span>
          <span className="text-accent ml-0.5" style={{ ...C, fontStyle: 'italic', fontSize: '17px', textShadow: '0 0 20px rgba(255,126,45,0.45)' }}>
            viajes
          </span>
        </Link>

        <div className="relative z-10">
          <div className="h-px w-10 bg-accent mb-7" />
          <p className="font-light text-white leading-[1.08] mb-4" style={{ ...C, fontSize: 'clamp(1.8rem, 2.8vw, 2.4rem)' }}>
            Te ayudamos a<br />
            <em className="font-semibold" style={{ color: '#ff9a5c' }}>recuperar el acceso</em><br />
            a tu cuenta.
          </p>
          <p className="text-[12px] text-white/30 leading-relaxed" style={S}>
            Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/20 font-semibold" style={S}>
            Agencia de viajes premium · Buenos Aires
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 bg-background">

        <div className="w-full max-w-[400px] mb-8 lg:hidden">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors" style={S}>
            <LuArrowLeft size={13} /> Volver al inicio de sesión
          </Link>
        </div>

        <div className="w-full max-w-[400px]" style={{ animation: 'fadeUp 0.45s ease both' }}>

          {status === 'done' ? (
            /* ── Estado enviado ── */
            <div className="text-center space-y-5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 mx-auto">
                <LuCircleCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h1 className="font-light text-foreground mb-2" style={{ ...C, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
                  ¡<em className="font-semibold">Revisá</em> tu email!
                </h1>
                <p className="text-[13px] text-muted leading-relaxed" style={S}>
                  Si <strong className="text-foreground">{email}</strong> tiene una cuenta, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
              </div>
              <p className="text-[12px] text-muted" style={S}>
                ¿No llegó? Revisá la carpeta de spam o{' '}
                <button onClick={() => setStatus('idle')} className="text-accent font-semibold hover:underline">
                  intentá de nuevo
                </button>.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors"
                style={S}
              >
                <LuArrowLeft size={13} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-accent" />
                  <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-accent" style={S}>
                    Recuperar acceso
                  </p>
                </div>
                <h1 className="font-light text-foreground leading-none mb-2" style={{ ...C, fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
                  ¿Olvidaste tu <em className="font-semibold">contraseña?</em>
                </h1>
                <p className="text-[13px] text-muted leading-relaxed" style={S}>
                  Ingresá tu email y te enviamos un enlace para crear una nueva.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S}>
                    Email
                  </label>
                  <div className="relative">
                    <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                    <input
                      type="email" required autoComplete="email"
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-surface text-foreground text-[13px] placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60 transition-all"
                      style={S}
                    />
                  </div>
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
                    ? <><Spinner color="current" size="sm" /> Enviando enlace...</>
                    : 'Enviar enlace de recuperación'
                  }
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-border text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors" style={S}>
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
