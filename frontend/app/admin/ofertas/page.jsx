'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeroSelect from '@/components/ui/hero-select';
import { AlertDialog, Button, Table, toast } from '@heroui/react';
import { Eye, PenLine, Trash2 } from 'lucide-react';
import OfferPreviewDrawer from '@/components/admin/offer-preview-drawer';

function getOfferPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
}

function formatPrice(amount, currency) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function getStatus(offer) {
  if (!offer.availability?.remainingSpots || offer.availability.remainingSpots <= 2) return 'low_stock';
  if (offer.isFeatured) return 'featured';
  return 'active';
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [pendingDelete, setPendingDelete] = useState(null);
  const [previewOffer, setPreviewOffer] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch('/api/ofertas', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => { if (active && Array.isArray(data)) setOffers(data); })
      .catch(() => { if (active) setOffers([]); });
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return offers.filter((offer) => {
      const offerStatus = getStatus(offer);
      const searchMatch =
        query.length === 0 ||
        offer.title.toLowerCase().includes(query) ||
        offer.location.city.toLowerCase().includes(query) ||
        offer.location.country.toLowerCase().includes(query);
      const statusMatch = status === 'all' || status === offerStatus;
      return searchMatch && statusMatch;
    });
  }, [offers, search, status]);

  const allRowsSelected = rows.length > 0 && rows.every((o) => selected.has(o.id));

  function toggleAll() {
    setSelected(allRowsSelected ? new Set() : new Set(rows.map((o) => o.id)));
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function executeDelete() {
    if (!pendingDelete) return;
    const toDelete = pendingDelete;
    const selectedIds = [...selected];

    const deleteFn = async () => {
      if (toDelete.type === 'batch') {
        const results = await Promise.all(selectedIds.map((id) => fetch(`/api/ofertas/${id}`, { method: 'DELETE' })));
        if (results.some((r) => !r.ok)) throw new Error('Alguna eliminación falló');
        setOffers((prev) => prev.filter((o) => !selectedIds.includes(o.id)));
        setSelected(new Set());
      } else {
        const res = await fetch(`/api/ofertas/${toDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('No se pudo eliminar la oferta');
        setOffers((prev) => prev.filter((o) => o.id !== toDelete.id));
        setSelected((prev) => { const next = new Set(prev); next.delete(toDelete.id); return next; });
      }
    };

    const count = toDelete.type === 'batch' ? selectedIds.length : 1;
    toast.promise(deleteFn, {
      loading: 'Eliminando...',
      success: count > 1 ? `${count} ofertas eliminadas` : 'Oferta eliminada',
      error: (err) => err?.message || 'No se pudo eliminar',
    });
  }

  const deleteLabel = pendingDelete?.type === 'batch'
    ? `${selected.size} oferta(s) seleccionada(s)`
    : 'esta oferta';

  return (
    <div className='space-y-5'>
      <OfferPreviewDrawer
        offer={previewOffer}
        isOpen={previewOffer !== null}
        onClose={() => setPreviewOffer(null)}
      />

      <AlertDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialog.Backdrop variant='blur'>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status='danger' />
                <AlertDialog.Heading>¿Eliminar oferta(s)?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className='text-sm text-muted'>
                  Estás por eliminar <strong>{deleteLabel}</strong>. Esta acción no se puede deshacer.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer className='flex justify-end gap-2'>
                <Button slot='close' variant='tertiary'>Cancelar</Button>
                <Button onClick={executeDelete} slot='close' variant='danger'>Eliminar</Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <section className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Gestión de ofertas</h2>
          <p className='text-muted'>Administra disponibilidad, precios y estado comercial.</p>
        </div>
        <Link href='/admin/ofertas/nueva' className='inline-flex items-center justify-center h-10 px-4 rounded-lg bg-accent text-white font-semibold text-sm'>
          + Nueva oferta
        </Link>
      </section>

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-5 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3'>
          <input
            className='h-10 px-3 rounded-lg border border-default bg-surface-secondary text-sm'
            placeholder='Buscar por título o destino...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <HeroSelect
            value={status}
            onValueChange={(v) => setStatus(v)}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activas' },
              { value: 'featured', label: 'Destacadas' },
              { value: 'low_stock', label: 'Pocos cupos' },
            ]}
            triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary px-3'
          />
        </div>

        {selected.size > 0 && (
          <div className='flex items-center gap-3 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800'>
            <span className='text-sm font-medium text-rose-700 dark:text-rose-400'>
              {selected.size} seleccionada(s)
            </span>
            <Button
              size='sm'
              variant='danger-soft'
              color='danger'
              onPress={() => setPendingDelete({ type: 'batch' })}
              startContent={<Trash2 size={14} />}
            >
              Eliminar seleccionadas
            </Button>
          </div>
        )}

        <Table>
          <Table.ScrollContainer minWidth={640}>
            <Table.Content aria-label='Gestión de ofertas'>
              <Table.Header>
                <Table.Column className='w-10'>
                  <input
                    type='checkbox'
                    checked={allRowsSelected}
                    onChange={toggleAll}
                    className='cursor-pointer' style={{ accentColor: 'var(--accent)' }}
                  />
                </Table.Column>
                <Table.Column isRowHeader>Oferta</Table.Column>
                <Table.Column>Destino</Table.Column>
                <Table.Column>Duración</Table.Column>
                <Table.Column>Precio</Table.Column>
                <Table.Column>Estado</Table.Column>
                <Table.Column> </Table.Column>
              </Table.Header>
              <Table.Body
                items={rows}
                renderEmptyState={() => (
                  <p className='py-10 text-center text-sm text-muted'>
                    No hay ofertas que coincidan con la búsqueda.
                  </p>
                )}
              >
                {(offer) => {
                  const price = getOfferPrice(offer);
                  const offerStatus = getStatus(offer);
                  const isSelected = selected.has(offer.id);
                  return (
                    <Table.Row
                      id={offer.id}
                      className={`transition-colors ${isSelected ? 'bg-orange-100 dark:bg-orange-900/20' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                    >
                      <Table.Cell>
                        <input
                          type='checkbox'
                          checked={isSelected}
                          onChange={() => toggleOne(offer.id)}
                          className='cursor-pointer' style={{ accentColor: 'var(--accent)' }}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <p className='font-semibold'>{offer.title}</p>
                        <p className='text-xs text-muted'>{offer.id}</p>
                      </Table.Cell>
                      <Table.Cell>{offer.location.city}, {offer.location.country}</Table.Cell>
                      <Table.Cell>{offer.duration.days}d / {offer.duration.nights}n</Table.Cell>
                      <Table.Cell className='font-medium'>{formatPrice(price, offer.pricing.currency)}</Table.Cell>
                      <Table.Cell><StatusPill status={offerStatus} /></Table.Cell>
                      <Table.Cell>
                        <div className='flex items-center justify-end gap-1'>
                          <button
                            onClick={() => setPreviewOffer(offer)}
                            className='w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-surface-secondary hover:text-foreground transition-colors'
                            title='Ver resumen'
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/ofertas/${offer.slug}/editar`)}
                            className='w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-surface-secondary hover:text-foreground transition-colors'
                            title='Editar'
                          >
                            <PenLine size={15} />
                          </button>
                          <button
                            onClick={() => setPendingDelete({ type: 'single', id: offer.id })}
                            className='w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors'
                            title='Eliminar'
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                }}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </section>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    featured: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    low_stock: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  };
  const label = { active: 'Activa', featured: 'Destacada', low_stock: 'Pocos cupos' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
}
