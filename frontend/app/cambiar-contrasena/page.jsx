'use client';

import { useState, useMemo } from 'react';
import { LuEye, LuEyeOff, LuShield, LuCircleCheck } from 'react-icons/lu';

const REQS = [
  { key: 'len',     label: 'Al menos 8 caracteres',          test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'Una letra mayúscula',             test: (p) => /[A-Z]/.test(p) },
  { key: 'number',  label: 'Un número',                       test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'Un carácter especial (!@#$%...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(pwd) {
  const base = REQS.filter((r) => r.test(pwd)).length; // 0–4
  const bonus = pwd.length >= 12 ? 1 : 0;              // +1 si es larga
  return Math.min(base + bonus, 5);
}

const STRENGTH_LABEL = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'];
const STRENGTH_CLASS = ['', 'text-danger', 'text-warning', 'text-warning', 'text-success', 'text-success'];
const STRENGTH_BAR_CLASS = ['', 'bg-danger', 'bg-warning', 'bg-warning', 'bg-success', 'bg-success'];

const inputClass = 'w-full h-12 px-4 rounded-xl text-[13px] transition-all outline-none border bg-surface text-foreground placeholder:text-muted/50 focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/15';

export default function CambiarContrasenaPage() {
  const [password,   setPassword]   = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [status,     setStatus]     = useState('idle'); // idle | loading | done
  const [error,      setError]      = useState('');

  const strength   = useMemo(() => getStrength(password), [password]);
  const reqsMet    = useMemo(() => REQS.map((r) => ({ ...r, ok: r.test(password) })), [password]);
  const allReqsMet = reqsMet.every((r) => r.ok);
  const matchOk    = confirmPwd.length > 0 && password === confirmPwd;
  const matchFail  = confirmPwd.length > 0 && password !== confirmPwd;
  const canSubmit  = allReqsMet && matchOk;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!allReqsMet)               { setError('La contraseña no cumple los requisitos.'); return; }
    if (password !== confirmPwd)  { setError('Las contraseñas no coinciden.'); return; }

    setStatus('loading');
    try {
      const res  = await fetch('/api/auth/change-temp-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al cambiar la contraseña.'); setStatus('idle'); return; }
      setStatus('done');
      setTimeout(() => { window.location.href = '/admin'; }, 1800);
    } catch {
      setError('No se pudo conectar con el servidor.');
      setStatus('idle');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-brand-primary/[0.08] to-background">
      <div className="relative z-10 w-full max-w-[420px] px-6" style={{ animation: 'appear 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>

        {status === 'done' ? (
          /* ── Estado éxito ── */
          <div className="text-center space-y-6" style={{ animation: 'appear 0.5s ease both' }}>
            <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-success" />
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-success/12 border border-success/30">
                <LuCircleCheck className="w-9 h-9 text-success" />
              </div>
            </div>
            <div>
              <h1 className="text-foreground mb-2 font-extrabold tracking-tight text-3xl">
                Acceso <span className="text-brand-primary">desbloqueado</span>
              </h1>
              <p className="text-[13px] text-muted">
                Redirigiendo al panel...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-10">
              <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
                <LuShield className="w-5 h-5 text-brand-primary" />
              </div>

              <h1 className="text-foreground leading-tight mb-3 font-extrabold tracking-tight" style={{ fontSize: 'clamp(1.9rem, 6vw, 2.5rem)' }}>
                Establece tu <span className="text-brand-primary">contraseña</span>
              </h1>

              <p className="text-[13px] leading-relaxed text-muted">
                Estás usando una contraseña temporal. Crea una nueva para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Nueva contraseña */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} required autoFocus
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  >
                    {showPwd ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Requisitos + barra de fortaleza */}
                {password.length > 0 && (
                  <div className="space-y-2.5" style={{ animation: 'appear 0.3s ease both' }}>
                    {/* Barra */}
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= strength ? STRENGTH_BAR_CLASS[strength] : 'bg-border'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-medium ${STRENGTH_CLASS[strength]}`}>
                      {STRENGTH_LABEL[strength]}
                    </p>
                    {/* Checklist de requisitos */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {reqsMet.map((r) => (
                        <div key={r.key} className="flex items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${r.ok ? 'bg-success/15 border border-success/50' : 'bg-surface-secondary border border-border'}`}>
                            {r.ok && <span className="text-success" style={{ fontSize: 8, lineHeight: 1 }}>✓</span>}
                          </div>
                          <span className={`text-[11px] transition-colors ${r.ok ? 'text-foreground/70' : 'text-muted/60'}`}>
                            {r.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted">
                  Confirmar contraseña
                </label>
                <input
                  type={showPwd ? 'text' : 'password'} required
                  value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Repite la contraseña"
                  className={`${inputClass} ${matchOk ? 'border-success' : matchFail ? 'border-danger' : ''}`}
                />
                {matchFail && (
                  <p className="text-[11px] text-danger">Las contraseñas no coinciden</p>
                )}
                {matchOk && (
                  <p className="text-[11px] text-success">Las contraseñas coinciden</p>
                )}
              </div>

              {error && (
                <p className="text-[12px] px-4 py-3 rounded-xl text-danger bg-danger/5 border border-danger/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !canSubmit}
                className="w-full h-12 rounded-xl font-semibold text-[13px] transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 mt-2 bg-brand-primary text-brand-primary-foreground shadow-lg shadow-brand-primary/25"
              >
                {status === 'loading' ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Establecer contraseña y entrar'
                )}
              </button>

            </form>

            {/* Nota de seguridad */}
            <p className="mt-6 text-center text-[11px] leading-relaxed text-muted/70">
              Tu contraseña está cifrada y nunca se almacena en texto plano.<br />
              Puedes cambiarla en cualquier momento desde tu perfil.
            </p>
          </>
        )}

      </div>

      <style>{`
        @keyframes appear {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
