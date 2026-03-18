'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Spinner } from '@heroui/react';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import { toastError } from '@/lib/toast';

const PREFIX_OPTIONS = [
  { value: '+54', label: 'AR +54' },
  { value: '+598', label: 'UY +598' },
  { value: '+56', label: 'CL +56' },
  { value: '+55', label: 'BR +55' },
  { value: '+595', label: 'PY +595' },
  { value: '+591', label: 'BO +591' },
  { value: '+51', label: 'PE +51' },
  { value: '+57', label: 'CO +57' },
  { value: '+58', label: 'VE +58' },
  { value: '+52', label: 'MX +52' },
  { value: '+34', label: 'ES +34' },
  { value: '+1', label: 'US +1' },
  { value: '+39', label: 'IT +39' },
  { value: '+33', label: 'FR +33' },
  { value: '+49', label: 'DE +49' },
];

const INPUT_CLASS =
  'w-full h-11 px-3 rounded-xl border border-default bg-field-background text-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors text-sm';

export default function RegistroPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+54');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toastError('Las contraseñas no coinciden.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phoneNumber.trim() ? `${phonePrefix} ${phoneNumber.trim()}` : '',
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al crear la cuenta.');
      window.location.href = '/cuenta';
    } catch (err) {
      toastError(err, 'Error al registrarse');
      setStatus('idle');
    }
  }

  return (
    <div className='max-w-md mx-auto py-12 space-y-6'>
      <div className='text-center space-y-1'>
        <h1 className='text-3xl font-bold'>Crear cuenta</h1>
        <p className='text-muted text-sm'>
          Registrate para hacer consultas y seguir el estado de tus viajes.
        </p>
      </div>

      <div className='rounded-2xl border border-default bg-surface p-6'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Nombre */}
          <div>
            <label className='text-sm font-medium block mb-1.5'>
              Nombre completo <span className='text-accent'>*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Tu nombre completo'
              className={INPUT_CLASS}
            />
          </div>

          {/* Email */}
          <div>
            <label className='text-sm font-medium block mb-1.5'>
              Email <span className='text-accent'>*</span>
            </label>
            <input
              required
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='tu@email.com'
              className={INPUT_CLASS}
            />
          </div>

          {/* Teléfono con prefijo */}
          <div>
            <label className='text-sm font-medium block mb-1.5'>Teléfono / WhatsApp</label>
            <div className='flex gap-2'>
              <HeroSelect
                value={phonePrefix}
                onValueChange={setPhonePrefix}
                options={PREFIX_OPTIONS}
                className='w-32 shrink-0'
              />
              <input
                type='tel'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder='11 1234-5678'
                className='flex-1 h-10 px-3 rounded-xl border border-default bg-field-background text-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors text-sm'
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className='text-sm font-medium block mb-1.5'>
              Contraseña <span className='text-accent'>*</span>
            </label>
            <div className='relative'>
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Mínimo 6 caracteres'
                className={`${INPUT_CLASS} pr-10`}
              />
              <button
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors'
              >
                {showPassword ? <LuEyeOff className='h-4 w-4' /> : <LuEye className='h-4 w-4' />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className='text-sm font-medium block mb-1.5'>
              Confirmar contraseña <span className='text-accent'>*</span>
            </label>
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='Repetí tu contraseña'
              className={INPUT_CLASS}
            />
          </div>

          <Button
            type='submit'
            isPending={status === 'loading'}
            size='lg'
            className='w-full bg-accent text-white font-semibold'
          >
            {({ isPending }) => (
              <>
                {isPending && <Spinner color='current' size='sm' />}
                {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
              </>
            )}
          </Button>
        </form>
      </div>

      <p className='text-center text-sm text-muted'>
        ¿Ya tenés cuenta?{' '}
        <Link href='/login' className='text-accent font-semibold hover:underline'>
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
