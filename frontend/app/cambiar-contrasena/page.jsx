'use client';

import { useState, useMemo } from 'react';
import { LuEye, LuEyeOff, LuShield, LuCircleCheck } from 'react-icons/lu';

const C = { fontFamily: 'var(--font-cormorant)' };
const S = { fontFamily: 'var(--font-syne)' };

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)'/%3E%3C/svg%3E")`;

function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)               score++;
  if (pwd.length >= 12)              score++;
  if (/[A-Z]/.test(pwd))            score++;
  if (/[0-9]/.test(pwd))            score++;
  if (/[^A-Za-z0-9]/.test(pwd))     score++;
  return score; // 0–5
}

const STRENGTH_LABEL = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'];
const STRENGTH_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

export default function CambiarContrasenaPage() {
  const [password,   setPassword]   = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [status,     setStatus]     = useState('idle'); // idle | loading | done
  const [error,      setError]      = useState('');

  const strength  = useMemo(() => getStrength(password), [password]);
  const matchOk   = confirmPwd.length > 0 && password === confirmPwd;
  const matchFail = confirmPwd.length > 0 && password !== confirmPwd;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPwd) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6)     { setError('Mínimo 6 caracteres.'); return; }

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
    <div
      className="w-screen -mx-[calc((100vw-100%)/2)] min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#060b10' }}
    >
      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.045] pointer-events-none mix-blend-overlay" style={{ backgroundImage: grain }} />

      {/* Glow superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,126,45,0.12) 0%, transparent 70%)' }} />

      {/* Grid decorativo */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      <div className="relative z-10 w-full max-w-[420px] px-6" style={{ animation: 'appear 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>

        {status === 'done' ? (
          /* ── Estado éxito ── */
          <div className="text-center space-y-6" style={{ animation: 'appear 0.5s ease both' }}>
            <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#10b981' }} />
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <LuCircleCheck className="w-9 h-9" style={{ color: '#10b981' }} />
              </div>
            </div>
            <div>
              <h1 className="text-white mb-2" style={{ ...C, fontSize: '2.2rem', fontWeight: 400 }}>
                Acceso <em className="font-semibold" style={{ color: '#ff9a5c' }}>desbloqueado</em>
              </h1>
              <p className="text-[13px]" style={{ ...S, color: 'rgba(255,255,255,0.35)' }}>
                Redirigiendo al panel...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-10">
              {/* Ícono */}
              <div className="mb-7 inline-flex items-center justify-center w-12 h-12 rounded-2xl"
                style={{ background: 'rgba(255,126,45,0.1)', border: '1px solid rgba(255,126,45,0.2)' }}>
                <LuShield className="w-5 h-5 text-accent" />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-6 bg-accent" />
                <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-accent" style={S}>
                  Acceso inicial
                </p>
              </div>

              <h1 className="text-white leading-[1.05] mb-3" style={{ ...C, fontSize: 'clamp(2rem, 6vw, 2.8rem)', fontWeight: 400 }}>
                Establecé tu<br />
                <em className="font-semibold" style={{ color: '#ff9a5c' }}>contraseña</em>
              </h1>

              <p className="text-[13px] leading-relaxed" style={{ ...S, color: 'rgba(255,255,255,0.35)' }}>
                Estás usando una contraseña temporal. Creá una nueva para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Nueva contraseña */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ ...S, color: 'rgba(255,255,255,0.35)' }}>
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} required autoFocus
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className="w-full h-12 px-4 pr-12 rounded-xl text-[13px] transition-all outline-none"
                    style={{
                      ...S,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${password && strength >= 4 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      color: 'rgba(255,255,255,0.9)',
                    }}
                  />
                  <button
                    type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {showPwd ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Indicador de fortaleza */}
                {password.length > 0 && (
                  <div className="space-y-1.5" style={{ animation: 'appear 0.3s ease both' }}>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{
                            background: i <= strength ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,0.08)',
                            opacity: i <= strength ? 1 : 1,
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] font-medium transition-colors" style={{ ...S, color: STRENGTH_COLOR[strength] }}>
                      {STRENGTH_LABEL[strength]}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmar */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ ...S, color: 'rgba(255,255,255,0.35)' }}>
                  Confirmar contraseña
                </label>
                <input
                  type={showPwd ? 'text' : 'password'} required
                  value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Repetí la contraseña"
                  className="w-full h-12 px-4 rounded-xl text-[13px] transition-all outline-none"
                  style={{
                    ...S,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${matchOk ? 'rgba(16,185,129,0.4)' : matchFail ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: 'rgba(255,255,255,0.9)',
                  }}
                />
                {matchFail && (
                  <p className="text-[11px]" style={{ ...S, color: '#ef4444' }}>Las contraseñas no coinciden</p>
                )}
                {matchOk && (
                  <p className="text-[11px]" style={{ ...S, color: '#10b981' }}>Las contraseñas coinciden</p>
                )}
              </div>

              {error && (
                <p className="text-[12px] px-4 py-3 rounded-xl" style={{ ...S, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || matchFail || !password || !confirmPwd}
                className="w-full h-12 rounded-xl font-semibold text-[13px] transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
                style={{
                  ...S,
                  background: 'linear-gradient(135deg, #ff7e2d 0%, #ff5f00 100%)',
                  color: '#fff',
                  boxShadow: status !== 'loading' ? '0 8px 24px rgba(255,126,45,0.3)' : 'none',
                }}
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
            <p className="mt-6 text-center text-[11px] leading-relaxed" style={{ ...S, color: 'rgba(255,255,255,0.18)' }}>
              Tu contraseña está cifrada y nunca se almacena en texto plano.<br />
              Podés cambiarla en cualquier momento desde tu perfil.
            </p>
          </>
        )}

      </div>

      <style>{`
        @keyframes appear {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(255,126,45,0.5) !important; box-shadow: 0 0 0 3px rgba(255,126,45,0.08); }
      `}</style>
    </div>
  );
}
