'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuUser, LuMail, LuLock, LuSave } from 'react-icons/lu';
import { toastError, toastSuccess } from '@/lib/toast';

const ROLE_LABELS = {
  admin: 'Administrador',
  agent: 'Agente',
  designer: 'Diseñador',
};

export default function PerfilPage() {
  const [user, setUser] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setName(data.user.name);
          setEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  async function handleSaveInfo(e) {
    e.preventDefault();
    if (!name.trim()) return toastError('El nombre no puede estar vacío.');
    if (!email.trim()) return toastError('El email no puede estar vacío.');
    setSavingInfo(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return toastError(data.error || 'Error al guardar.');
      setUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
      toastSuccess('Perfil actualizado correctamente.');
    } catch {
      toastError('Error de conexión.');
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    if (!currentPassword) return toastError('Ingresá tu contraseña actual.');
    if (!newPassword) return toastError('Ingresá la nueva contraseña.');
    if (newPassword.length < 6) return toastError('La nueva contraseña debe tener al menos 6 caracteres.');
    if (newPassword !== confirmPassword) return toastError('Las contraseñas no coinciden.');
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return toastError(data.error || 'Error al cambiar contraseña.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toastSuccess('Contraseña actualizada correctamente.');
    } catch {
      toastError('Error de conexión.');
    } finally {
      setSavingPassword(false);
    }
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent' />
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-2xl'>
      <section>
        <p className='text-sm text-muted mb-1'>
          <Link href='/admin' className='hover:underline'>Panel</Link> / Mi perfil
        </p>
        <h2 className='text-4xl font-bold'>Mi perfil</h2>
        <p className='text-muted'>Gestioná tu información personal y contraseña.</p>
      </section>

      {/* Avatar + role */}
      <div className='flex items-center gap-4 rounded-2xl border border-default bg-surface p-5'>
        <div className='grid h-16 w-16 shrink-0 place-content-center rounded-full bg-accent/10 text-2xl font-bold text-accent'>
          {initials}
        </div>
        <div>
          <p className='text-lg font-semibold'>{user.name}</p>
          <p className='text-sm text-muted'>{ROLE_LABELS[user.role] || user.role}</p>
          <p className='text-sm text-muted'>{user.email}</p>
        </div>
      </div>

      {/* Info form */}
      <form onSubmit={handleSaveInfo} className='rounded-2xl border border-default bg-surface p-5 space-y-4'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <LuUser className='h-4 w-4 text-accent' />
          Información personal
        </h3>

        <div className='space-y-1'>
          <label className='text-sm font-medium text-foreground'>Nombre completo</label>
          <div className='relative'>
            <LuUser className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted' />
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-full rounded-xl border border-default bg-surface-secondary pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40'
              placeholder='Tu nombre'
              required
            />
          </div>
        </div>

        <div className='space-y-1'>
          <label className='text-sm font-medium text-foreground'>Email</label>
          <div className='relative'>
            <LuMail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted' />
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full rounded-xl border border-default bg-surface-secondary pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40'
              placeholder='tu@email.com'
              required
            />
          </div>
        </div>

        <div className='flex justify-end'>
          <button
            type='submit'
            disabled={savingInfo}
            className='inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60'
          >
            {savingInfo ? (
              <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
            ) : (
              <LuSave className='h-4 w-4' />
            )}
            Guardar cambios
          </button>
        </div>
      </form>

      {/* Password form */}
      <form onSubmit={handleSavePassword} className='rounded-2xl border border-default bg-surface p-5 space-y-4'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <LuLock className='h-4 w-4 text-accent' />
          Cambiar contraseña
        </h3>

        <div className='space-y-1'>
          <label className='text-sm font-medium text-foreground'>Contraseña actual</label>
          <div className='relative'>
            <LuLock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted' />
            <input
              type='password'
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className='w-full rounded-xl border border-default bg-surface-secondary pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40'
              placeholder='••••••••'
            />
          </div>
        </div>

        <div className='space-y-1'>
          <label className='text-sm font-medium text-foreground'>Nueva contraseña</label>
          <div className='relative'>
            <LuLock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted' />
            <input
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className='w-full rounded-xl border border-default bg-surface-secondary pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40'
              placeholder='Mínimo 6 caracteres'
            />
          </div>
        </div>

        <div className='space-y-1'>
          <label className='text-sm font-medium text-foreground'>Confirmar nueva contraseña</label>
          <div className='relative'>
            <LuLock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted' />
            <input
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className='w-full rounded-xl border border-default bg-surface-secondary pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40'
              placeholder='Repetí la nueva contraseña'
            />
          </div>
        </div>

        <div className='flex justify-end'>
          <button
            type='submit'
            disabled={savingPassword}
            className='inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60'
          >
            {savingPassword ? (
              <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
            ) : (
              <LuLock className='h-4 w-4' />
            )}
            Cambiar contraseña
          </button>
        </div>
      </form>
    </div>
  );
}
