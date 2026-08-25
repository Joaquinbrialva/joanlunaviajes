'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LuArrowLeft, LuUsers, LuPhone, LuCalendar, LuMessageSquare, LuMapPin, LuPackage, LuCheck } from 'react-icons/lu';

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
      <div className="rounded-3xl border border-border bg-surface overflow-hidden">
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
        <p className="text-5xl font-extrabold text-foreground">404</p>
        <p className="text-muted text-sm">Consulta no encontrada o sin acceso.</p>
        <Link href="/cuenta" className="inline-flex items-center gap-2 text-brand-primary text-sm font-semibold hover:underline">
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
      >
        <LuArrowLeft size={12} /> Mis consultas
      </Link>

      {/* Card principal */}
      <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-sm">

        {/* Header */}
        <div className="relative px-8 pt-8 pb-7 overflow-hidden bg-gradient-to-br from-brand-primary/[0.10] to-surface-secondary">
          {/* Type pill */}
          <div className="relative z-10 flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface text-[10px] font-semibold text-muted uppercase tracking-[0.18em]">
              {isOffer ? <LuPackage size={10} /> : <LuMapPin size={10} />}
              {isOffer ? 'Oferta' : 'Destino'}
            </span>
          </div>

          {/* Title */}
          <h1 className="relative z-10 text-foreground leading-tight mb-3 capitalize font-extrabold tracking-tight" style={{ fontSize: 'clamp(1.7rem, 5vw, 2.4rem)' }}>
            {title}
          </h1>

          {/* Meta */}
          <div className="relative z-10 flex items-center gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <LuCalendar size={10} /> {formatDateShort(inq.createdAt)}
            </span>
            <span className="text-muted/40">·</span>
            <span className="font-mono text-muted/70 text-[10px]">#{inq.id.slice(0,8).toUpperCase()}</span>
          </div>
        </div>

        {/* Dotted separator */}
        <div className="mx-8 border-t border-dashed border-border" />

        <div className="px-8 py-7 space-y-7">

          {/* Status stepper */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-semibold mb-5">Estado de tu consulta</p>
            <div className="flex items-start gap-0">
              {STEPS.map((step, i) => {
                const done    = i < stepIdx;
                const current = i === stepIdx;
                const future  = i > stepIdx;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                    {/* Connecting line left */}
                    {i > 0 && (
                      <div className={`absolute top-[13px] right-1/2 left-0 h-px ${done || current ? 'bg-brand-primary' : 'bg-border'}`} />
                    )}
                    {/* Connecting line right */}
                    {i < STEPS.length - 1 && (
                      <div className={`absolute top-[13px] left-1/2 right-0 h-px ${done ? 'bg-brand-primary' : 'bg-border'}`} />
                    )}

                    {/* Circle */}
                    <div className={[
                      'relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all',
                      done    ? 'bg-brand-primary border-brand-primary text-brand-primary-foreground' : '',
                      current ? 'bg-background border-brand-primary text-brand-primary'                : '',
                      future  ? 'bg-background border-border text-muted/40'                             : '',
                    ].join(' ')}>
                      {done
                        ? <LuCheck size={12} strokeWidth={2.5} />
                        : <span className={`w-1.5 h-1.5 rounded-full ${current ? 'bg-brand-primary' : 'bg-muted/40'}`} />
                      }
                    </div>

                    {/* Label */}
                    <div className="mt-2.5 text-center px-1">
                      <p className={[
                        'text-[11px] font-semibold leading-tight',
                        future ? 'text-muted/40' : current ? 'text-brand-primary' : 'text-foreground',
                      ].join(' ')}>
                        {step.label}
                      </p>
                      {current && (
                        <p className="text-[10px] text-muted mt-0.5 leading-tight">
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
          <div className="border-t border-border" />

          {/* Details grid */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-semibold mb-4">Detalles de la solicitud</p>
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
              <div className="border-t border-border" />
              <div className="rounded-2xl px-5 py-4 bg-brand-primary/5 border border-brand-primary/15">
                <p className="text-[10px] uppercase tracking-[0.18em] text-brand-primary font-semibold mb-1.5">Mensaje del agente</p>
                <p className="text-sm text-foreground leading-relaxed">{inq.notes}</p>
              </div>
            </>
          )}

          {/* CTA */}
          {inq.status !== 'closed' && (
            <>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">¿Necesitas algo más?</p>
                  <p className="text-xs text-muted mt-0.5">Nuestros agentes están disponibles para ayudarte.</p>
                </div>
                <a
                  href="https://wa.me/541158139420"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-brand-primary text-brand-primary-foreground text-[12px] font-semibold hover:opacity-90 active:scale-[0.97] transition-all shadow-md shadow-brand-primary/20"
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
    <div className={`rounded-2xl border border-border bg-background px-4 py-3.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-muted mb-1.5">
        {icon}
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold">{label}</p>
      </div>
      <p className={`text-sm text-foreground ${prose ? 'leading-relaxed' : 'font-medium'}`}>{value}</p>
    </div>
  );
}
