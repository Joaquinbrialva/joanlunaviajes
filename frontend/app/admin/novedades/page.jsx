'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, toast } from '@heroui/react';
import { LuPlus, LuPencil, LuTrash2, LuSparkles, LuVideo, LuX } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import NovedadStudio from '@/components/admin/novedad-studio';
import { toastError, toastSuccess } from '@/lib/toast';
import { PageHeader, Section, ConfirmDialog, EmptyState, NovedadStatusChip, TableToolbar } from '@/components/admin/kit';

function recordToMedia(item) {
  if (Array.isArray(item.media) && item.media.length > 0) return item.media;
  return (item.images || []).map((url) => ({ url, type: 'image' }));
}

export default function NovedadesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetch('/api/novedades')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setUpdates(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  async function handleStudioSubmit({ items, caption }) {
    if (editing) {
      const { media, status } = items[0];
      const body = { media: [media], caption, status };
      const res = await fetch(`/api/novedades/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar.');
      setUpdates((prev) => prev.map((u) => (u.id === editing.id ? data : u)));
      toastSuccess('Novedad actualizada');
    } else {
      // Cada imagen/video del lote se publica como una novedad independiente.
      const created = [];
      for (const { media, status } of items) {
        const res = await fetch('/api/novedades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media: [media], caption, status }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear.');
        created.push(data);
      }
      setUpdates((prev) => [...created, ...prev]);
      toastSuccess(created.length > 1 ? `${created.length} novedades creadas` : 'Novedad creada');
    }
    closeDrawer();
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return updates.filter((item) => {
      const media = recordToMedia(item);
      const type = media[0]?.type || 'image';
      const matchesSearch = query.length === 0 || (item.caption || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [updates, search, statusFilter, typeFilter]);

  const publishedCount = updates.filter((u) => u.status === 'published').length;
  const description = updates.length === 0
    ? 'Promos y novedades que se muestran destacadas en el home.'
    : `${updates.length} novedad${updates.length === 1 ? '' : 'es'} · ${publishedCount} publicada${publishedCount === 1 ? '' : 's'}`;

  async function executeDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    setPendingDelete(null);
    setDeleting(true);
    const promise = (async () => {
      const res = await fetch(`/api/novedades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar la novedad.');
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    })();
    toast.promise(() => promise, { loading: 'Eliminando...', success: 'Novedad eliminada', error: (err) => err?.message || 'Error al eliminar' });
    try {
      await promise;
    } catch {
      // el toast ya muestra el error
    } finally {
      setDeleting(false);
    }
  }

  function toggleSelectMode() {
    setSelectMode((prev) => !prev);
    setSelectedIds([]);
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function executeBulkDelete() {
    const ids = selectedIds;
    if (ids.length === 0) return;
    setPendingBulkDelete(false);
    setDeleting(true);
    const promise = (async () => {
      const results = await Promise.all(ids.map((id) => fetch(`/api/novedades/${id}`, { method: 'DELETE' })));
      const failed = results.filter((r) => !r.ok).length;
      setUpdates((prev) => prev.filter((u) => !ids.includes(u.id)));
      setSelectedIds([]);
      setSelectMode(false);
      if (failed > 0) throw new Error(`No se pudieron eliminar ${failed} novedad${failed === 1 ? '' : 'es'}.`);
    })();
    toast.promise(() => promise, {
      loading: 'Eliminando...',
      success: `${ids.length} novedad${ids.length === 1 ? '' : 'es'} eliminada${ids.length === 1 ? '' : 's'}`,
      error: (err) => err?.message || 'Error al eliminar',
    });
    try {
      await promise;
    } catch {
      // el toast ya muestra el error
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className='space-y-5'>
      <ConfirmDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title='¿Eliminar novedad?' onConfirm={executeDelete}>
        Esta acción no se puede deshacer. La novedad dejará de mostrarse en el sitio.
      </ConfirmDialog>

      <ConfirmDialog isOpen={pendingBulkDelete} onOpenChange={setPendingBulkDelete} title={`¿Eliminar ${selectedIds.length} novedad${selectedIds.length === 1 ? '' : 'es'}?`} onConfirm={executeBulkDelete}>
        Esta acción no se puede deshacer. Las novedades seleccionadas dejarán de mostrarse en el sitio.
      </ConfirmDialog>

      <NovedadStudio
        isOpen={drawerOpen}
        editing={editing}
        initialMedia={editing ? recordToMedia(editing) : []}
        initialCaption={editing?.caption || ''}
        initialStatus={editing?.status || 'published'}
        onClose={closeDrawer}
        onSubmit={handleStudioSubmit}
      />

      <PageHeader
        title='Novedades'
        description={description}
        actions={
          <div className='flex items-center gap-2'>
            {updates.length > 0 && (
              <Button variant='tertiary' onClick={toggleSelectMode} isDisabled={deleting}>
                {selectMode ? (<><LuX className='h-4 w-4' /> Cancelar</>) : 'Seleccionar'}
              </Button>
            )}
            <Button onClick={openCreate} isDisabled={deleting}>
              <LuPlus className='h-4 w-4' />
              Nueva novedad
            </Button>
          </div>
        }
      />

      <Section className={deleting ? 'pointer-events-none opacity-60' : ''}>
        {selectMode && (
          <div className='flex flex-wrap items-center justify-between gap-3 border-b border-default px-4 py-3 md:px-5'>
            <Checkbox
              isSelected={selectedIds.length > 0 && selectedIds.length === filtered.length}
              isIndeterminate={selectedIds.length > 0 && selectedIds.length < filtered.length}
              onChange={() => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((u) => u.id))}
            >
              <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
              <Checkbox.Content>{selectedIds.length > 0 ? `${selectedIds.length} seleccionada${selectedIds.length === 1 ? '' : 's'}` : 'Seleccionar todo'}</Checkbox.Content>
            </Checkbox>
            <Button variant='danger' isDisabled={selectedIds.length === 0 || deleting} onClick={() => setPendingBulkDelete(true)}>
              <LuTrash2 className='h-4 w-4' />
              Eliminar seleccionadas
            </Button>
          </div>
        )}
        {!loading && updates.length > 0 && (
          <TableToolbar search={search} onSearchChange={setSearch} placeholder='Buscar por descripción...'>
            <HeroSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'published', label: 'Publicadas' },
                { value: 'draft', label: 'Borrador' },
              ]}
              triggerClassName='h-9 min-w-[170px] rounded-xl border border-default bg-surface-secondary px-3 text-[13px]'
            />
            <HeroSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={[
                { value: 'all', label: 'Fotos y videos' },
                { value: 'image', label: 'Solo fotos' },
                { value: 'video', label: 'Solo videos' },
              ]}
              triggerClassName='h-9 min-w-[150px] rounded-xl border border-default bg-surface-secondary px-3 text-[13px]'
            />
          </TableToolbar>
        )}
        <div className='p-4 md:p-5'>
          {loading ? (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className='aspect-[12/5] animate-pulse rounded-xl bg-surface-secondary' />)}
            </div>
          ) : updates.length === 0 ? (
            <EmptyState
              icon={LuSparkles}
              title='Todavía no hay novedades'
              description='Creá la primera para que aparezca en la home.'
              action={<Button onClick={openCreate}>Nueva novedad</Button>}
            />
          ) : filtered.length === 0 ? (
            <p className='py-10 text-center text-muted'>No hay novedades que coincidan con la búsqueda.</p>
          ) : (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {filtered.map((item) => {
                const media = recordToMedia(item);
                const cover = media[0];
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={selectMode ? () => toggleSelected(item.id) : undefined}
                    className={`group relative aspect-[12/5] overflow-hidden rounded-xl border bg-surface-secondary ${selectMode ? 'cursor-pointer' : ''} ${isSelected ? 'border-accent ring-2 ring-accent' : 'border-default'}`}
                  >
                    {cover && (cover.type === 'video' ? (
                      <video src={cover.url} className='h-full w-full object-cover' muted playsInline />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={cover.url} alt={item.caption || 'Novedad'} className='h-full w-full object-cover' />
                    ))}
                    {selectMode && (
                      <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-black/30' : 'bg-black/0 group-hover:bg-black/10'}`} />
                    )}
                    <div className='absolute left-3 top-3 flex items-center gap-1.5'>
                      {selectMode ? (
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-white/80 bg-black/30'}`}>
                          {isSelected && <span className='h-2.5 w-2.5 rounded-full bg-current' />}
                        </span>
                      ) : (
                        <>
                          <NovedadStatusChip status={item.status} solid />
                          {cover?.type === 'video' && (
                            <span className='flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white'>
                              <LuVideo className='h-3 w-3' /> video
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {!selectMode && (
                      <div className='absolute right-2 top-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                        <button onClick={() => openEdit(item)} className='flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70' title='Editar'>
                          <LuPencil size={14} />
                        </button>
                        <button onClick={() => setPendingDelete(item.id)} className='flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-danger/80' title='Eliminar'>
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                    )}
                    <div className='absolute bottom-3 left-3 right-3'>
                      {item.caption && <p className='truncate text-sm font-medium text-white'>{item.caption}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
