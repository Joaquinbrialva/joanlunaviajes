'use client';

import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@heroui/react';
import {
  Mail, Phone, Trash2, X,
  Users, Tag, Check,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import HeroSelect from '@/components/ui/hero-select';
import { INQUIRY_STATUS_OPTIONS } from '@/lib/inquiries';
import { toastError } from '@/lib/toast';

/* ─── Wizard label maps ──────────────────────────────────────── */

const FLEXIBILITY_LABELS = { fixed: 'Fechas fijas', flexible: 'Flexible', unknown: 'Sin definir todavía' };
const BUDGET_LABELS = {
  'hasta-500': 'Hasta $500',
  '500-1500': '$500–$1500',
  '1500-3000': '$1500–$3000',
  'mas-3000': '+$3000',
  'flexible': 'Flexible',
};

/* ─── Status config (Tailwind classes, same pattern as StatusBadge in offer-preview-drawer) ── */

const STATUS_CFG = {
  pending:   { label: 'Pendiente',  dot: 'bg-amber-500',   badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',     strip: 'bg-amber-500',   iconBg: 'bg-amber-500/15' },
  contacted: { label: 'Contactado', dot: 'bg-sky-500',     badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',           strip: 'bg-sky-500',     iconBg: 'bg-sky-500/15' },
  closed:    { label: 'Cerrado',    dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', strip: 'bg-emerald-500', iconBg: 'bg-emerald-500/15' },
};

/* ─── Helpers ────────────────────────────────────────────────── */

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function formatIsoDate(isoStr) {
  if (!isoStr) return null;
  const [y, m, d] = isoStr.split('-');
  if (!y || !m || !d) return null;
  return `${d}/${m}/${y}`;
}

/* ─── Sub-components ─────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <p className='text-[9px] font-bold uppercase tracking-[0.14em] text-muted mb-2.5'>{children}</p>
  );
}

function ContactRow({ href, icon: Icon, iconClass, label, value, dimmed }) {
  const El = href ? 'a' : 'div';
  return (
    <El
      href={href}
      className={`flex items-center gap-3 rounded-xl border border-default bg-surface-secondary px-3.5 py-2.5 transition-colors ${href ? 'hover:bg-surface-tertiary cursor-pointer' : ''} ${dimmed ? 'opacity-45' : ''}`}
    >
      <div className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] ${iconClass}`}>
        <Icon size={14} />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-[10px] text-muted mb-px'>{label}</p>
        <p className='truncate text-[13px] font-semibold text-foreground'>{value}</p>
      </div>
    </El>
  );
}

function WizardDetails({ wizardData }) {
  if (!wizardData) return null;

  const rows = [];

  if (wizardData.destination) {
    rows.push({ label: 'Destino', value: wizardData.destination });
  }

  if (wizardData.dateFlexibility) {
    rows.push({ label: 'Flexibilidad', value: FLEXIBILITY_LABELS[wizardData.dateFlexibility] || wizardData.dateFlexibility });
  }

  // Dates are only stored in wizardData when dateFlexibility === 'fixed' (wizard enforces this)
  if (wizardData.dateFlexibility === 'fixed') {
    const dep = formatIsoDate(wizardData.departureDate);
    const ret = formatIsoDate(wizardData.returnDate);
    if (dep || ret) {
      rows.push({ label: 'Salida / Regreso', value: [dep, ret].filter(Boolean).join(' → ') });
    }
  }

  const adults = wizardData.adults ?? 0;
  const children = wizardData.children ?? 0;
  if (adults > 0 || children > 0) {
    const parts = [`${adults} adulto${adults !== 1 ? 's' : ''}`];
    if (children > 0) parts.push(`${children} niño${children !== 1 ? 's' : ''}`);
    rows.push({ label: 'Viajeros', value: parts.join(', ') });
  }

  if (wizardData.budget) {
    rows.push({ label: 'Presupuesto', value: BUDGET_LABELS[wizardData.budget] || wizardData.budget });
  }

  if (wizardData.tripType) {
    rows.push({ label: 'Tipo de viaje', value: wizardData.tripType });
  }

  if (Array.isArray(wizardData.includes) && wizardData.includes.length > 0) {
    rows.push({ label: 'Incluye', value: wizardData.includes.join(', ') });
  }

  if (rows.length === 0) return null;

  return (
    <div className='border-b border-default px-5 py-4'>
      <SectionLabel>Detalles del viaje solicitado</SectionLabel>
      <div className='overflow-hidden rounded-xl border border-default bg-surface-secondary'>
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-baseline gap-2.5 px-3.5 py-2.5 ${i > 0 ? 'border-t border-default' : ''}`}
          >
            <p className='w-[100px] shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-muted'>{row.label}</p>
            <p className='text-[13px] font-semibold text-foreground'>{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */

export default function InquiryPreviewDrawer({
  inquiry,
  isOpen,
  onClose,
  onSaveNotes,
  onStatusChange,
  onDelete,
  buildWhatsAppUrl,
}) {
  const [notes, setNotes] = useState(inquiry?.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Retain last valid inquiry so the modal exit transition plays even when prop becomes null
  const lastInquiry = useRef(inquiry);
  if (inquiry) lastInquiry.current = inquiry;
  const displayed = inquiry || lastInquiry.current;

  useEffect(() => {
    setNotes(inquiry?.notes || '');
  }, [inquiry]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!displayed) return null;

  const s = STATUS_CFG[displayed.status] || STATUS_CFG.pending;
  const initials = getInitials(displayed.name);

  async function handleSaveNotes() {
    setSaving(true);
    try {
      await onSaveNotes(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toastError('No se pudieron guardar las notas.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Modal container — centered */}
      <div className={`fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`relative flex w-full max-w-[600px] flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl transition-all duration-300 max-h-[90vh] ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>

          {/* Status accent strip */}
          <div className={`h-[3px] shrink-0 ${s.strip}`} />

          {/* ── Client header ── */}
          <div className='relative shrink-0 border-b border-default px-5 pb-4 pt-[18px]'>
            <button
              onClick={onClose}
              className='absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg bg-surface-secondary text-muted transition-colors hover:text-foreground'
            >
              <X size={14} />
            </button>

            <div className='flex items-center gap-3.5 pr-9'>
              <div className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full text-base font-extrabold tracking-tight ${s.iconBg}`}>
                {initials}
              </div>

              <div className='min-w-0 flex-1'>
                <div className={`mb-1.5 inline-flex items-center gap-1.5 rounded-full py-[3px] pl-[7px] pr-2.5 text-[9px] font-bold uppercase tracking-[0.12em] ${s.badge}`}>
                  <span className={`h-[5px] w-[5px] shrink-0 rounded-full ${s.dot}`} />
                  {s.label}
                  {displayed.passengers ? (
                    <span className='ml-1 inline-flex items-center gap-1 opacity-75'>
                      · <Users size={9} className='inline' /> {displayed.passengers} pax
                    </span>
                  ) : null}
                </div>

                <h2 className='truncate text-[17px] font-extrabold leading-tight tracking-tight text-foreground'>
                  {displayed.name}
                </h2>

                <p className='mt-0.5 text-[10.5px] text-muted'>
                  #{displayed.id?.slice(-8).toUpperCase() || '—'} &nbsp;·&nbsp; {formatDate(displayed.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className='flex-1 overflow-y-auto'>

            {/* Solicitud */}
            <div className='border-b border-default px-5 py-4'>
              <SectionLabel>Solicitud</SectionLabel>

              <div className={`flex items-center gap-2.5 rounded-xl border border-default bg-surface-secondary px-3.5 py-2.5 ${displayed.message ? 'mb-2.5' : ''}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${s.iconBg}`}>
                  <Tag size={15} />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-[13px] font-bold text-foreground'>{displayed.requestTitle}</p>
                  <p className='text-[11px] text-muted'>{displayed.requestMeta}</p>
                </div>
              </div>

              {displayed.message && (
                <div className='rounded-xl bg-surface-secondary px-3.5 py-2.5'>
                  <p className='mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted'>
                    Mensaje del cliente
                  </p>
                  <p className='text-[13px] italic leading-relaxed text-foreground'>
                    &ldquo;{displayed.message}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Detalles del wizard */}
            {displayed.wizardData && <WizardDetails wizardData={displayed.wizardData} />}

            {/* Contacto */}
            <div className='border-b border-default px-5 py-4'>
              <SectionLabel>Contacto</SectionLabel>
              <div className='space-y-2'>
                <ContactRow
                  href={displayed.phone ? `tel:${displayed.phone}` : null}
                  icon={Phone}
                  iconClass='bg-emerald-500/15 text-emerald-500'
                  label='Teléfono'
                  value={displayed.phone || '—'}
                  dimmed={!displayed.phone}
                />
                <ContactRow
                  href={displayed.email ? `mailto:${displayed.email}` : null}
                  icon={Mail}
                  iconClass='bg-sky-500/15 text-sky-500'
                  label='Email'
                  value={displayed.email || 'Sin email registrado'}
                  dimmed={!displayed.email}
                />
              </div>
            </div>

            {/* Gestión interna */}
            <div className='px-5 pb-[22px] pt-4'>
              <SectionLabel>Gestión interna</SectionLabel>

              <div className='mb-3.5'>
                <p className='mb-1.5 text-[11px] text-muted'>Estado</p>
                <HeroSelect
                  value={displayed.status}
                  onValueChange={onStatusChange}
                  options={INQUIRY_STATUS_OPTIONS}
                  triggerClassName='h-9 rounded-xl border border-default bg-surface-secondary px-3 text-sm w-full'
                />
              </div>

              <div>
                <p className='mb-1.5 text-[11px] text-muted'>Notas internas</p>
                <textarea
                  className='w-full min-h-24 resize-y rounded-xl border border-default bg-surface-secondary px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground outline-none transition-colors focus:border-accent/60'
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Notas privadas del agente...'
                />
                <button
                  type='button'
                  disabled={saving}
                  onClick={handleSaveNotes}
                  className={`mt-2 inline-flex h-[33px] items-center gap-1.5 rounded-[10px] px-3.5 text-xs font-bold text-white transition-colors disabled:opacity-70 ${saved ? 'bg-emerald-600' : 'bg-accent hover:bg-orange-500'}`}
                >
                  {saving
                    ? <Spinner size='sm' color='current' />
                    : saved
                    ? <Check size={13} />
                    : null}
                  {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar notas'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Action bar ── */}
          <div className='flex shrink-0 gap-2 border-t border-default px-5 py-3'>
            <a
              href={buildWhatsAppUrl(displayed)}
              target='_blank'
              rel='noopener noreferrer'
              className='flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-bold text-white transition-opacity hover:opacity-85'
            >
              <FaWhatsapp size={16} />
              WhatsApp
            </a>
            <button
              onClick={onDelete}
              title='Eliminar cotización'
              className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-900/10 dark:hover:bg-rose-900/20'
            >
              <Trash2 size={15} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
