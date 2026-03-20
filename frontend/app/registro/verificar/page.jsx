'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { InputOTP, Spinner } from '@heroui/react';
import { LuMailCheck, LuArrowLeft, LuRefreshCw, LuShieldCheck } from 'react-icons/lu';
import { toastError, toastSuccess } from '@/lib/toast';

const C = { fontFamily: 'var(--font-cormorant)' };
const S = { fontFamily: 'var(--font-syne)' };

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

const EXPIRY_SECONDS = 15 * 60;
const RESEND_COOLDOWN = 60;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function VerificarContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code,           setCode]           = useState('');
  const [status,         setStatus]         = useState('idle'); // idle | verifying | success | error
  const [errorMsg,       setErrorMsg]       = useState('');
  const [secondsLeft,    setSecondsLeft]    = useState(EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending,      setResending]      = useState(false);

  // Expiry countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleVerify = useCallback(async (val) => {
    const otp = val ?? code;
    if (otp.length !== 6) return;
    setStatus('verifying');
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Código incorrecto.');
      setStatus('success');
      setTimeout(() => { window.location.href = '/cuenta'; }, 1800);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
      setCode('');
    }
  }, [code, email]);

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo reenviar.');
      setSecondsLeft(EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN);
      setCode('');
      setErrorMsg('');
      setStatus('idle');
      toastSuccess('Código reenviado. Revisá tu bandeja de entrada.');
    } catch (err) {
      toastError(err, 'Error al reenviar');
    } finally {
      setResending(false);
    }
  };

  const isExpired  = secondsLeft <= 0;
  const canResend  = (isExpired || resendCooldown === 0) && !resending;
  const isVerifying = status === 'verifying';

  return (
    <div className="w-screen -mx-[calc((100vw-100%)/2)] min-h-screen flex">

      {/* ── Panel izquierdo ── */}
      <div
        className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden shrink-0"
        style={{ background: '#080f16' }}
      >
        {/* Glow naranja */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 25% 75%, rgba(255,126,45,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(255,126,45,0.07) 0%, transparent 50%)',
        }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: grain }} />
        {/* Número decorativo */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-white/[0.025] select-none pointer-events-none leading-none"
          style={{ ...C, fontSize: '40vw', fontWeight: 300 }}
        >
          6
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

        {/* Copy central */}
        <div className="relative z-10">
          <div className="h-px w-10 bg-accent mb-7" />
          <h2 className="font-light text-white leading-[1.05] mb-6" style={{ ...C, fontSize: 'clamp(2rem, 3vw, 2.8rem)' }}>
            Casi listo.<br />
            Solo falta<br />
            <em className="font-semibold" style={{ color: '#ff9a5c' }}>un código.</em>
          </h2>
          <p className="text-[13px] text-white/40 leading-relaxed" style={S}>
            Revisá tu bandeja de entrada. Si no ves el email, mirá en spam o solicitá un nuevo código.
          </p>

          {/* Security note */}
          <div className="mt-8 flex items-start gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.03]">
            <LuShieldCheck size={15} className="text-accent shrink-0 mt-0.5" />
            <p className="text-[12px] text-white/35 leading-relaxed" style={S}>
              El código tiene validez de <strong className="text-white/50">15 minutos</strong>. No lo compartas con nadie.
            </p>
          </div>
        </div>

        {/* Footer panel */}
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/20 font-semibold" style={S}>
            Agencia de viajes premium · Buenos Aires
          </p>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background overflow-y-auto">

        {/* Back — mobile */}
        <div className="w-full max-w-[420px] mb-6 lg:hidden">
          <Link href="/registro" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors" style={S}>
            <LuArrowLeft size={13} /> Volver al registro
          </Link>
        </div>

        <div className="w-full max-w-[420px]" style={{ animation: 'fadeUp 0.45s ease both' }}>

          {/* Encabezado */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-accent" />
              <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-accent" style={S}>
                Verificación
              </p>
            </div>
            <h1 className="font-light text-foreground leading-none mb-3" style={{ ...C, fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
              Verificá tu <em className="font-semibold">email</em>
            </h1>
            <p className="text-[13px] text-muted leading-relaxed" style={S}>
              Enviamos un código de 6 dígitos a{' '}
              {email
                ? <strong className="text-foreground font-semibold">{email}</strong>
                : 'tu email'
              }.
            </p>
          </div>

          {/* Estado: éxito */}
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-5 py-10" style={{ animation: 'fadeUp 0.35s ease both' }}>
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <LuMailCheck size={32} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-[17px] font-semibold text-foreground mb-1" style={S}>¡Cuenta verificada!</p>
                <p className="text-[13px] text-muted" style={S}>Redirigiendo a tu cuenta…</p>
              </div>
            </div>
          ) : (
            <>
              {/* InputOTP */}
              <div className="flex flex-col items-center gap-4 mb-7">

                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={setCode}
                  onComplete={handleVerify}
                  isInvalid={status === 'error'}
                  isDisabled={isVerifying || isExpired}
                >
                  <InputOTP.Group>
                    <InputOTP.Slot index={0} />
                    <InputOTP.Slot index={1} />
                    <InputOTP.Slot index={2} />
                  </InputOTP.Group>
                  <InputOTP.Separator />
                  <InputOTP.Group>
                    <InputOTP.Slot index={3} />
                    <InputOTP.Slot index={4} />
                    <InputOTP.Slot index={5} />
                  </InputOTP.Group>
                </InputOTP>

                {/* Temporizador */}
                {!isExpired ? (
                  <p className="text-[12px] text-muted" style={S}>
                    Expira en{' '}
                    <span className={`font-semibold tabular-nums ${secondsLeft < 60 ? 'text-rose-500' : 'text-foreground'}`}>
                      {formatTime(secondsLeft)}
                    </span>
                  </p>
                ) : (
                  <p className="text-[12px] text-rose-500 font-semibold" style={S}>
                    El código expiró. Solicitá uno nuevo.
                  </p>
                )}

                {/* Error inline */}
                {errorMsg && (
                  <p
                    className="text-[13px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-2.5 rounded-xl w-full text-center"
                    style={S}
                  >
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Botón verificar (manual) */}
              {!isExpired && (
                <button
                  onClick={() => handleVerify(undefined)}
                  disabled={code.length < 6 || isVerifying}
                  className="w-full h-11 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-orange-500 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40 flex items-center justify-center gap-2 mb-3"
                  style={S}
                >
                  {isVerifying
                    ? <><Spinner color="current" size="sm" /> Verificando…</>
                    : 'Verificar código'
                  }
                </button>
              )}

              {/* Botón reenviar */}
              <button
                onClick={handleResend}
                disabled={!canResend}
                className="w-full h-11 rounded-xl border border-border text-[13px] text-muted hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={S}
              >
                {resending
                  ? <><Spinner size="sm" /> Reenviando…</>
                  : resendCooldown > 0
                    ? `Reenviar en ${resendCooldown}s`
                    : <><LuRefreshCw size={13} /> Reenviar código</>
                }
              </button>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center space-y-2">
            <p className="text-[13px] text-muted" style={S}>
              ¿Te equivocaste de email?{' '}
              <Link href="/registro" className="text-accent font-semibold hover:underline">
                Volvé al registro
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

export default function VerificarPage() {
  return (
    <Suspense>
      <VerificarContent />
    </Suspense>
  );
}
