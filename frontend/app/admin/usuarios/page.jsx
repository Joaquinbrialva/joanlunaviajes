'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertDialog, Button, Spinner, Table, toast } from '@heroui/react';
import { LuPencil, LuTrash2, LuUserPlus } from 'react-icons/lu';
import AdminDrawer from '@/components/admin/admin-drawer';
import HeroSelect from '@/components/ui/hero-select';
import { toastError, toastSuccess } from '@/lib/toast';

/* ─── Config ─────────────────────────────────────────────────────────── */

const ROLES = [
  { value: 'admin',    label: 'Administrador' },
  { value: 'agent',    label: 'Agente' },
  { value: 'designer', label: 'Diseñador' },
  { value: 'client',   label: 'Cliente' },
];

const ROLE_BADGE = {
  admin:    'bg-accent/10 text-accent',
  agent:    'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  designer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  client:   'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

const ROLE_AVATAR = {
  admin:    'bg-accent/15 text-accent',
  agent:    'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  designer: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  client:   'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const inputClass =
  'w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground text-[13px] placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60 transition-all';

const labelClass = 'block text-[11px] uppercase tracking-[0.18em] font-semibold text-muted mb-1.5';

const EMPTY_FORM = { name: '', email: '', phone: '', role: 'client', password: '' };

/* ─── Helpers ────────────────────────────────────────────────────────── */

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function RoleBadge({ role }) {
  const label = ROLES.find((r) => r.value === role)?.label || role;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        ROLE_BADGE[role] || ROLE_BADGE.client
      }`}
    >
      {label}
    </span>
  );
}

function Avatar({ name, role }) {
  return (
    <div
      className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold select-none ${
        ROLE_AVATAR[role] || ROLE_AVATAR.client
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function UsuariosPage() {
  const [users, setUsers]               = useState([]);
  const [currentUser, setCurrentUser]   = useState(null);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [editingUser, setEditingUser]   = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  /* ── Data fetching ── */
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setCurrentUser(d.user); })
      .catch(() => {});

    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setUsers(d); })
      .catch(() => {});
  }, []);

  /* ── Filtered rows ── */
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const roleMatch = roleFilter === 'all' || u.role === roleFilter;
      const searchMatch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      return roleMatch && searchMatch;
    });
  }, [users, search, roleFilter]);

  /* ── Drawer helpers ── */
  function openCreate() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(user) {
    setEditingUser(user);
    setForm({
      name:     user.name     || '',
      email:    user.email    || '',
      phone:    user.phone    || '',
      role:     user.role     || 'client',
      password: '',
    });
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

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const body = {
          name:  form.name,
          email: form.email,
          phone: form.phone,
          role:  form.role,
        };
        if (form.password) body.newPassword = form.password;

        const res  = await fetch(`/api/users/${editingUser.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar.');
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? data : u)));
        toastSuccess('Usuario actualizado');
        closeDrawer();
      } else {
        const res  = await fetch('/api/users', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:     form.name,
            email:    form.email,
            phone:    form.phone,
            role:     form.role,
            password: form.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear.');
        setUsers((prev) => [data, ...prev]);
        toastSuccess('Usuario creado correctamente');
        closeDrawer();
      }
    } catch (err) {
      toastError(err, editingUser ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ── */
  function executeDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    const deleteFn = async () => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar el usuario.');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    };
    toast.promise(deleteFn, {
      loading: 'Eliminando...',
      success: 'Usuario eliminado',
      error:   (err) => err?.message || 'Error al eliminar',
    });
    setPendingDelete(null);
  }

  /* ── Render ── */
  return (
    <div className='space-y-5'>

      {/* ── Delete dialog ── */}
      <AlertDialog
        isOpen={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
      >
        <AlertDialog.Backdrop variant='blur'>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status='danger' />
                <AlertDialog.Heading>¿Eliminar usuario?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className='text-sm text-muted'>
                  Esta acción no se puede deshacer. El usuario perderá acceso al sistema.
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

      {/* ── User drawer ── */}
      <AdminDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
      >
        <form onSubmit={handleSubmit} className='p-5 space-y-4'>

          {/* Avatar preview */}
          <div className='flex justify-center py-2'>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${
                ROLE_AVATAR[form.role] || ROLE_AVATAR.client
              }`}
            >
              {getInitials(form.name) || '?'}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Nombre completo <span className='text-accent normal-case'>*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder='Nombre completo'
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Email <span className='text-accent normal-case'>*</span>
            </label>
            <input
              required
              type='email'
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder='correo@ejemplo.com'
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              type='tel'
              value={form.phone}
              onChange={(e) => updateForm('phone', e.target.value)}
              placeholder='+54 11 1234-5678'
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Rol <span className='text-accent normal-case'>*</span>
            </label>
            <HeroSelect
              value={form.role}
              onValueChange={(v) => updateForm('role', v)}
              options={ROLES}
              className='w-full'
            />
          </div>

          <div>
            <label className={labelClass}>
              Contraseña
              {editingUser
                ? <span className='normal-case font-normal text-muted ml-1'>(dejar en blanco para no cambiar)</span>
                : <span className='text-accent normal-case ml-1'>*</span>
              }
            </label>
            <input
              type='password'
              required={!editingUser}
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              placeholder={editingUser ? '••••••••' : 'Mín. 6 caracteres'}
              className={inputClass}
            />
          </div>

          <div className='pt-2 flex gap-3'>
            <button
              type='button'
              onClick={closeDrawer}
              className='flex-1 h-11 rounded-xl border border-default text-[13px] font-semibold text-muted hover:bg-surface-secondary transition-colors'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={saving}
              className='flex-1 h-11 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-orange-500 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 flex items-center justify-center gap-2'
            >
              {saving
                ? <><Spinner color='current' size='sm' /> Guardando...</>
                : editingUser ? 'Guardar cambios' : 'Crear usuario'
              }
            </button>
          </div>
        </form>
      </AdminDrawer>

      {/* ── Page header ── */}
      <section className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Usuarios</h2>
          <p className='text-muted mt-1'>Gestiona las cuentas y permisos del sistema.</p>
        </div>
        <button
          onClick={openCreate}
          className='inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20 shrink-0'
        >
          <LuUserPlus className='h-4 w-4' />
          Nuevo usuario
        </button>
      </section>

      {/* ── Table card ── */}
      <section className='rounded-2xl border border-default bg-surface p-4 md:p-5 space-y-4'>

        {/* Filters */}
        <div className='grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3'>
          <input
            className='h-10 px-3 rounded-lg border border-default bg-surface-secondary text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/60 transition-all'
            placeholder='Buscar por nombre o email...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <HeroSelect
            value={roleFilter}
            onValueChange={setRoleFilter}
            options={[{ value: 'all', label: 'Todos los roles' }, ...ROLES]}
            triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary px-3'
          />
        </div>

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
              <Table.Body
                items={rows}
                renderEmptyState={() => (
                  <p className='py-10 text-center text-sm text-muted'>
                    No se encontraron usuarios con los filtros aplicados.
                  </p>
                )}
              >
                {(item) => (
                  <Table.Row
                    id={item.id}
                    className='hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors'
                  >
                    <Table.Cell>
                      <div className='flex items-center gap-3'>
                        <Avatar name={item.name} role={item.role} />
                        <div>
                          <p className='font-semibold text-sm flex items-center gap-2'>
                            {item.name}
                            {currentUser?.id === item.id && (
                              <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent'>
                                Tú
                              </span>
                            )}
                          </p>
                          <p className='text-xs text-muted'>{item.email}</p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className='text-sm text-muted'>{item.phone || '—'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <RoleBadge role={item.role} />
                    </Table.Cell>
                    <Table.Cell>
                      <span className='text-sm text-muted whitespace-nowrap'>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString('es-AR')
                          : '—'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={() => openEdit(item)}
                          className='w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-surface-secondary hover:text-foreground transition-colors'
                          title='Editar usuario'
                        >
                          <LuPencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (currentUser?.id !== item.id) setPendingDelete(item.id);
                          }}
                          disabled={currentUser?.id === item.id}
                          className='w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
                          title={
                            currentUser?.id === item.id
                              ? 'No puedes eliminar tu propia cuenta'
                              : 'Eliminar usuario'
                          }
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

        {rows.length > 0 && (
          <p className='text-xs text-muted text-right'>
            {rows.length} usuario{rows.length !== 1 ? 's' : ''}
          </p>
        )}
      </section>
    </div>
  );
}
