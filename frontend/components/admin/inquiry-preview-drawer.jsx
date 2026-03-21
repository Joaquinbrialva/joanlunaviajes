'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Modal, Spinner } from '@heroui/react';
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

/* ─── Status config ──────────────────────────────────────────── */

const STATUS_CFG = {
  pending:   { label: 'Pendiente',  accent: '#f59e0b', bg: 'rgba(245,158,11,0.11)',  text: '#d97706' },
  contacted: { label: 'Contactado', accent: '#38bdf8', bg: 'rgba(56,189,248,0.11)',  text: '#0284c7' },
  closed:    { label: 'Cerrado',    accent: '#34d399', bg: 'rgba(52,211,153,0.11)',  text: '#059669' },
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

/* ─── Contact row ────────────────────────────────────────────── */

function ContactRow({ href, icon: Icon, iconBg, iconColor, label, value, dimmed }) {
  const [hovered, setHovered] = useState(false);
  const El = href ? 'a' : 'div';
  return (
    <El
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 12,
        background: hovered && href ? 'var(--surface-tertiary)' : 'var(--surface-secondary)',
        border: '1px solid var(--border)',
        textDecoration: 'none', transition: 'background 0.14s',
        opacity: dimmed ? 0.45 : 1,
        cursor: href ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 10, color: 'var(--muted)', margin: '0 0 1px', letterSpacing: '0.03em' }}>{label}</p>
        <p style={{
          fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value}
        </p>
      </div>
    </El>
  );
}

/* ─── Wizard details ─────────────────────────────────────────── */

function formatIsoDate(isoStr) {
  if (!isoStr) return null;
  const [y, m, d] = isoStr.split('-');
  if (!y || !m || !d) return isoStr;
  return `${d}/${m}/${y}`;
}

