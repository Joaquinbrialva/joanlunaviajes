'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroSelect from '@/components/ui/hero-select';
import { Button, Chip, Skeleton, toast } from '@heroui/react';
import { LuEye, LuPencil, LuTrash2, LuGlobe, LuPlus } from 'react-icons/lu';
import DestinationPreviewDrawer from '@/components/admin/destination-preview-drawer';
import { toastError } from '@/lib/toast';
import { usePagination } from '@/hooks/use-pagination';
import AdminTablePagination from '@/components/ui/admin-table-pagination';
import { PageHeader, Section, TableToolbar, EmptyState, ConfirmDialog, RowCheckbox, LinkButton } from '@/components/admin/kit';

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
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
      .catch(() => {
        if (active) { setDestinations([]); toastError('No se pudieron cargar los destinos. Verificá tu conexión.'); }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const continents = useMemo(() => ['all', ...new Set(destinations.map((d) => d.continent))], [destinations]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return destinations.filter((d) => {
      const searchMatch = query.length === 0 || d.city.toLowerCase().includes(query) || d.title.toLowerCase().includes(query) || d.country.toLowerCase().includes(query);
      const continentMatch = continent === 'all' || d.continent === continent;
      return searchMatch && continentMatch;
    });
  }, [destinations, continent, search]);

  const { page, setPage, pageItems, totalPages, from, to } = usePagination(rows);

  function executeDelete() {
    if (!pendingDelete) return;
    const toDelete = pendingDelete;
    const selectedIds = [...selected];

    const deleteFn = async () => {
      if (toDelete.type === 'batch') {
        const results = await Promise.all(selectedIds.map((id) => fetch(`/api/destinos/${id}`, { method: 'DELETE' })));
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
    toast.promise(deleteFn, { loading: 'Eliminando...', success: count > 1 ? `${count} destinos eliminados` : 'Destino eliminado', error: (err) => err?.message || 'No se pudo eliminar' });
  }

  const isDesigner = role === 'designer';
  const deleteLabel = pendingDelete?.type === 'batch' ? `${selected.size} destino(s) seleccionado(s)` : 'este destino';
  const tableLoading = loading || role === null;

  return (
    <div className={`space-y-5 transition-[padding-right] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${previewDest ? 'md:pr-[456px]' : ''}`}>
      <DestinationPreviewDrawer destination={previewDest} isOpen={previewDest !== null} onClose={() => setPreviewDest(null)} />

      {!isDesigner && (
        <ConfirmDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title='¿Eliminar destino(s)?' onConfirm={executeDelete}>
          Estás a punto de eliminar <strong>{deleteLabel}</strong>. Esta acción no se puede deshacer.
        </ConfirmDialog>
      )}

      <PageHeader
        title='Gestión de destinos'
        description={isDesigner ? 'Puedes ver los destinos y editar sus imágenes.' : 'Controla contenido, metadata SEO y visibilidad comercial.'}
        actions={role !== null && !isDesigner && (
          <LinkButton href='/admin/destinos/nuevo'>
            <LuPlus className='h-4 w-4' />
            Nuevo destino
          </LinkButton>
        )}
      />

      <Section>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder='Buscar por ciudad, título o país...'>
          <HeroSelect
            value={continent}
            onValueChange={setContinent}
            options={continents.map((item) => ({ value: item, label: item === 'all' ? 'Todos los continentes' : item }))}
            triggerClassName='h-9 min-w-[190px] rounded-xl border border-default bg-surface-secondary px-3 text-[13px]'
          />
        </TableToolbar>

        {!isDesigner && selected.size > 0 && (
          <div className='flex items-center gap-3 border-b border-default bg-danger/5 px-5 py-2.5'>
            <span className='text-sm font-medium text-danger'>{selected.size} seleccionado(s)</span>
            <Button size='sm' variant='danger-soft' onClick={() => setPendingDelete({ type: 'batch' })}>
              <LuTrash2 className='h-3.5 w-3.5' />
              Eliminar seleccionados
            </Button>
          </div>
        )}

        <div className='overflow-x-auto'>
          {tableLoading ? (
            <div className='space-y-2 p-5'>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className='h-11 rounded-lg' />)}</div>
          ) : (
            <table className='w-full min-w-[600px] text-sm'>
              <thead>
                <tr className='border-b border-default bg-surface-secondary text-left text-xs font-medium text-muted'>
                  {!isDesigner && <th className='w-10 px-4 py-3'><RowCheckbox checked={pageItems.length > 0 && pageItems.every((d) => selected.has(d.id))} onChange={(v) => setSelected(v ? new Set(pageItems.map((d) => d.id)) : new Set())} /></th>}
                  <th className='px-4 py-3'>Destino</th>
                  <th className='px-4 py-3'>País</th>
                  <th className='px-4 py-3'>Continente</th>
                  <th className='px-4 py-3'>Budget diario</th>
                  <th className='px-4 py-3'>Popular</th>
                  <th className='px-4 py-3' />
                </tr>
              </thead>
              <tbody className='divide-y divide-default'>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={isDesigner ? 6 : 7} className='px-4 py-2'>
                      {destinations.length === 0 ? (
                        <EmptyState icon={LuGlobe} title='Sin destinos todavía' description='Crea el primer destino para que aparezca aquí.' />
                      ) : (
                        <p className='py-10 text-center text-muted'>No hay destinos que coincidan con la búsqueda.</p>
                      )}
                    </td>
                  </tr>
                ) : pageItems.map((destination) => {
                  const isSelected = selected.has(destination.id);
                  return (
                    <tr key={destination.id} className={`transition-colors ${isSelected ? 'bg-accent/5' : 'hover:bg-surface-secondary/50'}`}>
                      {!isDesigner && (
                        <td className='px-4 py-3'>
                          <RowCheckbox checked={isSelected} onChange={(v) => { const next = new Set(selected); v ? next.add(destination.id) : next.delete(destination.id); setSelected(next); }} />
                        </td>
                      )}
                      <td className='px-4 py-3'>
                        <p className='font-semibold'>{destination.city}</p>
                        <p className='text-xs text-muted truncate max-w-[220px]'>{destination.title}</p>
                      </td>
                      <td className='px-4 py-3 text-muted'>{destination.country}</td>
                      <td className='px-4 py-3 text-muted'>{destination.continent}</td>
                      <td className='px-4 py-3 font-medium'>USD {destination.stats.averageDailyBudgetUSD}</td>
                      <td className='px-4 py-3'>
                        {destination.isPopular ? (
                          <Chip color='accent' variant='soft' size='sm'><Chip.Label>Popular</Chip.Label></Chip>
                        ) : (
                          <span className='text-xs text-muted'>—</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center justify-end gap-1'>
                          <button onClick={() => setPreviewDest(destination)} className='flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground' title='Ver resumen'>
                            <LuEye className='h-[15px] w-[15px]' />
                          </button>
                          <button onClick={() => router.push(`/admin/destinos/${destination.slug}/editar`)} className='flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground' title='Editar'>
                            <LuPencil className='h-[15px] w-[15px]' />
                          </button>
                          {!isDesigner && (
                            <button onClick={() => setPendingDelete({ type: 'single', id: destination.id })} className='flex h-8 w-8 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10' title='Eliminar'>
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
