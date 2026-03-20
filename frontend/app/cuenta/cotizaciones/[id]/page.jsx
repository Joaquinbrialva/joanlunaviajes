'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuArrowLeft, LuUsers, LuPhone, LuCalendar, LuMessageSquare, LuMapPin, LuPackage, LuCheck } from 'react-icons/lu';

const C = { fontFamily: 'var(--font-cormorant)' };
const S = { fontFamily: 'var(--font-syne)' };

const STEPS = [
  { key: 'pending',   label: 'Solicitud recibida',  sub: 'Tu consulta fue enviada correctamente' },
  { key: 'contacted', label: 'En contacto',          sub: 'Un agente está atendiendo tu caso'    },
  { key: 'closed',    label: 'Finalizada',           sub: 'Tu consulta fue resuelta'              },
];

const STEP_INDEX = { pending: 0, contacted: 1, closed: 2 };

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatDateShort(dateStr) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(dateStr));
}

/* ── Skeleton ─────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="h-4 w-32 rounded-lg bg-muted/20 animate-pulse" />
      <div className="rounded-3xl border border-default bg-surface overflow-hidden">
        <div className="p-8 space-y-4">
          <div className="h-3 w-24 rounded bg-muted/20 animate-pulse" />
          <div className="h-10 w-3/4 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-4 w-40 rounded bg-muted/20 animate-pulse" />
        </div>
        <div className="px-8 pb-8 space-y-6">
          <div className="h-16 rounded-2xl bg-muted/20 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {[0,1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/20 animate-pulse" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────── */
