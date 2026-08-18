'use client';

import { useEffect, useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { Mail, Phone, Trash2, Users, Tag, Check } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import HeroSelect from '@/components/ui/hero-select';
import { INQUIRY_STATUS_OPTIONS } from '@/lib/inquiries';
import { toastError } from '@/lib/toast';
import { Panel, PreviewHeader, TextareaField, INQUIRY_STATUS } from '@/components/admin/kit';

const FLEXIBILITY_LABELS = { fixed: 'Fechas fijas', flexible: 'Flexible', unknown: 'Sin definir todavía' };
const BUDGET_LABELS = {
  'hasta-500': 'Hasta $500',
  '500-1500': '$500–$1500',
  '1500-3000': '$1500–$3000',
  'mas-3000': '+$3000',
  flexible: 'Flexible',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatIsoDate(isoStr) {
  if (!isoStr) return null;
  const [y, m, d] = isoStr.split('-');
  if (!y || !m || !d) return null;
  return `${d}/${m}/${y}`;
}

function SectionLabel({ children }) {
  return <p className='mb-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted'>{children}</p>;
}

function ContactRow({ href, icon: Icon, iconClass, label, value, dimmed }) {
  const El = href ? 'a' : 'div';
  return (
    <El
      href={href}
      className={`flex items-center gap-3 rounded-xl border border-default bg-surface-secondary px-3.5 py-2.5 transition-colors ${href ? 'cursor-pointer hover:bg-surface-tertiary' : ''} ${dimmed ? 'opacity-45' : ''}`}
    >
      <div className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] ${iconClass}`}>
        <Icon size={14} />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='mb-px text-[10px] text-muted'>{label}</p>
        <p className='truncate text-[13px] font-semibold text-foreground'>{value}</p>
      </div>
    </El>
  );
}

function WizardDetails({ wizardData }) {
  if (!wizardData) return null;
  const rows = [];

  if (wizardData.destination) rows.push({ label: 'Destino', value: wizardData.destination });
  if (wizardData.dateFlexibility) rows.push({ label: 'Flexibilidad', value: FLEXIBILITY_LABELS[wizardData.dateFlexibility] || wizardData.dateFlexibility });
  if (wizardData.dateFlexibility === 'fixed') {
    const dep = formatIsoDate(wizardData.departureDate);
    const ret = formatIsoDate(wizardData.returnDate);
    if (dep || ret) rows.push({ label: 'Salida / Regreso', value: [dep, ret].filter(Boolean).join(' → ') });
  }
  const adults = wizardData.adults ?? 0;
  const children = wizardData.children ?? 0;
  if (adults > 0 || children > 0) {
    const parts = [`${adults} adulto${adults !== 1 ? 's' : ''}`];
    if (children > 0) parts.push(`${children} niño${children !== 1 ? 's' : ''}`);
    rows.push({ label: 'Viajeros', value: parts.join(', ') });
  }
  if (wizardData.budget) rows.push({ label: 'Presupuesto', value: BUDGET_LABELS[wizardData.budget] || wizardData.budget });
  if (wizardData.tripType) rows.push({ label: 'Tipo de viaje', value: wizardData.tripType });
  if (Array.isArray(wizardData.includes) && wizardData.includes.length > 0) rows.push({ label: 'Incluye', value: wizardData.includes.join(', ') });

  if (rows.length === 0) return null;

  return (
    <div className='border-b border-default px-5 py-4'>
      <SectionLabel>Detalles del viaje solicitado</SectionLabel>
      <div className='overflow-hidden rounded-xl border border-default bg-surface-secondary'>
        {rows.map((row, i) => (
          <div key={i} className={`flex items-baseline gap-2.5 px-3.5 py-2.5 ${i > 0 ? 'border-t border-default' : ''}`}>
            <p className='w-[100px] shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-muted'>{row.label}</p>
            <p className='text-[13px] font-semibold text-foreground'>{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InquiryPreviewDrawer({ inquiry, isOpen, onClose, onSaveNotes, onStatusChange, onDelete, buildWhatsAppUrl }) {
  const [notes, setNotes] = useState(inquiry?.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setNotes(inquiry?.notes || ''); }, [inquiry]);

  if (!inquiry) return null;

  const statusMeta = INQUIRY_STATUS[inquiry.status] || INQUIRY_STATUS.pending;

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
    <Panel
      isOpen={isOpen}
      onClose={onClose}
      size='lg'
      header={
        <PreviewHeader
          fallbackIcon={Users}
          title={inquiry.name}
          subtitle={`#${inquiry.id?.slice(-8).toUpperCase() || '—'} · ${formatDate(inquiry.createdAt)}`}
          statusColor={statusMeta.color}
          statusLabel={statusMeta.label}
          meta={inquiry.passengers ? [`${inquiry.passengers} pax`] : []}
        />
      }
      footer={
        <div className='flex w-full gap-2'>
          <a
            href={buildWhatsAppUrl(inquiry)}
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
      }
    >
      <div className='border-b border-default px-5 py-4'>
        <SectionLabel>Solicitud</SectionLabel>
        <div className={`flex items-center gap-2.5 rounded-xl border border-default bg-surface-secondary px-3.5 py-2.5 ${inquiry.message ? 'mb-2.5' : ''}`}>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent/15 text-accent'>
            <Tag size={15} />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-[13px] font-bold text-foreground'>{inquiry.requestTitle}</p>
            <p className='text-[11px] text-muted'>{inquiry.requestMeta}</p>
          </div>
        </div>
        {inquiry.message && (
          <div className='rounded-xl bg-surface-secondary px-3.5 py-2.5'>
            <p className='mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted'>Mensaje del cliente</p>
            <p className='text-[13px] italic leading-relaxed text-foreground'>&ldquo;{inquiry.message}&rdquo;</p>
          </div>
        )}
      </div>

      {inquiry.wizardData && <WizardDetails wizardData={inquiry.wizardData} />}

      <div className='border-b border-default px-5 py-4'>
        <SectionLabel>Contacto</SectionLabel>
        <div className='space-y-2'>
          <ContactRow href={inquiry.phone ? `tel:${inquiry.phone}` : null} icon={Phone} iconClass='bg-emerald-500/15 text-emerald-500' label='Teléfono' value={inquiry.phone || '—'} dimmed={!inquiry.phone} />
          <ContactRow href={inquiry.email ? `mailto:${inquiry.email}` : null} icon={Mail} iconClass='bg-sky-500/15 text-sky-500' label='Email' value={inquiry.email || 'Sin email registrado'} dimmed={!inquiry.email} />
        </div>
      </div>

      <div className='px-5 pb-6 pt-4'>
        <SectionLabel>Gestión interna</SectionLabel>

        <div className='mb-3.5'>
          <p className='mb-1.5 text-[11px] text-muted'>Estado</p>
          <HeroSelect value={inquiry.status} onValueChange={onStatusChange} options={INQUIRY_STATUS_OPTIONS} triggerClassName='h-9 w-full rounded-xl border border-default bg-surface-secondary px-3 text-sm' />
        </div>

        <TextareaField
          label='Notas internas'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Notas privadas del agente...'
        />
        <Button size='sm' className={`mt-2 ${saved ? '!bg-emerald-600' : ''}`} isDisabled={saving} onClick={handleSaveNotes}>
          {saving ? <Spinner size='sm' color='current' /> : saved ? <Check className='h-3.5 w-3.5' /> : null}
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar notas'}
        </Button>
      </div>
    </Panel>
  );
}
