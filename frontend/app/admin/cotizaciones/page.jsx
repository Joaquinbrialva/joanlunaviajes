'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Table, toast } from '@heroui/react';
import { LuTrash2, LuChevronRight } from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa';
import HeroSelect from '@/components/ui/hero-select';
import InquiryPreviewDrawer from '@/components/admin/inquiry-preview-drawer';
import { normalizeInquiry, INQUIRY_STATUS_OPTIONS, INQUIRY_STATUS_CLASS } from '@/lib/inquiries';
import { toastError } from '@/lib/toast';
import { usePagination } from '@/hooks/use-pagination';
import AdminTablePagination from '@/components/ui/admin-table-pagination';
import { PageHeader, Section, TableToolbar, ConfirmDialog } from '@/components/admin/kit';

function InquiryTableSkeleton() {
  return (
    <div className='animate-pulse'>
      <div className='flex gap-4 border-b border-default bg-surface-secondary/60 px-5 py-3'>
        {[70, 130, 150, 90, 60].map((w, i) => <div key={i} className='h-3 shrink-0 rounded bg-surface-secondary' style={{ width: w }} />)}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='flex items-center gap-4 border-b border-default px-5 py-4'>
          <div className='h-2.5 w-16 shrink-0 rounded bg-surface-secondary' />
          <div className='w-32 shrink-0 space-y-1.5'>
            <div className='h-3 w-28 rounded bg-surface-secondary' />
            <div className='h-2.5 w-20 rounded bg-surface-secondary' />
          </div>
          <div className='flex-1 space-y-1.5'>
            <div className='h-3 w-36 rounded bg-surface-secondary' />
            <div className='h-2.5 w-24 rounded bg-surface-secondary' />
          </div>
          <div className='h-6 w-24 shrink-0 rounded-full bg-surface-secondary' />
          <div className='flex shrink-0 gap-1'>
            <div className='h-8 w-8 rounded-lg bg-surface-secondary' />
            <div className='h-8 w-8 rounded-lg bg-surface-secondary' />
            <div className='h-8 w-8 rounded-lg bg-surface-secondary' />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminInquiriesPage() {
  return <Suspense><AdminInquiriesContent /></Suspense>;
}

function AdminInquiriesContent() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [previewInquiry, setPreviewInquiry] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

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
        if (active) { setInquiries([]); toastError('No se pudieron cargar las cotizaciones. Verificá tu conexión.'); }
      })
      .finally(() => { if (active) setLoading(false); });
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

  const { page, setPage, pageItems, totalPages, from, to } = usePagination(rows);

  async function changeStatus(id, newStatus) {
    try {
      const res = await fetch(`/api/cotizaciones/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
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
    toast.promise(deleteFn, { loading: 'Eliminando...', success: 'Cotización eliminada', error: (err) => err?.message || 'Error al eliminar' });
  }

  function buildWhatsAppUrl(inquiry) {
    const clean = String(inquiry.phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(`Hola ${inquiry.name}, te contactamos por tu solicitud de cotización${inquiry.requestTitle ? ` sobre "${inquiry.requestTitle}"` : ''}. `);
    return `https://wa.me/${clean}?text=${text}`;
  }

  const pending = inquiries.filter((i) => i.status === 'pending').length;
  const contacted = inquiries.filter((i) => i.status === 'contacted').length;

  return (
    <div className='space-y-6'>
      <InquiryPreviewDrawer
        inquiry={previewInquiry}
        isOpen={previewInquiry !== null}
        onClose={() => setPreviewInquiry(null)}
        onSaveNotes={async (notes) => {
          const res = await fetch(`/api/cotizaciones/${previewInquiry.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }) });
          if (!res.ok) throw new Error();
          const updated = normalizeInquiry(await res.json());
          setInquiries((prev) => prev.map((i) => (i.id === previewInquiry.id ? updated : i)));
          setPreviewInquiry(updated);
        }}
        onStatusChange={(status) => changeStatus(previewInquiry.id, status)}
        onDelete={() => { setPendingDelete(previewInquiry.id); setPreviewInquiry(null); }}
        buildWhatsAppUrl={buildWhatsAppUrl}
      />

      <ConfirmDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title='¿Eliminar cotización?' onConfirm={executeDelete}>
        Esta acción no se puede deshacer.
      </ConfirmDialog>

      <PageHeader
        title='Cotizaciones'
        description='Gestiona y haz seguimiento de las consultas recibidas.'
        actions={
          <div className='flex items-center gap-4'>
            <div className='rounded-xl border border-amber-100 bg-amber-50 px-4 py-2 text-center dark:border-amber-800/40 dark:bg-amber-900/20'>
              <p className='text-2xl font-bold leading-none text-amber-600 dark:text-amber-400'>{pending}</p>
              <p className='mt-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-600/70 dark:text-amber-400/70'>Pendientes</p>
            </div>
            <p className='text-sm text-muted'><span className='font-semibold text-foreground'>{contacted}</span> contactados</p>
          </div>
        }
      />

      <Section>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder='Buscar por nombre, email, teléfono u oferta...'>
          <HeroSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'contacted', label: 'Contactado' },
              { value: 'closed', label: 'Cerrado' },
            ]}
            triggerClassName='h-9 min-w-[170px] rounded-xl border border-default bg-surface-secondary px-3 text-[13px]'
          />
        </TableToolbar>

        {loading ? (
          <InquiryTableSkeleton />
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <Table.ScrollContainer style={{ minWidth: 700 }}>
                <Table.Content aria-label='Solicitudes de cotización'>
                  <Table.Header>
                    <Table.Column><span className='text-xs font-semibold uppercase tracking-wide text-muted'>Fecha</span></Table.Column>
                    <Table.Column isRowHeader><span className='text-xs font-semibold uppercase tracking-wide text-muted'>Cliente</span></Table.Column>
                    <Table.Column><span className='text-xs font-semibold uppercase tracking-wide text-muted'>Solicitud</span></Table.Column>
                    <Table.Column><span className='text-xs font-semibold uppercase tracking-wide text-muted'>Estado</span></Table.Column>
                    <Table.Column> </Table.Column>
                  </Table.Header>
                  <Table.Body items={pageItems} renderEmptyState={() => <p className='py-12 text-center text-sm text-muted'>No hay solicitudes que coincidan con los filtros.</p>}>
                    {(item) => (
                      <Table.Row id={item.id} className='transition-colors hover:bg-surface-secondary/50'>
                        <Table.Cell><span className='whitespace-nowrap text-xs text-muted'>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-AR') : '-'}</span></Table.Cell>
                        <Table.Cell>
                          <p className='text-[13px] font-semibold'>{item.name}</p>
                          <p className='mt-0.5 text-xs text-muted'>{item.phone || '-'}</p>
                          {item.email && <p className='text-xs text-muted/70'>{item.email}</p>}
                        </Table.Cell>
                        <Table.Cell>
                          <p className='text-[13px]'>{item.requestTitle}</p>
                          <p className='mt-0.5 text-xs text-muted'>{item.passengers ? `${item.passengers} pasajero(s)` : item.requestMeta}</p>
                        </Table.Cell>
                        <Table.Cell>
                          <HeroSelect
                            value={item.status}
                            onValueChange={(v) => changeStatus(item.id, v)}
                            options={INQUIRY_STATUS_OPTIONS}
                            triggerClassName={`h-7 rounded-full border-0 px-3 text-[11px] font-semibold ${INQUIRY_STATUS_CLASS[item.status]}`}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <div className='flex items-center justify-end gap-1'>
                            <a href={buildWhatsAppUrl(item)} target='_blank' rel='noopener noreferrer' className='flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20' title='Abrir WhatsApp'>
                              <FaWhatsapp size={15} />
                            </a>
                            <button onClick={() => setPreviewInquiry(item)} className='flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground' title='Ver detalle'>
                              <LuChevronRight size={14} />
                            </button>
                            <button onClick={() => setPendingDelete(item.id)} className='flex h-8 w-8 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10' title='Eliminar'>
                              <LuTrash2 size={14} />
                            </button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        )}

        <AdminTablePagination page={page} totalPages={totalPages} from={from} to={to} total={rows.length} onChange={setPage} />
      </Section>
    </div>
  );
}
