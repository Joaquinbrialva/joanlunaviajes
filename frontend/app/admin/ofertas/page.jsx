'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeroSelect from '@/components/ui/hero-select';
import { AlertDialog, Button, Checkbox, Table, toast } from '@heroui/react';
import { Eye, PenLine, Star, Trash2 } from 'lucide-react';
import OfferPreviewDrawer from '@/components/admin/offer-preview-drawer';
import { toastError } from '@/lib/toast';

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
      .then((data) => {
        if (active && Array.isArray(data)) setOffers(data);
      })
      .catch(() => {
        if (active) setOffers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const specialOffer = useMemo(() => offers.find((o) => o.isSpecialOffer) || null, [offers]);

  async function removeSpecialOffer(offer) {
    try {
      const res = await fetch(`/api/ofertas/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...offer,
          title: offer.title,
          destinationCountry: offer.location?.country,
          destinationCity: offer.location?.city,
          isSpecialOffer: false,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? updated : o)));
    } catch {
      toastError('No se pudo actualizar la oferta.');
    }
  }

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

  const allRowsSelected = rows.length > 0 && rows.every((offer) => selected.has(offer.id));

  function handleSelectionChange(keys) {
    if (keys === 'all') {
      setSelected(new Set(rows.map((offer) => offer.id)));
      return;
    }
    setSelected(new Set([...keys]));
  }

  function executeDelete() {
    if (!pendingDelete) return;
    const toDelete = pendingDelete;
    const selectedIds = [...selected];

    const deleteFn = async () => {
      if (toDelete.type === 'batch') {
        const results = await Promise.all(selectedIds.map((id) => fetch(`/api/ofertas/${id}`, { method: 'DELETE' })));
        if (results.some((r) => !r.ok)) throw new Error('Alguna eliminacion fallo');
        setOffers((prev) => prev.filter((offer) => !selectedIds.includes(offer.id)));
        setSelected(new Set());
      } else {
        const res = await fetch(`/api/ofertas/${toDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('No se pudo eliminar la oferta');
        setOffers((prev) => prev.filter((offer) => offer.id !== toDelete.id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(toDelete.id);
          return next;
        });
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
                  Estas por eliminar <strong>{deleteLabel}</strong>. Esta accion no se puede deshacer.
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

      <section className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-4xl font-bold'>Gestion de ofertas</h2>
          <p className='text-muted'>Administra disponibilidad, precios y estado comercial.</p>
        </div>
        <Link href='/admin/ofertas/nueva' className='inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white'>
          + Nueva oferta
        </Link>
      </section>

      <section className='space-y-3 rounded-2xl border border-default bg-surface p-4 md:p-5'>
        <div className='flex items-center gap-2'>
          <Star size={18} className='fill-amber-400 text-amber-400' />
          <h3 className='text-lg font-bold'>Oferta especial</h3>
          <span className='ml-1 text-xs text-muted'>(solo una a la vez, visible en el sidebar de /ofertas)</span>
        </div>
        {specialOffer ? (
          <div className='flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10'>
            {specialOffer.images?.[0]?.url && (
              <div className='relative h-16 w-24 shrink-0 overflow-hidden rounded-lg'>
                <Image src={specialOffer.images[0].url} alt={specialOffer.title} fill className='object-cover' />
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <p className='truncate font-semibold'>{specialOffer.title}</p>
              <p className='text-sm text-muted'>{specialOffer.location.city}, {specialOffer.location.country}</p>
            </div>
            <div className='flex shrink-0 gap-2'>
              <button
                onClick={() => router.push(`/admin/ofertas/${specialOffer.slug}/editar`)}
                className='h-9 rounded-lg border border-default px-3 text-sm font-medium transition-colors hover:bg-surface-secondary'
              >
                Editar
              </button>
              <button
                onClick={() => removeSpecialOffer(specialOffer)}
                className='h-9 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20'
              >
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <p className='py-2 text-sm text-muted'>
            Ninguna oferta marcada como especial. Edita una oferta y marca la opcion en el paso de revision.
          </p>
        )}
      </section>

      <section className='space-y-4 rounded-2xl border border-default bg-surface p-4 md:p-5'>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]'>
          <input
            className='h-10 rounded-lg border border-default bg-surface-secondary px-3 text-sm'
            placeholder='Buscar por titulo o destino...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <HeroSelect
            value={status}
            onValueChange={(value) => setStatus(value)}
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
          <div className='flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-800 dark:bg-rose-900/10'>
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
            <Table.Content
              aria-label='Gestion de ofertas'
              selectionMode='multiple'
              selectedKeys={selected}
              onSelectionChange={handleSelectionChange}
            >
              <Table.Header>
                <Table.Column className='w-10'>
                  <SelectionCheckbox ariaLabel='Seleccionar todas las ofertas' />
                </Table.Column>
                <Table.Column isRowHeader>Oferta</Table.Column>
                <Table.Column>Destino</Table.Column>
                <Table.Column>Duracion</Table.Column>
                <Table.Column>Precio</Table.Column>
                <Table.Column>Estado</Table.Column>
                <Table.Column>Especial</Table.Column>
                <Table.Column> </Table.Column>
              </Table.Header>
              <Table.Body
                items={rows}
                renderEmptyState={() => (
                  <p className='py-10 text-center text-sm text-muted'>
                    No hay ofertas que coincidan con la busqueda.
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
                        <SelectionCheckbox ariaLabel={`Seleccionar oferta ${offer.title}`} />
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
                        {offer.isSpecialOffer && (
                          <span className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'>
                            <Star size={10} className='fill-current' /> Especial
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className='flex items-center justify-end gap-1'>
                          <button
                            onClick={() => setPreviewOffer(offer)}
                            className='flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
                            title='Ver resumen'
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/ofertas/${offer.slug}/editar`)}
                            className='flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
                            title='Editar'
                          >
                            <PenLine size={15} />
                          </button>
                          <button
                            onClick={() => setPendingDelete({ type: 'single', id: offer.id })}
                            className='flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20'
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
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
}

function SelectionCheckbox({ ariaLabel }) {
  return (
    <Checkbox slot='selection' aria-label={ariaLabel} className='inline-flex cursor-pointer items-center'>
      <Checkbox.Control className='flex h-5 w-5 items-center justify-center rounded-md border border-default bg-surface transition-colors data-selected:border-accent data-selected:bg-accent'>
        <Checkbox.Indicator className='text-white' />
      </Checkbox.Control>
      <Checkbox.Content className='sr-only'>{ariaLabel}</Checkbox.Content>
    </Checkbox>
  );
}
