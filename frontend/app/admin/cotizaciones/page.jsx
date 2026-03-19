'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  return <Suspense><AdminInquiriesContent /></Suspense>;
}

function AdminInquiriesContent() {
  const [inquiries, setInquiries]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [search, setSearch]               = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [previewInquiry, setPreviewInquiry] = useState(null);
  const searchParams = useSearchParams();
  const router       = useRouter();

  useEffect(() => {
    let active = true;
    fetch('/api/cotizaciones', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!active || !Array.isArray(data)) return;
        const normalized = data.map(normalizeInquiry);
        setInquiries(normalized);
        const targetId = searchParams.get('inquiry');
        if (targetId) {
          const found = normalized.find((i) => i.id === targetId);
          if (found) setPreviewInquiry(found);
          router.replace('/admin/cotizaciones', { scroll: false });
        }
      })
      .catch(() => {
        if (active) {
          setInquiries([]);
          toastError('No se pudieron cargar las cotizaciones. Verificá tu conexión.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const pending   = inquiries.filter((i) => i.status === 'pending').length;
  const contacted = inquiries.filter((i) => i.status === 'contacted').length;

  return (
    <div className='space-y-6'>
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
        onDelete={() => { setPendingDelete(previewInquiry.id); setPreviewInquiry(null); }}
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

      {/* Header */}
      <section className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
        <div>
          <p className='text-xs uppercase tracking-[0.2em] font-semibold text-muted mb-1'>Bandeja de entrada</p>
          <h1 className='text-3xl font-bold tracking-tight'>Cotizaciones</h1>
          <p className='text-sm text-muted mt-1'>Gestiona y haz seguimiento de las consultas recibidas.</p>
        </div>
        {/* Quick stats */}
        <div className='flex items-center gap-3 shrink-0'>
          <div className='text-center px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40'>
            <p className='text-xl font-bold text-amber-600 dark:text-amber-400 leading-none'>{pending}</p>
            <p className='text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5 font-medium uppercase tracking-wide'>Pendientes</p>
          </div>
          <div className='text-center px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/40'>
            <p className='text-xl font-bold text-sky-600 dark:text-sky-400 leading-none'>{contacted}</p>
            <p className='text-[10px] text-sky-600/70 dark:text-sky-400/70 mt-0.5 font-medium uppercase tracking-wide'>Contactados</p>
          </div>
        </div>
      </section>

      {/* Table card */}
      <section className='rounded-2xl border border-default bg-surface overflow-hidden'>
        {/* Filter bar */}
        <div className='px-5 py-4 border-b border-default flex flex-col sm:flex-row gap-3'>
          <input
            className='h-9 flex-1 px-3.5 rounded-xl border border-default bg-surface-secondary text-[13px] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/50 transition-all'
            placeholder='Buscar por nombre, email, teléfono u oferta...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <HeroSelect
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
            options={[
              { value: 'all',       label: 'Todos los estados' },
              { value: 'pending',   label: 'Pendiente' },
              { value: 'contacted', label: 'Contactado' },
              { value: 'closed',    label: 'Cerrado' },
            ]}
            triggerClassName='h-9 rounded-xl border border-default bg-surface-secondary px-3 text-[13px] min-w-[170px]'
          />
        </div>

        {loading ? (
          <div className='flex min-h-[320px] items-center justify-center'>
            <div className='h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent' />
          </div>
        ) : (
        <Table>
          <Table.ScrollContainer style={{ minWidth: 700 }}>
            <Table.Content aria-label='Solicitudes de cotización'>
              <Table.Header>
                <Table.Column>
                  <span className='text-xs font-semibold text-muted uppercase tracking-wide'>Fecha</span>
                </Table.Column>
                <Table.Column isRowHeader>
                  <span className='text-xs font-semibold text-muted uppercase tracking-wide'>Cliente</span>
                </Table.Column>
                <Table.Column>
                  <span className='text-xs font-semibold text-muted uppercase tracking-wide'>Solicitud</span>
                </Table.Column>
                <Table.Column>
                  <span className='text-xs font-semibold text-muted uppercase tracking-wide'>Estado</span>
                </Table.Column>
                <Table.Column> </Table.Column>
              </Table.Header>
              <Table.Body
                items={rows}
                renderEmptyState={() => (
                  <p className='py-12 text-center text-sm text-muted'>
                    No hay solicitudes que coincidan con los filtros.
                  </p>
                )}
              >
                {(item) => (
                  <Table.Row id={item.id} className='hover:bg-surface-secondary/50 transition-colors'>
                    <Table.Cell>
                      <span className='text-xs text-muted whitespace-nowrap'>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-AR') : '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <p className='font-semibold text-[13px]'>{item.name}</p>
                      <p className='text-xs text-muted mt-0.5'>{item.phone || '-'}</p>
                      {item.email && <p className='text-xs text-muted/70'>{item.email}</p>}
                    </Table.Cell>
                    <Table.Cell>
                      <p className='text-[13px]'>{item.requestTitle}</p>
                      <p className='text-xs text-muted mt-0.5'>
                        {item.passengers ? `${item.passengers} pasajero(s)` : item.requestMeta}
                      </p>
                    </Table.Cell>
                    <Table.Cell>
                      <HeroSelect
                        value={item.status}
                        onValueChange={(v) => changeStatus(item.id, v)}
                        options={[
                          { value: 'pending',   label: 'Pendiente' },
                          { value: 'contacted', label: 'Contactado' },
                          { value: 'closed',    label: 'Cerrado' },
                        ]}
                        triggerClassName={`h-7 rounded-full text-[11px] font-semibold px-3 border-0 ${INQUIRY_STATUS_CLASS[item.status]}`}
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
                          <MessageCircle size={14} />
                        </a>
                        <button
                          onClick={() => setPreviewInquiry(item)}
                          className='w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-surface-secondary hover:text-foreground transition-colors'
                          title='Ver detalle'
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={() => setPendingDelete(item.id)}
                          className='w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors'
                          title='Eliminar'
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
        )}

        {!loading && rows.length > 0 && (
          <div className='px-5 py-3 border-t border-default'>
            <p className='text-xs text-muted'>{rows.length} resultado{rows.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </section>
    </div>
  );
}