function WizardDetails({ wizardData }) {
  if (!wizardData) return null;

  const labelStyle = {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: 'var(--muted)', margin: 0,
  };
  const valueStyle = {
    fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: 0,
  };

  const rows = [];

  if (wizardData.destination) {
    rows.push({ label: 'Destino', value: wizardData.destination });
  }

  if (wizardData.dateFlexibility) {
    rows.push({ label: 'Flexibilidad', value: FLEXIBILITY_LABELS[wizardData.dateFlexibility] || wizardData.dateFlexibility });
  }

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
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
        Detalles del viaje solicitado
      </p>
      <div
        style={{
          borderRadius: 12,
          background: 'var(--surface-secondary)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 10,
              padding: '9px 14px',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            }}
          >
            <p style={{ ...labelStyle, flexShrink: 0, width: 100 }}>{row.label}</p>
            <p style={valueStyle}>{row.value}</p>
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
  const [noteFocused, setNoteFocused] = useState(false);

  // Retain last valid inquiry so Modal exit animation plays even when prop becomes null
  const lastInquiry = useRef(inquiry);
  if (inquiry) lastInquiry.current = inquiry;
  const displayed = inquiry || lastInquiry.current;

  useEffect(() => {
    setNotes(inquiry?.notes || '');
  }, [inquiry]);

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
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className='w-full max-w-[600px] p-0 overflow-hidden flex flex-col'>

            {/* Status accent strip */}
            <div style={{ height: 3, background: s.accent, flexShrink: 0 }} />

            {/* ── Client header ── */}
            <div
              style={{
                padding: '18px 20px 16px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className='absolute top-3.5 right-3.5 w-7 h-7 flex items-center justify-center rounded-lg transition-colors'
                style={{ color: 'var(--muted)', background: 'var(--surface-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <X size={14} />
              </button>

              <div className='flex items-center gap-3.5 pr-9'>
                {/* Monogram avatar */}
                <div
                  style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: s.bg,
                    border: `1.5px solid ${s.accent}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, color: s.text,
                    flexShrink: 0, letterSpacing: '-0.5px',
                    fontFamily: 'var(--font-jakarta, sans-serif)',
                  }}
                >
                  {initials}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  {/* Status pill */}
                  <div
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: s.bg, color: s.text,
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', padding: '3px 9px 3px 7px',
                      borderRadius: 20, marginBottom: 5,
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
                    {s.label}
                    {displayed.passengers ? (
                      <span style={{ marginLeft: 4, display: 'inline-flex', alignItems: 'center', gap: 3, opacity: 0.75 }}>
                        · <Users size={9} style={{ display: 'inline' }} /> {displayed.passengers} pax
                      </span>
                    ) : null}
                  </div>

                  <h2
                    style={{
                      fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px',
                      color: 'var(--foreground)', margin: '0 0 3px',
                      lineHeight: 1.2,
                      fontFamily: 'var(--font-jakarta, sans-serif)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {displayed.name}
                  </h2>

                  <p style={{ fontSize: 10.5, color: 'var(--muted)', margin: 0, letterSpacing: '0.01em' }}>
                    #{displayed.id?.slice(-8).toUpperCase() || '—'} &nbsp;·&nbsp; {formatDate(displayed.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className='flex-1 overflow-y-auto'>

              {/* Solicitud */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                  Solicitud
                </p>

                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', borderRadius: 12,
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    marginBottom: displayed.message ? 10 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: `${s.accent}18`, color: s.text,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Tag size={15} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayed.requestTitle}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                      {displayed.requestMeta}
                    </p>
                  </div>
                </div>

                {displayed.message && (
                  <div
                    style={{
                      padding: '11px 14px', borderRadius: 12,
                      background: 'var(--surface-secondary)',
                      borderLeft: `3px solid ${s.accent}`,
                    }}
                  >
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                      Mensaje del cliente
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--foreground)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                      &ldquo;{displayed.message}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Detalles del wizard */}
              {displayed.wizardData && <WizardDetails wizardData={displayed.wizardData} />}

              {/* Contacto */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                  Contacto
                </p>
                <div className='space-y-2'>
                  <ContactRow
                    href={displayed.phone ? `tel:${displayed.phone}` : null}
                    icon={Phone}
                    iconBg='rgba(52,211,153,0.13)'
                    iconColor='#34d399'
                    label='Teléfono'
                    value={displayed.phone || '—'}
                    dimmed={!displayed.phone}
                  />
                  <ContactRow
                    href={displayed.email ? `mailto:${displayed.email}` : null}
                    icon={Mail}
                    iconBg='rgba(56,189,248,0.13)'
                    iconColor='#38bdf8'
                    label='Email'
                    value={displayed.email || 'Sin email registrado'}
                    dimmed={!displayed.email}
                  />
                </div>
              </div>

              {/* Gestión interna */}
              <div style={{ padding: '16px 20px 22px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                  Gestión interna
                </p>

                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Estado</p>
                  <HeroSelect
                    value={displayed.status}
                    onValueChange={onStatusChange}
                    options={INQUIRY_STATUS_OPTIONS}
                    triggerClassName='h-9 rounded-xl border border-default bg-surface-secondary px-3 text-sm w-full'
                  />
                </div>

                <div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Notas internas</p>
                  <textarea
                    style={{
                      width: '100%', minHeight: 96,
                      padding: '10px 13px', borderRadius: 12,
                      border: `1px solid ${noteFocused ? `${s.accent}70` : 'var(--border)'}`,
                      background: 'var(--surface-secondary)',
                      color: 'var(--foreground)',
                      fontSize: 13, lineHeight: 1.6,
                      resize: 'vertical', outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onFocus={() => setNoteFocused(true)}
                    onBlur={() => setNoteFocused(false)}
                    placeholder='Notas privadas del agente...'
                  />
                  <Button
                    size='sm'
                    isPending={saving}
                    onClick={handleSaveNotes}
                    style={{
                      marginTop: 8, height: 33,
                      background: saved ? '#16a34a' : s.accent,
                      color: '#fff',
                      fontSize: 12, fontWeight: 700,
                      borderRadius: 10,
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {({ isPending }) => (
                      <span className='flex items-center gap-1.5'>
                        {isPending
                          ? <Spinner size='sm' style={{ color: '#fff' }} />
                          : saved
                          ? <Check size={13} />
                          : null}
                        {isPending ? 'Guardando...' : saved ? 'Guardado' : 'Guardar notas'}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Action bar ── */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex', gap: 8, flexShrink: 0,
              }}
            >
              <a
                href={buildWhatsAppUrl(displayed)}
                target='_blank'
                rel='noopener noreferrer'
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 7, height: 40, borderRadius: 12,
                  background: '#16a34a', color: '#fff',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  transition: 'opacity 0.14s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <FaWhatsapp size={16} />
                WhatsApp
              </a>
              <button
                onClick={onDelete}
                title='Eliminar cotización'
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(248,113,113,0.09)',
                  border: '1px solid rgba(248,113,113,0.18)',
                  color: '#f87171',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.14s',
                  cursor: 'pointer', flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.18)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.09)')}
              >
                <Trash2 size={15} />
              </button>
            </div>

          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