export default function CotizacionDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const [inq, setInq]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/cotizaciones/${id}`)
      .then(r => {
        if (r.status === 404 || r.status === 403) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setInq(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton />;

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <p className="text-5xl" style={C}>404</p>
        <p className="text-muted text-sm" style={S}>Consulta no encontrada o sin acceso.</p>
        <Link href="/cuenta" className="inline-flex items-center gap-2 text-accent text-sm font-semibold hover:underline" style={S}>
          <LuArrowLeft size={14} /> Volver a mi cuenta
        </Link>
      </div>
    );
  }

  const stepIdx = STEP_INDEX[inq.status] ?? 0;
  const title = inq.offerTitle
    || (inq.destinationSlug ? inq.destinationSlug.replace(/-/g, ' ') : null)
    || 'Consulta general';
  const isOffer = !!inq.offerTitle;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-5">

      {/* Back */}
      <Link
        href="/cuenta"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-foreground transition-colors"
        style={S}
      >
        <LuArrowLeft size={12} /> Mis consultas
      </Link>

      {/* Card principal */}
      <div className="rounded-3xl border border-default bg-surface overflow-hidden shadow-sm">

        {/* Header */}
        <div
          className="relative px-8 pt-8 pb-7 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #080f16 0%, #111820 100%)' }}
        >
          {/* Glow */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,126,45,0.18) 0%, transparent 70%)' }} />
          {/* Grain */}
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

          {/* Type pill */}
          <div className="relative z-10 flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-white/50 uppercase tracking-[0.18em]" style={S}>
              {isOffer ? <LuPackage size={10} /> : <LuMapPin size={10} />}
              {isOffer ? 'Oferta' : 'Destino'}
            </span>
          </div>

          {/* Title */}
          <h1
            className="relative z-10 text-white leading-[1.05] mb-3 capitalize"
            style={{ ...C, fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 400 }}
          >
            {title}
          </h1>

          {/* Meta */}
          <div className="relative z-10 flex items-center gap-4 text-[11px] text-white/35" style={S}>
            <span className="flex items-center gap-1">
              <LuCalendar size={10} /> {formatDateShort(inq.createdAt)}
            </span>
            <span className="text-white/15">·</span>
            <span className="font-mono text-white/25 text-[10px]">#{inq.id.slice(0,8).toUpperCase()}</span>
          </div>
        </div>

        {/* Dotted separator */}
        <div className="mx-8 border-t border-dashed border-default" />

        <div className="px-8 py-7 space-y-7">

          {/* Status stepper */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-semibold mb-5" style={S}>Estado de tu consulta</p>
            <div className="flex items-start gap-0">
              {STEPS.map((step, i) => {
                const done    = i < stepIdx;
                const current = i === stepIdx;
                const future  = i > stepIdx;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                    {/* Connecting line left */}
                    {i > 0 && (
                      <div className="absolute top-[13px] right-1/2 left-0 h-px"
                        style={{ background: done || current ? '#ff7e2d' : 'var(--border)' }} />
                    )}
                    {/* Connecting line right */}
                    {i < STEPS.length - 1 && (
                      <div className="absolute top-[13px] left-1/2 right-0 h-px"
                        style={{ background: done ? '#ff7e2d' : 'var(--border)' }} />
                    )}

                    {/* Circle */}
                    <div className={[
                      'relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all',
                      done    ? 'bg-accent border-accent text-white'           : '',
                      current ? 'bg-background border-accent text-accent'      : '',
                      future  ? 'bg-background border-border text-muted/40'   : '',
                    ].join(' ')}>
                      {done
                        ? <LuCheck size={12} strokeWidth={2.5} />
                        : <span className="w-1.5 h-1.5 rounded-full" style={{ background: current ? '#ff7e2d' : 'var(--muted-foreground, #a8a29e)', opacity: future ? 0.3 : 1 }} />
                      }
                    </div>

                    {/* Label */}
                    <div className="mt-2.5 text-center px-1">
                      <p className={[
                        'text-[11px] font-semibold leading-tight',
                        future ? 'text-muted/40' : current ? 'text-accent' : 'text-foreground',
                      ].join(' ')} style={S}>
                        {step.label}
                      </p>
                      {current && (
                        <p className="text-[10px] text-muted mt-0.5 leading-tight" style={S}>
                          {step.sub}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-default" />

          {/* Details grid */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-semibold mb-4" style={S}>Detalles de la solicitud</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailCard icon={<LuUsers size={14} />} label="Pasajeros" value={`${inq.passengers} ${inq.passengers === 1 ? 'persona' : 'personas'}`} />
              <DetailCard icon={<LuPhone size={14} />} label="Teléfono" value={inq.phone || '—'} />
              <DetailCard icon={<LuCalendar size={14} />} label="Enviada el" value={formatDate(inq.createdAt)} className="col-span-2" />
              {inq.message && (
                <DetailCard icon={<LuMessageSquare size={14} />} label="Tu mensaje" value={inq.message} className="col-span-2" prose />
              )}
            </div>
          </div>

          {/* Notes from agency */}
          {inq.notes && (
            <>
              <div className="border-t border-default" />
              <div className="rounded-2xl px-5 py-4" style={{ background: 'rgba(255,126,45,0.05)', border: '1px solid rgba(255,126,45,0.15)' }}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-1.5" style={S}>Mensaje del agente</p>
                <p className="text-sm text-foreground leading-relaxed" style={S}>{inq.notes}</p>
              </div>
            </>
          )}

          {/* CTA */}
          {inq.status !== 'closed' && (
            <>
              <div className="border-t border-default" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={S}>¿Necesitás algo más?</p>
                  <p className="text-xs text-muted mt-0.5" style={S}>Nuestros agentes están disponibles para ayudarte.</p>
                </div>
                <a
                  href="https://wa.me/5491100000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-accent text-white text-[12px] font-semibold hover:bg-orange-500 active:scale-[0.97] transition-all shadow-md shadow-orange-500/20"
                  style={S}
                >
                  Contactar agente
                </a>
              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
}

function DetailCard({ icon, label, value, className = '', prose = false }) {
  return (
    <div className={`rounded-2xl border border-default bg-background px-4 py-3.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-muted mb-1.5">
        {icon}
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={S}>{label}</p>
      </div>
      <p className={`text-sm text-foreground ${prose ? 'leading-relaxed' : 'font-medium'}`} style={S}>{value}</p>
    </div>
  );
}
