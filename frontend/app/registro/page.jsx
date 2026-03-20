'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Spinner } from '@heroui/react';
import { LuEye, LuEyeOff, LuArrowLeft, LuCheck } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import { toastError } from '@/lib/toast';

const C = { fontFamily: 'var(--font-cormorant)' };
const S = { fontFamily: 'var(--font-syne)' };

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

const inputClass = [
  'w-full h-11 px-4 rounded-xl border border-border bg-surface',
  'text-foreground text-[13px] placeholder:text-muted/50',
  'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60',
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPwd) { toastError('Las contraseñas no coinciden.'); return; }
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
      <div
        className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden shrink-0"
        style={{ background: '#080f16' }}
      >
        {/* Glow naranja */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(255,126,45,0.15) 0%, transparent 55%), radial-gradient(ellipse at 10% 80%, rgba(255,126,45,0.12) 0%, transparent 50%)',
        }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: grain }} />
        {/* Letra decorativa */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-white/[0.025] select-none pointer-events-none leading-none"
          style={{ ...C, fontSize: '50vw', fontWeight: 300 }}
        >
          J
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
            Tu próxima aventura<br />
            empieza con un<br />
            <em className="font-semibold" style={{ color: '#ff9a5c' }}>solo clic.</em>
          </h2>

          {/* Perks */}
          <ul className="space-y-3.5">
            {PERKS.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <LuCheck size={10} className="text-accent" />
                </div>
                <p className="text-[13px] text-white/55 leading-snug" style={S}>{p}</p>
              </li>
            ))}
          </ul>
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
        <div className="w-full max-w-[440px] mb-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground transition-colors" style={S}>
            <LuArrowLeft size={13} /> Volver al inicio
          </Link>
        </div>

        <div className="w-full max-w-[440px]" style={{ animation: 'fadeUp 0.45s ease both' }}>

          {/* Encabezado */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-accent" />
              <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-accent" style={S}>
                Nueva cuenta
              </p>
            </div>
            <h1 className="font-light text-foreground leading-none mb-2" style={{ ...C, fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
              Regístrate <em className="font-semibold">gratis</em>
            </h1>
            <p className="text-[13px] text-muted" style={S}>
              Crea tu cuenta en segundos y empieza a planificar.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S}>
                Nombre completo <span className="text-accent normal-case">*</span>
              </label>
              <input
                required value={name} onChange={e => setName(e.target.value)}
                placeholder="Tu nombre completo"
                className={inputClass} style={S}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S}>
                Email <span className="text-accent normal-case">*</span>
              </label>
              <input
                required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={inputClass} style={S}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S}>
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
                  className="flex-1 h-11 px-4 rounded-xl border border-border bg-surface text-foreground text-[13px] placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60 transition-all"
                  style={S}
                />
              </div>
            </div>

            {/* Contraseñas en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S}>
                  Contraseña <span className="text-accent normal-case">*</span>
                </label>
                <div className="relative">
                  <input
                    required type={showPwd ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className={`${inputClass} pr-11`} style={S}
                  />
                  <button
                    type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  >
                    {showPwd ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted" style={S}>
                  Confirmar <span className="text-accent normal-case">*</span>
                </label>
                <input
                  required type={showPwd ? 'text' : 'password'}
                  value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className={inputClass} style={S}
                />
              </div>
            </div>

            <button
              type="submit" disabled={status === 'loading'}
              className="w-full h-11 mt-1 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-orange-500 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
              style={S}
            >
              {status === 'loading'
                ? <><Spinner color="current" size="sm" /> Creando cuenta...</>
                : 'Crear cuenta'
              }
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 pt-6 border-t border-border space-y-2 text-center">
            <p className="text-[13px] text-muted" style={S}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-accent font-semibold hover:underline">
                Inicia sesión
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
