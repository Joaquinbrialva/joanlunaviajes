'use client';

import { useState } from 'react';

const syne = { fontFamily: 'var(--font-syne)' };
const cormorant = { fontFamily: 'var(--font-cormorant)' };

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function NewsLetter() {
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al suscribirse.');
      setStatus('success');
      setMsg(data.message || '¡Gracias por suscribirte!');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMsg(err.message);
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <div className="w-screen -mx-[calc((100vw-100%)/2)] relative overflow-hidden">
      {/* Capas de fondo */}
      <div className="absolute inset-0 bg-[#0f1923]" />
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950/50 via-transparent to-slate-950/80" />
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: grain }}
      />
      {/* Glow decorativo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

      <div className="relative py-24 max-w-2xl mx-auto px-6 text-center">

        {/* Eyebrow */}
        <div className="flex items-center gap-4 justify-center mb-8">
          <div className="h-px w-10 bg-accent/50" />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-300/60"
            style={syne}
          >
            Newsletter
          </span>
          <div className="h-px w-10 bg-accent/50" />
        </div>

        {/* Heading editorial */}
        <h2
          className="text-4xl md:text-5xl font-light text-white leading-[1.1] mb-4"
          style={cormorant}
        >
          Destinos exclusivos,{' '}
          <em className="font-semibold" style={{ color: '#ff9a5c' }}>
            directo a tu mail.
          </em>
        </h2>

        <p
          className="text-[14px] text-white/40 mb-10 leading-relaxed"
          style={syne}
        >
          Ofertas limitadas, itinerarios curados y novedades de viaje — sin spam.
        </p>

        {/* Form */}
        {status === 'success' ? (
          <p className="text-[15px] text-orange-300 font-medium" style={syne}>{msg}</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="nombre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading'}
              className="flex-1 w-full h-11 bg-white/[0.07] border border-white/10 rounded-full px-5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
              style={syne}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0 h-11 px-7 rounded-full bg-accent text-white text-[13px] font-semibold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-900/40 disabled:opacity-60"
              style={syne}
            >
              {status === 'loading' ? 'Enviando...' : 'Suscribirme'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-[12px] text-red-400 mt-2" style={syne}>{msg}</p>
        )}

        {status !== 'success' && (
          <p className="text-[11px] text-white/20 mt-4" style={syne}>
            Sin spam. Puedes darte de baja cuando quieras.
          </p>
        )}
      </div>
    </div>
  );
}
