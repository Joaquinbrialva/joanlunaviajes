'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { InputOTP, Spinner } from '@heroui/react';
import { LuMailCheck, LuArrowLeft, LuRefreshCw, LuShieldCheck } from 'react-icons/lu';
import { toastError, toastSuccess } from '@/lib/toast';
import Logo from '@/components/ui/logo';

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
      toastSuccess('Código reenviado. Revisa tu bandeja de entrada.');
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
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden shrink-0 bg-gradient-to-br from-brand-primary/[0.10] to-surface-secondary">
        {/* Wordmark */}
        <Link href="/" className="relative z-10 inline-flex items-center select-none group">
          <Logo className="h-6 w-auto transition-opacity group-hover:opacity-80" />
        </Link>

        {/* Copy central */}
        <div className="relative z-10">
          <div className="h-px w-10 bg-brand-primary mb-7" />
          <h2 className="font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
            Casi listo. Solo falta <span className="text-brand-primary">un código.</span>
          </h2>
          <p className="text-[13px] text-muted leading-relaxed">
            Revisa tu bandeja de entrada. Si no ves el email, mira en spam o solicita un nuevo código.
          </p>

          {/* Security note */}
          <div className="mt-8 flex items-start gap-3 p-4 rounded-xl border border-border bg-surface">
            <LuShieldCheck size={15} className="text-brand-primary shrink-0 mt-0.5" />
            <p className="text-[12px] text-muted leading-relaxed">
              El código tiene validez de <strong className="text-foreground">15 minutos</strong>. No lo compartas con nadie.
            </p>
          </div>
        </div>

        {/* Footer panel */}
        <div className="relative z-10">
          <p className="text-[12px] text-muted font-semibold">
            Joanluna Viajes · Buenos Aires
          </p>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background overflow-y-auto">

        {/* Back — mobile */}
        <div className="w-full max-w-[420px] mb-6 lg:hidden">
          <Link href="/registro" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors">
            <LuArrowLeft size={13} /> Volver al registro
          </Link>
        </div>

        <div className="w-full max-w-[420px]" style={{ animation: 'fadeUp 0.45s ease both' }}>

          {/* Encabezado */}
          <div className="mb-10">
            <h1 className="font-extrabold text-foreground leading-tight mb-3 tracking-tight" style={{ fontSize: 'clamp(1.9rem, 5vw, 2.5rem)' }}>
              Verifica tu email
            </h1>
            <p className="text-[13px] text-muted leading-relaxed">
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
              <div className="w-20 h-20 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                <LuMailCheck size={32} className="text-success" />
              </div>
              <div className="text-center">
                <p className="text-[17px] font-semibold text-foreground mb-1">¡Cuenta verificada!</p>
                <p className="text-[13px] text-muted">Redirigiendo a tu cuenta…</p>
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
                  <p className="text-[12px] text-muted">
                    Expira en{' '}
                    <span className={`font-semibold tabular-nums ${secondsLeft < 60 ? 'text-danger' : 'text-foreground'}`}>
                      {formatTime(secondsLeft)}
                    </span>
                  </p>
                ) : (
                  <p className="text-[12px] text-danger font-semibold">
                    El código expiró. Solicita uno nuevo.
                  </p>
                )}

                {/* Error inline */}
                {errorMsg && (
                  <p className="text-[13px] text-danger bg-danger/10 border border-danger/20 px-4 py-2.5 rounded-xl w-full text-center">
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Botón verificar (manual) */}
              {!isExpired && (
                <button
                  onClick={() => handleVerify(undefined)}
                  disabled={code.length < 6 || isVerifying}
                  className="w-full h-11 rounded-xl bg-brand-primary text-brand-primary-foreground text-[13px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-40 flex items-center justify-center gap-2 mb-3"
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
            <p className="text-[13px] text-muted">
              ¿Te equivocaste de email?{' '}
              <Link href="/registro" className="text-brand-primary font-semibold hover:underline">
                Vuelve al registro
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

export default function VerificarPage() {
  return (
    <Suspense>
      <VerificarContent />
    </Suspense>
  );
}
