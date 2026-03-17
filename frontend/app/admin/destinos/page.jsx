'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeroSelect from '@/components/ui/hero-select';
import { AlertDialog, Button, toast } from '@heroui/react';
import { Eye, PenLine, Trash2 } from 'lucide-react';
import DestinationPreviewDrawer from '@/components/admin/destination-preview-drawer';
import { toastError } from '@/lib/toast';

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [pendingDelete, setPendingDelete] = useState(null);
  const [previewDest, setPreviewDest] = useState(null);
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
    fetch('/api/destinos', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => { if (active && Array.isArray(data)) setDestinations(data); })
      .catch(() => { if (active) setDestinations([]); });
    return () => { active = false; };
  }, []);

  const continents = useMemo(
    () => ['all', ...new Set(destinations.map((d) => d.continent))],
    [destinations]
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return destinations.filter((d) => {
      const searchMatch =
        query.length === 0 ||
        d.name.toLowerCase().includes(query) ||
        d.country.toLowerCase().includes(query);
      const continentMatch = continent === 'all' || d.continent === continent;
      return searchMatch && continentMatch;
    });
  }, [destinations, continent, search]);

  function executeDelete() {
    if (!pendingDelete) return;
    const toDelete = pendingDelete;
    const selectedIds = [...selected];

    const deleteFn = async () => {
      if (toDelete.type === 'batch') {
        const results = await Promise.all(
          selectedIds.map((id) => fetch(`/api/destinos/${id}`, { method: 'DELETE' }))
        );
        if (results.some((r) => !r.ok)) throw new Error('Alguna eliminación falló');
        setDestinations((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
        setSelected(new Set());
      } else {
        const res = await fetch(`/api/destinos/${toDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('No se pudo eliminar el destino');
        setDestinations((prev) => prev.filter((d) => d.id !== toDelete.id));
        setSelected((prev) => { const next = new Set(prev); next.delete(toDelete.id); return next; });
      }
    };

    const count = toDelete.type === 'batch' ? selectedIds.length : 1;
    toast.promise(deleteFn, {
      loading: 'Eliminando...',
      success: count > 1 ? `${count} destinos eliminados` : 'Destino eliminado',
      error: (err) => err?.message || 'No se pudo eliminar',
    });
  }

  const isDesigner = role === 'designer';
  const deleteLabel = pendingDelete?.type === 'batch'
    ? `${selected.size} destino(s) seleccionado(s)`
    : 'este destino';

  return (
    <div className='space-y-5'>
      <DestinationPreviewDrawer
        destination={previewDest}
        isOpen={previewDest !== null}
        onClose={() => setPreviewDest(null)}
      />

      {!isDesigner && (
        <AlertDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
          <AlertDialog.Backdrop variant='blur'>
            <AlertDialog.Container>
              <AlertDialog.Dialog>
                <AlertDialog.CloseTrigger />
                <AlertDialog.Header>
                  <AlertDialog.Icon status='danger' />
                  <AlertDialog.Heading>¿Eliminar destino(s)?</AlertDialog.Heading>
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
      )}

      <section className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-4xl font-bold'>Gestión de destinos</h2>
          <p className='text-muted'>
            {isDesigner
              ? 'Podés ver los destinos y editar sus imágenes.'
              : 'Controla contenido, metadata SEO y visibilidad comercial.'}
          </p>
        </div>
        {role !== null && !isDesigner && (
          <Link
            href='/admin/destinos/nuevo'
            className='inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white'
          >
            + Nuevo destino
          </Link>
        )}
      </section>

      <section className='space-y-4 rounded-2xl border border-default bg-surface p-4 md:p-5'>
        {!isDesigner && selected.size > 0 && (
          <div className='flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-800 dark:bg-rose-900/10'>
            <span className='text-sm font-medium text-rose-700 dark:text-rose-400'>
              {selected.size} seleccionado(s)
            </span>
            <Button size='sm' variant='danger-soft' color='danger' onPress={() => setPendingDelete({ type: 'batch' })} startContent={<Trash2 size={14} />}>
              Eliminar seleccionados
            </Button>
          </div>
        )}

        <div className='grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]'>
          <input
            className='h-10 rounded-lg border border-default bg-surface-secondary px-3 text-sm'
            placeholder='Buscar por nombre o país...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <HeroSelect
            value={continent}
            onValueChange={(value) => setContinent(value)}
            options={continents.map((item) => ({
              value: item,
              label: item === 'all' ? 'Todos los continentes' : item,
            }))}
            triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary px-3'
          />
        </div>

        <div className='overflow-x-auto rounded-xl border border-default'>
          <table className='w-full min-w-[600px] text-sm'>
            <thead>
              <tr className='border-b border-default bg-surface-secondary text-left text-xs font-medium text-muted'>
                {!isDesigner && (
                  <th className='w-10 px-4 py-3'>
                    <SquareCheckbox
                      checked={rows.length > 0 && rows.every((d) => selected.has(d.id))}
                      onChange={(v) => setSelected(v ? new Set(rows.map((d) => d.id)) : new Set())}
                    />
                  </th>
                )}
                <th className='px-4 py-3'>Destino</th>
                <th className='px-4 py-3'>País</th>
                <th className='px-4 py-3'>Continente</th>
                <th className='px-4 py-3'>Budget diario</th>
                <th className='px-4 py-3'>Popular</th>
                <th className='px-4 py-3'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-default'>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={!isDesigner ? 7 : 6} className='px-4 py-10 text-center text-muted'>
                    No hay destinos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : rows.map((destination) => {
                const isSelected = selected.has(destination.id);
                return (
                  <tr key={destination.id} className={`transition-colors ${isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-surface-secondary/50'}`}>
                    {!isDesigner && (
                      <td className='px-4 py-3'>
                        <SquareCheckbox
                          checked={isSelected}
                          onChange={(v) => {
                            const next = new Set(selected);
                            v ? next.add(destination.id) : next.delete(destination.id);
                            setSelected(next);
                          }}
                        />
                      </td>
                    )}
                    <td className='px-4 py-3'>
                      <p className='font-semibold'>{destination.name}</p>
                      <p className='text-xs text-muted'>{destination.id}</p>
                    </td>
                    <td className='px-4 py-3 text-muted'>{destination.country}</td>
                    <td className='px-4 py-3 text-muted'>{destination.continent}</td>
                    <td className='px-4 py-3 font-medium'>USD {destination.stats.averageDailyBudgetUSD}</td>
                    <td className='px-4 py-3'>
                      {destination.isPopular ? (
                        <span className='inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'>
                          Popular
                        </span>
                      ) : (
                        <span className='text-xs text-muted'>—</span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={() => setPreviewDest(destination)}
                          className='flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
                          title='Ver resumen'
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/destinos/${destination.slug}/editar`)}
                          className='flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
                          title='Editar'
                        >
                          <PenLine size={15} />
                        </button>
                        {!isDesigner && (
                          <button
                            onClick={() => setPendingDelete({ type: 'single', id: destination.id })}
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
        </div>
      </section>
    </div>
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

