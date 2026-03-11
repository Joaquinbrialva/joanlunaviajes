'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { Mail, MessageCircle, Phone, Trash2, User } from 'lucide-react';
import AdminDrawer from './admin-drawer';
import HeroSelect from '@/components/ui/hero-select';
import { toastError } from '@/lib/toast';

function Row({ label, children }) {
  return (
    <div className='flex gap-4 border-b border-default py-2.5 last:border-0'>
      <span className='w-32 shrink-0 pt-0.5 text-xs text-muted'>{label}</span>
      <span className='min-w-0 flex-1 text-sm'>{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className='border-b border-default px-5 py-4'>
      <p className='mb-3 text-xs font-semibold uppercase tracking-wider text-muted'>{title}</p>
      {children}
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-AR');
}

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

  useEffect(() => {
    setNotes(inquiry?.notes || '');
  }, [inquiry]);

  if (!inquiry) return null;

  async function handleSaveNotes() {
    setSaving(true);
    try {
      await onSaveNotes(notes);
    } catch {
      toastError('No se pudieron guardar las notas.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminDrawer isOpen={isOpen} onClose={onClose} title='Vista de cotización — Admin'>
      <div className='px-5 py-4 border-b border-default'>
        <div className='space-y-2'>
          <div className='flex flex-wrap gap-2'>
            <span className='rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-semibold text-muted'>
              {inquiry.statusLabel}
            </span>
            {inquiry.passengers ? (
              <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'>
                {inquiry.passengers} pasajero(s)
              </span>
            ) : null}
          </div>
          <p className='text-lg font-bold leading-tight'>{inquiry.requestTitle}</p>
          <p className='text-sm text-muted'>{inquiry.requestMeta}</p>
        </div>
      </div>

      <Section title='Cliente'>
        <Row label='Nombre'>
          <span className='inline-flex items-center gap-2'>
            <User size={14} className='text-muted' />
            {inquiry.name}
          </span>
        </Row>
        <Row label='Teléfono'>
          <span className='inline-flex items-center gap-2'>
            <Phone size={14} className='text-muted' />
            {inquiry.phone || '-'}
          </span>
        </Row>
        <Row label='Email'>
          <span className='inline-flex items-center gap-2'>
            <Mail size={14} className='text-muted' />
            {inquiry.email || '-'}
          </span>
        </Row>
      </Section>

      <Section title='Consulta'>
        <Row label='Solicitud'>{inquiry.requestTitle}</Row>
        <Row label='Detalle'>{inquiry.requestMeta}</Row>
        <Row label='Viajeros'>{inquiry.passengers ?? '-'}</Row>
        <Row label='Fecha'>{formatDate(inquiry.createdAt)}</Row>
        <Row label='Estado'>
          <HeroSelect
            value={inquiry.status}
            onValueChange={onStatusChange}
            options={[
              { value: 'pending', label: 'Pendiente' },
              { value: 'contacted', label: 'Contactado' },
              { value: 'closed', label: 'Cerrado' },
            ]}
            triggerClassName='h-9 rounded-lg border border-default bg-surface-secondary px-3 text-sm w-full'
          />
        </Row>
        <Row label='Mensaje'>
          {inquiry.message ? (
            <span className='italic text-muted'>&ldquo;{inquiry.message}&rdquo;</span>
          ) : (
            '-'
          )}
        </Row>
      </Section>

      <Section title='Gestión interna'>
        <div className='space-y-2'>
          <p className='text-xs text-muted uppercase tracking-wide'>Notas internas</p>
          <textarea
            className='min-h-28 w-full resize-none rounded-lg border border-default bg-surface-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='Notas privadas del agente...'
          />
          <Button size='sm' className='bg-accent text-white' onClick={handleSaveNotes} isPending={saving}>
            Guardar notas
          </Button>
        </div>
      </Section>

      <div className='flex gap-2 border-t border-default px-5 py-4'>
        <Button
          as={Link}
          href={buildWhatsAppUrl(inquiry)}
          target='_blank'
          className='flex-1 bg-emerald-500 text-white'
          startContent={<MessageCircle size={15} />}
        >
          WhatsApp
        </Button>
        <Button size='sm' variant='danger-soft' color='danger' onClick={onDelete} startContent={<Trash2 size={14} />}>
          Eliminar
        </Button>
      </div>
    </AdminDrawer>
  );
}
