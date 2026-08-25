'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import HeroSelect from '@/components/ui/hero-select';
import { Button, Chip, Skeleton, toast } from '@heroui/react';
import { LuPencil, LuStar, LuTrash2, LuClipboardList, LuPlus } from 'react-icons/lu';
import { toastError } from '@/lib/toast';
import { usePagination } from '@/hooks/use-pagination';
import AdminTablePagination from '@/components/ui/admin-table-pagination';
import { PageHeader, Section, TableToolbar, EmptyState, ConfirmDialog, RowCheckbox, OfferStatusChip, LinkButton } from '@/components/admin/kit';

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingUnspecial, setPendingUnspecial] = useState(null);
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setRole(data.user.role); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/ofertas', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => { if (active && Array.isArray(data)) setOffers(data); })
      .catch(() => {
        if (active) { setOffers([]); toastError('No se pudieron cargar las ofertas. Verificá tu conexión.'); }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const specialOffer = useMemo(() => offers.find((o) => o.isSpecialOffer) || null, [offers]);

  function removeSpecialOffer(offer) {
    const run = async () => {
      const res = await fetch(`/api/ofertas/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...offer, title: offer.title, destinationCountry: offer.location?.country, destinationCity: offer.location?.city, isSpecialOffer: false }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar la oferta.');
      const updated = await res.json();
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? updated : o)));
    };
    toast.promise(run, { loading: 'Actualizando...', success: 'Ya no es la oferta especial', error: (err) => err?.message || 'No se pudo actualizar la oferta.' });
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

  const { page, setPage, pageItems, totalPages, from, to } = usePagination(rows);
  const allRowsSelected = pageItems.length > 0 && pageItems.every((offer) => selected.has(offer.id));

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
        setSelected((prev) => { const next = new Set(prev); next.delete(toDelete.id); return next; });
      }
    };

    const count = toDelete.type === 'batch' ? selectedIds.length : 1;
    toast.promise(deleteFn, { loading: 'Eliminando...', success: count > 1 ? `${count} ofertas eliminadas` : 'Oferta eliminada', error: (err) => err?.message || 'No se pudo eliminar' });
  }

  const deleteLabel = pendingDelete?.type === 'batch' ? `${selected.size} oferta(s) seleccionada(s)` : 'esta oferta';
  const tableLoading = loading || role === null;
  const isDesigner = role === 'designer';

  return (
    <div className='space-y-5'>
      <ConfirmDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title='¿Eliminar oferta(s)?' onConfirm={executeDelete}>
        Estás por eliminar <strong>{deleteLabel}</strong>. Esta acción no se puede deshacer.
      </ConfirmDialog>

      <ConfirmDialog isOpen={pendingUnspecial !== null} onOpenChange={(open) => { if (!open) setPendingUnspecial(null); }} status='warning' title='¿Quitar oferta especial?' confirmLabel='Quitar' onConfirm={() => removeSpecialOffer(pendingUnspecial)}>
        <strong>{pendingUnspecial?.title}</strong> dejará de mostrarse como oferta especial en el sidebar de /ofertas.
      </ConfirmDialog>

      <PageHeader
        title='Gestión de ofertas'
        description={isDesigner ? 'Sube la imagen de portada de las ofertas pendientes.' : 'Administra disponibilidad, precios y estado comercial.'}
        actions={role !== null && !isDesigner && (
          <LinkButton href='/admin/ofertas/nueva'>
            <LuPlus className='h-4 w-4' />
            Nueva oferta
          </LinkButton>
        )}
      />

      <Section title='Oferta especial' description='Solo una a la vez, visible en el sidebar de /ofertas' bodyClassName='p-4 md:p-5'>
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
              <Button size='sm' variant='tertiary' onClick={() => router.push(`/admin/ofertas/${specialOffer.slug}/editar`)}>Editar</Button>
              <Button size='sm' variant='danger-soft' onClick={() => setPendingUnspecial(specialOffer)}>Quitar</Button>
            </div>
          </div>
        ) : (
          <p className='text-sm text-muted'>Ninguna oferta marcada como especial. Edita una oferta y marca la opción en el paso de revisión.</p>
        )}
      </Section>

      <Section>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder='Buscar por título o destino...'>
          <HeroSelect
            value={status}
            onValueChange={setStatus}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activas' },
              { value: 'featured', label: 'Destacadas' },
              { value: 'low_stock', label: 'Pocos cupos' },
            ]}
            triggerClassName='h-9 min-w-[190px] rounded-xl border border-default bg-surface-secondary px-3 text-[13px]'
          />
        </TableToolbar>

        {!isDesigner && selected.size > 0 && (
          <div className='flex items-center gap-3 border-b border-default bg-danger/5 px-5 py-2.5'>
            <span className='text-sm font-medium text-danger'>{selected.size} seleccionada(s)</span>
            <Button size='sm' variant='danger-soft' onClick={() => setPendingDelete({ type: 'batch' })}>
              <LuTrash2 className='h-3.5 w-3.5' />
              Eliminar seleccionadas
            </Button>
          </div>
        )}

        <div className='overflow-x-auto'>
          {tableLoading ? (
            <div className='space-y-2 p-5'>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className='h-11 rounded-lg' />)}</div>
          ) : (
            <table className='w-full min-w-[640px] text-sm'>
              <thead>
                <tr className='border-b border-default bg-surface-secondary text-left text-xs font-medium text-muted'>
                  {!isDesigner && <th className='w-10 px-4 py-3'><RowCheckbox checked={allRowsSelected} onChange={(v) => setSelected(v ? new Set(pageItems.map((o) => o.id)) : new Set())} /></th>}
                  <th className='px-4 py-3'>Oferta</th>
                  <th className='px-4 py-3'>Destino</th>
                  <th className='px-4 py-3'>Duración</th>
                  <th className='px-4 py-3'>Precio</th>
                  <th className='px-4 py-3'>Estado</th>
                  <th className='px-4 py-3'>Especial</th>
                  <th className='px-4 py-3' />
                </tr>
              </thead>
              <tbody className='divide-y divide-default'>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={isDesigner ? 7 : 8} className='px-4 py-2'>
                      {offers.length === 0 ? (
                        <EmptyState icon={LuClipboardList} title='Sin ofertas todavía' description='Crea la primera oferta para que aparezca aquí.' />
                      ) : (
                        <p className='py-10 text-center text-muted'>No hay ofertas que coincidan con la búsqueda.</p>
                      )}
                    </td>
                  </tr>
                ) : pageItems.map((offer) => {
                  const price = getOfferPrice(offer);
                  const offerStatus = getStatus(offer);
                  const isSelected = selected.has(offer.id);
                  return (
                    <tr
                      key={offer.id}
                      onClick={() => router.push(`/admin/ofertas/${offer.slug}/ver`)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-accent/5' : 'hover:bg-surface-secondary/50'}`}
                    >
                      {!isDesigner && (
                        <td className='px-4 py-3' onClick={(e) => e.stopPropagation()}>
                          <RowCheckbox checked={isSelected} onChange={(v) => { const next = new Set(selected); v ? next.add(offer.id) : next.delete(offer.id); setSelected(next); }} />
                        </td>
                      )}
                      <td className='px-4 py-3'><p className='font-semibold'>{offer.title}</p></td>
                      <td className='px-4 py-3 text-muted'>{offer.location.city}, {offer.location.country}</td>
                      <td className='px-4 py-3 text-muted'>{offer.duration.days}d / {offer.duration.nights}n</td>
                      <td className='px-4 py-3 font-medium'>{formatPrice(price, offer.pricing.currency)}</td>
                      <td className='px-4 py-3'><OfferStatusChip status={offerStatus} /></td>
                      <td className='px-4 py-3'>
                        {offer.isSpecialOffer && (
                          <Chip color='warning' variant='soft' size='sm'>
                            <Chip.Label className='flex items-center gap-1'><LuStar className='h-2.5 w-2.5' /> Especial</Chip.Label>
                          </Chip>
                        )}
                      </td>
                      <td className='px-4 py-3' onClick={(e) => e.stopPropagation()}>
                        <div className='flex items-center justify-end gap-1'>
                          <button onClick={() => router.push(`/admin/ofertas/${offer.slug}/editar`)} className='flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground' title='Editar'>
                            <LuPencil className='h-[15px] w-[15px]' />
                          </button>
                          {!isDesigner && (
                            <button onClick={() => setPendingDelete({ type: 'single', id: offer.id })} className='flex h-8 w-8 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10' title='Eliminar'>
                              <LuTrash2 className='h-[15px] w-[15px]' />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <AdminTablePagination page={page} totalPages={totalPages} from={from} to={to} total={rows.length} onChange={setPage} />
      </Section>
    </div>
  );
}
