'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeroSelect from '@/components/ui/hero-select';
import { AlertDialog, Button, toast } from '@heroui/react';
import { Eye, PenLine, Star, Trash2, ClipboardList } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [pendingDelete, setPendingDelete] = useState(null);
  const [previewOffer, setPreviewOffer] = useState(null);
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
      .then((data) => {
        if (active && Array.isArray(data)) setOffers(data);
      })
      .catch(() => {
        if (active) {
          setOffers([]);
          toastError('No se pudieron cargar las ofertas. Verificá tu conexión.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
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
  const tableLoading = loading || role === null;

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
          <p className='text-muted'>
            {role === 'designer'
              ? 'Sube la imagen de portada de las ofertas pendientes.'
              : 'Administra disponibilidad, precios y estado comercial.'}
          </p>
        </div>
        {role !== null && role !== 'designer' && (
          <Link href='/admin/ofertas/nueva' className='inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white'>
            + Nueva oferta
          </Link>
        )}
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
        {role !== 'designer' && selected.size > 0 && (
          <div className='flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-800 dark:bg-rose-900/10'>
            <span className='text-sm font-medium text-rose-700 dark:text-rose-400'>
              {selected.size} seleccionada(s)
            </span>
            <Button size='sm' variant='danger-soft' color='danger' onPress={() => setPendingDelete({ type: 'batch' })} startContent={<Trash2 size={14} />}>
              Eliminar seleccionadas
            </Button>
          </div>
        )}

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

        <div className='overflow-x-auto rounded-xl border border-default'>
          {tableLoading ? (
            <div className='flex min-h-[320px] items-center justify-center'>
              <div className='h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent' />
            </div>
          ) : (
            <table className='w-full min-w-[640px] text-sm'>
            <thead>
              <tr className='border-b border-default bg-surface-secondary text-left text-xs font-medium text-muted'>
                {role !== 'designer' && (
                  <th className='w-10 px-4 py-3'>
                    <SquareCheckbox
                      checked={allRowsSelected}
                      onChange={(v) => setSelected(v ? new Set(rows.map((o) => o.id)) : new Set())}
                    />
                  </th>
                )}
                <th className='px-4 py-3'>Oferta</th>
                <th className='px-4 py-3'>Destino</th>
                <th className='px-4 py-3'>Duración</th>
                <th className='px-4 py-3'>Precio</th>
                <th className='px-4 py-3'>Estado</th>
                <th className='px-4 py-3'>Especial</th>
                <th className='px-4 py-3'>Multimedia</th>
                <th className='px-4 py-3'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-default'>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={role !== 'designer' ? 9 : 8} className='px-4 py-12 text-center'>
                    {offers.length === 0 ? (
                      <div className='flex flex-col items-center gap-2'>
                        <ClipboardList className='h-9 w-9 text-muted/40' />
                        <p className='font-semibold text-foreground'>Sin ofertas todavía</p>
                        <p className='text-sm text-muted'>Crea la primera oferta para que aparezca aquí.</p>
                      </div>
                    ) : (
                      <p className='text-muted'>No hay ofertas que coincidan con la búsqueda.</p>
                    )}
                  </td>
                </tr>
              ) : rows.map((offer) => {
                const price = getOfferPrice(offer);
                const offerStatus = getStatus(offer);
                const isSelected = selected.has(offer.id);
                return (
                  <tr key={offer.id} className={`transition-colors ${isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-surface-secondary/50'}`}>
                    {role !== 'designer' && (
                      <td className='px-4 py-3'>
                        <SquareCheckbox
                          checked={isSelected}
                          onChange={(v) => {
                            const next = new Set(selected);
                            v ? next.add(offer.id) : next.delete(offer.id);
                            setSelected(next);
                          }}
                        />
                      </td>
                    )}
                    <td className='px-4 py-3'>
                      <p className='font-semibold'>{offer.title}</p>
                      <p className='text-xs text-muted'>{offer.id}</p>
                    </td>
                    <td className='px-4 py-3 text-muted'>{offer.location.city}, {offer.location.country}</td>
                    <td className='px-4 py-3 text-muted'>{offer.duration.days}d / {offer.duration.nights}n</td>
                    <td className='px-4 py-3 font-medium'>{formatPrice(price, offer.pricing.currency)}</td>
                    <td className='px-4 py-3'><StatusPill status={offerStatus} /></td>
                    <td className='px-4 py-3'>
                      {offer.isSpecialOffer && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'>
                          <Star size={10} className='fill-current' /> Especial
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      {offer.mediaReady === false && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'>
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
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
                        {role !== 'designer' && (
                          <button
                            onClick={() => setPendingDelete({ type: 'single', id: offer.id })}
                            className='flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20'
                            title='Eliminar'
                          >
                            <Trash2 size={15} />
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

function SquareCheckbox({ checked, onChange }) {
  return (
    <label className='inline-flex cursor-pointer'>
      <input type='checkbox' className='sr-only' checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${checked ? 'border-accent bg-accent' : 'border-default bg-surface'}`}>
        {checked && (
          <svg width='10' height='8' viewBox='0 0 10 8' fill='none'>
            <path d='M1 4l3 3 5-6' stroke='white' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        )}
      </span>
    </label>
  );
}

