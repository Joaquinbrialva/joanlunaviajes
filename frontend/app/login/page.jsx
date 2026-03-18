'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Spinner } from '@heroui/react';
import { LuPlane, LuEye, LuEyeOff } from 'react-icons/lu';

const STAFF_ROLES = ['admin', 'agent', 'designer'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const [res] = await Promise.all([
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión.');
        return;
      }

      window.location.href = STAFF_ROLES.includes(data.user.role) ? '/admin' : '/cuenta';
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='w-screen -mx-[calc((100vw-100%)/2)] min-h-[calc(100vh-5rem)] bg-background flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md space-y-4'>

        {/* Header */}
        <div className='text-center'>
          <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent text-white mb-4 shadow-lg'>
            <LuPlane className='w-7 h-7' />
          </div>
          <h1 className='text-3xl font-bold text-foreground'>Joan Luna Viajes</h1>
          <p className='text-muted mt-1'>Iniciá sesión en tu cuenta</p>
        </div>

        {/* Card principal */}
        <div className='bg-surface rounded-2xl border border-default p-8 shadow-sm'>
          <form onSubmit={handleSubmit} className='space-y-5'>

            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-foreground' htmlFor='email'>
                Email
              </label>
              <input
                id='email'
                type='email'
                autoComplete='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='tu@email.com'
                className='w-full h-11 px-3 rounded-xl border border-default bg-field-background text-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-sm font-medium text-foreground' htmlFor='password'>
                Contraseña
              </label>
              <div className='relative'>
                <input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  className='w-full h-11 px-3 pr-11 rounded-xl border border-default bg-field-background text-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors'
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <LuEyeOff className='w-4 h-4' /> : <LuEye className='w-4 h-4' />}
                </button>
              </div>
            </div>

            {error && (
              <p className='text-sm text-danger bg-danger/10 border border-danger-soft px-3 py-2.5 rounded-xl'>
                {error}
              </p>
            )}
            <Button
              isPending={loading}
              type='submit'
              className='w-full h-11 bg-accent text-white rounded-xl font-semibold' >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  Iniciando Sesión
                </>
              )}
            </Button>
          </form>

          <div className='mt-6 pt-5 border-t border-default text-center space-y-2'>
            <p className='text-sm text-muted'>
              ¿No tenés cuenta?{' '}
              <Link href='/registro' className='text-accent font-semibold hover:underline'>
                Registrate gratis
              </Link>
            </p>
            <Link href='/' className='text-sm text-muted hover:text-foreground transition-colors block'>
              ← Volvé al inicio
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
