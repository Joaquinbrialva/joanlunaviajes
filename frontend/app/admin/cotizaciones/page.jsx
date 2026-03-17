'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertDialog, Button, Table, toast } from '@heroui/react';
import { MessageCircle, Trash2, ChevronRight } from 'lucide-react';
import HeroSelect from '@/components/ui/hero-select';
import InquiryPreviewDrawer from '@/components/admin/inquiry-preview-drawer';
import {
  normalizeInquiry,
  INQUIRY_STATUS_CLASS,
} from '@/lib/inquiries';
import { toastError } from '@/lib/toast';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [previewInquiry, setPreviewInquiry] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/api/cotizaciones', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data)) setInquiries(data.map(normalizeInquiry));
      })
      .catch(() => {
        if (active) setInquiries([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inquiries.filter((item) => {
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      const searchMatch =
        q.length === 0 ||
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.phone?.toLowerCase().includes(q) ||
        item.requestTitle?.toLowerCase().includes(q);
      return statusMatch && searchMatch;
    });
  }, [inquiries, statusFilter, search]);

  async function changeStatus(id, newStatus) {
    try {
      const res = await fetch(`/api/cotizaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = normalizeInquiry(await res.json());
      setInquiries((prev) => prev.map((i) => (i.id === id ? updated : i)));
      if (previewInquiry?.id === id) setPreviewInquiry(updated);
    } catch {
      toastError('No se pudo actualizar el estado.');
    }
  }

  function executeDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    const deleteFn = async () => {
      const res = await fetch(`/api/cotizaciones/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar.');
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      if (previewInquiry?.id === id) setPreviewInquiry(null);
    };
    toast.promise(deleteFn, {
      loading: 'Eliminando...',
      success: 'Cotización eliminada',
      error: (err) => err?.message || 'Error al eliminar',
    });
  }

  function buildWhatsAppUrl(inquiry) {
    const clean = String(inquiry.phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hola ${inquiry.name}, te contactamos por tu solicitud de cotización${inquiry.requestTitle ? ` sobre "${inquiry.requestTitle}"` : ''}. `
    );
    return `https://wa.me/${clean}?text=${text}`;
  }

  return (
    <div className='space-y-5'>
      <InquiryPreviewDrawer
        inquiry={previewInquiry}
        isOpen={previewInquiry !== null}
        onClose={() => setPreviewInquiry(null)}
        onSaveNotes={async (notes) => {
          const res = await fetch(`/api/cotizaciones/${previewInquiry.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes }),
          });
          if (!res.ok) throw new Error();
          const updated = normalizeInquiry(await res.json());
          setInquiries((prev) => prev.map((i) => (i.id === previewInquiry.id ? updated : i)));
          setPreviewInquiry(updated);
        }}
        onStatusChange={(status) => changeStatus(previewInquiry.id, status)}
        onDelete={() => {
          setPendingDelete(previewInquiry.id);
          setPreviewInquiry(null);
        }}
        buildWhatsAppUrl={buildWhatsAppUrl}
      />

      <AlertDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialog.Backdrop variant='blur'>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status='danger' />
                <AlertDialog.Heading>¿Eliminar cotización?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className='text-sm text-muted'>Esta acción no se puede deshacer.</p>
              </AlertDialog.Body>
              <AlertDialog.Footer className='flex justify-end gap-2'>
                <Button slot='close' variant='tertiary'>Cancelar</Button>
                <Button onClick={executeDelete} slot='close' variant='danger'>Eliminar</Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <section>
        <h2 className='text-4xl font-bold'>Solicitudes de cotización</h2>
        <p className='text-muted'>Gestiona y hace seguimiento de las consultas recibidas.</p>
      </section>

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-5 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3'>
          <input
            className='h-10 px-3 rounded-lg border border-default bg-surface-secondary text-sm'
            placeholder='Buscar por nombre, email, teléfono u oferta...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <HeroSelect
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'contacted', label: 'Contactado' },
              { value: 'closed', label: 'Cerrado' },
            ]}
            triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary px-3'
          />
        </div>

        <Table>
          <Table.ScrollContainer style={{ minWidth: 700 }}>
            <Table.Content aria-label='Solicitudes de cotización'>
              <Table.Header>
                <Table.Column>Fecha</Table.Column>
                <Table.Column isRowHeader>Cliente</Table.Column>
                <Table.Column>Solicitud</Table.Column>
                <Table.Column>Estado</Table.Column>
                <Table.Column> </Table.Column>
              </Table.Header>
              <Table.Body
                items={rows}
                renderEmptyState={() => (
                  <p className='py-10 text-center text-sm text-muted'>
                    No hay solicitudes que coincidan con los filtros.
                  </p>
                )}
              >
                {(item) => (
                  <Table.Row id={item.id} className='hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors'>
                    <Table.Cell className='text-sm text-muted whitespace-nowrap'>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-AR') : '-'}
                    </Table.Cell>
                    <Table.Cell>
                      <p className='font-semibold'>{item.name}</p>
                      <p className='text-xs text-muted'>{item.phone || '-'}</p>
                      {item.email && <p className='text-xs text-muted'>{item.email}</p>}
                    </Table.Cell>
                    <Table.Cell>
                      <p className='text-sm'>{item.requestTitle}</p>
                      <p className='text-xs text-muted'>
                        {item.passengers ? `${item.passengers} pasajero(s)` : item.requestMeta}
                      </p>
                    </Table.Cell>
                    <Table.Cell>
                      <HeroSelect
                        value={item.status}
                        onValueChange={(v) => changeStatus(item.id, v)}
                        options={[
                          { value: 'pending', label: 'Pendiente' },
                          { value: 'contacted', label: 'Contactado' },
                          { value: 'closed', label: 'Cerrado' },
                        ]}
                        triggerClassName={`h-7 rounded-full text-xs font-semibold px-3 border-0 ${INQUIRY_STATUS_CLASS[item.status]}`}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <div className='flex items-center justify-end gap-1'>
                        <a
                          href={buildWhatsAppUrl(item)}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors'
                          title='Abrir WhatsApp'
                        >
                          <MessageCircle size={15} />
                        </a>
                        <button
                          onClick={() => setPreviewInquiry(item)}
                          className='w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-surface-secondary hover:text-foreground transition-colors'
                          title='Ver detalle'
                        >
                          <ChevronRight size={15} />
                        </button>
                        <button
                          onClick={() => setPendingDelete(item.id)}
                          className='w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors'
                          title='Eliminar'
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </section>
    </div>
  );
}
