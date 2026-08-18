'use client';

import { useEffect, useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { LuUser, LuLock, LuSave } from 'react-icons/lu';
import { toastError, toastSuccess } from '@/lib/toast';
import { PageHeader, Section, TextInputField, InitialsAvatar, RoleStatusChip } from '@/components/admin/kit';

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
    if (!currentPassword) return toastError('Ingresa tu contraseña actual.');
    if (!newPassword) return toastError('Ingresa la nueva contraseña.');
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
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <PageHeader crumbs={[{ label: 'Panel', href: '/admin' }, { label: 'Mi perfil' }]} title='Mi perfil' description='Gestiona tu información personal y contraseña.' />

      <Section bodyClassName='relative overflow-hidden'>
        <div className='h-16 bg-gradient-to-r from-accent/15 via-accent/5 to-transparent' />
        <div className='flex items-center gap-4 px-5 pb-5 -mt-8'>
          <InitialsAvatar name={user.name} role={user.role} size='lg' className='h-16 w-16 shrink-0 ring-4 ring-[var(--surface)] text-base' />
          <div className='min-w-0 pt-8'>
            <p className='truncate text-lg font-semibold'>{user.name}</p>
            <p className='truncate text-sm text-muted'>{user.email}</p>
          </div>
          <div className='ml-auto self-end'>
            <RoleStatusChip role={user.role} />
          </div>
        </div>
      </Section>

      <Section
        title={<span className='inline-flex items-center gap-2'><LuUser className='h-4 w-4 text-muted' />Información personal</span>}
        bodyClassName='space-y-4 p-5'
      >
        <form onSubmit={handleSaveInfo} className='space-y-4'>
          <TextInputField label='Nombre completo' value={name} onChange={(e) => setName(e.target.value)} placeholder='Tu nombre' required />
          <TextInputField label='Email' type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='tu@email.com' required />
          <div className='flex justify-end'>
            <Button type='submit' isDisabled={savingInfo}>
              {savingInfo ? <Spinner size='sm' color='current' /> : <LuSave className='h-4 w-4' />}
              Guardar cambios
            </Button>
          </div>
        </form>
      </Section>

      <Section
        title={<span className='inline-flex items-center gap-2'><LuLock className='h-4 w-4 text-muted' />Cambiar contraseña</span>}
        bodyClassName='space-y-4 p-5'
      >
        <form onSubmit={handleSavePassword} className='space-y-4'>
          <TextInputField label='Contraseña actual' type='password' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder='••••••••' />
          <TextInputField label='Nueva contraseña' type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder='••••••••' hint='Mínimo 6 caracteres' />
          <TextInputField label='Confirmar nueva contraseña' type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder='••••••••' />
          <div className='flex justify-end'>
            <Button type='submit' isDisabled={savingPassword}>
              {savingPassword ? <Spinner size='sm' color='current' /> : <LuLock className='h-4 w-4' />}
              Cambiar contraseña
            </Button>
          </div>
        </form>
      </Section>
    </div>
  );
}
