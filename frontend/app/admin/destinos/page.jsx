'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeroSelect from '@/components/ui/hero-select';
import { AlertDialog, Button, Table, toast } from '@heroui/react';
import { Eye, PenLine, Trash2 } from 'lucide-react';
import DestinationPreviewDrawer from '@/components/admin/destination-preview-drawer';

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [pendingDelete, setPendingDelete] = useState(null);
  const [previewDest, setPreviewDest] = useState(null);
  const router = useRouter();

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

  const allRowsSelected = rows.length > 0 && rows.every((d) => selected.has(d.id));

  function toggleAll() {
    setSelected(allRowsSelected ? new Set() : new Set(rows.map((d) => d.id)));
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
    toast.promise(deleteFn, {
      loading: 'Eliminando...',
      success: count > 1 ? `${count} destinos eliminados` : 'Destino eliminado',
      error: (err) => err?.message || 'No se pudo eliminar',
    });
  }

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

      <section className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Gestión de destinos</h2>
          <p className='text-muted'>Controla contenido, metadata SEO y visibilidad comercial.</p>
        </div>
        <Link
          href='/admin/destinos/nuevo'
          className='inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white'
        >
          + Nuevo destino
        </Link>
      </section>

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-5 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3'>
          <input
            className='h-10 px-3 rounded-lg border border-default bg-surface-secondary text-sm'
            placeholder='Buscar por nombre o país...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <HeroSelect
            value={continent}
            onValueChange={(v) => setContinent(v)}
            options={continents.map((c) => ({
              value: c,
              label: c === 'all' ? 'Todos los continentes' : c,
            }))}
            triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary px-3'
          />
        </div>

        {selected.size > 0 && (
          <div className='flex items-center gap-3 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800'>
            <span className='text-sm font-medium text-rose-700 dark:text-rose-400'>
              {selected.size} seleccionado(s)
            </span>
            <Button
              size='sm'
              variant='danger-soft'
              color='danger'
              onPress={() => setPendingDelete({ type: 'batch' })}
              startContent={<Trash2 size={14} />}
            >
              Eliminar seleccionados
            </Button>
          </div>
        )}

        <Table>
          <Table.ScrollContainer minWidth={600}>
            <Table.Content aria-label='Gestión de destinos'>
              <Table.Header>
                <Table.Column className='w-10'>
                  <input
                    type='checkbox'
                    checked={allRowsSelected}
                    onChange={toggleAll}
                    className='cursor-pointer' style={{ accentColor: 'var(--accent)' }}
                  />
                </Table.Column>
                <Table.Column isRowHeader>Destino</Table.Column>
                <Table.Column>País</Table.Column>
                <Table.Column>Continente</Table.Column>
                <Table.Column>Budget diario</Table.Column>
                <Table.Column>Popular</Table.Column>
                <Table.Column> </Table.Column>
              </Table.Header>
              <Table.Body
                items={rows}
                renderEmptyState={() => (
                  <p className='py-10 text-center text-sm text-muted'>
                    No hay destinos que coincidan con la búsqueda.
                  </p>
                )}
              >
                {(destination) => {
                  const isSelected = selected.has(destination.id);
                  return (
                    <Table.Row
                      id={destination.id}
                      className={`transition-colors ${isSelected ? 'bg-orange-100 dark:bg-orange-900/20' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                    >
                      <Table.Cell>
                        <input
                          type='checkbox'
                          checked={isSelected}
                          onChange={() => toggleOne(destination.id)}
                          className='cursor-pointer' style={{ accentColor: 'var(--accent)' }}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <p className='font-semibold'>{destination.name}</p>
                        <p className='text-xs text-muted'>{destination.id}</p>
                      </Table.Cell>
                      <Table.Cell>{destination.country}</Table.Cell>
                      <Table.Cell>{destination.continent}</Table.Cell>
                      <Table.Cell className='font-medium'>USD {destination.stats.averageDailyBudgetUSD}</Table.Cell>
                      <Table.Cell>
                        {destination.isPopular
                          ? <span className='inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'>Popular</span>
                          : <span className='text-muted text-xs'>—</span>
                        }
                      </Table.Cell>
                      <Table.Cell>
                        <div className='flex items-center justify-end gap-1'>
                          <button
                            onClick={() => setPreviewDest(destination)}
                            className='w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-surface-secondary hover:text-foreground transition-colors'
                            title='Ver resumen'
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/destinos/${destination.slug}/editar`)}
                            className='w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-surface-secondary hover:text-foreground transition-colors'
                            title='Editar'
                          >
                            <PenLine size={15} />
                          </button>
                          <button
                            onClick={() => setPendingDelete({ type: 'single', id: destination.id })}
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
