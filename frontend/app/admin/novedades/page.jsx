'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Spinner, toast } from '@heroui/react';
import { LuPlus, LuPencil, LuTrash2, LuSparkles, LuVideo } from 'react-icons/lu';
import NovedadImagePicker from '@/components/admin/novedad-image-picker';
import { toastError, toastSuccess } from '@/lib/toast';
import { PageHeader, Section, Dialog, ConfirmDialog, TextareaField, EmptyState, NovedadStatusChip } from '@/components/admin/kit';

const EMPTY_FORM = { media: [], caption: '', status: 'published' };

function itemToPayload(item) {
  return item.type === 'video'
    ? { url: item.url, type: 'video', trimStart: item.trimStart, trimEnd: item.trimEnd }
    : { url: item.url, type: 'image' };
}

function recordToMedia(item) {
  if (Array.isArray(item.media) && item.media.length > 0) return item.media;
  return (item.images || []).map((url) => ({ url, type: 'image' }));
}

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
    setForm({ media: recordToMedia(item), caption: item.caption || '', status: item.status || 'published' });
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
    if (form.media.length === 0) {
      toastError('Agregá al menos una imagen o video.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body = { media: [itemToPayload(form.media[0])], caption: form.caption, status: form.status };
        const res = await fetch(`/api/novedades/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar.');
        setUpdates((prev) => prev.map((u) => (u.id === editing.id ? data : u)));
        toastSuccess('Novedad actualizada');
      } else {
        // Cada imagen/video del lote se publica como una novedad independiente.
        const created = [];
        for (const item of form.media) {
          const res = await fetch('/api/novedades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media: [itemToPayload(item)], caption: form.caption, status: form.status }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al crear.');
          created.push(data);
        }
        setUpdates((prev) => [...created, ...prev]);
        toastSuccess(created.length > 1 ? `${created.length} novedades creadas` : 'Novedad creada');
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

      <Dialog isOpen={drawerOpen} onClose={closeDrawer} title={editing ? 'Editar novedad' : 'Nueva novedad'} size='lg'>
        <form onSubmit={handleSubmit} className='space-y-4 p-5'>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-foreground'>
              {editing ? 'Imagen o video' : 'Imágenes o videos'} <span className='text-accent'>*</span>
            </label>
            <NovedadImagePicker items={form.media} onChange={(arr) => update('media', arr)} maxImages={editing ? 1 : undefined} />
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
      </Dialog>

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
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className='aspect-[3/1] animate-pulse rounded-xl bg-surface-secondary' />)}
            </div>
          ) : updates.length === 0 ? (
            <EmptyState
              icon={LuSparkles}
              title='Todavía no hay novedades'
              description='Creá la primera para que aparezca en la home.'
              action={<Button onClick={openCreate}>Nueva novedad</Button>}
            />
          ) : (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {updates.map((item) => {
                const media = recordToMedia(item);
                const cover = media[0];
                return (
                  <div key={item.id} className='group relative aspect-[3/1] overflow-hidden rounded-xl border border-default bg-surface-secondary'>
                    {cover && (cover.type === 'video' ? (
                      <video src={cover.url} className='h-full w-full object-cover' muted playsInline />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={cover.url} alt={item.caption || 'Novedad'} className='h-full w-full object-cover' />
                    ))}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/0' />
                    <div className='absolute left-3 top-3 flex items-center gap-1.5'>
                      <NovedadStatusChip status={item.status} solid />
                      {cover?.type === 'video' && (
                        <span className='flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white'>
                          <LuVideo className='h-3 w-3' /> video
                        </span>
                      )}
                    </div>
                    <div className='absolute right-2 top-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                      <button onClick={() => openEdit(item)} className='flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70' title='Editar'>
                        <LuPencil size={14} />
                      </button>
                      <button onClick={() => setPendingDelete(item.id)} className='flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-danger/80' title='Eliminar'>
                        <LuTrash2 size={14} />
                      </button>
                    </div>
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
