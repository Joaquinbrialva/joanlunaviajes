'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Spinner, Table, toast } from '@heroui/react';
import { LuPencil, LuTrash2, LuUserPlus } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import { toastError, toastSuccess } from '@/lib/toast';
import { PageHeader, Section, TableToolbar, ConfirmDialog, Panel, TextInputField, InitialsAvatar, RoleStatusChip } from '@/components/admin/kit';

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'agent', label: 'Agente' },
  { value: 'designer', label: 'Diseñador' },
  { value: 'client', label: 'Cliente' },
];

const EMPTY_FORM = { name: '', email: '', phone: '', role: 'client', password: '' };

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setCurrentUser(d.user); })
      .catch(() => {});

    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setUsers(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const roleMatch = roleFilter === 'all' || u.role === roleFilter;
      const searchMatch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return roleMatch && searchMatch;
    });
  }, [users, search, roleFilter]);

  function openCreate() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(user) {
    setEditingUser(user);
    setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', role: user.role || 'client', password: '' });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const body = { name: form.name, email: form.email, phone: form.phone, role: form.role };
        if (form.password) body.newPassword = form.password;

        const res = await fetch(`/api/users/${editingUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar.');
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? data : u)));
        toastSuccess('Usuario actualizado');
        closeDrawer();
      } else {
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, role: form.role }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear.');
        setUsers((prev) => [data, ...prev]);
        toastSuccess('Usuario creado. Se envió la contraseña temporal al email.');
        closeDrawer();
      }
    } catch (err) {
      toastError(err, editingUser ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  function executeDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    const deleteFn = async () => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar el usuario.');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    };
    toast.promise(deleteFn, { loading: 'Eliminando...', success: 'Usuario eliminado', error: (err) => err?.message || 'Error al eliminar' });
    setPendingDelete(null);
  }

  return (
    <div className='space-y-5'>
      <ConfirmDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title='¿Eliminar usuario?' onConfirm={executeDelete}>
        Esta acción no se puede deshacer. El usuario perderá acceso al sistema.
      </ConfirmDialog>

      <Panel isOpen={drawerOpen} onClose={closeDrawer} title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={handleSubmit} className='space-y-4 p-5'>
          <div className='flex justify-center py-2'>
            <InitialsAvatar name={form.name} role={form.role} size='lg' />
          </div>

          <TextInputField label='Nombre completo' required value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder='Nombre completo' />
          <TextInputField label='Email' required type='email' value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder='correo@ejemplo.com' />
          <TextInputField label='Teléfono' type='tel' value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder='+54 11 1234-5678' />

          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-foreground'>
              Rol <span className='text-accent'>*</span>
            </label>
            <HeroSelect value={form.role} onValueChange={(v) => updateForm('role', v)} options={ROLES} />
          </div>

          {editingUser ? (
            <TextInputField
              label='Contraseña'
              hint='Dejar en blanco para no cambiar'
              type='password'
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              placeholder='••••••••'
            />
          ) : (
            <div className='flex items-start gap-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3'>
              <span className='mt-0.5 text-base text-accent'>✉</span>
              <p className='text-[13px] leading-snug text-muted'>
                Se generará una <strong className='text-foreground'>contraseña temporal</strong> y se enviará al email del usuario. Al iniciar sesión se le pedirá que la cambie.
              </p>
            </div>
          )}

          <div className='flex gap-3 pt-2'>
            <Button type='button' variant='tertiary' className='flex-1' onClick={closeDrawer}>Cancelar</Button>
            <Button type='submit' className='flex-1' isDisabled={saving}>
              {saving ? <Spinner color='current' size='sm' /> : null}
              {saving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Panel>

      <PageHeader
        title='Usuarios'
        description='Gestiona las cuentas y permisos del sistema.'
        actions={
          <Button onClick={openCreate}>
            <LuUserPlus className='h-4 w-4' />
            Nuevo usuario
          </Button>
        }
      />

      <Section>
        <TableToolbar search={search} onSearchChange={setSearch} placeholder='Buscar por nombre o email...'>
          <HeroSelect
            value={roleFilter}
            onValueChange={setRoleFilter}
            options={[{ value: 'all', label: 'Todos los roles' }, ...ROLES]}
            triggerClassName='h-9 min-w-[180px] rounded-xl border border-default bg-surface-secondary px-3 text-[13px]'
          />
        </TableToolbar>

        <div className='p-4 md:p-5'>
          {loading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <div key={i} className='h-14 animate-pulse rounded-xl bg-surface-secondary' />)}</div>
          ) : (
            <Table>
              <Table.ScrollContainer style={{ minWidth: 640 }}>
                <Table.Content aria-label='Usuarios'>
                  <Table.Header>
                    <Table.Column isRowHeader>Usuario</Table.Column>
                    <Table.Column>Teléfono</Table.Column>
                    <Table.Column>Rol</Table.Column>
                    <Table.Column>Registrado</Table.Column>
                    <Table.Column> </Table.Column>
                  </Table.Header>
                  <Table.Body items={rows} renderEmptyState={() => <p className='py-10 text-center text-sm text-muted'>No se encontraron usuarios con los filtros aplicados.</p>}>
                    {(item) => (
                      <Table.Row id={item.id} className='transition-colors hover:bg-surface-secondary/50'>
                        <Table.Cell>
                          <div className='flex items-center gap-3'>
                            <InitialsAvatar name={item.name} role={item.role} size='sm' />
                            <div>
                              <p className='flex items-center gap-2 text-sm font-semibold'>
                                {item.name}
                                {currentUser?.id === item.id && <span className='rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent'>Tú</span>}
                              </p>
                              <p className='text-xs text-muted'>{item.email}</p>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell><span className='text-sm text-muted'>{item.phone || '—'}</span></Table.Cell>
                        <Table.Cell><RoleStatusChip role={item.role} /></Table.Cell>
                        <Table.Cell><span className='whitespace-nowrap text-sm text-muted'>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-AR') : '—'}</span></Table.Cell>
                        <Table.Cell>
                          <div className='flex items-center justify-end gap-1'>
                            <button onClick={() => openEdit(item)} className='flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground' title='Editar usuario'>
                              <LuPencil size={14} />
                            </button>
                            <button
                              onClick={() => { if (currentUser?.id !== item.id) setPendingDelete(item.id); }}
                              disabled={currentUser?.id === item.id}
                              className='flex h-8 w-8 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-30'
                              title={currentUser?.id === item.id ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                            >
                              <LuTrash2 size={14} />
                            </button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}

          {rows.length > 0 && <p className='mt-3 text-right text-xs text-muted'>{rows.length} usuario{rows.length !== 1 ? 's' : ''}</p>}
        </div>
      </Section>
    </div>
  );
}
