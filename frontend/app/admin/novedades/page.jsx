'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Spinner, toast } from '@heroui/react';
import { LuPlus, LuPencil, LuTrash2, LuSparkles } from 'react-icons/lu';
import GalleryEditor from '@/components/ui/gallery-editor';
import { toastError, toastSuccess } from '@/lib/toast';
import { PageHeader, Section, Panel, ConfirmDialog, TextareaField, EmptyState, NovedadStatusChip } from '@/components/admin/kit';

const EMPTY_FORM = { images: [], caption: '', status: 'published' };

export default function NovedadesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    fetch('/api/novedades')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setUpdates(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ images: item.images || [], caption: item.caption || '', status: item.status || 'published' });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.images.length === 0) {
      toastError('Agregá al menos una imagen.');
      return;
    }
    setSaving(true);
    try {
      const body = { images: form.images, caption: form.caption, status: form.status };
      if (editing) {
        const res = await fetch(`/api/novedades/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar.');
        setUpdates((prev) => prev.map((u) => (u.id === editing.id ? data : u)));
        toastSuccess('Novedad actualizada');
      } else {
        const res = await fetch('/api/novedades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear.');
        setUpdates((prev) => [data, ...prev]);
        toastSuccess('Novedad creada');
      }
      closeDrawer();
    } catch (err) {
      toastError(err, editing ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  function executeDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    const deleteFn = async () => {
      const res = await fetch(`/api/novedades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar la novedad.');
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    };
    toast.promise(deleteFn, { loading: 'Eliminando...', success: 'Novedad eliminada', error: (err) => err?.message || 'Error al eliminar' });
    setPendingDelete(null);
  }

  return (
    <div className='space-y-5'>
      <ConfirmDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title='¿Eliminar novedad?' onConfirm={executeDelete}>
        Esta acción no se puede deshacer. La novedad dejará de mostrarse en el sitio.
      </ConfirmDialog>

      <Panel isOpen={drawerOpen} onClose={closeDrawer} title={editing ? 'Editar novedad' : 'Nueva novedad'} size='lg'>
        <form onSubmit={handleSubmit} className='space-y-4 p-5'>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-foreground'>
              Imágenes <span className='text-accent'>*</span>
            </label>
            <GalleryEditor images={form.images} onChange={(arr) => update('images', arr)} />
          </div>

          <TextareaField
            label='Descripción'
            hint='Opcional'
            rows={3}
            value={form.caption}
            onChange={(e) => update('caption', e.target.value)}
            placeholder='Un texto corto para acompañar las fotos...'
          />

          <Checkbox isSelected={form.status === 'published'} onChange={(checked) => update('status', checked ? 'published' : 'draft')}>
            <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
            <Checkbox.Content>Publicada (visible en el sitio)</Checkbox.Content>
          </Checkbox>

          <div className='flex gap-3 pt-2'>
            <Button type='button' variant='tertiary' className='flex-1' onClick={closeDrawer}>Cancelar</Button>
            <Button type='submit' className='flex-1' isDisabled={saving}>
              {saving ? <Spinner color='current' size='sm' /> : null}
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear novedad'}
            </Button>
          </div>
        </form>
      </Panel>

      <PageHeader
        title='Novedades'
        description='Álbumes tipo Estados/Stories para mostrar en la home.'
        actions={
          <Button onClick={openCreate}>
            <LuPlus className='h-4 w-4' />
            Nueva novedad
          </Button>
        }
      />

      <Section>
        <div className='p-4 md:p-5'>
          {loading ? (
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className='aspect-square animate-pulse rounded-xl bg-surface-secondary' />)}
            </div>
          ) : updates.length === 0 ? (
            <EmptyState
              icon={LuSparkles}
              title='Todavía no hay novedades'
              description='Creá la primera para que aparezca en la home.'
              action={<Button onClick={openCreate}>Nueva novedad</Button>}
            />
          ) : (
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
              {updates.map((item) => (
                <div key={item.id} className='group relative aspect-square overflow-hidden rounded-xl border border-default bg-surface-secondary'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.images?.[0] && <img src={item.images[0]} alt={item.caption || 'Novedad'} className='h-full w-full object-cover' />}
                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0' />
                  <div className='absolute left-2 top-2'><NovedadStatusChip status={item.status} /></div>
                  <div className='absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2'>
                    <div className='min-w-0'>
                      {item.caption && <p className='truncate text-xs font-medium text-white'>{item.caption}</p>}
                      <p className='text-[10px] text-white/70'>{item.images?.length || 0} foto{item.images?.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                      <button onClick={() => openEdit(item)} className='flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70' title='Editar'>
                        <LuPencil size={13} />
                      </button>
                      <button onClick={() => setPendingDelete(item.id)} className='flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-danger/80' title='Eliminar'>
                        <LuTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
