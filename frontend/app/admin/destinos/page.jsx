'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeroSelect from '@/components/ui/hero-select';
import { AlertDialog, Button, Checkbox, Table, toast } from '@heroui/react';
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
      .then((data) => {
        if (active && Array.isArray(data)) setDestinations(data);
      })
      .catch(() => {
        if (active) setDestinations([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const continents = useMemo(
    () => ['all', ...new Set(destinations.map((destination) => destination.continent))],
    [destinations]
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return destinations.filter((destination) => {
      const searchMatch =
        query.length === 0 ||
        destination.name.toLowerCase().includes(query) ||
        destination.country.toLowerCase().includes(query);
      const continentMatch = continent === 'all' || destination.continent === continent;
      return searchMatch && continentMatch;
    });
  }, [destinations, continent, search]);

  function handleSelectionChange(keys) {
    if (keys === 'all') {
      setSelected(new Set(rows.map((destination) => destination.id)));
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
        const results = await Promise.all(selectedIds.map((id) => fetch(`/api/destinos/${id}`, { method: 'DELETE' })));
        if (results.some((r) => !r.ok)) throw new Error('Alguna eliminacion fallo');
        setDestinations((prev) => prev.filter((destination) => !selectedIds.includes(destination.id)));
        setSelected(new Set());
      } else {
        const res = await fetch(`/api/destinos/${toDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('No se pudo eliminar el destino');
        setDestinations((prev) => prev.filter((destination) => destination.id !== toDelete.id));
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
          <h2 className='text-4xl font-bold'>Gestion de destinos</h2>
          <p className='text-muted'>Controla contenido, metadata SEO y visibilidad comercial.</p>
        </div>
        <Link href='/admin/destinos/nuevo' className='inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white'>
          + Nuevo destino
        </Link>
      </section>

      <section className='space-y-4 rounded-2xl border border-default bg-surface p-4 md:p-5'>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]'>
          <input
            className='h-10 rounded-lg border border-default bg-surface-secondary px-3 text-sm'
            placeholder='Buscar por nombre o pais...'
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

        {selected.size > 0 && (
          <div className='flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-800 dark:bg-rose-900/10'>
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
            <Table.Content
              aria-label='Gestion de destinos'
              selectionMode='multiple'
              selectedKeys={selected}
              onSelectionChange={handleSelectionChange}
            >
              <Table.Header>
                <Table.Column className='w-10'>
                  <SelectionCheckbox ariaLabel='Seleccionar todos los destinos' />
                </Table.Column>
                <Table.Column isRowHeader>Destino</Table.Column>
                <Table.Column>Pais</Table.Column>
                <Table.Column>Continente</Table.Column>
                <Table.Column>Budget diario</Table.Column>
                <Table.Column>Popular</Table.Column>
                <Table.Column> </Table.Column>
              </Table.Header>
              <Table.Body
                items={rows}
                renderEmptyState={() => (
                  <p className='py-10 text-center text-sm text-muted'>
                    No hay destinos que coincidan con la busqueda.
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
                        <SelectionCheckbox ariaLabel={`Seleccionar destino ${destination.name}`} />
                      </Table.Cell>
                      <Table.Cell>
                        <p className='font-semibold'>{destination.name}</p>
                        <p className='text-xs text-muted'>{destination.id}</p>
                      </Table.Cell>
                      <Table.Cell>{destination.country}</Table.Cell>
                      <Table.Cell>{destination.continent}</Table.Cell>
                      <Table.Cell className='font-medium'>USD {destination.stats.averageDailyBudgetUSD}</Table.Cell>
                      <Table.Cell>
                        {destination.isPopular ? (
                          <span className='inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'>
                            Popular
                          </span>
                        ) : (
                          <span className='text-xs text-muted'>-</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
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
                          <button
                            onClick={() => setPendingDelete({ type: 'single', id: destination.id })}
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
