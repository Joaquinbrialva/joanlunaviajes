'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Spinner } from '@heroui/react';
import { LuEye, LuEyeOff, LuArrowLeft, LuCheck } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import Logo from '@/components/ui/logo';
import { toastError } from '@/lib/toast';

const inputClass = [
  'w-full h-11 px-4 rounded-xl border border-border bg-surface',
  'text-foreground text-[13px] placeholder:text-muted/50',
  'focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary/60',
  'transition-all',
].join(' ');

const PREFIX_OPTIONS = [
  { value: '+54', label: 'AR +54' },
  { value: '+598', label: 'UY +598' },
  { value: '+56', label: 'CL +56' },
  { value: '+55', label: 'BR +55' },
  { value: '+595', label: 'PY +595' },
  { value: '+591', label: 'BO +591' },
  { value: '+51', label: 'PE +51' },
  { value: '+57', label: 'CO +57' },
  { value: '+58', label: 'VE +58' },
  { value: '+52', label: 'MX +52' },
  { value: '+34', label: 'ES +34' },
  { value: '+1',  label: 'US +1'  },
  { value: '+39', label: 'IT +39' },
  { value: '+33', label: 'FR +33' },
  { value: '+49', label: 'DE +49' },
];

const REQS = [
  { key: 'len',     label: 'Al menos 8 caracteres',           test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'Una letra mayúscula',              test: (p) => /[A-Z]/.test(p) },
  { key: 'number',  label: 'Un número',                        test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'Un carácter especial (!@#$%...)',  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const PERKS = [
  'Sigue el estado de tus reservas en tiempo real',
  'Guarda destinos y ofertas favoritas',
  'Consulta directamente con nuestros agentes',
];

export default function RegistroPage() {
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [phonePrefix,   setPhonePrefix]   = useState('+54');
  const [phoneNumber,   setPhoneNumber]   = useState('');
  const [password,      setPassword]      = useState('');
  const [confirmPwd,    setConfirmPwd]    = useState('');
  const [showPwd,       setShowPwd]       = useState(false);
  const [status,        setStatus]        = useState('idle');

  const reqsMet    = useMemo(() => REQS.map((r) => ({ ...r, ok: r.test(password) })), [password]);
  const allReqsMet = reqsMet.every((r) => r.ok);
  const matchOk    = confirmPwd.length > 0 && password === confirmPwd;
  const matchFail  = confirmPwd.length > 0 && password !== confirmPwd;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allReqsMet)              { toastError('La contraseña no cumple los requisitos de seguridad.'); return; }
    if (password !== confirmPwd)  { toastError('Las contraseñas no coinciden.'); return; }
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     name.trim(),
          email:    email.trim(),
          phone:    phoneNumber.trim() ? `${phonePrefix} ${phoneNumber.trim()}` : '',
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al crear la cuenta.');
      window.location.href = `/registro/verificar?email=${encodeURIComponent(email.trim())}`;
    } catch (err) {
      toastError(err, 'Error al registrarse');
      setStatus('idle');
    }
  }

  return (
    <div className="w-screen -mx-[calc((100vw-100%)/2)] min-h-screen flex">

      {/* ── Panel izquierdo: atmosférico ── */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden shrink-0 bg-gradient-to-br from-brand-primary/[0.10] to-surface-secondary">
        {/* Wordmark */}
        <Link href="/" className="relative z-10 inline-flex items-center select-none group">
          <Logo className="h-6 w-auto transition-opacity group-hover:opacity-80" />
        </Link>

        {/* Copy central */}
        <div className="relative z-10">
          <div className="h-px w-10 bg-brand-primary mb-7" />
          <h2 className="font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
            Tu próxima aventura<br />
            empieza con un<br />
            <span className="text-brand-primary">solo clic.</span>
          </h2>

          {/* Perks */}
          <ul className="space-y-3.5">
            {PERKS.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <LuCheck size={10} className="text-brand-primary" />
                </div>
                <p className="text-[13px] text-muted leading-snug">{p}</p>
              </li>
            ))}
          </ul>
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
        <div className="w-full max-w-[440px] mb-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors">
            <LuArrowLeft size={13} /> Volver al inicio
          </Link>
        </div>

        <div className="w-full max-w-[440px]" style={{ animation: 'fadeUp 0.45s ease both' }}>

          {/* Encabezado */}
          <div className="mb-7">
            <h1 className="font-extrabold text-foreground leading-tight mb-2 tracking-tight" style={{ fontSize: 'clamp(1.9rem, 5vw, 2.6rem)' }}>
              Regístrate gratis
            </h1>
            <p className="text-[13px] text-muted">
              Crea tu cuenta en segundos y empieza a planificar.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted">
                Nombre completo <span className="text-brand-primary normal-case">*</span>
              </label>
              <input
                required value={name} onChange={e => setName(e.target.value)}
                placeholder="Tu nombre completo"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted">
                Email <span className="text-brand-primary normal-case">*</span>
              </label>
              <input
                required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={inputClass}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted">
                Teléfono / WhatsApp
              </label>
              <div className="flex gap-2">
                <HeroSelect
                  value={phonePrefix} onValueChange={setPhonePrefix}
                  options={PREFIX_OPTIONS}
                  className="w-32 shrink-0"
                />
                <input
                  type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="11 1234-5678"
                  className="flex-1 h-11 px-4 rounded-xl border border-border bg-surface text-foreground text-[13px] placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary/60 transition-all"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted">
                Contraseña <span className="text-brand-primary normal-case">*</span>
              </label>
              <div className="relative">
                <input
                  required type={showPwd ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPwd ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                </button>
              </div>

              {/* Checklist de requisitos */}
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
                  {reqsMet.map((r) => (
                    <div key={r.key} className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${r.ok ? 'bg-success/10 border border-success/40' : 'bg-surface-secondary border border-border'}`}>
                        {r.ok && <span className="text-success" style={{ fontSize: 8, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span className={`text-[11px] transition-colors ${r.ok ? 'text-foreground/60' : 'text-muted/50'}`}>
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted">
                Confirmar contraseña <span className="text-brand-primary normal-case">*</span>
              </label>
              <input
                required type={showPwd ? 'text' : 'password'}
                value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Repite tu contraseña"
                className={`${inputClass} ${matchFail ? 'border-danger focus:border-danger' : matchOk ? 'border-success focus:border-success' : ''}`}
              />
              {matchFail && <p className="text-[11px] text-danger">Las contraseñas no coinciden</p>}
              {matchOk   && <p className="text-[11px] text-success">Las contraseñas coinciden</p>}
            </div>

            <button
              type="submit" disabled={status === 'loading' || (password.length > 0 && (!allReqsMet || matchFail))}
              className="w-full h-11 mt-1 rounded-xl bg-brand-primary text-brand-primary-foreground text-[13px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {status === 'loading'
                ? <><Spinner color="current" size="sm" /> Creando cuenta...</>
                : 'Crear cuenta'
              }
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 pt-6 border-t border-border space-y-2 text-center">
            <p className="text-[13px] text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-brand-primary font-semibold hover:underline">
                Inicia sesión
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
